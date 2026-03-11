import { Component, signal , inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { Menu } from './layout/menu/menu';
import { UserService } from './core/services/user-service';
import { NotificationService } from './core/services/notification-service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Header, Menu],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('padel-booking');

  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  toast = this.notificationService.toast;

  // Methode closeToast: gere close toast de ce bloc.
  closeToast() {
    this.notificationService.clearToast();
  }

  // Methode constructor: initialise l etat du composant ou du service au chargement.
  constructor() {
    // ✅ seed admins une seule fois
    this.userService.seedAdmins();
  }


}
