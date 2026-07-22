import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MatchScoreValue, MatchSetupData, MatchSnapshot, MatchState, PlayerKey } from '../match.model';

@Component({
  selector: 'app-match-score',
  imports: [ButtonModule],
  templateUrl: './match-score.html',
  styleUrl: './match-score.scss',
})
export class MatchScore {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storageKey = 'tennis-score.active-match';
  private readonly pointLabels = ['0', '15', '30', '40'] as const;

  readonly matchState = signal<MatchState | null>(null);
  readonly nowMs = signal(Date.now());
  readonly showRotateNotice = signal(false);

  readonly elapsedTime = computed(() => {
    const state = this.matchState();
    if (!state) {
      return '00:00:00';
    }

    const elapsedMs = Math.max(this.nowMs() - state.startedAt, 0);
    return this.formatDuration(elapsedMs);
  });

  readonly pointsDisplay = computed(() => {
    const state = this.matchState();
    if (!state) {
      return { player1: '0', player2: '0' };
    }

    const player1 = this.resolvePointLabel(state.score.points.player1, state.score.points.player2);
    const player2 = this.resolvePointLabel(state.score.points.player2, state.score.points.player1);

    return { player1, player2 };
  });

  readonly canUndo = computed(() => {
    const state = this.matchState();
    return Boolean(state && state.history.length > 0);
  });

  readonly currentServer = computed<PlayerKey | null>(() => {
    const state = this.matchState();
    if (!state || state.score.ended) {
      return null;
    }

    const gamesPlayed = state.score.games.player1 + state.score.games.player2;
    return gamesPlayed % 2 === 0 ? 'player1' : 'player2';
  });

  constructor() {
    this.initializeMatch();
    this.startClock();
    this.watchOrientation();

    effect(() => {
      const state = this.matchState();
      if (!state) {
        sessionStorage.removeItem(this.storageKey);
        return;
      }

      sessionStorage.setItem(this.storageKey, JSON.stringify(state));
    });
  }

  addPoint(player: PlayerKey): void {
    const state = this.matchState();
    if (!state || state.score.ended) {
      return;
    }

    const nextState = this.cloneState(state);
    nextState.history.push(this.createSnapshot(state.score));
    nextState.score.points[player] += 1;

    this.resolveGameAndSetProgress(nextState, player);
    this.matchState.set(nextState);
  }

  undoLastPoint(): void {
    const state = this.matchState();
    if (!state || state.history.length === 0) {
      return;
    }

    const nextState = this.cloneState(state);
    const previous = nextState.history.pop();
    if (!previous) {
      return;
    }

    nextState.score.points = { ...previous.points };
    nextState.score.games = { ...previous.games };
    nextState.score.sets = { ...previous.sets };
    nextState.score.ended = previous.ended;

    this.matchState.set(nextState);
  }

  restartMatch(): void {
    sessionStorage.removeItem(this.storageKey);
    void this.router.navigate(['/']);
  }

  hideRotateNotice(): void {
    this.showRotateNotice.set(false);
  }

  private initializeMatch(): void {
    const navigationData = this.parseSetupData(history.state?.['match']);
    if (navigationData) {
      this.matchState.set(this.createInitialState(navigationData));
      return;
    }

    const persisted = this.readPersistedState();
    if (persisted) {
      this.matchState.set(persisted);
      return;
    }

    void this.router.navigate(['/'], { replaceUrl: true });
  }

  private watchOrientation(): void {
    const media = window.matchMedia('(orientation: portrait) and (max-width: 1024px)');
    const update = () => this.showRotateNotice.set(media.matches);

    update();
    media.addEventListener('change', update);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', update));
  }

  private startClock(): void {
    const intervalId = window.setInterval(() => {
      this.nowMs.set(Date.now());
    }, 1000);

    this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
  }

