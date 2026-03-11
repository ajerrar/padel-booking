import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user-service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.html',
})
export class Menu {
  private router = inject(Router);
  private userService = inject(UserService);

  mobileOpen = false;

  me = this.userService.currentUser;

  readonly routes = {
    home: '/home',
    clubs: '/clubs',
    myReservations: '/my-reservations',
    login: '/login',
    register: '/register',
    profile: '/user',
    adminGlobal: '/admin-global',
    adminSite: '/admin-site',
    publicMatches: '/matches-publics',
  };

  initials = computed(() => {
    const user = this.me();
    if (!user) return '—';
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  });

  roleLabel = computed(() => {
    const role = this.me()?.role;
    if (role === 'AdminGlobal') return 'Admin global';
    if (role === 'AdminClub') return 'Admin site';
    return 'Joueur';
  });

  // Methode toggle: gere toggle de ce bloc.
  toggle() {
    this.mobileOpen = !this.mobileOpen;
  }

  // Methode closeMobile: gere close mobile de ce bloc.
  closeMobile() {
    this.mobileOpen = false;
  }

  // Methode logout: ferme la session utilisateur courante.
  logout() {
    this.userService.logout();
    this.closeMobile();
    this.router.navigate([this.routes.home], { replaceUrl: true });
  }
}
