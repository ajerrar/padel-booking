import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../../core/services/notification-service';
import { UserService } from '../../../core/services/user-service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, EmptyState, PageHeader],
  templateUrl: './notifications-page.html',
})
export class NotificationsPage {
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser = this.userService.currentUser;

  notifications = computed<AppNotification[]>(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.notificationService.listForUser(user.email, user.matricule);
  });

  hasResults = computed(() => this.notifications().length > 0);

  constructor() {
    const user = this.currentUser();
    if (user) {
      this.notificationService.markAllAsReadForUser(user.email, user.matricule);
    }
  }

  navigateToMatchDetail(matchId?: string) {
    if (!matchId) return;
    this.router.navigate(['/match', matchId]);
  }

  navigateToProfile() {
    this.router.navigate(['/user']);
  }

  removeNotification(id: string) {
    this.notificationService.remove(id);
  }
}
