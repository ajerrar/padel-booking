import { Injectable } from '@angular/core';
import { ReservationModel } from '../models/reservation.model';

const KEY = 'pb_reservations';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  list(): ReservationModel[] {
    return this.read();
  }

  listByUser(matricule: string): ReservationModel[] {
    return this.read().filter(r => r.userMatricule === matricule);
  }

  add(data: Omit<ReservationModel, 'id' | 'createdAt' | 'status'>): ReservationModel {
    const item: ReservationModel = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
      ...data,
      total: Number((data as any).total) || 0, // ✅ blindage
    };

    const all = this.read();
    all.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(all));
    return item;
  }

  cancel(id: string): void {
    const all = this.read();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return;

    all[idx] = { ...all[idx], status: 'CANCELED' };
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  private read(): ReservationModel[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ReservationModel[]) : [];
    } catch {
      return [];
    }
  }
}
