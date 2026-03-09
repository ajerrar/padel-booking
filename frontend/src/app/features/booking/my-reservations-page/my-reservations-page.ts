import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { ReservationModel } from '../../../models/reservation.model';
import { getPlayersLabel, isMatchPast } from '../../../core/utils/match.utils';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';

type ReservationTab = 'ALL' | 'UPCOMING' | 'PAST' | 'CANCELED';
type ReservationSort = 'RECENT' | 'OLD';
type ReservationFilter =
  | 'ALL'
  | 'PUBLIC'
  | 'PRIVATE'
  | 'CLUB_COURT_24_ARENA'
  | 'CLUB_PADEL_FACTORY'
  | 'CLUB_PLAYZONE_PADEL'
  | 'COURT_COURT_1'
  | 'COURT_COURT_2'
  | 'COURT_COURT_3'
  | 'COURT_COURT_4'
  | 'COURT_COURT_5'
  | 'COURT_COURT_6'
  | 'COURT_COURT_7'
  | 'COURT_COURT_8'
  | 'COURT_COURT_9'
  | 'COURT_COURT_10'
  | 'COURT_COURT_11'
  | 'COURT_COURT_12'
  | 'COURT_COURT_13';

@Component({
  selector: 'app-my-reservations-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyState, PageHeader],
  templateUrl: './my-reservations-page.html',
})
export class MyReservationsPage {
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser = this.userService.currentUser;

  selectedTab = signal<ReservationTab>('ALL');
  searchQuery = signal('');
  selectedSort = signal<ReservationSort>('RECENT');
  selectedFilter = signal<ReservationFilter>('ALL');

  errorMessage = signal('');
  successMessage = signal('');

  isInviteModalOpen = signal(false);
  selectedReservationId = signal('');

  inviteEmail1 = '';
  inviteEmail2 = '';
  inviteEmail3 = '';

  rawReservations = computed<ReservationModel[]>(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.reservationService.listByUser(user.matricule);
  });

  reservations = computed<ReservationModel[]>(() => {
    let items = [...this.rawReservations()];

    const tab = this.selectedTab();
    if (tab === 'CANCELED') {
      items = items.filter(item => item.status === 'CANCELED');
    }
    if (tab === 'UPCOMING') {
      items = items.filter(item => item.status === 'CONFIRMED' && !this.isReservationPast(item));
    }
    if (tab === 'PAST') {
      items = items.filter(item => item.status === 'CONFIRMED' && this.isReservationPast(item));
    }

    const filter = this.selectedFilter();

    if (filter === 'PUBLIC') {
      items = items.filter(item => item.visibility === 'PUBLIC');
    }

    if (filter === 'PRIVATE') {
      items = items.filter(item => item.visibility === 'PRIVATE');
    }

    if (filter.startsWith('CLUB_')) {
      const clubLabel = filter.replace('CLUB_', '').replaceAll('_', ' ').trim().toLowerCase();
      items = items.filter(item => String(item.clubName || '').trim().toLowerCase() === clubLabel);
    }

    if (filter.startsWith('COURT_')) {
      const courtLabel = filter.replace('COURT_', '').replaceAll('_', ' ').trim().toLowerCase();
      items = items.filter(item => String(item.courtName || '').trim().toLowerCase() === courtLabel);
    }

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      items = items.filter(item =>
        `${item.clubName} ${item.courtName} ${item.time} ${item.date ?? ''} ${item.visibility ?? ''}`
          .toLowerCase()
          .includes(query)
      );
    }

    const sort = this.selectedSort();
    if (sort === 'RECENT') {
      items = [...items].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    }
    if (sort === 'OLD') {
      items = [...items].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    }

    return items;
  });

  nextReservation = computed<ReservationModel | null>(() => {
    const upcoming = this.rawReservations()
      .filter(item => item.status === 'CONFIRMED' && !this.isReservationPast(item))
      .sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1));

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

  handleFilterChange(event: Event) {
    this.selectedFilter.set((event.target as HTMLSelectElement).value as ReservationFilter);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedSort.set('RECENT');
    this.selectedFilter.set('ALL');
    this.selectedTab.set('ALL');
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
    const currentUser = this.currentUser();

    if (!reservationId) {
      this.errorMessage.set('Réservation introuvable.');
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
      this.reservationService.inviteByEmails(reservationId, emails);
      this.successMessage.set('Invitations ajoutées au match privé.');
      this.isInviteModalOpen.set(false);
      this.inviteEmail1 = '';
      this.inviteEmail2 = '';
      this.inviteEmail3 = '';
    } catch (error: any) {
      this.errorMessage.set(error?.message ?? 'Erreur lors de l’ajout des invitations.');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private emailExistsInUsers(email: string): boolean {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    return this.userService.listUsers().some(
      user => String(user.email || '').trim().toLowerCase() === normalizedEmail
    );
  }

  getPlayersLabel(reservation: ReservationModel): string {
    return getPlayersLabel(reservation.players?.length ?? 0);
  }

  getVisibilityLabel(reservation: ReservationModel): string {
    return reservation.visibility === 'PRIVATE' ? 'Privé' : 'Public';
  }

  formatDisplayDate(date: string | undefined | null): string {
    if (!date) return '—';
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    return `${day}/${month}/${year}`;
  }

  getAmountPerPlayer(reservation: ReservationModel): number {
    return Number((reservation.total || 0).toFixed(2));
  }

  isReservationPast(reservation: ReservationModel): boolean {
    return isMatchPast(reservation.date, reservation.time);
  }
}
