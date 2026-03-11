import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { ReservationModel } from '../../../models/reservation.model';
import { FormsModule } from '@angular/forms';
import { formatDisplayDate } from '../../../core/utils/date.utils';
import {
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

  outstandingDebt = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.reservationService.getOrganizerOutstandingDebt(user.matricule);
  });

  matchBaseAmount = computed(() => {
    const match = this.match();
    return Number((match?.total ?? 0).toFixed(2));
  });

  totalToPayNow = computed(() => {
    return Number((this.matchBaseAmount() + this.outstandingDebt()).toFixed(2));
  });

  // Methode canCurrentUserAccessMatchDate: verifie une condition metier et renvoie le resultat attendu.
  private canCurrentUserAccessMatchDate(): { allowed: boolean; message: string } {
    const user = this.currentUser();
    const match = this.match();

    if (!user || !match) {
      return { allowed: false, message: 'Match introuvable.' };
    }

    return this.reservationService.canUserReserveClub({
      matricule: user.matricule,
      userSiteName: user.siteName,
      clubName: match.clubName,
      reservationDate: match.date,
    });
  }

  canJoinPublicMatch = computed(() => {
    const user = this.currentUser();
    const match = this.match();

    if (!user || !match) return false;
    if (match.status !== 'CONFIRMED') return false;
    if (match.visibility !== 'PUBLIC') return false;
    if (this.isCurrentUserParticipant()) return false;
    if (this.isComplete()) return false;
    if (this.isMatchPast()) return false;

    const ruleCheck = this.canCurrentUserAccessMatchDate();
    return ruleCheck.allowed;
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

    const ruleCheck = this.canCurrentUserAccessMatchDate();
    if (!ruleCheck.allowed) return false;

    if (this.isInvitedByEmail()) return true;
    if (this.isCurrentUserParticipant() && !this.isCurrentUserPaid()) return true;

    return false;
  });

  // Methode getPlayersLabel: recupere les donnees necessaires a cette fonctionnalite.
  getPlayersLabel(): string {
    return getPlayersLabel(this.match()?.players?.length ?? 0);
  }

  // Methode getAmountPerPlayer: recupere les donnees necessaires a cette fonctionnalite.
  getAmountPerPlayer(): number {
    return this.matchBaseAmount();
  }

  // Methode getDisplayedAmountToPay: recupere les donnees necessaires a cette fonctionnalite.
  getDisplayedAmountToPay(): number {
    return this.totalToPayNow();
  }

  // Methode getMatchTotal: recupere les donnees necessaires a cette fonctionnalite.
  getMatchTotal(): number {
    return Number((((this.match()?.total ?? 0) * 4)).toFixed(2));
  }

  // Methode formatDisplayDate: construit la valeur attendue a partir des donnees disponibles.
  formatDisplayDate(date: string | undefined | null): string {
    return formatDisplayDate(date);
  }

  // Methode joinPublicMatch: traite l action utilisateur avec les validations necessaires.
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

    const ruleCheck = this.canCurrentUserAccessMatchDate();
    if (!ruleCheck.allowed) {
      this.errorMessage.set(ruleCheck.message);
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

  // Methode payPrivateInvitationSeat: gere pay private invitation seat de ce bloc.
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

    const ruleCheck = this.canCurrentUserAccessMatchDate();
    if (!ruleCheck.allowed) {
      this.errorMessage.set(ruleCheck.message);
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

  // Methode sendMatchInvitations: gere send match invitations de ce bloc.
  sendMatchInvitations() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const match = this.match();
    const currentUser = this.currentUser();

    if (!match) {
      this.errorMessage.set('Match introuvable.');
      return;
    }

    const emails = [this.inviteEmail1, this.inviteEmail2, this.inviteEmail3]
      .map(value => String(value || '').trim().toLowerCase())
      .filter(Boolean);

    if (!emails.length) {
      this.errorMessage.set('Ajoute au moins un email.');
      return;
    }

    const invalidEmail = emails.find(email => !this.isValidEmail(email));
    if (invalidEmail) {
      this.errorMessage.set(`Format email invalide : ${invalidEmail}`);
      return;
    }

    const duplicates = new Set<string>();
    for (const email of emails) {
      if (duplicates.has(email)) {
        this.errorMessage.set(`Email en double : ${email}`);
        return;
      }
      duplicates.add(email);
    }

    if (currentUser?.email) {
      const myEmail = String(currentUser.email).trim().toLowerCase();
      if (emails.includes(myEmail)) {
        this.errorMessage.set('Tu ne peux pas t’inviter toi-même.');
        return;
      }
    }

    const unknownEmail = emails.find(email => !this.emailExistsInUsers(email));
    if (unknownEmail) {
      this.errorMessage.set(`Cette adresse n'existe pas dans les utilisateurs : ${unknownEmail}`);
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

  // Methode isValidEmail: verifie une condition metier et renvoie le resultat attendu.
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Methode emailExistsInUsers: gere email exists in users de ce bloc.
  private emailExistsInUsers(email: string): boolean {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    return this.userService.listUsers().some(
      user => String(user.email || '').trim().toLowerCase() === normalizedEmail
    );
  }

  // Methode navigateBack: gere la navigation vers l ecran approprie.
  navigateBack() {
    this.router.navigate(['/my-reservations']);
  }

  // Methode isMatchPast: verifie une condition metier et renvoie le resultat attendu.
  isMatchPast(): boolean {
    const match = this.match();
    if (!match) return false;

    return isMatchPast(match.date, match.time);
  }

  // Methode getEmptySlots: recupere les donnees necessaires a cette fonctionnalite.
  getEmptySlots(): number[] {
    return Array.from({ length: this.remainingPlaces() }, (_, index) => index + 1);
  }

  // Methode getMatchStartTimestamp: recupere les donnees necessaires a cette fonctionnalite.
  getMatchStartTimestamp(): number {
    const match = this.match();
    if (!match) return Number.MAX_SAFE_INTEGER;

    return getMatchStartTimestamp(match.date, match.time);
  }
  participationInfoMessage = computed(() => {
    const user = this.currentUser();
    const match = this.match();

    if (!user || !match) return '';

    const ruleCheck = this.reservationService.canUserReserveClub({
      matricule: user.matricule,
      userSiteName: user.siteName,
      clubName: match.clubName,
      reservationDate: match.date,
    });

    if (!ruleCheck.allowed) {
      return ruleCheck.message;
    }

    if (this.isCurrentUserParticipant() && !this.isCurrentUserPaid()) {
      return 'Tu es invité à ce match, mais ta place est encore en attente de paiement.';
    }

    if (this.isCurrentUserParticipant() && this.isCurrentUserPaid()) {
      return 'Tu participes déjà à ce match.';
    }

    return '';
  });
}
