import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user-service';
import { NotificationService } from '../../../core/services/notification-service';
import { ReservationService } from '../../../core/services/reservation-service';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ReservationModel } from '../../../models/reservation.model';
import { getRoleLabel } from '../../../core/utils/user.utils';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeader],
  templateUrl: './user-page.html',
})
export class ProfilePage {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private reservationService = inject(ReservationService);
  private router = inject(Router);

  currentUser = this.userService.currentUser;

  unreadNotificationsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.notificationService.unreadCountForUser(user.email, user.matricule);
  });

  userReservations = computed<ReservationModel[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.reservationService
      .listByUser(user.matricule)
      .filter(reservation => reservation.status === 'CONFIRMED');
  });

  reservationsCount = computed(() => this.userReservations().length);

  hoursPlayed = computed(() => {
    return Number((this.userReservations().length * 1.5).toFixed(1));
  });

  visitedClubsCount = computed(() => {
    const clubs = this.userReservations()
      .map(reservation => String(reservation.clubName || '').trim())
      .filter(Boolean);

    return new Set(clubs).size;
  });

  outstandingDebt = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.reservationService.getOrganizerOutstandingDebt(user.matricule);
  });

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';

    const firstName = String(user.firstName || '').trim();
    const lastName = String(user.lastName || '').trim();

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  }

  getRoleLabel(): string {
    return getRoleLabel(this.currentUser()?.role);
  }

  navigateToReservations() {
    this.router.navigate(['/my-reservations']);
  }

  navigateToInvitations() {
    this.router.navigate(['/invitations']);
  }

  navigateToNotifications() {
    this.router.navigate(['/notifications']);
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
