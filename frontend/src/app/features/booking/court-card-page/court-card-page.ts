import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { CourtCardService } from '../../../core/services/court-card-service';
import { CourtListModel } from '../../../models/court.model';
import { ReservationService } from '../../../core/services/reservation-service';
import { CourtService } from '../../../core/services/court.service';
import { ReservationModel } from '../../../models/reservation.model';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';


@Component({
  selector: 'app-court-card-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './court-card-page.html',
  styleUrls: ['./court-card-page.css'],
})
export class CourtCardPage {
  private courtCardService = inject(CourtCardService);
  private reservationService = inject(ReservationService);
  private courtService = inject(CourtService);
  private slotPolicyService = inject(SlotPolicyService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  clubId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('id') ?? 0))),
    { initialValue: 0 }
  );

  selectedDate = toSignal(
    this.route.queryParamMap.pipe(map(q => (q.get('date') ?? this.todayISO()).trim())),
    { initialValue: this.todayISO() }
  );

  selectedTime = toSignal(
    this.route.queryParamMap.pipe(map(q => (q.get('time') ?? '').trim())),
    { initialValue: '' }
  );

  clubName = computed(() => {
    const id = this.clubId();
    return this.courtService.getterrains().find(c => c.id === id)?.name ?? '—';
  });

  listeTerrain = computed<CourtListModel[]>(() =>
    this.courtCardService.getCourtsByClubId(this.clubId())
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

  // ✅ propriété qui manquait
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

    return this.listeTerrain().filter(court =>
      this.reservationService.isSlotAvailable(club, court.name, date, time)
    );
  });

  publicMatches = computed<ReservationModel[]>(() => {
    const club = (this.clubName() || '').trim();
    const date = (this.selectedDate() || '').trim();
    const time = (this.effectiveSelectedTime() || '').trim();

    if (!club || club === '—' || !time || this.isClosed()) return [];

    return this.reservationService
      .list()
      .filter(r =>
        r.status === 'CONFIRMED' &&
        r.visibility === 'PUBLIC' &&
        (r.clubName || '').trim() === club &&
        (r.date || '').trim() === date &&
        (r.time || '').trim() === time &&
        (r.players?.length ?? 0) < 4
      );
  });

  goToDetail(c: CourtListModel) {
    this.router.navigate(['/terrain', this.clubId(), 'court', c.id], {
      queryParams: {
        date: this.selectedDate(),
        time: this.effectiveSelectedTime(),
      },
    });
  }

  goToMatch(m: ReservationModel) {
    this.router.navigate(['/match', m.id]);
  }

  playersLabel(m: ReservationModel): string {
    const n = m.players?.length ?? 0;
    return `${n}/4 joueurs`;
  }

  getClubImage(): string {
    const images: { [key: number]: string } = {
      1: '/assets/image/waterloo.png',
      2: '/assets/image/uccle.png',
      3: '/assets/image/forest.png',
    };
    return images[this.clubId()] || '/assets/image/forest.png';
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
