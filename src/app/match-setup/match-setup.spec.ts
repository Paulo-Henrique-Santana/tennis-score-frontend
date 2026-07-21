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

  it('should not navigate when form is invalid', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    const event = { preventDefault: vi.fn() } as unknown as Event;

    component.matchModel.set({
      player1Name: '',
      player2Name: '',
      totalSets: 3,
      gamesPerSet: 6,
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
        },
      },
    });
  });
});
