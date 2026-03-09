import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { formatDisplayDate } from '../../../core/utils/date.utils';

type MatchVisibility = 'PUBLIC' | 'PRIVATE';

@Component({
  selector: 'app-payment-success-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success-page.html',
})
export class PaymentSuccessPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);

  currentUser = this.userService.currentUser;

  clubName = signal<string>('—');
  courtName = signal<string>('—');
  time = signal<string>('—');
  total = signal<number>(0);

  baseTotal = signal<number>(0);
  outstandingDebt = signal<number>(0);

  date = signal<string>('');
  siteName = signal<string>('');

  visibility = signal<MatchVisibility>('PUBLIC');
  invitedMatricules = signal<string[]>([]);
  invitedEmails = signal<string[]>([]);

  paymentMode = signal<string>('CREATE_MATCH');
  matchId = signal<string>('');

  errorMessage = signal('');
  private hasProcessedReservation = signal(false);

  reference = computed(() => {
    const time = this.time() || '—';
    return `PADEL-${time.replace(':', '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
  });

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      this.clubName.set(params.get('clubName') ?? '—');
      this.courtName.set(params.get('courtName') ?? '—');
      this.time.set(params.get('time') ?? '—');

      this.total.set(Number(params.get('total') ?? 0));
      this.baseTotal.set(Number(params.get('baseTotal') ?? 0));
      this.outstandingDebt.set(Number(params.get('outstandingDebt') ?? 0));

      this.date.set(params.get('date') ?? '');
      this.siteName.set(params.get('siteName') ?? '');

      const visibility = (params.get('visibility') ?? 'PUBLIC').toUpperCase();
      this.visibility.set(visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC');

      const emails = (params.get('invitedEmails') ?? '')
        .split(',')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);
      this.invitedEmails.set(emails);

      const matricules = (params.get('invitedMatricules') ?? '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
      this.invitedMatricules.set(matricules);

      this.paymentMode.set(params.get('mode') ?? 'CREATE_MATCH');
      this.matchId.set(params.get('matchId') ?? '');

      this.processReservationOnce();
    });
  }

  private processReservationOnce() {
    if (this.hasProcessedReservation()) return;

    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    try {
      if (this.paymentMode() === 'JOIN_PUBLIC') {
        const matchId = this.matchId().trim();
        if (!matchId) {
          this.errorMessage.set('Match introuvable pour le paiement.');
          return;
        }

        this.reservationService.joinAndMarkPaid(matchId, user.matricule);
        this.hasProcessedReservation.set(true);
        return;
      }

      if (this.paymentMode() === 'JOIN_PRIVATE_INVITE') {
        const matchId = this.matchId().trim();
        if (!matchId) {
          this.errorMessage.set('Invitation introuvable pour le paiement.');
          return;
        }

        this.reservationService.acceptPrivateInvitationAndMarkPaid(
          matchId,
          user.email,
          user.matricule
        );

        this.hasProcessedReservation.set(true);
        return;
      }

      if (this.clubName() === '—' || this.courtName() === '—' || this.time() === '—') {
        this.errorMessage.set('Données de réservation invalides.');
        return;
      }

      this.reservationService.add({
        organizerMatricule: user.matricule,
        clubName: this.clubName(),
        courtName: this.courtName(),
        time: this.time(),
        date: this.date(),
        siteName: this.siteName(),
        total: Number(this.baseTotal()) || 0,
        visibility: this.visibility(),
        invitedMatricules: this.visibility() === 'PRIVATE' ? this.invitedMatricules() : [],
        invitedEmails: this.visibility() === 'PRIVATE' ? this.invitedEmails() : [],
      });

      if (this.outstandingDebt() > 0) {
        const reservations = this.reservationService
          .list()
          .filter(match =>
            (match.organizerMatricule || '').trim() === (user.matricule || '').trim()
          )
          .filter(match => (Number(match.organizerDebtAmount) || 0) > 0);

        reservations.forEach(match => {
          this.reservationService.clearOrganizerDebtForMatch(match.id);
        });
      }

      this.hasProcessedReservation.set(true);
    } catch (error: any) {
      this.errorMessage.set(error?.message ?? 'Erreur lors de la validation du paiement.');
    }
  }

  formatDisplayDate(date: string | undefined | null): string {
    return formatDisplayDate(date);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  navigateToReservations() {
    this.router.navigate(['/my-reservations']);
  }

  navigateToClub() {
    this.router.navigate(['/home']);
  }
}
