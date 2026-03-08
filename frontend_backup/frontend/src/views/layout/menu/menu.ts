import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.html',
  styleUrls: ['./menu.css'],
})
export class Menu {
  mobileOpen = false;

  toggle() {
    this.mobileOpen = !this.mobileOpen;
  }

  goTohome() {
    window.location.href = '/home';
  }

}
