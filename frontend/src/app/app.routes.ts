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

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'terrain/:id', component: TerrainCard },
  { path: 'terrain/:clubId/court/:courtId', component: TerrainDetail },
  { path: 'reservation', component: Reservation },
  { path: 'payment', component: Payment },
  { path: 'payment-success', component: PaymentSuccess },
  { path: 'register', component: Register },
  { path: 'user', component: User },
  { path: 'my-reservations', component: MyReservations },
];
