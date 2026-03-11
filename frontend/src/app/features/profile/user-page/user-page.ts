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

  // Signal derive: nombre de notifications non lues pour l utilisateur connecte.
  unreadNotificationsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.notificationService.unreadCountForUser(user.email, user.matricule);
  });

  // Signal derive: reservations confirmees de l utilisateur (source reactive du profil).
  userReservations = computed<ReservationModel[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.reservationService
      .listByUser(user.matricule)
      .filter(reservation => reservation.status === 'CONFIRMED');
  });

  // Signal derive: total de reservations confirmees.
  reservationsCount = computed(() => this.userReservations().length);

  // Signal derive: estimation des heures jouees (1h30 par reservation).
  hoursPlayed = computed(() => {
    return Number((this.userReservations().length * 1.5).toFixed(1));
  });

  // Signal derive: nombre de clubs differents deja visites.
  visitedClubsCount = computed(() => {
    const clubs = this.userReservations()
      .map(reservation => String(reservation.clubName || '').trim())
      .filter(Boolean);

    return new Set(clubs).size;
  });

  // Signal derive: dette organisateur encore due par l utilisateur courant.
  outstandingDebt = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.reservationService.getOrganizerOutstandingDebt(user.matricule);
  });

  // Methode getInitials: recupere les donnees necessaires a cette fonctionnalite.
  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';

    const firstName = String(user.firstName || '').trim();
    const lastName = String(user.lastName || '').trim();

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  }

  // Methode getRoleLabel: recupere les donnees necessaires a cette fonctionnalite.
  getRoleLabel(): string {
    return getRoleLabel(this.currentUser()?.role);
  }

  // Methode navigateToReservations: gere la navigation vers l ecran approprie.
  navigateToReservations() {
    this.router.navigate(['/my-reservations']);
  }

  // Methode navigateToInvitations: gere la navigation vers l ecran approprie.
  navigateToInvitations() {
    this.router.navigate(['/invitations']);
  }

  // Methode navigateToNotifications: gere la navigation vers l ecran approprie.
  navigateToNotifications() {
    this.router.navigate(['/notifications']);
  }

  // Methode logout: ferme la session utilisateur courante.
  logout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
