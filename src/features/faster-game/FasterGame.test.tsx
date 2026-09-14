import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { FasterGame } from './FasterGame';
import { DecksProvider } from '../../decks/DecksContext';
import { getAllPokemon } from '../../lib/data';
import { renderWithTheme } from '../../test/renderWithTheme';
import { pickTwo } from '../random';

vi.mock('../random', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../random')>();
  return { ...actual, pickTwo: vi.fn() };
});

const all = getAllPokemon();
const slow = all.find((p) => p.id === 'kingambit')!; // base spe 50, max 112
const fast = all.find((p) => p.id === 'garchomp')!; // base spe 102, max 169

const renderGame = () =>
  renderWithTheme(
    <DecksProvider>
      <FasterGame />
    </DecksProvider>,
  );

const choices = () => screen.getAllByRole('button', { name: /choose/i });
const click = (el: HTMLElement) => act(() => void fireEvent.click(el));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('FasterGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.mocked(pickTwo).mockReturnValue([slow, fast]); // choices()[0] = slow, choices()[1] = fast
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.mocked(pickTwo).mockReset();
  });

  it('reveals the picked speed first, then the other after a beat, and scores the round', () => {
    renderGame();
    expect(screen.getByText('Score: 0/0')).toBeTruthy();
    expect(screen.getAllByText('???')).toHaveLength(2); // both values masked up front

    click(choices()[0]); // pick the slower one
    expect(screen.getByText('112')).toBeTruthy(); // picked value unmasked immediately
    expect(screen.queryByText('169')).toBeNull(); // other still masked

    advance(600);
    expect(screen.getByText('169')).toBeTruthy(); // other now unmasked
    expect(screen.getByText(/Score: [01]\/1/)).toBeTruthy();
  });

  it('shows Try again on a wrong guess, does not auto-advance, and advances on click', () => {
    renderGame();

    click(choices()[0]); // slow = wrong
    advance(600);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull(); // verdict held until settled

    advance(3000); // let the second reveal settle into the resolved verdict
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    const callsAfterGuess = vi.mocked(pickTwo).mock.calls.length;

    advance(3000); // must NOT auto-advance
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(vi.mocked(pickTwo).mock.calls.length).toBe(callsAfterGuess);

    click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(vi.mocked(pickTwo).mock.calls.length).toBeGreaterThan(callsAfterGuess);
  });

  it('auto-advances to a new matchup 3s after a correct guess', () => {
    renderGame();

    click(choices()[1]); // fast = correct
    advance(600);
    expect(screen.getByText('Score: 1/1')).toBeTruthy();
    expect(screen.queryByText('Not quite.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();

    const callsBefore = vi.mocked(pickTwo).mock.calls.length;
    advance(3000);

    expect(vi.mocked(pickTwo).mock.calls.length).toBeGreaterThan(callsBefore); // new pair drawn
    expect(screen.queryByText('112')).toBeNull(); // back to idle, values masked again
  });

  it('switches the prompt when the compare mode changes', () => {
    renderGame();
    expect(screen.getByText('Which Pokemon has the higher max Speed?')).toBeTruthy();

    click(screen.getByRole('button', { name: 'Base Speed' }));
    expect(screen.getByText('Which Pokemon has the higher base Speed?')).toBeTruthy();
  });
});
