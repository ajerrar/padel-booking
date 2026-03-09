import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { ReservationModel } from '../../../models/reservation.model';
import {
  getRemainingPlaces,
  getMatchStartTimestamp,
  isMatchPast,
} from '../../../core/utils/match.utils';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';

type SortOption = 'SOONEST' | 'LATEST' | 'MOST_PLAYERS';

@Component({
  selector: 'app-matches-publics-page',
  standalone: true,
  imports: [CommonModule, EmptyState, PageHeader],
  templateUrl: './matches-publics-page.html',
})
export class PublicMatchesPage {
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser = this.userService.currentUser;

  searchQuery = signal('');
  selectedSortOption = signal<SortOption>('SOONEST');

  publicMatches = computed<ReservationModel[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const sort = this.selectedSortOption();

    let matches = this.reservationService
      .list()
      .filter(match => match.status === 'CONFIRMED')
      .filter(match => match.visibility === 'PUBLIC')
      .filter(match => (match.players?.length ?? 0) < 4)
      .filter(match => !isMatchPast(match.date, match.time));

    if (query) {
      matches = matches.filter(match =>
        (match.clubName || '').toLowerCase().includes(query) ||
        (match.courtName || '').toLowerCase().includes(query) ||
        (match.date || '').toLowerCase().includes(query) ||
        (match.time || '').toLowerCase().includes(query)
      );
    }

    if (sort === 'SOONEST') {
      matches = [...matches].sort(
        (a, b) => getMatchStartTimestamp(a.date, a.time) - getMatchStartTimestamp(b.date, b.time)
      );
    }

    if (sort === 'LATEST') {
      matches = [...matches].sort(
        (a, b) => getMatchStartTimestamp(b.date, b.time) - getMatchStartTimestamp(a.date, a.time)
      );
    }

    if (sort === 'MOST_PLAYERS') {
      matches = [...matches].sort(
        (a, b) => (b.players?.length ?? 0) - (a.players?.length ?? 0)
      );
    }

    return matches;
  });

  myPublicMatches = computed(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.publicMatches().filter(match =>
      match.players.some(player => player.matricule === user.matricule)
    );
  });

  hasResults = computed(() => this.publicMatches().length > 0);

  handleSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value ?? '');
  }

  handleSortChange(event: Event) {
    this.selectedSortOption.set((event.target as HTMLSelectElement).value as SortOption);
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  navigateToMatchDetail(matchId: string) {
    this.router.navigate(['/match', matchId]);
  }

  isCurrentUserParticipant(match: ReservationModel): boolean {
    const user = this.currentUser();
    if (!user) return false;

    return match.players.some(player => player.matricule === user.matricule);
  }

  getRemainingPlaces(match: ReservationModel): number {
    return getRemainingPlaces(match.players?.length ?? 0);
  }

  getAmountPerPlayer(match: ReservationModel): number {
    return Number((match.total || 0).toFixed(2));
  }

  getMatchTotal(match: ReservationModel): number {
    return Number((((match.total || 0) * 4)).toFixed(2));
  }

  formatDisplayDate(date: string | undefined | null): string {
    if (!date) return '—';
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    return `${day}/${month}/${year}`;
  }
}
