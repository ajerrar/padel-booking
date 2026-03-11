import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { getTodayIso } from '../../../core/utils/date.utils';

@Component({
  selector: 'app-admin-global-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StatCard, PageHeader, RouterLink],
  templateUrl: './admin-global-dashboard-page.html',
})
export class AdminGlobalDashboardPage {
  private reservationService = inject(ReservationService);
  private slotPolicyService = inject(SlotPolicyService);

  infoMessage = signal('');
  errorMessage = signal('');

  selectedSiteName = signal('');
  selectedClosedDate = signal('');
  selectedScheduleDate = signal(getTodayIso());

  dashboardStats = computed(() =>
    this.reservationService.getGlobalStatsDetailed()
  );

  siteOptions = computed(() => this.slotPolicyService.getAllSites());

  weekdayOptions = [
    { value: 0, label: 'Dim' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mer' },
    { value: 4, label: 'Jeu' },
    { value: 5, label: 'Ven' },
    { value: 6, label: 'Sam' },
  ];

  closedWeekdays = computed(() => {
    const site = this.selectedSiteName().trim();
    if (!site) return [];
    return this.slotPolicyService.getClosedWeekdays(site);
  });

  closedDates = computed(() => {
    const site = this.selectedSiteName().trim();
    if (!site) return [];
    return this.slotPolicyService.getCustomClosedDates(site);
  });

  reservedSlots = computed(() => {
    const site = this.selectedSiteName().trim();
    const date = this.selectedScheduleDate().trim();

    if (!site || !date) return [];

    return this.reservationService.listReservedSlotsBySiteAndDate(site, date);
  });

  // Methode constructor: initialise l etat du composant ou du service au chargement.
  constructor() {
    const firstSite = this.slotPolicyService.getAllSites()[0] ?? '';
    this.selectedSiteName.set(firstSite);
  }

  maxSiteRevenue = computed(() => {
    const values = this.dashboardStats().bySite.map(site => site.revenue);
    return values.length ? Math.max(...values) : 1;
  });

  // Methode getRevenueWidth: recupere les donnees necessaires a cette fonctionnalite.
  getRevenueWidth(value: number): number {
    const max = this.maxSiteRevenue() || 1;
    return Math.max(10, Math.round((value / max) * 100));
  }

  // Methode isWeekdayClosed: verifie une condition metier et renvoie le resultat attendu.
  isWeekdayClosed(day: number): boolean {
    return this.closedWeekdays().includes(day);
  }

  // Methode toggleClosedWeekday: gere toggle closed weekday de ce bloc.
  toggleClosedWeekday(day: number) {
    const site = this.selectedSiteName().trim();
    if (!site) {
      this.errorMessage.set('Choisis un site.');
      this.infoMessage.set('');
      return;
    }

    const current = [...this.closedWeekdays()];
    const next = current.includes(day)
      ? current.filter(x => x !== day)
      : [...current, day];

    this.slotPolicyService.updateClosedWeekdays(site, next);
    this.infoMessage.set('Jours de fermeture mis à jour.');
    this.errorMessage.set('');
  }

  // Methode addClosedDate: cree ou ajoute un element selon les regles metier.
  addClosedDate() {
    const site = this.selectedSiteName().trim();
    const date = this.selectedClosedDate().trim();

    if (!site) {
      this.errorMessage.set('Choisis un site.');
      this.infoMessage.set('');
      return;
    }

    if (!date) {
      this.errorMessage.set('Choisis une date.');
      this.infoMessage.set('');
      return;
    }

    this.slotPolicyService.addCustomClosedDate(site, date);
    this.selectedClosedDate.set('');
    this.infoMessage.set('Date de fermeture ajoutée.');
    this.errorMessage.set('');
  }

  // Methode removeClosedDate: supprime ou reinitialise les donnees concernees.
  removeClosedDate(date: string) {
    const site = this.selectedSiteName().trim();
    if (!site) {
      this.errorMessage.set('Choisis un site.');
      this.infoMessage.set('');
      return;
    }

    this.slotPolicyService.removeCustomClosedDate(site, date);
    this.infoMessage.set('Date de fermeture supprimée.');
    this.errorMessage.set('');
  }

  // Methode handleSiteChange: gere handle site change de ce bloc.
  handleSiteChange(value: string) {
    this.selectedSiteName.set(value || '');
    this.infoMessage.set('');
    this.errorMessage.set('');
  }

  // Methode handleScheduleDateChange: gere handle schedule date change de ce bloc.
  handleScheduleDateChange(value: string) {
    this.selectedScheduleDate.set(value || getTodayIso());
  }

  // Methode cancelReservationByAdmin: verifie une condition metier et renvoie le resultat attendu.
  cancelReservationByAdmin(id: string) {
    this.reservationService.adminCancelReservation(id);
    this.infoMessage.set('Réservation annulée.');
    this.errorMessage.set('');
  }
}
