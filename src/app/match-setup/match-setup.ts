import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MatchSetupData } from '../match.model';

@Component({
  selector: 'app-match-setup',
  imports: [FormField, ButtonModule, InputTextModule, SelectButtonModule, CardModule, DividerModule],
  templateUrl: './match-setup.html',
  styleUrl: './match-setup.scss',
})
export class MatchSetup {
  private readonly router = inject(Router);

  readonly setsOptions = [
    { label: 'Melhor de 1', value: 1 },
    { label: 'Melhor de 3', value: 3 },
    { label: 'Melhor de 5', value: 5 },
  ];

  readonly gamesOptions = [
    { label: '2 games', value: 2 },
    { label: '4 games', value: 4 },
    { label: '6 games', value: 6 },
  ];

  readonly matchModel = signal<MatchSetupData>({
    player1Name: '',
    player2Name: '',
    totalSets: 3,
    gamesPerSet: 6,
  });

  readonly matchForm = form(this.matchModel, (s) => {
    required(s.player1Name, { message: 'Nome do jogador 1 é obrigatório' });
    minLength(s.player1Name, 2, { message: 'Mínimo de 2 caracteres' });
    required(s.player2Name, { message: 'Nome do jogador 2 é obrigatório' });
    minLength(s.player2Name, 2, { message: 'Mínimo de 2 caracteres' });
    required(s.totalSets, { message: 'Selecione o número de sets' });
    required(s.gamesPerSet, { message: 'Selecione o número de games' });
  });

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.matchForm().valid()) {
      const data = this.matchModel();
      this.router.navigate(['/match'], { state: { match: data } });
    }
  }
}
