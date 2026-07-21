import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchScore } from './match-score';

describe('MatchScore', () => {
  let component: MatchScore;
  let router: Router;
  let fixture: any;

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
    };

    history.replaceState({ match: setup }, '');
    const newFixture = TestBed.createComponent(MatchScore);
    newFixture.detectChanges();

    expect(newFixture.componentInstance.matchState()?.player1Name).toBe('Alice');
    expect(newFixture.componentInstance.matchState()?.player2Name).toBe('Bob');
  });

  it('should add point and update score text', () => {
    component.matchState.set({
      player1Name: 'Alice',
      player2Name: 'Bob',
      totalSets: 3,
      gamesPerSet: 6,
      startedAt: Date.now(),
      score: {
        points: { player1: 0, player2: 0 },
        games: { player1: 0, player2: 0 },
        sets: { player1: 0, player2: 0 },
        ended: false,
      },
      history: [],
    });

    component.addPoint('player1');

    expect(component.pointsDisplay().player1).toBe('15');
    expect(component.pointsDisplay().player2).toBe('0');
    expect(component.canUndo()).toBe(true);
  });

  it('should hide rotate notice when requested', () => {
    component.showRotateNotice.set(true);

    component.hideRotateNotice();

    expect(component.showRotateNotice()).toBe(false);
  });

  it('should undo last point', () => {
    component.matchState.set({
      player1Name: 'Alice',
      player2Name: 'Bob',
      totalSets: 3,
      gamesPerSet: 6,
      startedAt: Date.now(),
      score: {
        points: { player1: 1, player2: 0 },
        games: { player1: 0, player2: 0 },
        sets: { player1: 0, player2: 0 },
        ended: false,
      },
      history: [
        {
          points: { player1: 0, player2: 0 },
          games: { player1: 0, player2: 0 },
          sets: { player1: 0, player2: 0 },
          ended: false,
        },
      ],
    });

    component.undoLastPoint();

    expect(component.matchState()?.score.points.player1).toBe(0);
    expect(component.canUndo()).toBe(false);
  });

  it('should end game at 4-0 and update game count', () => {
    component.matchState.set({
      player1Name: 'Alice',
      player2Name: 'Bob',
      totalSets: 3,
      gamesPerSet: 6,
      startedAt: Date.now(),
      score: {
        points: { player1: 3, player2: 0 },
        games: { player1: 0, player2: 0 },
        sets: { player1: 0, player2: 0 },
        ended: false,
      },
      history: [],
    });

    component.addPoint('player1');

    expect(component.matchState()?.score.games.player1).toBe(1);
    expect(component.matchState()?.score.points.player1).toBe(0);
  });

  it('should format elapsed time correctly', () => {
    expect(component['formatDuration'](3651000)).toBe('01:00:51');
  });
});
