import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { UserService } from '../../services/user-service';
import { ReservationService } from '../../services/reservation-service';
import { ReservationModel } from '../../models/reservation.model';

@Component({
  selector: 'app-admin-global',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-global.html',
  styleUrls: ['./admin-global.css'],
})
export class AdminGlobal {
  private userService = inject(UserService);
  private reservationService = inject(ReservationService);
  private router = inject(Router);

  me = this.userService.currentUser;

  selectedSite = signal<string>('');
  selectedDate = signal<string>('');
  search = signal<string>('');

  reservations = signal<ReservationModel[]>(this.reservationService.list());

  sites = computed(() => {
    const set = new Set<string>();
    for (const r of this.reservations()) {
      if (r.siteName?.trim()) set.add(r.siteName.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  filtered = computed(() => {
    const site = this.selectedSite().trim().toLowerCase();
    const date = this.selectedDate().trim();
    const q = this.search().trim().toLowerCase();

    return this.reservations().filter(r => {
      if (site && (r.siteName ?? '').toLowerCase() !== site) return false;
      if (date && (r.date ?? '') !== date) return false;

      if (q) {
        const hay = `${r.siteName ?? ''} ${r.clubName} ${r.courtName} ${r.date ?? ''} ${r.time} ${r.userMatricule} ${r.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  });

  kpiBookings = computed(() => this.filtered().length);

  kpiRevenue = computed(() =>
    this.filtered()
      .filter(r => this.isConfirmed(r.status))
      .reduce((sum, r) => sum + (Number(r.total) || 0), 0)
  );

  kpiCanceled = computed(() =>
    this.filtered().filter(r => r.status === 'CANCELED').length
  );

  isConfirmed(status: string): boolean {
    return (status || '').toUpperCase().includes('CONFIRM');
  }



  utilizationPercent = computed(() => {
    const total = this.filtered().length;
    if (!total) return 0;
    const confirmed = this.filtered().filter(r => r.status === 'CONFIRMED').length;
    return Math.round((confirmed / total) * 100);
  });

  refresh() {
    this.reservations.set(this.reservationService.list());
  }

  cancelReservation(id: string) {
    this.reservationService.cancel(id);
    this.refresh();
  }

  exportCsv() {
    const rows = this.filtered();
    const header = ['Site', 'Club', 'Court', 'Date', 'Heure', 'Matricule', 'Statut', 'Total', 'CreatedAt'];
    const csv = [
      header.join(','),
      ...rows.map(r => [
        csvCell(r.siteName ?? ''),
        csvCell(r.clubName ?? ''),
        csvCell(r.courtName ?? ''),
        csvCell(r.date ?? ''),
        csvCell(r.time ?? ''),
        csvCell(r.userMatricule ?? ''),
        csvCell(r.status ?? ''),
        csvCell(String(r.total ?? '')),
        csvCell(r.createdAt ?? ''),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_reservations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}

function csvCell(v: string) {
  return `"${(v ?? '').replace(/"/g, '""')}"`;
}
