import { Component,inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourtService } from '../../../court.service';
import { CourtListModel } from '../../../models/court.model';



@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content.html',
  styleUrls: ['./content.css'],
})
export class Content  {
  route = inject(Router);
  courtService = inject(CourtService);

  terrainsList : CourtListModel[] = this.courtService.getterrains();

  cherchertext = '';
  selecterrain = '';
  selectedterrain: number | null = null;
  filtrerterrains = this.terrainsList;

  filtrerparnom(){
  this.filtrerterrains = this.terrainsList.filter(court => court.name.toLowerCase().includes(this.cherchertext.toLowerCase()));};

  filtrerpartype() {
    this.filtrerterrains = this.terrainsList.filter(court => court.type.toLowerCase().includes(this.cherchertext.toLowerCase()));
  }
  filtrerparterrain() {
    if (this.selecterrain === '') {
      this.filtrerterrains = this.terrainsList;
      return;
    }
    this.filtrerterrains = this.terrainsList.filter(t => t.name === this.selecterrain);
  }

  goToterrain() {
    if (this.selecterrain === null) return;
    {
      this.route.navigate(['/terrain', this.selecterrain]);
    }
  }
}
