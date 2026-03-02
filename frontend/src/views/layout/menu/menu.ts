import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  router = inject(Router);
  mobileOpen = false;
  toggle() {
    this.mobileOpen = !this.mobileOpen;
  }
  goTohome() {
    this.router.navigate(['/home']);
  }
}
