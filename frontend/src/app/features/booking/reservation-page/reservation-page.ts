import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';
import { UserService } from '../../../core/services/user-service';

type MatchVisibility = 'PUBLIC' | 'PRIVATE';
type MemberType = 'GLOBAL' | 'SITE' | 'FREE';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-page.html',
})
export class ReservationPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private slotPolicyService = inject(SlotPolicyService);
  private userService = inject(UserService);

  currentUser = this.userService.currentUser;
  errorMessage = signal('');

  selectedClubName = signal('');
  selectedCourtName = signal('');
  selectedDate = signal('');
  selectedTime = signal('');
  selectedSiteName = signal('');
  selectedVisibility = signal<MatchVisibility>('PRIVATE');
  totalPrice = signal(60);

  availableSlots = computed(() => {
    const site = this.selectedSiteName() || this.selectedClubName();
    const date = this.selectedDate();

    if (!site || !date) return [];
    return this.slotPolicyService.getSlotsForSite(site, date);
  });

  // Methode constructor: initialise l etat du composant ou du service au chargement.
  constructor() {
    this.route.queryParamMap.subscribe(params => {
      this.selectedClubName.set(params.get('clubName') ?? '');
      this.selectedCourtName.set(params.get('courtName') ?? '');
      this.selectedDate.set(params.get('date') ?? '');
      this.selectedTime.set(params.get('time') ?? '');
      this.selectedSiteName.set(params.get('siteName') ?? params.get('clubName') ?? '');
      this.totalPrice.set(Number(params.get('total') ?? 60));

      const visibility = (params.get('visibility') ?? 'PRIVATE').toUpperCase();
      this.selectedVisibility.set(visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
    });
  }

  // Methode getMemberTypeFromMatricule: recupere les donnees necessaires a cette fonctionnalite.
  private getMemberTypeFromMatricule(matricule: string): MemberType {
    const value = String(matricule || '').trim().toUpperCase();
    if (value.startsWith('G')) return 'GLOBAL';
    if (value.startsWith('S')) return 'SITE';
    return 'FREE';
  }

  // Methode getMaxAdvanceDays: recupere les donnees necessaires a cette fonctionnalite.
  private getMaxAdvanceDays(memberType: MemberType): number {
    if (memberType === 'GLOBAL') return 21;
    if (memberType === 'SITE') return 14;
    return 5;
  }

  // Methode getDaysBetweenTodayAnd: recupere les donnees necessaires a cette fonctionnalite.
  private getDaysBetweenTodayAnd(dateIso: string): number {
    if (!dateIso) return Number.POSITIVE_INFINITY;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(`${dateIso}T00:00:00`);

    if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;

    const diffMs = target.getTime() - today.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Methode validateAccess: traite l action utilisateur avec les validations necessaires.
  private validateAccess(): string | null {
    const user = this.currentUser();
    if (!user) return null;

    if (this.userService.isBookingBlocked(user.matricule)) {
      return 'Tu ne peux pas réserver pendant 7 jours suite à une annulation ou un match non complété.';
    }

    const memberType = this.getMemberTypeFromMatricule(user.matricule);
    const maxDays = this.getMaxAdvanceDays(memberType);
    const daysAhead = this.getDaysBetweenTodayAnd(this.selectedDate());

    if (daysAhead < 0) {
      return 'La date sélectionnée est invalide.';
    }

    if (daysAhead > maxDays) {
      if (memberType === 'GLOBAL') return 'Un membre global peut réserver maximum 3 semaines à l’avance.';
      if (memberType === 'SITE') return 'Un membre site peut réserver maximum 2 semaines à l’avance.';
      return 'Un membre libre peut réserver maximum 5 jours à l’avance.';
    }

    if (memberType === 'SITE') {
      const userSite = String(user.siteName || '').trim().toLowerCase();
      const targetSite = String(this.selectedSiteName() || this.selectedClubName() || '').trim().toLowerCase();

      if (userSite && targetSite && userSite !== targetSite) {
        return 'Un membre site ne peut réserver que sur son propre site.';
      }
    }

    return null;
  }

  // Methode formatDisplayDate: construit la valeur attendue a partir des donnees disponibles.
  formatDisplayDate(date: string | undefined | null): string {
    if (!date) return '—';
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    return `${day}/${month}/${year}`;
  }

  // Methode getVisibilityLabel: recupere les donnees necessaires a cette fonctionnalite.
  getVisibilityLabel(): string {
    return this.selectedVisibility() === 'PUBLIC' ? 'Match public' : 'Match privé';
  }

  // Methode handleDateChange: gere handle date change de ce bloc.
  handleDateChange(value: string) {
    this.errorMessage.set('');
    this.selectedDate.set(value || '');
    this.selectedTime.set('');
  }

  // Methode handleTimeChange: gere handle time change de ce bloc.
  handleTimeChange(value: string) {
    this.errorMessage.set('');
    this.selectedTime.set(value || '');
  }

  // Methode continueToPayment: gere continue to payment de ce bloc.
  continueToPayment() {
    this.errorMessage.set('');

    const accessError = this.validateAccess();
    if (accessError) {
      this.errorMessage.set(accessError);
      return;
    }

    if (!this.selectedDate() || !this.selectedTime()) {
      this.errorMessage.set('Choisis une date et un créneau.');
      return;
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        clubName: this.selectedClubName(),
        courtName: this.selectedCourtName(),
        date: this.selectedDate(),
        time: this.selectedTime(),
        siteName: this.selectedSiteName(),
        total: this.totalPrice(),
        visibility: this.selectedVisibility(),
      },
    });
  }

  // Methode navigateBack: gere la navigation vers l ecran approprie.
  navigateBack() {
    this.router.navigate(['/home']);
  }
}
