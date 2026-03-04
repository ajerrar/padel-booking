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

  // ✅ nouveau : label propre pour ton UI
  roleLabel = computed(() => {
    const r = this.me()?.role;
    if (r === 'AdminGlobal') return 'Admin global';
    if (r === 'AdminClub') return 'Admin site';
    return 'Joueur';
  });

  // ✅ nouveau : déconnexion
  logout() {
    this.userService.logout();
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  goReservations() {
    this.router.navigate(['/my-reservations']);
  }
}
