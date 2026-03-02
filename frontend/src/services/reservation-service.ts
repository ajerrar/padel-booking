import { Injectable } from '@angular/core';
import { ReservationModel } from '../models/reservation.model';

const KEY = 'pb_reservations';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  list(): ReservationModel[] {
    return this.read();
  }

  add(data: Omit<ReservationModel, 'id' | 'createdAt' | 'status'>): ReservationModel {
    const item: ReservationModel = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1e9)}`,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
      ...data,
    };

    const all = this.read();
    all.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(all));
    return item;
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
