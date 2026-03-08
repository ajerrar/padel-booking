import { Injectable } from '@angular/core';
import { CourtListModel } from './models/court.model';


@Injectable({
  providedIn: 'root',
})
export class CourtService {

  getterrains() : CourtListModel[] {
    return [
      { id: 1, name: 'Court 24 Arena', status: "libre" , type: 'indoor', availableTimes: true },
      { id: 2, name: 'Padel Factory', status:'complet', type: 'outdoor', availableTimes: false },
      { id: 3, name: 'PlayZone Padely', status : 'libre', type: 'indoor', availableTimes: true },
    ];
  }


}
