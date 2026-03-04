import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);

  error = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit() {
    this.error.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.getRawValue();
    const u = this.userService.loginByEmail(email);

    if (!u) {
      this.error.set('Email introuvable. Inscris-toi ou crée un admin seed.');
      return;
    }

    if (u.role === 'AdminGlobal') return this.router.navigate(['/admin-global'], { replaceUrl: true });
    if (u.role === 'AdminClub') return this.router.navigate(['/admin-site'], { replaceUrl: true });
    return this.router.navigate(['/user'], { replaceUrl: true });
  }
}
