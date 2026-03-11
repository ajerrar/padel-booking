import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user-service';

// Methode normRole: gere norm role de ce bloc.
function normRole(role: any): string {
  return String(role ?? '').trim().toLowerCase();
}

// Methode adminGlobalGuard: autorise uniquement les comptes admin global sur les routes ciblees.
export const adminGlobalGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const u = userService.currentUser();
  const r = normRole(u?.role);


  const ok =
    r === 'adminglobal' ||
    r === 'admin_global' ||
    r === 'admin global' ||
    r === 'globaladmin' ||
    r === 'admin';

  if (ok) return true;

  router.navigate(['/home']);
  return false;
};

// Methode adminClubGuard: autorise uniquement les comptes admin de site sur les routes ciblees.
export const adminClubGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const u = userService.currentUser();
  const r = normRole(u?.role);

  const ok =
    r === 'adminclub' ||
    r === 'admin_club' ||
    r === 'admin club' ||
    r === 'siteadmin';

  if (ok) return true;

  router.navigate(['/home']);
  return false;
};
