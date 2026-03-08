import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourtService } from '../../../../core/services/court.service';
import { CourtListModel } from '../../../../models/court.model';
import { ReservationService } from '../../../../core/services/reservation-service';
import { ReservationModel } from '../../../../models/reservation.model';
import { UserService } from '../../../../core/services/user-service';
import { SlotPolicyService } from '../../../../core/services/slot-policy.service';
import {
  getAmountPerPlayer,
  getPlayersLabel,
  getRemainingPlaces,
} from '../../../../core/utils/match.utils';

type MemberType = 'GLOBAL' | 'SITE' | 'FREE';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content.html',
  styleUrls: ['./content.css'],
})
export class Content {
  private router = inject(Router);
  private courtService = inject(CourtService);
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private slotPolicyService = inject(SlotPolicyService);

  courtList: CourtListModel[] = this.courtService.getterrains();

  searchQuery = '';
  selectedCourtId = '';
  selectedDate = this.getTodayIso();
  selectedTime = '';

  filteredCourts: CourtListModel[] = this.courtList;
  currentUser = this.userService.currentUser;

  constructor() {
    this.refreshSelectedTime();
  }

  filterByName() {
    this.filteredCourts = this.courtList.filter(court =>
      court.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  filterByType() {
    this.filteredCourts = this.courtList.filter(court =>
      court.type.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  filterByCourt() {
    if (this.selectedCourtId === '') {
      this.filteredCourts = this.courtList;
      return;
    }

    const selectedId = Number(this.selectedCourtId);
    this.filteredCourts = this.courtList.filter(court => court.id === selectedId);
  }

  getAvailableTimes(): string[] {
    const clubId = Number(this.selectedCourtId);
    if (!clubId) return [];

    const clubName = this.courtService.getterrains().find(court => court.id === clubId)?.name ?? '';
    if (!clubName) return [];

    return this.slotPolicyService.getSlotsForSite(clubName, this.selectedDate);
  }

  handleSiteChange() {
    this.refreshSelectedTime();
  }

  handleDateChange() {
    this.refreshSelectedTime();
  }

  private refreshSelectedTime() {
    const times = this.getAvailableTimes();
    this.selectedTime = times.length ? times[0] : '';
  }

  navigateToCourtList() {
    const clubId = Number(this.selectedCourtId);
    if (!clubId || !this.selectedTime) return;

    this.router.navigate(['/terrain', clubId], {
      queryParams: {
        date: this.selectedDate,
        time: this.selectedTime,
      },
    });
  }

  navigateToMatch(matchId: string) {
    this.router.navigate(['/match', matchId]);
  }

  previewClubs = computed(() => {
    const allClubs = this.courtList;

    return allClubs.slice(0, 2).map((club, index) => ({
      id: club.id,
      name: club.name,
      city: this.getClubCity(club.id),
      type: index % 2 === 0 ? 'Indoor' : 'Outdoor',
      courts: this.getClubCourtsCount(club.id),
      price: 60,
      slots: this.slotPolicyService.getSlotsForSite(club.name, this.selectedDate).slice(0, 3),
    }));
  });

  previewPublicMatches = computed<ReservationModel[]>(() => {
    const currentUser = this.currentUser();

    let matches = this.reservationService
      .list()
      .filter(match => match.status === 'CONFIRMED')
      .filter(match => match.visibility === 'PUBLIC')
      .filter(match => (match.players?.length ?? 0) < 4);

    if (!currentUser) return matches.slice(0, 2);

    const memberType = this.getMemberTypeFromMatricule(currentUser.matricule);
    const userSite = (currentUser.siteName || '').trim().toLowerCase();

    if (memberType === 'SITE' && userSite) {
      matches = matches.filter(
        match => (match.siteName || '').trim().toLowerCase() === userSite
      );
    }

    return matches.slice(0, 2);
  });

  getPlayersLabel(match: ReservationModel): string {
    return getPlayersLabel(match.players?.length ?? 0);
  }

  getRemainingPlaces(match: ReservationModel): number {
    return getRemainingPlaces(match.players?.length ?? 0);
  }

  getAmountPerPlayer(match: ReservationModel): number {
    return getAmountPerPlayer(match.total);
  }

  reservePreview(clubId: number) {
    const currentUser = this.currentUser();

    if (currentUser) {
      const memberType = this.getMemberTypeFromMatricule(currentUser.matricule);

      if (memberType === 'SITE') {
        const userSite = (currentUser.siteName || '').trim().toLowerCase();
        const targetSite = (this.courtService.getterrains().find(court => court.id === clubId)?.name || '')
          .trim()
          .toLowerCase();

        if (userSite && targetSite && userSite !== targetSite) {
          return;
        }
      }
    }

    const club = this.courtService.getterrains().find(court => court.id === clubId);
    const defaultTimes = this.slotPolicyService.getSlotsForSite(club?.name ?? '', this.selectedDate);

    this.router.navigate(['/terrain', clubId], {
      queryParams: {
        date: this.selectedDate,
        time: defaultTimes[0] ?? '',
      },
    });
  }

  canReserveClub(clubId: number): boolean {
    const currentUser = this.currentUser();
    if (!currentUser) return true;

    const memberType = this.getMemberTypeFromMatricule(currentUser.matricule);
    if (memberType !== 'SITE') return true;

    const userSite = (currentUser.siteName || '').trim().toLowerCase();
    const targetSite = (this.courtService.getterrains().find(court => court.id === clubId)?.name || '')
      .trim()
      .toLowerCase();

    return !userSite || !targetSite || userSite === targetSite;
  }

  private getMemberTypeFromMatricule(matricule: string): MemberType {
    const value = (matricule || '').trim().toUpperCase();
    if (value.startsWith('G')) return 'GLOBAL';
    if (value.startsWith('S')) return 'SITE';
    return 'FREE';
  }

  private getClubCity(clubId: number): string {
    const cityMap: Record<number, string> = {
      1: 'Waterloo',
      2: 'Uccle',
      3: 'Forest',
    };
    return cityMap[clubId] ?? 'Bruxelles';
  }

  private getClubCourtsCount(clubId: number): number {
    const courtsCountMap: Record<number, number> = {
      1: 13,
      2: 5,
      3: 5,
    };
    return courtsCountMap[clubId] ?? 4;
  }

  private getTodayIso(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
