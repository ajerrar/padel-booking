import { Injectable, signal } from '@angular/core';

const CURRENT_USER_STORAGE_KEY = 'pb_current_user';
const USERS_STORAGE_KEY = 'pb_users';

export type Role = 'User' | 'AdminGlobal' | 'AdminClub';
export type MemberType = 'FREE' | 'SITE' | 'GLOBAL';

export interface UserModel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  level: string;
  matricule: string;
  role: Role;
  siteName?: string;
  bookingBlockedUntil?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  currentUser = signal<UserModel | null>(this.readCurrentUser());

  register(
    payload: Omit<UserModel, 'id' | 'matricule' | 'role'> & { memberType: MemberType }
  ): UserModel {
    const memberType = payload.memberType;
    const normalizedEmail = String(payload.email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error('L’email est obligatoire.');
    }

    const emailAlreadyExists = this.listUsers().some(
      user => String(user.email || '').trim().toLowerCase() === normalizedEmail
    );

    if (emailAlreadyExists) {
      throw new Error('Un compte existe déjà avec cet email.');
    }

    if (memberType === 'SITE' && !payload.siteName?.trim()) {
      throw new Error('Le site est obligatoire pour un membre SITE.');
    }

    const { memberType: _ignored, ...userData } = payload;

    const user: UserModel = {
      id: this.generateId(),
      matricule: this.generateMatricule(memberType),
      role: 'User',
      ...userData,
      email: normalizedEmail,
      firstName: String(payload.firstName || '').trim(),
      lastName: String(payload.lastName || '').trim(),
      phone: String(payload.phone || '').trim(),
      city: String(payload.city || '').trim(),
      level: String(payload.level || '').trim(),
      siteName: payload.siteName?.trim() || undefined,
    };

    this.saveUser(user);
    this.persistCurrentUser(user);

    return user;
  }

  loginByEmail(email: string): UserModel | null {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;

    const user = this.listUsers().find(
      item => String(item.email || '').trim().toLowerCase() === normalizedEmail
    );

    if (!user) return null;

    this.persistCurrentUser(user);
    return user;
  }
  loginByMatricule(matricule: string): UserModel | null {
    const normalizedMatricule = String(matricule || '').trim().toUpperCase();
    if (!normalizedMatricule) return null;

    const user = this.listUsers().find(
      item => String(item.matricule || '').trim().toUpperCase() === normalizedMatricule
    );

    if (!user) return null;

    this.persistCurrentUser(user);
    return user;
  }

  logout(): void {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    this.currentUser.set(null);
  }

  seedAdmins(): void {
    const users = this.listUsers();

    const hasGlobalAdmin = users.some(user => user.role === 'AdminGlobal');
    if (!hasGlobalAdmin) {
      this.saveUser({
        id: 'seed-admin-global',
        firstName: 'Admin',
        lastName: 'Global',
        email: 'admin@padel.com',
        phone: '',
        city: 'Bruxelles',
        level: 'Avancé',
        matricule: 'ADM-GLOBAL',
        role: 'AdminGlobal',
      });
    }

    const siteAdmins = [
      {
        id: 'seed-admin-site-court24',
        email: 'site-court24@padel.com',
        siteName: 'Court 24 Arena',
        city: 'Waterloo',
      },
      {
        id: 'seed-admin-site-factory',
        email: 'site-padel-factory@padel.com',
        siteName: 'Padel Factory',
        city: 'Uccle',
      },
      {
        id: 'seed-admin-site-playzone',
        email: 'site-playzone@padel.com',
        siteName: 'PlayZone Padely',
        city: 'Forest',
      },
    ];

    for (const siteAdmin of siteAdmins) {
      const exists = users.some(
        user => String(user.email || '').trim().toLowerCase() === siteAdmin.email.toLowerCase()
      );

      if (!exists) {
        this.saveUser({
          id: siteAdmin.id,
          firstName: 'Admin',
          lastName: 'Site',
          email: siteAdmin.email,
          phone: '',
          city: siteAdmin.city,
          level: 'Avancé',
          matricule: `ADM-SITE-${siteAdmin.city.toUpperCase()}`,
          role: 'AdminClub',
          siteName: siteAdmin.siteName,
        });
      }
    }
  }

  updateCurrent(patch: Partial<UserModel>): void {
    const user = this.currentUser();
    if (!user) return;

    const updatedUser: UserModel = {
      ...user,
      ...patch,
      email: patch.email ? String(patch.email).trim().toLowerCase() : user.email,
      siteName:
        patch.siteName !== undefined
          ? String(patch.siteName || '').trim() || undefined
          : user.siteName,
    };

    this.saveUser(updatedUser);
    this.persistCurrentUser(updatedUser);
  }

  listUsers(): UserModel[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as UserModel[]) : [];

      return Array.isArray(parsed)
        ? parsed.map(user => ({
          ...user,
          email: String(user.email || '').trim().toLowerCase(),
          firstName: String(user.firstName || '').trim(),
          lastName: String(user.lastName || '').trim(),
          city: String(user.city || '').trim(),
          level: String(user.level || '').trim(),
          matricule: String(user.matricule || '').trim(),
          siteName: user.siteName ? String(user.siteName).trim() : undefined,
          phone: user.phone ? String(user.phone).trim() : '',
        }))
        : [];
    } catch {
      return [];
    }
  }

  getUserByMatricule(matricule: string): UserModel | undefined {
    const normalizedMatricule = String(matricule || '').trim();
    if (!normalizedMatricule) return undefined;

    return this.listUsers().find(
      user => String(user.matricule || '').trim() === normalizedMatricule
    );
  }

  getMemberTypeFromMatricule(matricule: string): MemberType {
    const value = String(matricule || '').trim().toUpperCase();

    if (value.startsWith('G')) return 'GLOBAL';
    if (value.startsWith('S')) return 'SITE';
    return 'FREE';
  }

  blockBookingForDays(matricule: string, days: number): void {
    const normalizedMatricule = String(matricule || '').trim();
    if (!normalizedMatricule || days <= 0) return;

    const users = this.listUsers();
    const index = users.findIndex(user => user.matricule === normalizedMatricule);
    if (index < 0) return;

    const until = new Date();
    until.setDate(until.getDate() + days);

    users[index] = {
      ...users[index],
      bookingBlockedUntil: until.toISOString(),
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    if (this.currentUser()?.matricule === normalizedMatricule) {
      this.currentUser.set(users[index]);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(users[index]));
    }
  }

  clearBookingBlock(matricule: string): void {
    const normalizedMatricule = String(matricule || '').trim();
    if (!normalizedMatricule) return;

    const users = this.listUsers();
    const index = users.findIndex(user => user.matricule === normalizedMatricule);
    if (index < 0) return;

    users[index] = {
      ...users[index],
      bookingBlockedUntil: undefined,
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    if (this.currentUser()?.matricule === normalizedMatricule) {
      this.currentUser.set(users[index]);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(users[index]));
    }
  }

  isBookingBlocked(matricule: string): boolean {
    const user = this.getUserByMatricule(matricule);
    if (!user?.bookingBlockedUntil) return false;

    return new Date(user.bookingBlockedUntil).getTime() > Date.now();
  }

  getBookingBlockedUntil(matricule: string): string | null {
    const user = this.getUserByMatricule(matricule);
    return user?.bookingBlockedUntil ?? null;
  }

  private saveUser(user: UserModel): void {
    const users = this.listUsers();
    const index = users.findIndex(
      item => String(item.email || '').trim().toLowerCase() === String(user.email || '').trim().toLowerCase()
    );

    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  private persistCurrentUser(user: UserModel): void {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private readCurrentUser(): UserModel | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserModel) : null;
    } catch {
      return null;
    }
  }

  private generateMatricule(memberType: MemberType): string {
    const prefix =
      memberType === 'GLOBAL'
        ? 'G'
        : memberType === 'SITE'
          ? 'S'
          : 'L';

    const digitsCount = memberType === 'GLOBAL' ? 4 : 5;

    let digits = '';
    for (let index = 0; index < digitsCount; index++) {
      digits += Math.floor(Math.random() * 10).toString();
    }

    return `${prefix}${digits}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
