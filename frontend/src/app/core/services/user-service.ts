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

  register(payload: Omit<UserModel, 'id' | 'matricule'> & { memberType: MemberType }): UserModel {
    const memberType = payload.memberType;

    if (memberType === 'SITE' && !payload.siteName?.trim()) {
      throw new Error('Le site est obligatoire pour un membre SITE.');
    }

    const { memberType: _ignored, ...userData } = payload;

    const user: UserModel = {
      id: this.generateId(),
      matricule: this.generateMatricule(memberType),
      ...userData,
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
        id: 'seed-admin-site-court24-waterloo',
        email: 'site-court-24@padel.com',
        siteName: 'SITE_COURT24_ARENA_WATERLOO',
        city: 'Waterloo',
      },
      {
        id: 'seed-admin-site-court24-uccle',
        email: 'site-padel-factory@padel.com',
        siteName: 'SITE_PADEL_FACTORY_UCCLE',
        city: 'Uccle',
      },
      {
        id: 'seed-admin-site-padel-inn-forest',
        email: 'site-playzone@padel.com',
        siteName: 'SITE_PLAYZONE_PADELY_FOREST',
        city: 'Forest',
      },
    ];

    for (const siteAdmin of siteAdmins) {
      const exists = users.some(user => user.email === siteAdmin.email);

      if (!exists) {
        this.saveUser({
          id: siteAdmin.id,
          firstName: 'Admin',
          lastName: 'Site',
          email: siteAdmin.email,
          phone: '',
          city: siteAdmin.city,
          level: 'Avancé',
          matricule: 'ADM-SITE',
          role: 'AdminClub',
          siteName: siteAdmin.siteName,
        });
      }
    }
  }

  updateCurrent(patch: Partial<UserModel>): void {
    const user = this.currentUser();
    if (!user) return;

    const updatedUser: UserModel = { ...user, ...patch };

    this.saveUser(updatedUser);
    this.persistCurrentUser(updatedUser);
  }

  listUsers(): UserModel[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserModel[]) : [];
    } catch {
      return [];
    }
  }

  private saveUser(user: UserModel): void {
    const users = this.listUsers();
    const index = users.findIndex(item => item.email === user.email);

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
      memberType === 'GLOBAL' ? 'G' :
        memberType === 'SITE' ? 'S' :
          'L';

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
