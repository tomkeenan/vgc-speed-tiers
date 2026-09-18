import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { FasterGame } from './FasterGame';
import { buildContenders } from './contenders';
import { DecksProvider } from '../../decks/DecksContext';
import { AuthProvider } from '../../auth/AuthContext';
import { getAllPokemon } from '../../lib/data';
import { renderWithTheme } from '../../test/renderWithTheme';
import { pickPairWithin } from '../random';

vi.mock('../random', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../random')>();
  return { ...actual, pickPairWithin: vi.fn() };
});

// Ranked runs try to submit the finished streak; stub it so tests don't touch the network.
vi.mock('../../ranked/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ranked/api')>();
  return { ...actual, submitScore: vi.fn().mockResolvedValue({ rank: 1, streak: 1 }) };
});

const all = getAllPokemon();
const slow = all.find((p) => p.id === 'kingambit')!; // base spe 50
const fast = all.find((p) => p.id === 'garchomp')!; // base spe 102
const [slowC, fastC] = buildContenders([slow, fast], false);

// The app owns the ranked flag now, so render the game already in ranked mode.
const renderGame = () =>
  renderWithTheme(
    <AuthProvider>
      <DecksProvider>
        <FasterGame ranked />
      </DecksProvider>
    </AuthProvider>,
  );

const click = (el: HTMLElement) => act(() => void fireEvent.click(el));
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const choices = () => screen.getAllByRole('button', { name: /choose/i });
const playButton = () => screen.queryByRole('button', { name: 'Play' });
const streakValue = () => screen.getByText('Streak').previousElementSibling?.textContent;

// Ranked opens on the masked mystery cards; Play reveals the real pair for a live run.
const startRankedRun = () => {
  expect(playButton()).toBeTruthy(); // ranked opens on the mystery cards with Play
  click(playButton()!);
  expect(playButton()).toBeNull(); // now playing
};

describe('FasterGame ranked mode', () => {
  beforeEach(() => {
    localStorage.clear();
    // A configured build with a signed-in player, so the Ranked toggle is available.
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id');
    localStorage.setItem(
      'speedtiers.auth.user',
      JSON.stringify({ displayName: 'Tester', canRenameAt: null }),
    );
    vi.useFakeTimers();
    vi.mocked(pickPairWithin).mockReturnValue([slowC, fastC]);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.mocked(pickPairWithin).mockReset();
    vi.unstubAllEnvs();
  });

  // Hard and Natures pick which leaderboard board you play, and a streak can't carry across boards,
  // so changing one during a ranked run drops back to the mystery cards to Play fresh on the new board.
  it('returns to the mystery cards when the board (Hard mode) changes mid-run', () => {
    renderGame();
    startRankedRun();

    click(screen.getByLabelText('Hard mode'));

    expect(playButton()).toBeTruthy(); // back on the ranked mystery cards
  });

  it('returns to the mystery cards when the board (Allow natures) changes mid-run', () => {
    renderGame();
    startRankedRun();

    click(screen.getByLabelText('Allow natures'));

    expect(playButton()).toBeTruthy();
  });

  it('resets the streak for the fresh run on the new board', () => {
    renderGame();
    startRankedRun();

    // Build a streak of 1 on the current board.
    click(choices()[1]); // fast = correct
    advance(600);
    advance(1000); // resolve: streak advances
    expect(streakValue()).toBe('1');

    // Switch the board: back to the mystery cards with a cleared streak.
    click(screen.getByLabelText('Hard mode'));
    expect(playButton()).toBeTruthy();
    expect(streakValue()).toBe('0');

    // Playing again begins a clean run on the new board.
    click(playButton()!);
    expect(playButton()).toBeNull();
    expect(streakValue()).toBe('0');
  });
});
