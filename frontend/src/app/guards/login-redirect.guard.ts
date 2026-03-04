import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../../services/user-service';

export const loginRedirectGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const me = userService.currentUser();

  // si pas connecté → accès au login
  if (!me) return true;

  // si déjà connecté → redirection selon rôle
  if (me.role === 'AdminGlobal') {
    return router.createUrlTree(['/admin-global']);
  }

  if (me.role === 'AdminClub') {
    return router.createUrlTree(['/admin-site']);
  }

  return router.createUrlTree(['/user']);
};

