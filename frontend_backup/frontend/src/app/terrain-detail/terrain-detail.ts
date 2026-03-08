import { Component } from '@angular/core';
import {CourtService} from '../../court.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourtListModel } from '../../models/court.model';

@Component({
  selector: 'app-terrain-detail',
  standalone : true,
  imports: [CommonModule],
  templateUrl: './terrain-detail.html',
  styleUrl: './terrain-detail.css',
})

export class TerrainDetail {
  route = inject(Router);
  courtService = inject(CourtService);

terrain?: CourtListModel;

ngOnInit() {
  const id = Number(this.route.url.split('/').pop());
  this.terrain = this.courtService.getterrains().find(t => t.id === id);
}

}
