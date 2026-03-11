import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user-service';

// Methode userRedirectGuard: controle l acces aux routes utilisateur selon la session et le role.
// - Si personne n est connecte, redirige vers /login.
// - Si le compte est AdminGlobal, redirige vers /admin-global.
// - Si le compte est AdminClub, redirige vers /admin-site.
// - Sinon (utilisateur standard), autorise l acces a la route demandee.
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
