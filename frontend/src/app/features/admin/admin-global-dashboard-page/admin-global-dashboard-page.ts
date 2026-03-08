import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-admin-global-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink , StatCard, PageHeader],
  templateUrl: './admin-global-dashboard-page.html',
  styleUrls: ['./admin-global-dashboard-page.css'],
})
export class AdminGlobalDashboardPage {
  private reservationService = inject(ReservationService);
  private slotPolicyService = inject(SlotPolicyService);

  selectedSiteName = signal('Court 24 Arena');
  selectedClosedDate = signal('');
  selectedScheduleDate = signal(this.getTodayIso());
  infoMessage = signal('');
  errorMessage = signal('');

  dashboardStats = computed(() => this.reservationService.getGlobalStatsDetailed());
  siteOptions = computed(() => this.slotPolicyService.getAllSites());

  closedDates = computed(() =>
    this.slotPolicyService.getCustomClosedDates(this.selectedSiteName())
  );

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
    this.slotPolicyService.getClosedWeekdays(this.selectedSiteName())
  );

  reservedSlots = computed(() =>
    this.reservationService.listReservedSlotsBySiteAndDate(
      this.selectedSiteName(),
      this.selectedScheduleDate()
    )
  );

  maxRevenue = computed(() => {
    const values = this.dashboardStats().bySite.map(site => site.revenue);
    return values.length ? Math.max(...values) : 1;
  });

  getRevenueWidth(value: number): number {
    const max = this.maxRevenue() || 1;
    return Math.max(10, Math.round((value / max) * 100));
  }

  isWeekdayClosed(day: number): boolean {
    return this.closedWeekdays().includes(day);
  }

  toggleClosedWeekday(day: number) {
    this.errorMessage.set('');
    this.infoMessage.set('');

    const current = [...this.closedWeekdays()];
    const next = current.includes(day)
      ? current.filter(x => x !== day)
      : [...current, day];

    this.slotPolicyService.updateClosedWeekdays(this.selectedSiteName(), next);
    this.infoMessage.set('Jours de fermeture hebdomadaire mis à jour.');
  }

  addClosedDate() {
    this.errorMessage.set('');
    this.infoMessage.set('');

    const date = this.selectedClosedDate().trim();
    if (!date) {
      this.errorMessage.set('Choisis une date de fermeture.');
      return;
    }

    this.slotPolicyService.addCustomClosedDate(this.selectedSiteName(), date);
    this.selectedClosedDate.set('');
    this.infoMessage.set('Fermeture exceptionnelle ajoutée.');
  }

  removeClosedDate(date: string) {
    this.slotPolicyService.removeCustomClosedDate(this.selectedSiteName(), date);
    this.infoMessage.set('Date de fermeture supprimée.');
    this.errorMessage.set('');
  }

  cancelReservationByAdmin(id: string) {
    this.reservationService.adminCancelReservation(id);
    this.infoMessage.set('Réservation annulée.');
    this.errorMessage.set('');
  }

  handleSiteChange(value: string) {
    this.selectedSiteName.set(value || 'Court 24 Arena');
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
