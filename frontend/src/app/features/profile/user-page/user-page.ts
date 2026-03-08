import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user-service';
import { NotificationService } from '../../../core/services/notification-service';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [CommonModule, RouterLink , PageHeader],
  templateUrl: './user-page.html',
  styleUrls: ['./user-page.css'],
})
export class ProfilePage {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  currentUser = this.userService.currentUser;

  unreadNotificationsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.notificationService.unreadCountForUser(user.email, user.matricule);
  });

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';

    const firstName = String(user.firstName || '').trim();
    const lastName = String(user.lastName || '').trim();

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  }

  getRoleLabel(): string {
    const role = String(this.currentUser()?.role || '').trim();

    if (role === 'AdminGlobal') return 'Administrateur global';
    if (role === 'AdminClub') return 'Administrateur du site';

    return 'Membre';
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
