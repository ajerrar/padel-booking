import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TerrainCardService } from './terrain-card-service';
import { CourtListModel } from '../models/court.model';
import {TerrainDetail} from '../app/terrain-detail/terrain-detail';

@Component({
  selector: 'app-terrain-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terrain-card.html',
  styleUrls: ['./terrain-card.css'],
})
export class TerrainCard implements OnInit {
  private terrainCardService = inject(TerrainCardService);
  private route = inject(ActivatedRoute);

  listeTerrain: CourtListModel[] = [];

  ngOnInit() {
    const clubId = Number(this.route.snapshot.paramMap.get('id')); // /terrain/1 -> 1
    this.listeTerrain = this.terrainCardService.getCourtsByClubId(clubId);

  }

  isLibre(c: CourtListModel): boolean {
    return c.status === 'libre';
  }
  GoToDetail(c: CourtListModel) {
    window.location.href = `/terrain/${c.id}`;
  }


}
