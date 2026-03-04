import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user-service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css'],
})
export class Menu {
  private router = inject(Router);
  private userService = inject(UserService);

  mobileOpen = false;

  me = this.userService.currentUser;

  initials = computed(() => {
    const u = this.me();
    if (!u) return '—';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  roleLabel = computed(() => {
    const r = this.me()?.role;
    if (r === 'AdminGlobal') return 'Admin global';
    if (r === 'AdminClub') return 'Admin site';
    return 'Joueur';
  });

  toggle() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  logout() {
    this.userService.logout();
    this.closeMobile();
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
