import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./match-setup/match-setup').then((m) => m.MatchSetup),
  },
  {
    path: 'match',
    loadComponent: () =>
      import('./match-score/match-score').then((m) => m.MatchScore),
  },
];
