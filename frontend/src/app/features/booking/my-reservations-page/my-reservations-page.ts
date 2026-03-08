import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { ReservationModel } from '../../../models/reservation.model';
import {getAmountPerPlayer, getPlayersLabel, isMatchPast,} from '../../../core/utils/match.utils';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';

type ReservationTab = 'ALL' | 'UPCOMING' | 'PAST' | 'CANCELED';
type ReservationSort = 'RECENT' | 'OLD' | 'PRICE_ASC' | 'PRICE_DESC';

@Component({
  selector: 'app-my-reservations-page',
  standalone: true,
  imports: [CommonModule, FormsModule , EmptyState , PageHeader],
  templateUrl: './my-reservations-page.html',
  styleUrls: ['./my-reservations-page.css'],
})
export class MyReservationsPage {
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser = this.userService.currentUser;

  selectedTab = signal<ReservationTab>('ALL');
  searchQuery = signal('');
  selectedSort = signal<ReservationSort>('RECENT');

  errorMessage = signal('');
  successMessage = signal('');

  isInviteModalOpen = signal(false);
  selectedReservationId = signal('');

  inviteEmail1 = '';
  inviteEmail2 = '';
  inviteEmail3 = '';

  reservations = computed<ReservationModel[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    let items = this.reservationService.listByUser(user.matricule);

    const tab = this.selectedTab();
    if (tab === 'CANCELED') items = items.filter(item => item.status === 'CANCELED');
    if (tab === 'UPCOMING') items = items.filter(item => item.status === 'CONFIRMED' && !this.isReservationPast(item));
    if (tab === 'PAST') items = items.filter(item => item.status === 'CONFIRMED' && this.isReservationPast(item));

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      items = items.filter(item =>
        `${item.clubName} ${item.courtName} ${item.time} ${item.date ?? ''} ${item.visibility ?? ''}`
          .toLowerCase()
          .includes(query)
      );
    }

    const sort = this.selectedSort();
    if (sort === 'RECENT') items = [...items].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    if (sort === 'OLD') items = [...items].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    if (sort === 'PRICE_ASC') items = [...items].sort((a, b) => a.total - b.total);
    if (sort === 'PRICE_DESC') items = [...items].sort((a, b) => b.total - a.total);

    return items;
  });

  nextReservation = computed<ReservationModel | null>(() => {
    const upcoming = this.reservations().filter(
      item => item.status === 'CONFIRMED' && !this.isReservationPast(item)
    );
    return upcoming.length ? upcoming[0] : null;
  });

  hasResults = computed(() => this.reservations().length > 0);

  setSelectedTab(tab: ReservationTab) {
    this.selectedTab.set(tab);
  }

  handleSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value ?? '');
  }

  handleSortChange(event: Event) {
    this.selectedSort.set((event.target as HTMLSelectElement).value as ReservationSort);
  }

  cancelReservation(id: string) {
    this.reservationService.cancel(id);
    this.successMessage.set('Réservation annulée.');
    this.errorMessage.set('');
  }

  downloadQrCode(_id: string) {
    alert('QR demo (à brancher backend plus tard).');
  }

  exportPdf() {
    alert('Export PDF demo (à faire plus tard).');
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  navigateToMatchDetail(reservation: ReservationModel) {
    this.router.navigate(['/match', reservation.id]);
  }

  navigateToNewReservation(reservation: ReservationModel) {
    this.router.navigate(['/home'], {
      queryParams: { clubName: reservation.clubName },
    });
  }

  isOrganizer(reservation: ReservationModel): boolean {
    const user = this.currentUser();
    if (!user) return false;

    return (reservation.organizerMatricule || '').trim() === (user.matricule || '').trim();
  }

  canInvitePlayers(reservation: ReservationModel): boolean {
    return reservation.status === 'CONFIRMED'
      && reservation.visibility === 'PRIVATE'
      && this.isOrganizer(reservation);
  }

  openInviteModal(reservation: ReservationModel) {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedReservationId.set(reservation.id);
    this.inviteEmail1 = '';
    this.inviteEmail2 = '';
    this.inviteEmail3 = '';
    this.isInviteModalOpen.set(true);
  }

  closeInviteModal() {
    this.isInviteModalOpen.set(false);
  }

  sendMatchInvitations() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const reservationId = this.selectedReservationId();
    if (!reservationId) {
      this.errorMessage.set('Réservation introuvable.');
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
      this.reservationService.inviteByEmails(reservationId, emails);
      this.successMessage.set('Invitations ajoutées au match privé.');
      this.isInviteModalOpen.set(false);
    } catch (error: any) {
      this.errorMessage.set(error?.message ?? 'Erreur lors de l’ajout des invitations.');
    }
  }

  getPlayersLabel(reservation: ReservationModel): string {
    return getPlayersLabel(reservation.players?.length ?? 0);
  }

  getVisibilityLabel(reservation: ReservationModel): string {
    return reservation.visibility === 'PRIVATE' ? 'Privé' : 'Public';
  }

  getAmountPerPlayer(reservation: ReservationModel): number {
    return getAmountPerPlayer(reservation.total);
  }

  isReservationPast(reservation: ReservationModel): boolean {
    return isMatchPast(reservation.date, reservation.time);
  }
}
