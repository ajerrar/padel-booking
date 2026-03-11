import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { ReservationModel } from '../../../models/reservation.model';
import {getAmountPerPlayer, getPlayersLabel,} from '../../../core/utils/match.utils';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-invitations-page',
  standalone: true,
  imports: [CommonModule, EmptyState, PageHeader],
  templateUrl: './invitations-page.html',
})
export class InvitationsPage {
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser = this.userService.currentUser;

  invitations = computed<ReservationModel[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.reservationService.listInvitationsForUser(user.email, user.matricule);
  });

  hasResults = computed(() => this.invitations().length > 0);

  // Methode getPlayersLabel: recupere les donnees necessaires a cette fonctionnalite.
  getPlayersLabel(reservation: ReservationModel): string {
    return getPlayersLabel(reservation.players?.length ?? 0);
  }

  // Methode getAmountPerPlayer: recupere les donnees necessaires a cette fonctionnalite.
  getAmountPerPlayer(reservation: ReservationModel): number {
    return Number((reservation.total || 0).toFixed(2));
  }

  // Methode getMatchTotal: recupere les donnees necessaires a cette fonctionnalite.
  getMatchTotal(reservation: ReservationModel): number {
    return Number((((reservation.total || 0) * 4)).toFixed(2));
  }

  // Methode getInvitationStatus: recupere les donnees necessaires a cette fonctionnalite.
  getInvitationStatus(reservation: ReservationModel): 'PENDING' | 'ACCEPTED' {
    const user = this.currentUser();
    if (!user) return 'PENDING';

    return this.reservationService.getInvitationStatus(reservation, user.email, user.matricule);
  }

  // Methode navigateToMatchDetail: gere la navigation vers l ecran approprie.
  navigateToMatchDetail(reservation: ReservationModel) {
    this.router.navigate(['/match', reservation.id]);
  }

  // Methode navigateToProfile: gere la navigation vers l ecran approprie.
  navigateToProfile() {
    this.router.navigate(['/user']);
  }
}
