import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { CourtService } from '../../../core/services/court.service';
import { ClubService } from '../../../core/services/club.service';
import { ReservationService } from '../../../core/services/reservation-service';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';
import { UserService } from '../../../core/services/user-service';

import { SlotList, SlotItem } from '../components/slot-list/slot-list';
import { getTodayIso } from '../../../core/utils/date.utils';

@Component({
  selector: 'app-court-detail-page',
  standalone: true,
  imports: [CommonModule, SlotList],
  templateUrl: './court-detail-page.html',
})
export class CourtDetailPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private courtService = inject(CourtService);
  private clubService = inject(ClubService);
  private reservationService = inject(ReservationService);
  private slotPolicyService = inject(SlotPolicyService);
  private userService = inject(UserService);

  errorMessage = signal('');

  clubId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('clubId') ?? pm.get('id') ?? 0))),
    { initialValue: 0 }
  );

  courtId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('courtId') ?? 0))),
    { initialValue: 0 }
  );

  selectedDate = signal<string>(
    this.route.snapshot.queryParamMap.get('date') ?? getTodayIso()
  );

  selectedSlot = signal<SlotItem | null>(null);
  showConfirmModal = signal(false);
  matchVisibility = signal<'PUBLIC' | 'PRIVATE'>('PRIVATE');

  club = computed(() => this.clubService.getClubById(this.clubId()));
  clubName = computed(() => this.club()?.name ?? '—');
  clubLocation = computed(() => this.club()?.location ?? '—');

  court = computed(() => {
    const clubId = this.clubId();
    const courtId = this.courtId();
    if (!clubId || !courtId) return undefined;
    return this.courtService.getCourtById(clubId, courtId);
  });

  courtName = computed(() => this.court()?.name ?? '—');
  courtType = computed(() => this.court()?.type ?? 'indoor');

  matchTotal = computed<number>(() => 60);
  pricePerPlayer = computed<number>(() => Number((this.matchTotal() / 4).toFixed(2)));
  totalPrice = computed(() => this.pricePerPlayer());

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

  availableTimes = computed<string[]>(() => {
    const site = this.clubName();
    const date = this.selectedDate();
    if (!site || site === '—' || !date) return [];
    return this.slotPolicyService.getSlotsForSite(site, date);
  });

  slots = computed<SlotItem[]>(() => {
    const currentCourt = this.court();
    const site = this.clubName();
    const dateKey = (this.selectedDate() || '').trim();

    if (!currentCourt || !site || site === '—') return [];
    if (this.isClosed()) return [];

    return this.availableTimes().map(time => ({
      time,
      isAvailable: this.reservationService.isSlotAvailable(
        site,
        currentCourt.name,
        dateKey,
        time
      ),
    }));
  });

  // Methode setMatchVisibility: met a jour les donnees et maintient la coherence de l etat.
  setMatchVisibility(value: 'PUBLIC' | 'PRIVATE') {
    this.matchVisibility.set(value);
  }

  // Methode backToCourts: gere back to courts de ce bloc.
  backToCourts() {
    this.router.navigate(['/terrain', this.clubId()], {
      queryParams: {
        date: this.selectedDate(),
      },
    });
  }

  // Methode onDateChange: gere on date change de ce bloc.
  onDateChange(valueOrEvent: string | Event) {
    this.errorMessage.set('');

    const value =
      typeof valueOrEvent === 'string'
        ? valueOrEvent
        : (valueOrEvent.target as HTMLInputElement).value;

    const date = value || getTodayIso();
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  // Methode select: gere select de ce bloc.
  select(slot: SlotItem) {
    this.errorMessage.set('');
    if (!slot.isAvailable) return;
    this.selectedSlot.set(slot);
  }

  // Methode confirm: traite l action utilisateur avec les validations necessaires.
  confirm() {
    this.errorMessage.set('');

    if (this.isClosed()) {
      this.errorMessage.set('Le site est fermé pour cette date.');
      return;
    }

    if (!this.selectedSlot()) {
      this.errorMessage.set('Sélectionne un créneau avant de continuer.');
      return;
    }

    this.showConfirmModal.set(true);
  }

  // Methode closeConfirm: gere close confirm de ce bloc.
  closeConfirm() {
    this.showConfirmModal.set(false);
  }

  // Methode nextHourLabel: gere next hour label de ce bloc.
  nextHourLabel(time: string): string {
    return this.slotPolicyService.getEndTime(this.clubName(), time);
  }

  // Methode validateReservation: traite l action utilisateur avec les validations necessaires.
  validateReservation() {
    this.errorMessage.set('');

    const slot = this.selectedSlot();
    if (!slot) {
      this.errorMessage.set('Sélectionne un créneau avant de valider.');
      return;
    }

    const currentClub = this.club();
    const currentUser = this.userService.currentUser();

    if (currentUser && currentClub) {
      const result = this.reservationService.canUserReserveClub({
        matricule: currentUser.matricule,
        userSiteName: currentUser.siteName,
        clubName: currentClub.name,
        reservationDate: this.selectedDate(),
      });

      if (!result.allowed) {
        this.showConfirmModal.set(false);
        this.errorMessage.set(result.message);
        return;
      }
    }

    this.showConfirmModal.set(false);

    this.router.navigate(['/reservation'], {
      queryParams: {
        clubId: this.clubId(),
        courtId: this.courtId(),
        clubName: this.clubName(),
        courtName: this.courtName(),
        time: slot.time,
        date: this.selectedDate(),
        total: this.totalPrice(),
        siteName: this.clubName(),
        visibility: this.matchVisibility(),
      },
    });
  }

  // Methode goHome: gere la navigation vers l ecran approprie.
  goHome() {
    this.router.navigate(['/home']);
  }
}
