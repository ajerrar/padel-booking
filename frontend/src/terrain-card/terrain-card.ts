import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { TerrainCardService } from './terrain-card-service';
import { CourtListModel } from '../models/court.model';

@Component({
  selector: 'app-terrain-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terrain-card.html',
  styleUrls: ['./terrain-card.css'],
})
export class TerrainCard {
  private terrainCardService = inject(TerrainCardService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);


  clubId = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('id') ?? 0))),
    { initialValue: 0 }
  );


  listeTerrain = computed<CourtListModel[]>(() =>
    this.terrainCardService.getCourtsByClubId(this.clubId())
  );

  isLibre(c: CourtListModel): boolean {
    return c.status === 'libre';
  }


  goToDetail(c: CourtListModel) {
    this.router.navigate(['/terrain', this.clubId(), 'court', c.id]);
  }

  getClubImage(): string {
    const images: { [key: number]: string } = {
      1: '/assets/image/waterloo.png',  // Court 24 Arena - Waterloo
      2: '/assets/image/uccle.png',     // Padel Factory - Uccle
      3: '/assets/image/forest.png'     // PlayZone Padel - Forest
    };
    return images[this.clubId()] || '/assets/image/forest.png';
  }
}
