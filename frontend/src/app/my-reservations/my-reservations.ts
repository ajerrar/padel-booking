import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router} from "@angular/router";
import {ReservationService} from "../../services/reservation-service";
import {UserService} from "../../services/user-service";
import {ReservationModel} from "../../models/reservation.model";

type Tab = 'ALL' | 'UPCOMING' | 'PAST' | 'CANCELED';
type Sort = 'RECENT' | 'OLD' | 'PRICE_ASC' | 'PRICE_DESC';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-reservations.html',
  styleUrls: ['./my-reservations.css'],
})
export class MyReservations {
  private reservationService = inject(ReservationService);
  private userService = inject(UserService);
  private router = inject(Router);

  me = this.userService.currentUser;

  tab = signal<Tab>('ALL');
  query = signal<string>('');
  sort = signal<Sort>('RECENT');

  // ⚠️ Pour l’instant on n’a pas de "date réelle" dans le model
  // Donc "PAST" = vide (on mettra quand tu ajoutes dateStart/dateEnd)
  list = computed<ReservationModel[]>(() => {
    const u = this.me();
    if (!u) return [];

    let items = this.reservationService.listByUser(u.matricule);

    // tab filter
    const t = this.tab();
    if (t === 'CANCELED') items = items.filter(r => r.status === 'CANCELED');
    if (t === 'UPCOMING') items = items.filter(r => r.status === 'CONFIRMED');
    if (t === 'PAST') items = []; // TODO quand tu as une date

    // search
    const q = this.query().trim().toLowerCase();
    if (q) {
      items = items.filter(r =>
        `${r.clubName} ${r.courtName} ${r.time}`.toLowerCase().includes(q)
      );
    }

    // sort
    const s = this.sort();
    if (s === 'RECENT') items = [...items].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    if (s === 'OLD') items = [...items].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    if (s === 'PRICE_ASC') items = [...items].sort((a, b) => a.total - b.total);
    if (s === 'PRICE_DESC') items = [...items].sort((a, b) => b.total - a.total);

    return items;
  });

  nextReservation = computed<ReservationModel | null>(() => {
    // prochaine = première CONFIRMED la plus récente (simple)
    const confirmed = this.list().filter(r => r.status === 'CONFIRMED');
    return confirmed.length ? confirmed[0] : null;
  });

  hasAny = computed(() => this.list().length > 0);


  setTab(t: Tab) {
    this.tab.set(t);
  }

  onSearch(ev: Event) {
    this.query.set((ev.target as HTMLInputElement).value ?? '');
  }

  onSort(ev: Event) {
    const v = (ev.target as HTMLSelectElement).value as Sort;
    this.sort.set(v);
  }

  cancelReservation(id: string) {
    this.reservationService.cancel(id);

    this.query.set(this.query());
  }

  downloadQr(_id: string) {

    alert('QR demo (à brancher backend plus tard).');
  }

  exportPdf() {

    alert('Export PDF demo (à faire plus tard).');
  }

  bookCourt() {
    this.router.navigate(['/home']);
  }

  bookAgain(r: ReservationModel) {
    this.router.navigate(['/home'], {
      queryParams: { clubName: r.clubName },
    });
  }

  goDetails(_r: ReservationModel) {
    alert('Détails demo (à brancher page détail).');
  }
}
