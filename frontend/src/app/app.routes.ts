import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { CourtDetailPage } from './features/booking/court-detail-page/court-detail-page';
import { CourtCardPage } from './features/booking/court-card-page/court-card-page';
import { ReservationPage } from './features/booking/reservation-page/reservation-page';
import { PaymentPage } from './features/booking/payment-page/payment-page';
import { PaymentSuccessPage } from './features/booking/payment-success-page/payment-success-page';
import { RegisterPage } from './features/auth/register-page/register-page';
import { ProfilePage } from './features/profile/user-page/user-page';
import { MyReservationsPage } from './features/booking/my-reservations-page/my-reservations-page';
import { AdminSiteDashboardPage } from './features/admin/admin-site-dashboard-page/admin-site-dashboard-page';
import { AdminGlobalDashboardPage } from './features/admin/admin-global-dashboard-page/admin-global-dashboard-page';
import { ClubsPage } from './features/clubs/clubs';
import { authGuard } from './core/guards/auth.guard';
import { LoginPage } from './features/auth/login-page/login-page';
import { userRedirectGuard } from './core/guards/user-redirect.guard';
import { loginRedirectGuard } from './core/guards/login-redirect.guard';
import { PublicMatchesPage } from './features/matches/matches-publics-page/matches-publics-page';
import { MatchDetailPage } from './features/matches/match-detail-page/match-detail-page';
import { InvitationsPage } from './features/matches/invitations-page/invitations-page';
import { NotificationsPage } from './features/matches/notifications-page/notifications-page';
import { AdminMembersPage } from './features/admin/admin-members-page/admin-members-page';
import { AdminSiteMembersPage } from './features/admin/admin-site-members-page/admin-site-members-page';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: Home },
  { path: 'clubs', component: ClubsPage },

  { path: 'terrain/:id', component: CourtCardPage },
  { path: 'terrain/:clubId/court/:courtId', component: CourtDetailPage },

  { path: 'reservation', component: ReservationPage, canActivate: [authGuard] },
  { path: 'payment', component: PaymentPage, canActivate: [authGuard] },
  { path: 'payment-success', component: PaymentSuccessPage, canActivate: [authGuard] },

  { path: 'register', component: RegisterPage },
  { path: 'login', component: LoginPage, canActivate: [loginRedirectGuard] },

  { path: 'user', component: ProfilePage, canActivate: [userRedirectGuard] },
  { path: 'my-reservations', component: MyReservationsPage, canActivate: [authGuard] },
  { path: 'invitations', component: InvitationsPage, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsPage, canActivate: [authGuard] },

  { path: 'admin-site', component: AdminSiteDashboardPage, canActivate: [authGuard, roleGuard(['AdminClub'])] },
  { path: 'admin-global', component: AdminGlobalDashboardPage, canActivate: [authGuard, roleGuard(['AdminGlobal'])] },

  { path: 'admin-members', component: AdminMembersPage, canActivate: [authGuard, roleGuard(['AdminGlobal'])] },
  { path: 'admin-site-members', component: AdminSiteMembersPage, canActivate: [authGuard, roleGuard(['AdminClub'])] },

  { path: 'matches-publics', component: PublicMatchesPage, canActivate: [authGuard] },
  { path: 'match/:id', component: MatchDetailPage, canActivate: [authGuard] },

  { path: '**', redirectTo: 'home' }
];
