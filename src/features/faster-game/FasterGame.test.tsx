import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { FasterGame } from './FasterGame';
import { loadBestStreak } from './bestStreak';
import { buildContenders } from './contenders';
import { DecksProvider } from '../../decks/DecksContext';
import { AuthProvider } from '../../auth/AuthContext';
import { ALL_DECK_ID } from '../../decks/store';
import { getAllPokemon } from '../../lib/data';
import { renderWithTheme } from '../../test/renderWithTheme';
import { pickPairWithin } from '../random';

vi.mock('../random', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../random')>();
  return { ...actual, pickPairWithin: vi.fn() };
});

const all = getAllPokemon();
const slow = all.find((p) => p.id === 'kingambit')!; // base spe 50
const fast = all.find((p) => p.id === 'garchomp')!; // base spe 102
const [slowC, fastC] = buildContenders([slow, fast], false); // base-Speed contenders

const renderGame = () =>
  renderWithTheme(
    <AuthProvider>
      <DecksProvider>
        <FasterGame />
      </DecksProvider>
    </AuthProvider>,
  );

const choices = () => screen.getAllByRole('button', { name: /choose/i });
const click = (el: HTMLElement) => act(() => void fireEvent.click(el));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('FasterGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.mocked(pickPairWithin).mockReturnValue([slowC, fastC]); // choices()[0] = slow, choices()[1] = fast
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.mocked(pickPairWithin).mockReset();
  });

  // The streak value is the <p> immediately before the "Streak" label in the counter block.
  const streakValue = () => screen.getByText('Streak').previousElementSibling?.textContent;

  it('reveals the picked speed first, then the other after a beat, and breaks the streak on a wrong guess', () => {
    renderGame();
    expect(streakValue()).toBe('0'); // streak starts at 0
    expect(screen.getAllByText('???')).toHaveLength(2); // both values masked up front

    click(choices()[0]); // pick the slower one
    expect(screen.getByText('50')).toBeTruthy(); // picked value unmasked immediately
    expect(screen.queryByText('102')).toBeNull(); // other still masked

    advance(600);
    expect(screen.getByText('102')).toBeTruthy(); // other now unmasked
    expect(streakValue()).toBe('0'); // wrong guess keeps the streak at 0
  });

  it('shows Try again on a wrong guess, does not auto-advance, and advances on click', () => {
    renderGame();

    click(choices()[0]); // slow = wrong
    advance(600);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull(); // verdict held until settled

    advance(3000); // let the second reveal settle into the resolved verdict
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    const callsAfterGuess = vi.mocked(pickPairWithin).mock.calls.length;

    advance(3000); // must NOT auto-advance
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(vi.mocked(pickPairWithin).mock.calls.length).toBe(callsAfterGuess);

    click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(vi.mocked(pickPairWithin).mock.calls.length).toBeGreaterThan(callsAfterGuess);
  });

  it('auto-advances to a new matchup 3s after a correct guess', () => {
    renderGame();

    click(choices()[1]); // fast = correct
    advance(600);
    expect(streakValue()).toBe('0'); // highlight not shown yet, so streak not counted
    expect(screen.queryByText('Not quite.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();

    advance(1000); // past resolve: the highlight appears and the streak advances with it
    expect(streakValue()).toBe('1');

    const callsBefore = vi.mocked(pickPairWithin).mock.calls.length;
    advance(3000);

    expect(vi.mocked(pickPairWithin).mock.calls.length).toBeGreaterThan(callsBefore); // new pair drawn
    expect(screen.queryByText('50')).toBeNull(); // back to idle, values masked again
  });

  it('tracks the best streak, keeps it after a reset, and persists it', () => {
    renderGame();
    const bestValue = () => screen.getByText('Best').previousElementSibling?.textContent;
    expect(bestValue()).toBe('0');

    click(choices()[1]); // correct
    advance(600);
    advance(1000); // resolve: streak 1, best 1
    expect(streakValue()).toBe('1');
    expect(bestValue()).toBe('1');

    advance(3000); // auto-advance to a new pair
    click(choices()[1]); // correct again
    advance(600);
    advance(1000); // resolve: streak 2, best 2
    expect(streakValue()).toBe('2');
    expect(bestValue()).toBe('2');
    expect(loadBestStreak(ALL_DECK_ID)).toBe(2); // persisted per deck

    advance(3000); // auto-advance
    click(choices()[0]); // wrong
    advance(600);
    advance(3000); // resolved
    expect(streakValue()).toBe('2'); // streak held on screen after a loss
    expect(bestValue()).toBe('2');

    click(screen.getByRole('button', { name: 'Continue playing' }));
    advance(500); // let the dialog's close transition finish
    click(screen.getByRole('button', { name: 'Try again' }));
    expect(streakValue()).toBe('0'); // reset only on Try again
    expect(bestValue()).toBe('2'); // best holds
  });

  it('prompts for the higher base Speed', () => {
    renderGame();
    expect(screen.getByText('Which Pokemon has the higher base Speed?')).toBeTruthy();
  });

  it('celebrates a new personal best with the streak it reached when a practice run ends', () => {
    renderGame();
    click(choices()[1]); // correct: streak 1 (a new best over 0)
    advance(600);
    advance(1000);
    advance(3000); // auto-advance
    click(choices()[0]); // wrong: the run ends
    advance(600);
    advance(3000); // resolved

    expect(screen.getByText('New PB!')).toBeTruthy();
    expect(
      screen.getByText('A streak of 1 beats your record. Ready to make it count in Ranked?'),
    ).toBeTruthy();
  });

  it('does not celebrate a later practice run that falls short of the best', () => {
    renderGame();
    click(choices()[1]);
    advance(600);
    advance(1000); // streak 1
    advance(3000);
    click(choices()[1]);
    advance(600);
    advance(1000); // streak 2
    advance(3000);
    click(choices()[0]);
    advance(600);
    advance(3000); // wrong: resolved, best beaten
    click(screen.getByRole('button', { name: 'Continue playing' })); // dismiss the celebration
    advance(500); // let the dialog's close transition finish
    click(screen.getByRole('button', { name: 'Try again' }));

    click(choices()[1]);
    advance(600);
    advance(1000); // streak 1
    advance(3000);
    click(choices()[0]);
    advance(600);
    advance(3000); // wrong: resolved

    expect(screen.queryByRole('button', { name: 'Continue playing' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
