import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user-service';

// Methode authGuard: protege une route: redirige vers /login si l utilisateur n est pas connecte.
export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const u = userService.currentUser();
  if (u) return true;

  return router.createUrlTree(['/login']);
  return false;
};

