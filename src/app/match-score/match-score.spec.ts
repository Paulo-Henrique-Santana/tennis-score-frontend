import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchState } from '../match.model';
import { MatchScore } from './match-score';

describe('MatchScore', () => {
  let component: MatchScore;
  let router: Router;
  let fixture: any;

  const baseState = (overrides: Partial<MatchState> = {}): MatchState => ({
    player1Name: 'Alice',
    player2Name: 'Bob',
    totalSets: 3,
    gamesPerSet: 6,
    tieBreakRule: 'winByTwo',
    startedAt: Date.now(),
    score: {
      points: { player1: 0, player2: 0 },
      games: { player1: 0, player2: 0 },
      sets: { player1: 0, player2: 0 },
      inTieBreak: false,
      ended: false,
    },
    history: [],
    ...overrides,
  });

  beforeEach(() => {
    const win = (globalThis as any).window ?? globalThis;
    Object.defineProperty(win, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '(orientation: portrait) and (max-width: 1024px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      }),
    });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchScore],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(MatchScore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize match state from navigation data', () => {
    const setup = {
      player1Name: 'Alice',
      player2Name: 'Bob',
      totalSets: 3,
      gamesPerSet: 6,
      tieBreakRule: 'decidingGame' as const,
    };

    history.replaceState({ match: setup }, '');
    const newFixture = TestBed.createComponent(MatchScore);
    newFixture.detectChanges();

    expect(newFixture.componentInstance.matchState()?.player1Name).toBe('Alice');
    expect(newFixture.componentInstance.matchState()?.player2Name).toBe('Bob');
    expect(newFixture.componentInstance.matchState()?.tieBreakRule).toBe('decidingGame');
  });

  it('should add point and update score text', () => {
    component.matchState.set(baseState());

    component.addPoint('player1');

    expect(component.pointsDisplay().player1).toBe('15');
    expect(component.pointsDisplay().player2).toBe('0');
    expect(component.canUndo()).toBe(true);
  });

  it('should compute current server based on current game', () => {
    component.matchState.set(baseState());

    expect(component.currentServer()).toBe('player1');

    component.matchState.set(
      baseState({
        score: {
          points: { player1: 0, player2: 0 },
          games: { player1: 1, player2: 0 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: false,
          ended: false,
        },
      }),
    );

    expect(component.currentServer()).toBe('player2');
  });

  it('should rotate serve every two points in tie-break after the first point', () => {
    component.matchState.set(
      baseState({
        score: {
          points: { player1: 0, player2: 0 },
          games: { player1: 1, player2: 1 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: true,
          ended: false,
        },
      }),
    );

    expect(component.currentServer()).toBe('player1');

    component.matchState.set(
      baseState({
        score: {
          points: { player1: 1, player2: 0 },
          games: { player1: 1, player2: 1 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: true,
          ended: false,
        },
      }),
    );
    expect(component.currentServer()).toBe('player2');

    component.matchState.set(
      baseState({
        score: {
          points: { player1: 1, player2: 1 },
          games: { player1: 1, player2: 1 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: true,
          ended: false,
        },
      }),
    );
    expect(component.currentServer()).toBe('player2');

    component.matchState.set(
      baseState({
        score: {
          points: { player1: 2, player2: 1 },
          games: { player1: 1, player2: 1 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: true,
          ended: false,
        },
      }),
    );
    expect(component.currentServer()).toBe('player1');
  });

  it('should hide rotate notice when requested', () => {
    component.showRotateNotice.set(true);

    component.hideRotateNotice();

    expect(component.showRotateNotice()).toBe(false);
  });

  it('should undo last point', () => {
    component.matchState.set(
      baseState({
        score: {
          points: { player1: 1, player2: 0 },
          games: { player1: 0, player2: 0 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: false,
          ended: false,
        },
        history: [
          {
            points: { player1: 0, player2: 0 },
            games: { player1: 0, player2: 0 },
            sets: { player1: 0, player2: 0 },
            inTieBreak: false,
            ended: false,
          },
        ],
      }),
    );

    component.undoLastPoint();

    expect(component.matchState()?.score.points.player1).toBe(0);
    expect(component.canUndo()).toBe(false);
  });

  it('should end game at 4-0 and update game count', () => {
    component.matchState.set(
      baseState({
        score: {
          points: { player1: 3, player2: 0 },
          games: { player1: 0, player2: 0 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: false,
          ended: false,
        },
      }),
    );

    component.addPoint('player1');

    expect(component.matchState()?.score.games.player1).toBe(1);
    expect(component.matchState()?.score.points.player1).toBe(0);
  });

  it('should win set at 6-5 with decidingGame rule', () => {
    component.matchState.set(
      baseState({
        tieBreakRule: 'decidingGame',
        score: {
          points: { player1: 3, player2: 0 },
          games: { player1: 5, player2: 5 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: false,
          ended: false,
        },
      }),
    );

    component.addPoint('player1');

    expect(component.matchState()?.score.sets.player1).toBe(1);
    expect(component.matchState()?.score.games.player1).toBe(0);
  });

  it('should require 2-game lead with winByTwo rule', () => {
    component.matchState.set(
      baseState({
        tieBreakRule: 'winByTwo',
        score: {
          points: { player1: 3, player2: 0 },
          games: { player1: 5, player2: 5 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: false,
          ended: false,
        },
      }),
    );

    component.addPoint('player1');

    expect(component.matchState()?.score.sets.player1).toBe(0);
    expect(component.matchState()?.score.games.player1).toBe(6);
  });

  it('should enter tie-break at 1-1 when set is first to 2', () => {
    component.matchState.set(
      baseState({
        gamesPerSet: 2,
        tieBreakRule: 'tieBreak',
        score: {
          points: { player1: 3, player2: 0 },
          games: { player1: 0, player2: 1 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: false,
          ended: false,
        },
      }),
    );

    component.addPoint('player1');

    expect(component.matchState()?.score.games).toEqual({ player1: 1, player2: 1 });
    expect(component.matchState()?.score.inTieBreak).toBe(true);
    expect(component.matchState()?.score.sets.player1).toBe(0);
  });

  it('should enter tie-break at gamesPerSet - 1 all', () => {
    component.matchState.set(
      baseState({
        tieBreakRule: 'tieBreak',
        score: {
          points: { player1: 3, player2: 0 },
          games: { player1: 4, player2: 5 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: false,
          ended: false,
        },
      }),
    );

    component.addPoint('player1');

    expect(component.matchState()?.score.games).toEqual({ player1: 5, player2: 5 });
    expect(component.matchState()?.score.inTieBreak).toBe(true);
    expect(component.matchState()?.score.sets.player1).toBe(0);
  });

  it('should win set after winning tie-break', () => {
    component.matchState.set(
      baseState({
        gamesPerSet: 2,
        tieBreakRule: 'tieBreak',
        score: {
          points: { player1: 6, player2: 5 },
          games: { player1: 1, player2: 1 },
          sets: { player1: 0, player2: 0 },
          inTieBreak: true,
          ended: false,
        },
      }),
    );

    component.addPoint('player1');

    expect(component.matchState()?.score.sets.player1).toBe(1);
    expect(component.matchState()?.score.inTieBreak).toBe(false);
    expect(component.pointsDisplay().player1).toBe('0');
  });

  it('should format elapsed time correctly', () => {
    expect(component['formatDuration'](3651000)).toBe('01:00:51');
  });
});
