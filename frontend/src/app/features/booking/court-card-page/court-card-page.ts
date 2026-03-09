import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { CourtService } from '../../../core/services/court.service';
import { ClubService } from '../../../core/services/club.service';
import { CourtListModel } from '../../../models/court.model';
import { ReservationService } from '../../../core/services/reservation-service';
import { ReservationModel } from '../../../models/reservation.model';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';
import { getTodayIso } from '../../../core/utils/date.utils';

@Component({
  selector: 'app-court-card-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './court-card-page.html',
})
export class CourtCardPage {
  private courtService = inject(CourtService);
  private clubService = inject(ClubService);
  private reservationService = inject(ReservationService);
  private slotPolicyService = inject(SlotPolicyService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  clubId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('id') ?? 0))),
    { initialValue: 0 }
  );

  selectedDate = toSignal(
    this.route.queryParamMap.pipe(map(q => (q.get('date') ?? getTodayIso()).trim())),
    { initialValue: getTodayIso() }
  );

  selectedTime = toSignal(
    this.route.queryParamMap.pipe(map(q => (q.get('time') ?? '').trim())),
    { initialValue: '' }
  );

  club = computed(() => this.clubService.getClubById(this.clubId()));

  clubName = computed(() => this.club()?.name ?? '—');

  listCourt = computed<CourtListModel[]>(() =>
    this.courtService.getCourtsByClubId(this.clubId())
  );

  isClosed = computed(() => {
    const site = this.clubName();
    const date = this.selectedDate();
    if (!site || site === '—' || !date) return false;
    return this.slotPolicyService.isClosed(site, date);
  });

  closureReason = computed(() => {
    const site = this.clubName();
    const date = this.selectedDate();
    if (!site || site === '—' || !date) return null;
    return this.slotPolicyService.getClosureReason(site, date);
  });

  siteSlots = computed<string[]>(() => {
    const site = this.clubName();
    const date = this.selectedDate();
    if (!site || site === '—' || !date) return [];
    return this.slotPolicyService.getSlotsForSite(site, date);
  });

  effectiveSelectedTime = computed(() => {
    const selected = (this.selectedTime() || '').trim();
    const slots = this.siteSlots();

    if (selected && slots.includes(selected)) return selected;
    return slots[0] ?? '';
  });

  availableCourts = computed<CourtListModel[]>(() => {
    const club = (this.clubName() || '').trim();
    const date = (this.selectedDate() || '').trim();
    const time = (this.effectiveSelectedTime() || '').trim();

    if (!club || club === '—' || !time || this.isClosed()) return [];

    return this.listCourt().filter(court =>
      this.reservationService.isSlotAvailable(club, court.name, date, time)
    );
  });

  publicMatches = computed<ReservationModel[]>(() => {
    const club = (this.clubName() || '').trim().toLowerCase();
    const date = (this.selectedDate() || '').trim();

    if (!club || club === '—' || this.isClosed()) return [];

    return this.reservationService
      .list()
      .filter(match => match.status === 'CONFIRMED')
      .filter(match => match.visibility === 'PUBLIC')
      .filter(match => (match.players?.length ?? 0) < 4)
      .filter(match => {
        const matchClub = (match.clubName || match.siteName || '').trim().toLowerCase();
        return matchClub === club;
      })
      .filter(match => (match.date || '').trim() === date);
  });

  goToDetail(court: CourtListModel) {
    this.router.navigate(['/terrain', this.clubId(), 'court', court.id], {
      queryParams: {
        date: this.selectedDate(),
        time: this.effectiveSelectedTime(),
      },
    });
  }

  goToMatch(match: ReservationModel) {
    this.router.navigate(['/match', match.id]);
  }

  playersLabel(match: ReservationModel): string {
    const count = match.players?.length ?? 0;
    return `${count}/4 joueurs`;
  }

  getClubImage(): string {
    const images: Record<number, string> = {
      1: '/assets/image/waterloo.png',
      2: '/assets/image/uccle.png',
      3: '/assets/image/forest.png',
    };
    return images[this.clubId()] || '/assets/image/forest.png';
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
