import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-page.html',
  styleUrls: ['./payment-page.css'],
})
export class PaymentPage {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  clubName = computed(() => this.route.snapshot.queryParamMap.get('clubName') ?? '—');
  courtName = computed(() => this.route.snapshot.queryParamMap.get('courtName') ?? '—');
  time = computed(() => this.route.snapshot.queryParamMap.get('time') ?? '—');
  date = computed(() => this.route.snapshot.queryParamMap.get('date') ?? '');
  siteName = computed(() => this.route.snapshot.queryParamMap.get('siteName') ?? '');
  total = computed(() => Number(this.route.snapshot.queryParamMap.get('total') ?? 0));

  visibility = computed(() => this.route.snapshot.queryParamMap.get('visibility') ?? 'PUBLIC');
  invitedMatricules = computed(() => this.route.snapshot.queryParamMap.get('invitedMatricules') ?? '');
  invitedEmails = computed(() => this.route.snapshot.queryParamMap.get('invitedEmails') ?? '');

  paymentMode = computed(() => this.route.snapshot.queryParamMap.get('mode') ?? 'CREATE_MATCH');
  matchId = computed(() => this.route.snapshot.queryParamMap.get('matchId') ?? '');

  paymentForm = this.formBuilder.nonNullable.group({
    cardHolder: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    expirationDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  submitPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.router.navigate(['/payment-success'], {
      queryParams: {
        clubName: this.clubName(),
        courtName: this.courtName(),
        time: this.time(),
        date: this.date(),
        siteName: this.siteName(),
        total: this.total(),

        visibility: this.visibility(),
        invitedMatricules: this.invitedMatricules(),
        invitedEmails: this.invitedEmails(),

        mode: this.paymentMode(),
        matchId: this.matchId(),
      },
    });
  }

  navigateBack() {
    if (
      (this.paymentMode() === 'JOIN_PUBLIC' || this.paymentMode() === 'JOIN_PRIVATE_INVITE') &&
      this.matchId()
    ) {
      this.router.navigate(['/match', this.matchId()]);
      return;
    }

    this.router.navigate(['/reservation'], { queryParamsHandling: 'preserve' });
  }
}
