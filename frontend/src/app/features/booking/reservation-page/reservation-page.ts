import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlotPolicyService } from '../../../core/services/slot-policy.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-page.html',
  styleUrls: ['./reservation-page.css'],
})
export class ReservationPage {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private slotPolicyService = inject(SlotPolicyService);

  selectedClubName = signal('');
  selectedCourtName = signal('');
  selectedDate = signal('');
  selectedTime = signal('');
  selectedSiteName = signal('');
  totalPrice = signal(60);

  availableSlots = computed(() => {
    const site = this.selectedSiteName() || this.selectedClubName();
    const date = this.selectedDate();

    if (!site || !date) return [];
    return this.slotPolicyService.getSlotsForSite(site, date);
  });

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      this.selectedClubName.set(params.get('clubName') ?? '');
      this.selectedCourtName.set(params.get('courtName') ?? '');
      this.selectedDate.set(params.get('date') ?? '');
      this.selectedTime.set(params.get('time') ?? '');
      this.selectedSiteName.set(params.get('siteName') ?? params.get('clubName') ?? '');
      this.totalPrice.set(Number(params.get('total') ?? 60));
    });
  }

  handleDateChange(value: string) {
    this.selectedDate.set(value || '');
    this.selectedTime.set('');
  }

  handleTimeChange(value: string) {
    this.selectedTime.set(value || '');
  }

  continueToPayment() {
    this.router.navigate(['/payment'], {
      queryParams: {
        clubName: this.selectedClubName(),
        courtName: this.selectedCourtName(),
        date: this.selectedDate(),
        time: this.selectedTime(),
        siteName: this.selectedSiteName(),
        total: this.totalPrice(),
      },
    });
  }

  navigateBack() {
    this.router.navigate(['/home']);
  }
}
