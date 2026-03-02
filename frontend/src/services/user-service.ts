import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models/user.model';
const LS_USER_KEY = 'pb_current_user';
@Injectable({ providedIn: 'root' })
export class UserService {
  private _currentUser = signal<User | null>(this.readFromStorage());
  currentUser = computed(() => this._currentUser());
  isLoggedIn = computed(() => !!this._currentUser());
  register(payload: Omit<User, 'id' | 'matricule' | 'createdAt'>): User {
    const user: User = {
      id: this.uuid(),
      matricule: this.generateMatricule(),
      createdAt: new Date().toISOString(),
      ...payload,
    };
    this._currentUser.set(user);
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user));
    return user;
  }
  logout() {
    this._currentUser.set(null);
    localStorage.removeItem(LS_USER_KEY);
  }
  private readFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
  private generateMatricule(): string {
    const n = Math.floor(1000 + Math.random() * 9000);
    return `USR-${n}`;
  }
  private uuid(): string {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}
