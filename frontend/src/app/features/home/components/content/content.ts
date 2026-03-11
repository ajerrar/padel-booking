import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService, Club } from '../../../../core/services/club.service';
import { ReservationService } from '../../../../core/services/reservation-service';
import { ReservationModel } from '../../../../models/reservation.model';
import { UserService } from '../../../../core/services/user-service';
import { SlotPolicyService } from '../../../../core/services/slot-policy.service';
import {
  getPlayersLabel,
  getRemainingPlaces,
} from '../../../../core/utils/match.utils';
import { getTodayIso } from '../../../../core/utils/date.utils';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content.html',
})
export class Content {
  private router = inject(Router);
  private clubService = inject(ClubService);
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private slotPolicyService = inject(SlotPolicyService);

  clubList: Club[] = this.clubService.getClubs();

  selectedClubId = '';
  selectedDate = getTodayIso();
  selectedTime = '';

  errorMessage = signal('');
  currentUser = this.userService.currentUser;

  // Methode constructor: initialise l etat du composant ou du service au chargement.
  constructor() {
    this.refreshSelectedTime();
  }

  // Methode getAvailableTimes: recupere les donnees necessaires a cette fonctionnalite.
  getAvailableTimes(): string[] {
    const clubId = Number(this.selectedClubId);
    if (!clubId || !this.selectedDate) return [];

    const club = this.clubService.getClubById(clubId);
    if (!club) return [];

    return this.slotPolicyService.getSlotsForSite(club.name, this.selectedDate);
  }

  // Methode handleSiteChange: gere handle site change de ce bloc.
  handleSiteChange() {
    this.errorMessage.set('');
    this.refreshSelectedTime();
  }

  // Methode handleDateChange: gere handle date change de ce bloc.
  handleDateChange() {
    this.errorMessage.set('');
    this.refreshSelectedTime();
  }

  // Methode refreshSelectedTime: gere refresh selected time de ce bloc.
  private refreshSelectedTime() {
    const times = this.getAvailableTimes();
    this.selectedTime = times.length ? times[0] : '';
  }

  // Methode navigateToCourtList: gere la navigation vers l ecran approprie.
  navigateToCourtList() {
    this.errorMessage.set('');

    const user = this.currentUser();
    const clubId = Number(this.selectedClubId);

    if (!clubId) {
      this.errorMessage.set('Sélectionne un club.');
      return;
    }

    if (!this.selectedDate) {
      this.errorMessage.set('Sélectionne une date.');
      return;
    }

    const club = this.clubService.getClubById(clubId);
    if (!club) {
      this.errorMessage.set('Club introuvable.');
      return;
    }

    if (user) {
      const result = this.reservationService.canUserReserveClub({
        matricule: user.matricule,
        userSiteName: user.siteName,
        clubName: club.name,
        reservationDate: this.selectedDate,
      });

      if (!result.allowed) {
        this.errorMessage.set(result.message);
        return;
      }
    }

    if (!this.selectedTime) {
      this.errorMessage.set('Aucun créneau disponible pour ce club à cette date.');
      return;
    }

    this.router.navigate(['/terrain', clubId], {
      queryParams: {
        date: this.selectedDate,
        time: this.selectedTime,
      },
    });
  }

  // Methode navigateToMatch: gere la navigation vers l ecran approprie.
  navigateToMatch(matchId: string) {
    this.router.navigate(['/match', matchId]);
  }

  previewClubs = computed(() => {
    return this.clubList.map(club => ({
      id: club.id,
      name: club.name,
      city: club.location,
      type: club.type === 'indoor' ? 'Indoor' : 'Outdoor',
      courts: club.courts.length,
      price: club.price,
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

    const memberType = this.userService.getMemberTypeFromMatricule(currentUser.matricule);
    const userSite = (currentUser.siteName || '').trim().toLowerCase();

    if (memberType === 'SITE' && userSite) {
      matches = matches.filter(
        match => (match.siteName || '').trim().toLowerCase() === userSite
      );
    }

    return matches.slice(0, 2);
  });

  // Methode getPlayersLabel: recupere les donnees necessaires a cette fonctionnalite.
  getPlayersLabel(match: ReservationModel): string {
    return getPlayersLabel(match.players?.length ?? 0);
  }

  // Methode getRemainingPlaces: recupere les donnees necessaires a cette fonctionnalite.
  getRemainingPlaces(match: ReservationModel): number {
    return getRemainingPlaces(match.players?.length ?? 0);
  }

  // Methode getAmountPerPlayer: recupere les donnees necessaires a cette fonctionnalite.
  getAmountPerPlayer(match: ReservationModel): number {
    return Number((match.total || 0).toFixed(2));
  }

  // Methode reservePreview: gere reserve preview de ce bloc.
  reservePreview(clubId: number) {
    this.errorMessage.set('');

    const currentUser = this.currentUser();
    const club = this.clubService.getClubById(clubId);

    if (!club) return;

    if (currentUser) {
      const result = this.reservationService.canUserReserveClub({
        matricule: currentUser.matricule,
        userSiteName: currentUser.siteName,
        clubName: club.name,
        reservationDate: this.selectedDate,
      });

      if (!result.allowed) {
        this.errorMessage.set(result.message);
        return;
      }
    }

    const defaultTimes = this.slotPolicyService.getSlotsForSite(club.name, this.selectedDate);

    if (!defaultTimes.length) {
      this.errorMessage.set('Aucun créneau disponible pour ce club à cette date.');
      return;
    }

    this.router.navigate(['/terrain', clubId], {
      queryParams: {
        date: this.selectedDate,
        time: defaultTimes[0],
      },
    });
  }

  // Methode canReserveClub: verifie une condition metier et renvoie le resultat attendu.
  canReserveClub(clubId: number): boolean {
    const currentUser = this.currentUser();
    const club = this.clubService.getClubById(clubId);

    if (!club) return false;
    if (!currentUser) return true;

    const result = this.reservationService.canUserReserveClub({
      matricule: currentUser.matricule,
      userSiteName: currentUser.siteName,
      clubName: club.name,
      reservationDate: this.selectedDate,
    });

    return result.allowed;
  }
}
