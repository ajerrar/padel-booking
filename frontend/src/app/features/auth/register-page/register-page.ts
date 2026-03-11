import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService, MemberType } from '../../../core/services/user-service';
import { ClubService } from '../../../core/services/club.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);
  private clubService = inject(ClubService);

  errorMessage = signal('');
  submitted = signal(false);

  clubs = this.clubService.getClubs();

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{8,15}$/)]],
    city: ['Bruxelles', [Validators.required]],
    level: ['Débutant', [Validators.required]],
    memberType: ['FREE' as MemberType, [Validators.required]],
    siteName: [''],
  });

  // Methode isSiteMember: verifie une condition metier et renvoie le resultat attendu.
  get isSiteMember(): boolean {
    return this.form.controls.memberType.value === 'SITE';
  }

  // Methode submit: traite l action utilisateur avec les validations necessaires.
  submit() {
    this.submitted.set(true);
    this.errorMessage.set('');

    const memberType = this.form.controls.memberType.value;
    const siteName = this.form.controls.siteName.value?.trim() || '';

    if (memberType === 'SITE' && !siteName) {
      this.errorMessage.set('Sélectionne un club.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.userService.register({
        firstName: this.form.controls.firstName.value.trim(),
        lastName: this.form.controls.lastName.value.trim(),
        email: this.form.controls.email.value.trim().toLowerCase(),
        phone: this.form.controls.phone.value.trim(),
        city: this.form.controls.city.value.trim(),
        level: this.form.controls.level.value.trim(),
        memberType,
        siteName: memberType === 'SITE' ? siteName : undefined,
      });

      this.router.navigate(['/user']);
    } catch (error: any) {
      this.errorMessage.set(error?.message ?? 'Erreur lors de l’inscription.');
    }
  }
}
