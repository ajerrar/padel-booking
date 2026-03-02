import { Injectable } from '@angular/core';
import { CourtListModel } from '../models/court.model';
import {CommonModule} from "@angular/common";

@Injectable({ providedIn: 'root' })

export class TerrainCardService {


  private courtsByClubId: Record<number, CourtListModel[]> = {
    1: [
      {id: 1, name: 'Court 1', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 2, name: 'Court 2', type: 'outdoor', status: 'complet', availableTimes: false},
      {id: 3, name: 'Court 3', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 4, name: 'Court 4', type: 'outdoor', status: 'libre', availableTimes: true},
      {id: 5, name: 'Court 5', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 6, name: 'Court 6', type: 'outdoor', status: 'complet', availableTimes: false},
      {id: 7, name: 'Court 7', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 8, name: 'Court 8', type: 'outdoor', status: 'libre', availableTimes: true},
      {id: 9, name: 'Court 9', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 10, name: 'Court 10', type: 'outdoor', status: 'complet', availableTimes: false},
      {id: 11, name: 'Court 11', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 12, name: 'Court 12', type: 'outdoor', status: 'libre', availableTimes: true},
      {id: 13, name: 'Court 13', type: 'indoor', status: 'libre', availableTimes: true},
    ],

    2: [
      {id: 1, name: 'Court 1', type: 'outdoor', status: 'complet', availableTimes: false},
      {id: 2, name: 'Court 2', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 3, name: 'Court 3', type: 'outdoor', status: 'libre', availableTimes: true},
      {id: 4, name: 'Court 4', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 5, name: 'Court 5', type: 'outdoor', status: 'complet', availableTimes: false},
    ],

    3: [
      {id: 1, name: 'Court 1', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 2, name: 'Court 2', type: 'indoor', status: 'libre', availableTimes: true},
      {id: 3, name: 'Court 3', type: 'outdoor', status: 'complet', availableTimes: false},
      {id: 4, name: 'Court 4', type: 'outdoor', status: 'libre', availableTimes: true},
      {id: 5, name: 'Court 5', type: 'indoor', status: 'libre', availableTimes: true},
    ],
  };


  getCourtsByClubId(clubId: number): CourtListModel[] {
    return this.courtsByClubId[clubId] ?? [];
  }


  getterrains(): CourtListModel[] {

    return Object.values(this.courtsByClubId).flat();
  }

  GetCourtById(clubId: number, courtId: number): CourtListModel | undefined {
    const courts = this.courtsByClubId[clubId] ?? [];
    return courts.find(c => c.id === courtId);
  }
}
