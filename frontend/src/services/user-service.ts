import { Injectable, signal } from '@angular/core';

const CURRENT_KEY = 'pb_current_user';
const USERS_KEY = 'pb_users';

export type Role = 'User' | 'AdminGlobal' | 'AdminClub';

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
}

@Injectable({ providedIn: 'root' })
export class UserService {
  currentUser = signal<UserModel | null>(this.readCurrent());

  register(payload: Omit<UserModel, 'id' | 'matricule'>): UserModel {
    const user: UserModel = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      matricule: this.generateMatricule(),
      ...payload,
    };

    this.saveUser(user);

    localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
    this.currentUser.set(user);

    return user;
  }

  loginByEmail(email: string): UserModel | null {
    const users = this.getUsers();
    const u = users.find(x => String(x.email).toLowerCase() === String(email).toLowerCase());
    if (!u) return null;

    localStorage.setItem(CURRENT_KEY, JSON.stringify(u));
    this.currentUser.set(u);
    return u;
  }

  logout() {
    localStorage.removeItem(CURRENT_KEY);
    this.currentUser.set(null);
  }

  // ✅ Seed admins au démarrage
  seedAdmins() {
    const users = this.getUsers();

    const hasGlobal = users.some(u => u.role === 'AdminGlobal');
    const hasClub = users.some(u => u.role === 'AdminClub');

    if (!hasGlobal) {
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

    if (!hasClub) {
      this.saveUser({
        id: 'seed-admin-club',
        firstName: 'Admin',
        lastName: 'Site',
        email: 'site@padel.com',
        phone: '',
        city: 'Waterloo',
        level: 'Avancé',
        matricule: 'ADM-SITE',
        role: 'AdminClub',
      });
    }
  }

  // -------- helpers --------

  private saveUser(u: UserModel) {
    const users = this.getUsers();
    const idx = users.findIndex(x => x.email === u.email);
    if (idx >= 0) users[idx] = u;
    else users.push(u);

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  private getUsers(): UserModel[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? (JSON.parse(raw) as UserModel[]) : [];
    } catch {
      return [];
    }
  }

  private readCurrent(): UserModel | null {
    try {
      const raw = localStorage.getItem(CURRENT_KEY);
      return raw ? (JSON.parse(raw) as UserModel) : null;
    } catch {
      return null;
    }
  }

  private generateMatricule(): string {
    const num = Math.floor(Math.random() * 9000 + 1000);
    return `USR-${num}`;
  }
}
