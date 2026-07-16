import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./match-setup/match-setup').then((m) => m.MatchSetup),
  },
];
