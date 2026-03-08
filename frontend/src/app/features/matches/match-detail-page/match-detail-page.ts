import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { ReservationModel } from '../../../models/reservation.model';
import { FormsModule } from '@angular/forms';
import {
  getAmountPerPlayer,
  getMatchStartTimestamp,
  getPlayersLabel,
  getRemainingPlaces,
  isMatchPast,
} from '../../../core/utils/match.utils';

@Component({
  selector: 'app-match-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './match-detail-page.html',
  styleUrls: ['./match-detail-page.css'],
})
export class MatchDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);

  currentUser = this.userService.currentUser;

  errorMessage = signal('');
  successMessage = signal('');

  inviteEmail1 = '';
  inviteEmail2 = '';
  inviteEmail3 = '';

  matchId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  match = computed<ReservationModel | undefined>(() => {
    const id = this.matchId();
    return this.reservationService.list().find(item => item.id === id);
  });

  currentUserPlayerEntry = computed(() => {
    const user = this.currentUser();
    const match = this.match();
    if (!user || !match) return undefined;

    return (match.players || []).find(
      player => (player.matricule || '').trim() === (user.matricule || '').trim()
    );
  });

  isCurrentUserParticipant = computed(() => !!this.currentUserPlayerEntry());

  isCurrentUserPaid = computed(() => !!this.currentUserPlayerEntry()?.paid);

  isOrganizer = computed(() => {
    const user = this.currentUser();
    const match = this.match();
    if (!user || !match) return false;

    return (match.organizerMatricule || '').trim() === (user.matricule || '').trim();
  });

  isComplete = computed(() => (this.match()?.players.length ?? 0) >= 4);

  remainingPlaces = computed(() => getRemainingPlaces(this.match()?.players.length ?? 0));

  canJoinPublicMatch = computed(() => {
    const user = this.currentUser();
    const match = this.match();

    if (!user || !match) return false;
    if (match.status !== 'CONFIRMED') return false;
    if (match.visibility !== 'PUBLIC') return false;
    if (this.isCurrentUserParticipant()) return false;
    if (this.isComplete()) return false;
    if (this.isMatchPast()) return false;

    return true;
  });

  canInvitePlayers = computed(() => {
    const match = this.match();
    if (!match) return false;

    return match.status === 'CONFIRMED' && match.visibility === 'PRIVATE' && this.isOrganizer();
  });

  isInvitedByEmail = computed(() => {
    const user = this.currentUser();
    const match = this.match();

    if (!user || !match) return false;
    if (match.visibility !== 'PRIVATE') return false;
    if (this.isComplete()) return false;
    if (this.isMatchPast()) return false;

    return Array.isArray(match.invitedEmails)
      && match.invitedEmails.some(
        email => String(email || '').trim().toLowerCase() === String(user.email || '').trim().toLowerCase()
      );
  });

  canPayPrivateSeat = computed(() => {
    const user = this.currentUser();
    const match = this.match();

    if (!user || !match) return false;
    if (match.visibility !== 'PRIVATE') return false;
    if (match.status !== 'CONFIRMED') return false;
    if (this.isMatchPast()) return false;

    if (this.isInvitedByEmail()) return true;
    if (this.isCurrentUserParticipant() && !this.isCurrentUserPaid()) return true;

    return false;
  });

  getPlayersLabel(): string {
    return getPlayersLabel(this.match()?.players?.length ?? 0);
  }

  getAmountPerPlayer(): number {
    return getAmountPerPlayer(this.match()?.total ?? 0);
  }

  joinPublicMatch() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const user = this.currentUser();
    const match = this.match();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (!match) {
      this.errorMessage.set('Match introuvable.');
      return;
    }

    if (!this.canJoinPublicMatch()) {
      this.errorMessage.set('Impossible de rejoindre ce match.');
      return;
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        mode: 'JOIN_PUBLIC',
        matchId: match.id,
        clubName: match.clubName,
        courtName: match.courtName,
        time: match.time,
        date: match.date,
        siteName: match.siteName ?? '',
        total: this.getAmountPerPlayer(),
      },
    });
  }

  payPrivateInvitationSeat() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const user = this.currentUser();
    const match = this.match();

    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (!match) {
      this.errorMessage.set('Match introuvable.');
      return;
    }

    if (!this.canPayPrivateSeat()) {
      this.errorMessage.set('Tu ne peux pas payer cette place.');
      return;
    }

    this.router.navigate(['/payment'], {
      queryParams: {
        mode: 'JOIN_PRIVATE_INVITE',
        matchId: match.id,
        clubName: match.clubName,
        courtName: match.courtName,
        time: match.time,
        date: match.date,
        siteName: match.siteName ?? '',
        total: this.getAmountPerPlayer(),
      },
    });
  }

  sendMatchInvitations() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const match = this.match();
    if (!match) {
      this.errorMessage.set('Match introuvable.');
      return;
    }

    const emails = [this.inviteEmail1, this.inviteEmail2, this.inviteEmail3]
      .map(value => (value || '').trim())
      .filter(Boolean);

    if (!emails.length) {
      this.errorMessage.set('Ajoute au moins un email.');
      return;
    }

    try {
      this.reservationService.inviteByEmails(match.id, emails);
      this.successMessage.set('Invitations ajoutées au match privé.');
      this.inviteEmail1 = '';
      this.inviteEmail2 = '';
      this.inviteEmail3 = '';
    } catch (error: any) {
      this.errorMessage.set(error?.message ?? 'Erreur lors de l’ajout des invitations.');
    }
  }

  navigateBack() {
    this.router.navigate(['/my-reservations']);
  }

  isMatchPast(): boolean {
    const match = this.match();
    if (!match) return false;

    return isMatchPast(match.date, match.time);
  }

  getEmptySlots(): number[] {
    return Array.from({ length: this.remainingPlaces() }, (_, index) => index + 1);
  }

  getMatchStartTimestamp(): number {
    const match = this.match();
    if (!match) return Number.MAX_SAFE_INTEGER;

    return getMatchStartTimestamp(match.date, match.time);
  }
}
