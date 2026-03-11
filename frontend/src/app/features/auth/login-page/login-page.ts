import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user-service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);

  errorMessage = signal('');

  loginForm = this.formBuilder.nonNullable.group({
    matricule: ['', [Validators.required, Validators.minLength(2)]],
  });

  // Methode submitLogin: traite l action utilisateur avec les validations necessaires.
  submitLogin() {
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const matricule = this.loginForm.getRawValue().matricule;
    const user = this.userService.loginByMatricule(matricule);

    if (!user) {
      this.errorMessage.set('Matricule introuvable.');
      return;
    }

    if (user.role === 'AdminGlobal') {
      this.router.navigate(['/admin-global']);
      return;
    }

    if (user.role === 'AdminClub') {
      this.router.navigate(['/admin-site']);
      return;
    }

    this.router.navigate(['/user']);
  }
}
