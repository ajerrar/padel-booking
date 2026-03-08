import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user-service';

type AllowedRole = 'AdminGlobal' | 'AdminClub' | 'User';

export const roleGuard = (allowed: AllowedRole[]): CanActivateFn => {
  return () => {
    const userService = inject(UserService);
    const router = inject(Router);

    const me = userService.currentUser();
    if (!me) return router.createUrlTree(['/login']);

    if (allowed.includes(me.role as AllowedRole)) return true;

    // si connecté mais mauvais rôle
    return router.createUrlTree(['/home']);
  };
};

