import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { CourtService } from '../../../core/services/court.service';
import { CourtCardService } from '../../../core/services/court-card-service';
import { ReservationService } from '../../../core/services/reservation-service';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';

import { SlotList, SlotItem } from '../components/slot-list/slot-list';

@Component({
  selector: 'app-court-detail-page',
  standalone: true,
  imports: [CommonModule, SlotList],
  templateUrl: './court-detail-page.html',
  styleUrls: ['./court-detail-page.css'],
})
export class CourtDetailPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private courtService = inject(CourtService);
  private courtCardService = inject(CourtCardService);
  private reservationService = inject(ReservationService);
  private slotPolicyService = inject(SlotPolicyService);

  clubId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('clubId') ?? pm.get('id') ?? 0))),
    { initialValue: 0 }
  );

  courtId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('courtId') ?? 0))),
    { initialValue: 0 }
  );

  selectedDate = signal<string>(
    this.route.snapshot.queryParamMap.get('date') ?? this.todayISO()
  );

  selectedSlot = signal<SlotItem | null>(null);
  showConfirmModal = signal(false);

  clubName = computed(() => {
    const id = this.clubId();
    return this.courtService.getterrains().find(c => c.id === id)?.name ?? '—';
  });

  clubLocation = computed(() => {
    const map: Record<number, string> = {
      1: 'Waterloo',
      2: 'Uccle',
      3: 'Forest',
    };
    return map[this.clubId()] ?? '—';
  });

  court = computed(() => {
    const clubId = this.clubId();
    const courtId = this.courtId();
    if (!clubId || !courtId) return undefined;
    return this.courtCardService.GetCourtById(clubId, courtId);
  });

  courtName = computed(() => this.court()?.name ?? '—');
  courtType = computed(() => this.court()?.type ?? 'indoor');

  matchTotal = computed<number>(() => 60);
  pricePerPlayer = computed<number>(() => Number((this.matchTotal() / 4).toFixed(2)));
  totalPrice = computed(() => (this.selectedSlot() ? this.matchTotal() : 0));

  // ✅ fermeture du site
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

  // ✅ vrais créneaux selon le site
  availableTimes = computed<string[]>(() => {
    const site = this.clubName();
    const date = this.selectedDate();
    if (!site || site === '—' || !date) return [];
    return this.slotPolicyService.getSlotsForSite(site, date);
  });

  // ✅ slots = créneaux du site, puis on enlève ceux déjà réservés
  slots = computed<SlotItem[]>(() => {
    const c = this.court();
    const site = this.clubName();
    const dateKey = (this.selectedDate() || '').trim();

    if (!c || !site || site === '—') return [];

    const base = this.availableTimes();

    if (this.isClosed()) {
      return [];
    }

    return base.map(time => ({
      time,
      isAvailable: this.reservationService.isSlotAvailable(
        site,
        c.name,
        dateKey,
        time
      ),
    }));
  });


  backToCourts() {
    this.router.navigate(['/terrain', this.clubId()], {
      queryParams: {
        date: this.selectedDate(),
      },
    });
  }

  onDateChange(valueOrEvent: string | Event) {
    const v =
      typeof valueOrEvent === 'string'
        ? valueOrEvent
        : (valueOrEvent.target as HTMLInputElement).value;

    const date = v || this.todayISO();
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
  }

  select(s: SlotItem) {
    if (!s.isAvailable) return;
    this.selectedSlot.set(s);
  }

  confirm() {
    if (!this.selectedSlot()) return;
    this.showConfirmModal.set(true);
  }

  closeConfirm() {
    this.showConfirmModal.set(false);
  }

  // ✅ fin du créneau calculée avec SlotPolicyService
  nextHourLabel(time: string): string {
    return this.slotPolicyService.getEndTime(this.clubName(), time);
  }

  validateReservation() {
    const slot = this.selectedSlot();
    if (!slot) return;

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
      },
    });
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  private todayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
