import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClubService, FilterCriteria } from '../../services/club.service';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.html',
  styleUrls: ['./filters.css']
})
export class FiltersComponent implements OnInit {
  @Output() filtersApplied = new EventEmitter<FilterCriteria>();

  locations: string[] = [];
  priceRange = { min: 0, max: 50 };

  // Critères de filtre
  selectedLocation = '';
  selectedType = '';
  selectedPriceMax = 50;
  searchTerm = '';

  private clubService = inject(ClubService);

  ngOnInit(): void {
    this.locations = this.clubService.getLocations();
    this.priceRange = this.clubService.getPriceRange();
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    const criteria: FilterCriteria = {
      location: this.selectedLocation,
      type: this.selectedType as 'indoor' | 'outdoor' | '',
      priceMax: this.selectedPriceMax,
      searchTerm: this.searchTerm
    };

    console.log('[FiltersComponent] applyFilters clicked, criteria=', criteria);
    this.clubService.applyFilters(criteria);
    this.filtersApplied.emit(criteria);
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.selectedLocation = '';
    this.selectedType = '';
    this.selectedPriceMax = this.priceRange.max;
    this.searchTerm = '';

    console.log('[FiltersComponent] resetFilters called');
    this.clubService.resetFilters();
    this.filtersApplied.emit({});
  }

  /**
   * Met à jour le filtre de prix et applique immédiatement
   */
  onPriceChange(): void {
    this.applyFilters();
  }

  /**
   * Met à jour le filtre de localisation et applique immédiatement
   */
  onLocationChange(): void {
    this.applyFilters();
  }

  /**
   * Met à jour le filtre de type et applique immédiatement
   */
  onTypeChange(): void {
    this.applyFilters();
  }

  /**
   * Cherche au fur et à mesure de la saisie
   */
  onSearchChange(): void {
    this.applyFilters();
  }
}
