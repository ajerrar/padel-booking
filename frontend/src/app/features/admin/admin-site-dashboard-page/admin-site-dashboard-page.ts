import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-admin-site-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCard , PageHeader, RouterLink],
  templateUrl: './admin-site-dashboard-page.html',
  styleUrls: ['./admin-site-dashboard-page.css'],
})
export class AdminSiteDashboardPage {
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private slotPolicyService = inject(SlotPolicyService);

  currentUser = this.userService.currentUser;

  infoMessage = signal('');
  errorMessage = signal('');
  selectedClosedDate = signal('');
  selectedScheduleDate = signal(this.getTodayIso());

  siteName = computed(() => this.currentUser()?.siteName || '');

  dashboardStats = computed(() => this.reservationService.getSiteStats(this.siteName()));

  weekdayOptions = [
    { value: 0, label: 'Dim' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mer' },
    { value: 4, label: 'Jeu' },
    { value: 5, label: 'Ven' },
    { value: 6, label: 'Sam' },
  ];

  closedWeekdays = computed(() =>
    this.slotPolicyService.getClosedWeekdays(this.siteName())
  );

  closedDates = computed(() =>
    this.slotPolicyService.getCustomClosedDates(this.siteName())
  );

  reservedSlots = computed(() =>
    this.reservationService.listReservedSlotsBySiteAndDate(
      this.siteName(),
      this.selectedScheduleDate()
    )
  );

  maxCourtMatches = computed(() => {
    const values = this.dashboardStats().byCourt.map(court => court.matches);
    return values.length ? Math.max(...values) : 1;
  });

  getCourtWidth(value: number): number {
    const max = this.maxCourtMatches() || 1;
    return Math.max(10, Math.round((value / max) * 100));
  }

  isWeekdayClosed(day: number): boolean {
    return this.closedWeekdays().includes(day);
  }

  toggleClosedWeekday(day: number) {
    const current = [...this.closedWeekdays()];
    const next = current.includes(day)
      ? current.filter(x => x !== day)
      : [...current, day];

    this.slotPolicyService.updateClosedWeekdays(this.siteName(), next);
    this.infoMessage.set('Jours de fermeture mis à jour.');
    this.errorMessage.set('');
  }

  addClosedDate() {
    const date = this.selectedClosedDate().trim();
    if (!date) {
      this.errorMessage.set('Choisis une date.');
      this.infoMessage.set('');
      return;
    }

    this.slotPolicyService.addCustomClosedDate(this.siteName(), date);
    this.selectedClosedDate.set('');
    this.infoMessage.set('Date de fermeture ajoutée.');
    this.errorMessage.set('');
  }

  removeClosedDate(date: string) {
    this.slotPolicyService.removeCustomClosedDate(this.siteName(), date);
    this.infoMessage.set('Date de fermeture supprimée.');
    this.errorMessage.set('');
  }

  cancelReservationByAdmin(id: string) {
    this.reservationService.adminCancelReservation(id);
    this.infoMessage.set('Réservation annulée.');
    this.errorMessage.set('');
  }

  handleScheduleDateChange(value: string) {
    this.selectedScheduleDate.set(value || this.getTodayIso());
  }

  private getTodayIso(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
