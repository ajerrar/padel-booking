import { Component, signal , inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../views/layout/footer/footer';
import { Header } from '../views/layout/header/header';
import { Menu } from '../views/layout/menu/menu';
import { UserService } from '../services/user-service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Header, Menu],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('padel-booking');

  private userService = inject(UserService);

  constructor() {
    // ✅ seed admins une seule fois
    this.userService.seedAdmins();
  }


}
