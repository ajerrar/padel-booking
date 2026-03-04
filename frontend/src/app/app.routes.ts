import { Routes } from '@angular/router';
import { Home } from '../views/home/home';
import { TerrainDetail } from './terrain-detail/terrain-detail';
import { TerrainCard } from '../terrain-card/terrain-card';
import { Reservation } from './reservation/reservation';
import { Payment } from './payment/payment';
import { PaymentSuccess } from './payment-success/payment-success';
import { Register } from './register/register';
import { User } from './user/user';
import { MyReservations } from './my-reservations/my-reservations';
import { AdminSite } from './admin-site/admin-site';
import { AdminGlobal } from './admin-global/admin-global';
import { adminClubGuard, adminGlobalGuard } from './guards/admin.guards';
import { authGuard } from './guards/auth.guard';
import { Login } from './login/login';
import { roleGuard } from './guards/role.guard';
import { userRedirectGuard } from './guards/user-redirect.guard';
import { loginRedirectGuard } from './guards/login-redirect.guard';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: Home },

  { path: 'terrain/:id', component: TerrainCard },
  { path: 'terrain/:clubId/court/:courtId', component: TerrainDetail },

  { path: 'reservation', component: Reservation, canActivate: [authGuard] },
  { path: 'payment', component: Payment, canActivate: [authGuard] },
  { path: 'payment-success', component: PaymentSuccess, canActivate: [authGuard] },

  { path: 'register', component: Register },
  { path: 'login', component: Login, canActivate: [loginRedirectGuard] },

  { path: 'user', component: User, canActivate: [userRedirectGuard] },
  { path: 'my-reservations', component: MyReservations, canActivate: [authGuard] },

  { path: 'admin-site', component: AdminSite, canActivate: [adminClubGuard] },
  { path: 'admin-global', component: AdminGlobal, canActivate: [adminGlobalGuard] },

  { path: '**', redirectTo: 'home' },
];
