import { Injectable } from '@angular/core';

export interface Court {
  id: number;
  name: string;
  type: string;
  status: string;
}

export interface Club {
  id: number;
  name: string;
  location: string;
  type: 'indoor' | 'outdoor';
  price: number;
  courts: Court[];
}

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private readonly clubs: Club[] = [
    {
      id: 1,
      name: 'Court 24 Arena',
      location: 'Waterloo',
      type: 'indoor',
      price: 60,
      courts: [
        { id: 1, name: 'Terrain 1', type: 'Double', status: 'libre' },
        { id: 2, name: 'Terrain 2', type: 'Double', status: 'libre' },
        { id: 3, name: 'Terrain 3', type: 'Double', status: 'occupé' }
      ]
    },
    {
      id: 2,
      name: 'Padel Factory',
      location: 'Uccle',
      type: 'outdoor',
      price: 60,
      courts: [
        { id: 4, name: 'Terrain 1', type: 'Double', status: 'libre' },
        { id: 5, name: 'Terrain 2', type: 'Double', status: 'libre' },
        { id: 6, name: 'Terrain 3', type: 'Double', status: 'occupé' }
      ]
    },
    {
      id: 3,
      name: 'PlayZone Padely',
      location: 'Forest',
      type: 'indoor',
      price: 60,
      courts: [
        { id: 7, name: 'Terrain 1', type: 'Double', status: 'libre' },
        { id: 8, name: 'Terrain 2', type: 'Double', status: 'libre' },
        { id: 9, name: 'Terrain 3', type: 'Double', status: 'occupé' }
      ]
    }
  ];

  // Methode getClubs: recupere les donnees necessaires a cette fonctionnalite.
  getClubs(): Club[] {
    return this.clubs;
  }

  // Methode getClubById: recupere les donnees necessaires a cette fonctionnalite.
  getClubById(id: number): Club | undefined {
    return this.clubs.find(club => club.id === id);
  }
}
