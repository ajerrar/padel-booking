import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { UserService } from '../../services/user-service';
import { ReservationService } from '../../services/reservation-service';
import { ReservationModel } from '../../models/reservation.model';

type Tab = 'COURTS' | 'SLOTS' | 'BOOKINGS' | 'SETTINGS';

type CourtItem = {
  id: number;
  name: string;
  pricePerHour: number;
  indoor: boolean;
  active: boolean;
  tags: string[];
};

@Component({
  selector: 'app-admin-site',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-site.html',
  styleUrls: ['./admin-site.css'],
})
export class AdminSite {
  private router = inject(Router);
  private userService = inject(UserService);
  private reservationService = inject(ReservationService);

  me = this.userService.currentUser;

  // ⚠️ Démo : ton admin site gère 1 seul club
  clubName = signal('Court 24 Arena');
  clubCity = signal('Waterloo');

  tab = signal<Tab>('COURTS');

  // ✅ Terrains démo (tu pourras brancher backend après)
  courts = signal<CourtItem[]>(
    Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      name: `Terrain ${i + 1}`,
      pricePerHour: 18,
      indoor: true,
      active: i !== 2, // terrain 3 inactif (démo)
      tags: i === 0 ? ['Éclairage', 'Filet'] : [],
    }))
  );

  bookings = computed<ReservationModel[]>(() => {
    // Réservations du club uniquement
    return this.reservationService
      .list()
      .filter(r => r.clubName === this.clubName());
  });

  kpiBookingsDay = computed(() => this.bookings().filter(b => b.status === 'CONFIRMED').length);
  kpiFreeSlots = computed(() => 18); // démo (tu le calculeras avec tes slots)

  setTab(t: Tab) {
    this.tab.set(t);
  }

  exportBookings() {
    alert('Export réservations (démo).');
  }

  addCourt() {
    alert('Ajouter terrain (démo).');
  }

  stopCourt(id: number) {
    this.courts.set(this.courts().map(c => (c.id === id ? { ...c, active: false } : c)));
  }

  activateCourt(id: number) {
    this.courts.set(this.courts().map(c => (c.id === id ? { ...c, active: true } : c)));
  }

  cancelBooking(id: string) {
    this.reservationService.cancel(id);
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/home']);
  }
}
