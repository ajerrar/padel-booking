import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user-service';

export const userRedirectGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const me = userService.currentUser();

  // pas connecté => login
  if (!me) return router.createUrlTree(['/login']);

  // admin global => dashboard global
  if (me.role === 'AdminGlobal') return router.createUrlTree(['/admin-global']);

  // admin site => page admin site
  if (me.role === 'AdminClub') return router.createUrlTree(['/admin-site']);

  // user normal => page profil
  return true;
};

