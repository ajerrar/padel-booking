import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Club {
  id: number;
  name: string;
  location: string;
  type: 'indoor' | 'outdoor';
  priceMin: number;
  priceMax: number;
  courts: Court[];       // <= IMPORTANT (pas juste un nombre)
  rating: number;
}

export interface Court {
  id: number;
  name: string;          // "Terrain 1"
  type: 'indoor' | 'outdoor';
  status: 'Libre' | 'Occupé';
  slots: Slot[];
}

export interface Slot {
  time: string;          // "18:00"
  available: boolean;    // libre ou pas
}

export interface FilterCriteria {
  location?: string;
  type?: 'indoor' | 'outdoor' | '';
  priceMax?: number;
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private makeCourts(count: number, type: 'indoor' | 'outdoor'): Court[] {
    const times = ['18:00','19:00','20:00','21:00'];

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Terrain ${i + 1}`,
      type,
      status: 'Libre',
      slots: times.map((t, idx) => ({
        time: t,
        available: idx !== 3 // ex: 21:00 occupé (demo)
      }))
    }));
  }
  private clubs: Club[] = [
    {
      id: 1,
      name: 'Court 24 Arena',
      location: 'Waterloo',
      type: 'indoor',
      priceMin: 15,
      priceMax: 25,
      rating: 4.8,
      courts: this.makeCourts(10, 'indoor')
    },
    {
      id: 2,
      name: 'Padel Factory',
      location: 'Forest',
      type: 'outdoor',
      priceMin: 12,
      priceMax: 20,
      rating: 4.5,
      courts: this.makeCourts(6, 'outdoor')
    },
    {
      id: 3,
      name: 'PlayZone Padel',
      location: 'Uccle',
      type: 'indoor',
      priceMin: 18,
      priceMax: 28,
      rating: 4.7,
      courts: this.makeCourts(10, 'indoor')
    },
  ];
  getClubs(): Club[] {
    return this.clubs;
  }

  getClubById(id: number): Club | undefined {
    return this.clubs.find(c => c.id === id);
  }

  private filteredClubsSubject = new BehaviorSubject<Club[]>(this.clubs);
  public filteredClubs$ = this.filteredClubsSubject.asObservable();

  private filterCriteriaSubject = new BehaviorSubject<FilterCriteria>({});
  public filterCriteria$ = this.filterCriteriaSubject.asObservable();

  constructor() {
    this.filteredClubsSubject.next(this.clubs);
  }

  /**
   * Récupère tous les clubs
   */
  getAll(): Club[] {
    return this.clubs;
  }

  /**
   * Récupère les clubs filtrés
   */
  getFilteredClubs(): Observable<Club[]> {
    return this.filteredClubs$;
  }

  /**
   * Applique les filtres
   */
  applyFilters(criteria: FilterCriteria): void {
    console.log('[ClubService] applyFilters called with', criteria);

    this.filterCriteriaSubject.next(criteria);

    let filtered = this.clubs;

    // Filtre par localisation
    if (criteria.location && criteria.location !== '') {
      filtered = filtered.filter(club =>
        club.location.toLowerCase().includes(criteria.location!.toLowerCase())
      );
    }

    // Filtre par type (indoor/outdoor)
    if (criteria.type) {
      filtered = filtered.filter(club => club.type === criteria.type);
    }

    // Filtre par prix max
    if (criteria.priceMax !== undefined && criteria.priceMax > 0) {
      filtered = filtered.filter(club => club.priceMin <= criteria.priceMax!);
    }

    // Filtre par terme de recherche
    if (criteria.searchTerm && criteria.searchTerm !== '') {
      const searchLower = criteria.searchTerm.toLowerCase();
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(searchLower) ||
        club.location.toLowerCase().includes(searchLower)
      );
    }

    console.log('[ClubService] filtered result:', filtered.map(c => c.name));
    this.filteredClubsSubject.next(filtered);
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.filterCriteriaSubject.next({});
    this.filteredClubsSubject.next(this.clubs);
  }

  /**
   * Récupère les critères de filtre actuels
   */
  getFilterCriteria(): FilterCriteria {
    return this.filterCriteriaSubject.value;
  }

  /**
   * Recherche par terme
   */
  search(term: string): Club[] {
    if (!term) {
      return this.clubs;
    }
    return this.clubs.filter(club =>
      club.name.toLowerCase().includes(term.toLowerCase()) ||
      club.location.toLowerCase().includes(term.toLowerCase())
    );
  }

  /**
   * Récupère les localisations uniques
   */
  getLocations(): string[] {
    return Array.from(new Set(this.clubs.map(club => club.location)));
  }

  /**
   * Récupère le prix minimum et maximum
   */
  getPriceRange(): { min: number; max: number } {
    const prices = this.clubs.flatMap(club => [club.priceMin, club.priceMax]);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }



}

