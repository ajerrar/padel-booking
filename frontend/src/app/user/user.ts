import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user-service';
@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {
  private userService = inject(UserService);
  private router = inject(Router);
  me = this.userService.currentUser;
  initials = computed(() => {
    const u = this.me();
    if (!u) return '—';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });
  logout() {
    this.userService.logout();
    this.router.navigate(['/home']);
  }
  goReservations() {
    this.router.navigate(['/my-reservations']);
  }
}
