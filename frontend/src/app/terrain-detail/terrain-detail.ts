import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { CourtService } from '../../court.service';
import { TerrainCardService } from '../../terrain-card/terrain-card-service';
import { CourtListModel } from '../../models/court.model';

type Slot = { time: string; isAvailable: boolean };

@Component({
  selector: 'app-terrain-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terrain-detail.html',
  styleUrls: ['./terrain-detail.css'],
})
export class TerrainDetail {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clubService = inject(CourtService);
  private terrainCardService = inject(TerrainCardService);


  clubId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('clubId') ?? pm.get('id') ?? 0))),
    { initialValue: 0 }
  );

  courtId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('courtId') ?? 0))),
    { initialValue: 0 }
  );


  clubName = computed(() => this.clubService.getterrains().find(c => c.id === this.clubId())?.name ?? '—');
  clubLocation = computed(() => 'Bruxelles'); // adapte si tu as une vraie location

  court = computed<CourtListModel | undefined>(() =>
    this.terrainCardService.GetCourtById(this.clubId(), this.courtId())
  );

  courtName = computed(() => this.court()?.name ?? '—');
  courtType = computed(() => this.court()?.type ?? 'indoor');


  pricePerHour = computed<number>(() => (this.courtType() === 'indoor' ? 18 : 16));


  slots = computed<Slot[]>(() => {
    const c = this.court();
    if (!c) return [];

    const base = ['18:00', '19:00', '20:00', '21:00'];

    if (!c.availableTimes) return base.map(time => ({ time, isAvailable: false }));

    if (c.status === 'complet') return base.map(time => ({ time, isAvailable: false }));


    return base.map(time => ({ time, isAvailable: true }));
  });


  selectedSlot = signal<Slot | null>(null);

  totalPrice = computed(() => (this.selectedSlot() ? this.pricePerHour() : 0));


  showConfirmModal = signal(false);

  backToCourts() {

    this.router.navigate(['/terrain', this.clubId()]);
  }

  getClubImage(): string {
    const images: { [key: number]: string } = {
      1: '/assets/image/waterloo.png',  // Court 24 Arena - Waterloo
      2: '/assets/image/uccle.png',     // Padel Factory - Uccle
      3: '/assets/image/forest.png'     // PlayZone Padel - Forest
    };
    return images[this.clubId()] || '/assets/image/forest.png';
  }

  isLibre(): boolean {
    return this.court()?.status === 'libre';
  }

  select(slot: Slot) {
    if (!slot.isAvailable) return;
    this.selectedSlot.set(slot);
  }

  nextHourLabel(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const nextH = (h + 1) % 24;
    return `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  confirm() {
    if (!this.selectedSlot()) return;
    this.showConfirmModal.set(true);
  }

  closeConfirm() {
    this.showConfirmModal.set(false);
  }

  validateReservation() {
    const slot = this.selectedSlot();
    if (!slot) return;

    // Ferme le modal
    this.showConfirmModal.set(false);


    this.router.navigate(['/reservation'], {
      queryParams: {
        clubId: this.clubId(),
        courtId: this.courtId(),
        time: slot.time,
      },
    });
  }
}
