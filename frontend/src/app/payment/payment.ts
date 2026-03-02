import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css'],
})
export class Payment {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // ✅ query params depuis Reservation
  clubName = computed(() => this.route.snapshot.queryParamMap.get('clubName') ?? '—');
  courtName = computed(() => this.route.snapshot.queryParamMap.get('courtName') ?? '—');
  time = computed(() => this.route.snapshot.queryParamMap.get('time') ?? '—');
  total = computed(() => Number(this.route.snapshot.queryParamMap.get('total') ?? 0));

  form = this.fb.nonNullable.group({
    cardHolder: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]], // 16 chiffres
    exp: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]], // MM/YY
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]], // 3 chiffres
  });

  submitPayment() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // ✅ On va vers la page success (c’est là qu’on crée la réservation)
    this.router.navigate(['/payment-success'], {
      queryParams: {
        clubName: this.clubName(),
        courtName: this.courtName(),
        time: this.time(),
        total: this.total(),
      },
    });


    // ✅ Redirection vers page "merci paiement"
    this.router.navigate(['/payment-success'], {
      queryParams: {
        clubName: this.clubName(),
        courtName: this.courtName(),
        time: this.time(),
        total: this.total(),
      },
    });
  }

  back() {
    this.router.navigate(['/reservation'], { queryParamsHandling: 'preserve' });
  }
}
