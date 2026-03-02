import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);

  submitted = signal(false);

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{8,15}$/)]],
    city: ['Bruxelles', [Validators.required, Validators.minLength(2)]],
    level: ['Intermédiaire', [Validators.required]],
  });

  submit() {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    this.userService.register({
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phone: v.phone,
      city: v.city,
      level: v.level,
      role: 'Joueur',
    });

    this.router.navigate(['/user']);
  }

  hasError(fieldName: string, errorName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.hasError(errorName) && (field.dirty || field.touched || this.submitted()));
  }
}
