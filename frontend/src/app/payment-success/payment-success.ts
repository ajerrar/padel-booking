import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../services/reservation-service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccess {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);

  clubName = signal<string>('â€”');
  courtName = signal<string>('â€”');
  time = signal<string>('â€”');
  total = signal<number>(0);

  // Ã©vite de crÃ©er la rÃ©servation 2 fois si la page se recharge
  private created = signal(false);

  reference = computed(() => {
    const t = this.time();
    return `PADEL-${t.replace(':', '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
  });

  constructor() {
    this.route.queryParamMap.subscribe(p => {
      this.clubName.set(p.get('clubName') ?? 'â€”');
      this.courtName.set(p.get('courtName') ?? 'â€”');
      this.time.set(p.get('time') ?? 'â€”');
      this.total.set(Number(p.get('total') ?? 0));

      // âœ… crÃ©er rÃ©servation ici (aprÃ¨s paiement)
      this.createReservationOnce();
    });
  }

  private createReservationOnce() {
    if (this.created()) return;

    // si jamais les infos ne sont pas lÃ 
    if (this.clubName() === 'â€”' || this.courtName() === 'â€”' || this.time() === 'â€”') return;

    this.reservationService.add({
      clubName: this.clubName(),
      courtName: this.courtName(),
      time: this.time(),
      total: this.total(),
    });

    this.created.set(true);
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  goBackToClub() {
    this.router.navigate(['/home']);
  }

  goMyReservations() {
    this.router.navigate(['/my-reservations']);
  }
}
