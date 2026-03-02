import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CourtService } from '../../court.service';
import { TerrainCardService } from '../../terrain-card/terrain-card-service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.css'],
})
export class Reservation implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private courtService = inject(CourtService);
  private terrainCardService = inject(TerrainCardService);

  clubId = signal<number | null>(null);
  courtId = signal<number | null>(null);
  time = signal<string>('');


  form = this.fb.nonNullable.group({
    matricul: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}\d{4}$/)]], // ex: fr1234
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{8,15}$/)]],
    notes: [''],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  submitted = signal(false);


  clubName = computed(() => {
    const id = this.clubId();
    if (id === null) return '—';
    return this.courtService.getterrains().find(c => c.id === id)?.name ?? '—';
  });

  courtName = computed(() => {
    const clubId = this.clubId();
    const courtId = this.courtId();
    if (clubId === null || courtId === null) return '—';
    return this.terrainCardService
      .getCourtsByClubId(clubId)
      .find(c => c.id === courtId)?.name ?? '—';
  });


  total = computed(() => 18);

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const clubId = params.get('clubId');
      const courtId = params.get('courtId');
      this.clubId.set(clubId ? Number(clubId) : null);
      this.courtId.set(courtId ? Number(courtId) : null);
      this.time.set(params.get('time') ?? '');
    });
  }

  back() {
    const id = this.clubId();
    if (id !== null) this.router.navigate(['/terrain', id]);
    else this.router.navigate(['/home']);
  }


  submit() {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }


    this.router.navigate(['/payment'], {
      queryParams: {
        clubName: this.clubName(),
        courtName: this.courtName(),
        time: this.time(),
        total: this.total(),
      },
      state: {
        reservation: {
          clubId: this.clubId(),
          courtId: this.courtId(),
          time: this.time(),
          customer: this.form.getRawValue(),
        },
      },
    });
  }


  hasError(name: keyof typeof this.form.controls, error: string): boolean {
    const ctrl = this.form.controls[name];
    return !!(ctrl.touched && ctrl.errors && ctrl.errors[error]);
  }
}
