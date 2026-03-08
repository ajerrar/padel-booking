import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user-service';

export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  const u = userService.currentUser();
  if (u) return true;

  return router.createUrlTree(['/login']);
  return false;
};

