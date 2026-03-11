import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClubService, Club } from '../../core/services/club.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-clubs',
  standalone: true,
  imports: [CommonModule, PageHeader, EmptyState],
  templateUrl: './clubs.html',
})
export class ClubsPage {

  private clubService = inject(ClubService);
  private router = inject(Router);

  clubs: Club[] = this.clubService.getClubs();

  // Methode navigateToClubCourts: gere la navigation vers l ecran approprie.
  navigateToClubCourts(clubId: number) {
    this.router.navigate(['/terrain', clubId]);
  }

  // Methode navigateToHome: gere la navigation vers l ecran approprie.
  navigateToHome() {
    this.router.navigate(['/home']);
  }

  // Methode getClubTags: recupere les donnees necessaires a cette fonctionnalite.
  getClubTags(club: Club): string[] {

    const tags: string[] = [];

    tags.push(club.type === 'indoor' ? 'Indoor' : 'Outdoor');

    if (club.location === 'Waterloo') {
      tags.push('Parking', 'Vestiaires','caféteria');
    }

    if (club.location === 'Uccle') {
      tags.push('Parking','Vestiaire','Bar', 'Saunna');
    }

    if (club.location === 'Forest') {
      tags.push('Parking','Tournois', 'Pro shop');
    }

    return tags.slice(0, 3);
  }

}
