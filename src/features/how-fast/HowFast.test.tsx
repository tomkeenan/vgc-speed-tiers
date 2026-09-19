import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { HowFast } from './HowFast';
import { loadBestStreak } from './bestStreak';
import { DecksProvider } from '../../decks/DecksContext';
import { AuthProvider } from '../../auth/AuthContext';
import { ALL_DECK_ID } from '../../decks/store';
import { getAllPokemon } from '../../lib/data';
import { renderWithTheme } from '../../test/renderWithTheme';
import { randomIndex } from '../random';

vi.mock('../random', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../random')>();
  return { ...actual, randomIndex: vi.fn() };
});

// With randomIndex alternating 0,1,0,1..., the first card is pool[0] and the next is pool[1].
const all = getAllPokemon();
const first = all[0];
const second = all[1];

const render = () =>
  renderWithTheme(
    <AuthProvider>
      <DecksProvider>
        <HowFast />
      </DecksProvider>
    </AuthProvider>,
  );

const input = () => screen.getByLabelText('Your base Speed guess') as HTMLInputElement;
const type = (v: string) => act(() => void fireEvent.change(input(), { target: { value: v } }));
const click = (el: HTMLElement) => act(() => void fireEvent.click(el));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const submitBtn = () => screen.getByRole('button', { name: 'Submit' });
const streakValue = () => screen.getByText('Streak').previousElementSibling?.textContent;

describe('HowFast', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    let n = 0;
    vi.mocked(randomIndex).mockImplementation(() => n++ % 2);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.mocked(randomIndex).mockReset();
  });

  it('masks the speed and disables Submit until a guess is typed', () => {
    render();
    expect(screen.getByText('???')).toBeTruthy();
    expect(streakValue()).toBe('0');
    expect(submitBtn()).toHaveProperty('disabled', true);

    type('80');
    expect(submitBtn()).toHaveProperty('disabled', false);
  });

  it('auto-submits the guess after a pause with no button click', () => {
    render();
    type(String(first.baseStats.spe));
    advance(1500); // pause after the last digit
    expect(screen.queryByText('???')).toBeNull(); // revealed via auto-submit
    expect(streakValue()).toBe('1');
  });

  it('does not auto-submit while the player is still entering digits', () => {
    render();
    type('1');
    advance(400); // shorter than the debounce
    type('12'); // another digit resets the timer
    advance(400);
    expect(screen.getByText('???')).toBeTruthy(); // still masked, not submitted mid-entry
  });

  it('counts an exact match, reveals the speed, and auto-advances to a fresh card', () => {
    render();
    type(String(first.baseStats.spe));
    click(submitBtn());

    expect(screen.queryByText('???')).toBeNull(); // revealed
    expect(streakValue()).toBe('1'); // streak advanced
    expect(loadBestStreak(ALL_DECK_ID)).toBe(1); // best persisted per deck
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull(); // no manual step

    advance(10000); // past the reveal + hold
    expect(screen.getByText('???')).toBeTruthy(); // next card, masked again
    expect(streakValue()).toBe('1'); // streak retained
  });

  it('focuses the answer box on a fresh card but not the opening one', () => {
    render();
    expect(document.activeElement).not.toBe(input());

    type(String(first.baseStats.spe)); // correct -> auto-advance to a fresh card
    click(submitBtn());
    advance(10000);

    expect(document.activeElement).toBe(input());
  });

  it('holds the streak on a wrong guess and only zeroes it on Try again', () => {
    render();
    type(String(first.baseStats.spe)); // correct: build the streak to 1
    click(submitBtn());
    expect(streakValue()).toBe('1');
    advance(10000); // auto-advance to the next card (pool[1])

    type(String(second.baseStats.spe + 1)); // guaranteed wrong
    click(submitBtn());
    click(screen.getByRole('button', { name: 'Continue playing' }));
    advance(500); // let the dialog's close transition finish
    expect(streakValue()).toBe('1'); // streak still shown, not reset
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();

    advance(10000); // must NOT auto-advance on a wrong guess
    expect(streakValue()).toBe('1'); // still held
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();

    click(screen.getByRole('button', { name: 'Try again' }));
    expect(streakValue()).toBe('0'); // now it resets
    expect(submitBtn()).toBeTruthy();
    expect(input().value).toBe('');
    expect(screen.getByText('???')).toBeTruthy();
  });
});
