import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation-service';
import { UserService } from '../../../core/services/user-service';
import { formatDisplayDate } from '../../../core/utils/date.utils';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-page.html',
})
export class PaymentPage {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);

  currentUser = this.userService.currentUser;

  clubName = computed(() => this.route.snapshot.queryParamMap.get('clubName') ?? '—');
  courtName = computed(() => this.route.snapshot.queryParamMap.get('courtName') ?? '—');
  time = computed(() => this.route.snapshot.queryParamMap.get('time') ?? '—');
  date = computed(() => this.route.snapshot.queryParamMap.get('date') ?? '');
  siteName = computed(() => this.route.snapshot.queryParamMap.get('siteName') ?? '');

  baseTotal = computed(() => Number(this.route.snapshot.queryParamMap.get('total') ?? 0));

  visibility = computed(() => this.route.snapshot.queryParamMap.get('visibility') ?? 'PUBLIC');
  invitedMatricules = computed(() => this.route.snapshot.queryParamMap.get('invitedMatricules') ?? '');
  invitedEmails = computed(() => this.route.snapshot.queryParamMap.get('invitedEmails') ?? '');

  paymentMode = computed(() => this.route.snapshot.queryParamMap.get('mode') ?? 'CREATE_MATCH');
  matchId = computed(() => this.route.snapshot.queryParamMap.get('matchId') ?? '');

  outstandingDebt = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.reservationService.getOrganizerOutstandingDebt(user.matricule);
  });

  total = computed(() => {
    return Number((this.baseTotal() + this.outstandingDebt()).toFixed(2));
  });

  paymentForm = this.formBuilder.nonNullable.group({
    cardHolder: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    expirationDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  formatDisplayDate(date: string | undefined | null): string {
    return formatDisplayDate(date);
  }

  isFieldInvalid(fieldName: 'cardHolder' | 'cardNumber' | 'expirationDate' | 'cvc'): boolean {
    const field = this.paymentForm.controls[fieldName];
    return field.invalid && (field.touched || field.dirty);
  }

  getFieldError(fieldName: 'cardHolder' | 'cardNumber' | 'expirationDate' | 'cvc'): string {
    const field = this.paymentForm.controls[fieldName];
    if (!field.errors) return '';

    if (field.errors['required']) {
      if (fieldName === 'cardHolder') return 'Le nom du titulaire est obligatoire.';
      if (fieldName === 'cardNumber') return 'Le numéro de carte est obligatoire.';
      if (fieldName === 'expirationDate') return 'La date d’expiration est obligatoire.';
      return 'Le CVC est obligatoire.';
    }

    if (field.errors['minlength']) {
      return 'Le nom doit contenir au moins 2 caractères.';
    }

    if (field.errors['pattern']) {
      if (fieldName === 'cardNumber') return 'Le numéro de carte doit contenir 16 chiffres.';
      if (fieldName === 'expirationDate') return 'Le format doit être MM/AA.';
      if (fieldName === 'cvc') return 'Le CVC doit contenir 3 chiffres.';
    }

    return 'Champ invalide.';
  }

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
        baseTotal: this.baseTotal(),
        outstandingDebt: this.outstandingDebt(),

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
