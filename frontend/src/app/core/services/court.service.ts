import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CourtListModel } from '../../models/court.model';

@Injectable({
  providedIn: 'root',
})
export class CourtService {


  private readonly _terrains = signal<CourtListModel[]>([
    { id: 1, name: 'Court 24 Arena', status: 'libre', type: 'indoor', availableTimes: true },
    { id: 2, name: 'Padel Factory', status: 'complet', type: 'outdoor', availableTimes: false },
    { id: 3, name: 'PlayZone Padely', status: 'libre', type: 'indoor', availableTimes: true },
  ]);


  readonly terrains$ = toObservable(this._terrains);


  getterrains(): CourtListModel[] {
    return this._terrains();
  }


  setTerrains(next: CourtListModel[]) {
    this._terrains.set(next);
  }
}
