import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService, MemberType, Role } from '../../../core/services/user-service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.html',
  styleUrls: ['./register-page.css'],
})
export class RegisterPage {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(UserService);

  errorMessage = signal('');
  submitted = signal(false);

  registerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{8,15}$/)]],
    city: ['Bruxelles', [Validators.required]],
    level: ['Débutant', [Validators.required]],
    memberType: ['FREE' as MemberType, [Validators.required]],
    role: ['User' as Role, [Validators.required]],
    siteName: [''],
  });

  submitRegistration() {
    this.errorMessage.set('');
    this.submitted.set(true);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();

    try {
      this.userService.register({
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        city: formValue.city,
        level: formValue.level,
        memberType: formValue.memberType,
        role: formValue.role,
        siteName: formValue.siteName?.trim() || undefined,
      });

      this.router.navigate(['/user']);
    } catch (error: any) {
      this.errorMessage.set(error?.message ?? 'Erreur lors de l’inscription.');
    }
  }

  isSiteMember(): boolean {
    return this.registerForm.getRawValue().memberType === 'SITE';
  }
}
