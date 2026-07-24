import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchSetup } from './match-setup';

describe('MatchSetup', () => {
  let component: MatchSetup;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchSetup],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(MatchSetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select the first option of each field by default', () => {
    expect(component.matchModel()).toEqual({
      player1Name: '',
      player2Name: '',
      totalSets: 1,
      gamesPerSet: 2,
      tieBreakRule: 'tieBreak',
    });
    expect(component.tieBreakOptions[0].value).toBe('tieBreak');
  });

  it('should render tie-break rule options', () => {
    const fixture = TestBed.createComponent(MatchSetup);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Regra de desempate');
    expect(compiled.textContent).toContain('Game decisivo');
    expect(compiled.textContent).toContain('Vantagem de 2 games');
    expect(compiled.textContent).toContain('Tie-break');
  });

  it('should not navigate when form is invalid', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const event = { preventDefault: vi.fn() } as unknown as Event;

    component.matchModel.set({
      player1Name: '',
      player2Name: '',
      totalSets: 3,
      gamesPerSet: 6,
      tieBreakRule: 'decidingGame',
    });

    component.onSubmit(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should navigate to match when form is valid', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const event = { preventDefault: vi.fn() } as unknown as Event;

    component.matchModel.set({
      player1Name: 'Alice',
      player2Name: 'Bob',
      totalSets: 3,
      gamesPerSet: 6,
      tieBreakRule: 'decidingGame',
    });

    component.onSubmit(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/match'], {
      state: {
        match: {
          player1Name: 'Alice',
          player2Name: 'Bob',
          totalSets: 3,
          gamesPerSet: 6,
          tieBreakRule: 'decidingGame',
        },
      },
    });
  });
});
