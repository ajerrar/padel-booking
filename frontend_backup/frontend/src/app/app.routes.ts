import { Routes } from '@angular/router';
import { Home } from '../views/home/home';
import { TerrainDetail } from './terrain-detail/terrain-detail';
import {TerrainCard} from '../terrain-card/terrain-card';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'terrain/:id', component: TerrainCard },
  { path: "terrain/:id/detail", component: TerrainDetail }
];