  private resolveGameAndSetProgress(state: MatchState, player: PlayerKey): void {
    const other: PlayerKey = player === 'player1' ? 'player2' : 'player1';
    const playerPoints = state.score.points[player];
    const otherPoints = state.score.points[other];

    const wonGame = playerPoints >= 4 && playerPoints - otherPoints >= 2;
    if (!wonGame) {
      return;
    }

    state.score.games[player] += 1;
    state.score.points.player1 = 0;
    state.score.points.player2 = 0;

    const playerGames = state.score.games[player];
    const otherGames = state.score.games[other];
    const wonSet = playerGames >= state.gamesPerSet && playerGames - otherGames >= 2;

    if (!wonSet) {
      return;
    }

    state.score.sets[player] += 1;
    state.score.games.player1 = 0;
    state.score.games.player2 = 0;

    const setsToWin = Math.floor(state.totalSets / 2) + 1;
    if (state.score.sets[player] >= setsToWin) {
      state.score.ended = true;
    }
  }

  private resolvePointLabel(playerPoints: number, opponentPoints: number): string {
    if (playerPoints >= 3 && opponentPoints >= 3) {
      if (playerPoints === opponentPoints) {
        return '40';
      }

      return playerPoints === opponentPoints + 1 ? 'AD' : '40';
    }

    return this.pointLabels[Math.min(playerPoints, 3)];
  }

  private formatDuration(elapsedMs: number): string {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  private parseSetupData(raw: unknown): MatchSetupData | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const candidate = raw as Partial<MatchSetupData>;
    if (
      typeof candidate.player1Name !== 'string' ||
      typeof candidate.player2Name !== 'string' ||
      typeof candidate.totalSets !== 'number' ||
      typeof candidate.gamesPerSet !== 'number'
    ) {
      return null;
    }

    const player1Name = candidate.player1Name.trim();
    const player2Name = candidate.player2Name.trim();
    if (!player1Name || !player2Name) {
      return null;
    }

    if (![1, 3, 5].includes(candidate.totalSets) || ![2, 4, 6].includes(candidate.gamesPerSet)) {
      return null;
    }

    return {
      player1Name,
      player2Name,
      totalSets: candidate.totalSets,
      gamesPerSet: candidate.gamesPerSet,
    };
  }

  private readPersistedState(): MatchState | null {
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as MatchState;
      const setup = this.parseSetupData(parsed);
      if (!setup || typeof parsed.startedAt !== 'number') {
        return null;
      }

      if (!parsed.score || !parsed.history) {
        return null;
      }

      return {
        ...setup,
        startedAt: parsed.startedAt,
        score: {
          points: {
            player1: Number(parsed.score.points.player1) || 0,
            player2: Number(parsed.score.points.player2) || 0,
          },
          games: {
            player1: Number(parsed.score.games.player1) || 0,
            player2: Number(parsed.score.games.player2) || 0,
          },
          sets: {
            player1: Number(parsed.score.sets.player1) || 0,
            player2: Number(parsed.score.sets.player2) || 0,
          },
          ended: Boolean(parsed.score.ended),
        },
        history: Array.isArray(parsed.history)
          ? parsed.history.map((snapshot) => ({
              points: {
                player1: Number(snapshot.points.player1) || 0,
                player2: Number(snapshot.points.player2) || 0,
              },
              games: {
                player1: Number(snapshot.games.player1) || 0,
                player2: Number(snapshot.games.player2) || 0,
              },
              sets: {
                player1: Number(snapshot.sets.player1) || 0,
                player2: Number(snapshot.sets.player2) || 0,
              },
              ended: Boolean(snapshot.ended),
            }))
          : [],
      };
    } catch {
      return null;
    }
  }

  private createInitialState(setup: MatchSetupData): MatchState {
    return {
      ...setup,
      startedAt: Date.now(),
      score: {
        points: { player1: 0, player2: 0 },
        games: { player1: 0, player2: 0 },
        sets: { player1: 0, player2: 0 },
        ended: false,
      },
      history: [],
    };
  }

  private createSnapshot(score: MatchScoreValue): MatchSnapshot {
    return {
      points: { ...score.points },
      games: { ...score.games },
      sets: { ...score.sets },
      ended: score.ended,
    };
  }

  private cloneState(state: MatchState): MatchState {
    return {
      ...state,
      score: {
        points: { ...state.score.points },
        games: { ...state.score.games },
        sets: { ...state.score.sets },
        ended: state.score.ended,
      },
      history: state.history.map((snapshot) => ({
        points: { ...snapshot.points },
        games: { ...snapshot.games },
        sets: { ...snapshot.sets },
        ended: snapshot.ended,
      })),
    };
  }
}
