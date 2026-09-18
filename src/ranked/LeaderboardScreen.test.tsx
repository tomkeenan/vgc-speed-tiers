import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { AuthProvider } from '../auth/AuthContext';
import { LeaderboardScreen } from './LeaderboardScreen';
import { cachedLeaderboard, fetchLeaderboard, type LeaderboardResult } from './api';

vi.mock('./api', () => ({ fetchLeaderboard: vi.fn(), cachedLeaderboard: vi.fn() }));

const result = (over: Partial<LeaderboardResult> = {}): LeaderboardResult => ({
  board: 'faster:standard',
  entries: [
    { rank: 1, displayName: 'Ash', streak: 12, achievedAt: 1 },
    { rank: 2, displayName: 'PikaFast', streak: 9, achievedAt: 2 },
  ],
  me: null,
  ...over,
});

const renderScreen = (onClose = vi.fn()) =>
  renderWithTheme(
    <AuthProvider>
      <LeaderboardScreen initialBoard="faster:standard" onClose={onClose} />
    </AuthProvider>,
  );

afterEach(() => {
  localStorage.clear();
  vi.mocked(fetchLeaderboard).mockReset();
  vi.mocked(cachedLeaderboard).mockReset();
});

describe('LeaderboardScreen', () => {
  beforeEach(() => {
    vi.mocked(fetchLeaderboard).mockResolvedValue(result());
    // Default: nothing cached, so boards load via fetch (the pre-cache behaviour).
    vi.mocked(cachedLeaderboard).mockReturnValue(undefined);
  });

  it('lists the ranked entries for the opening board', async () => {
    renderScreen();
    expect(await screen.findByText('Ash')).toBeInTheDocument();
    expect(screen.getByText('PikaFast')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(fetchLeaderboard).toHaveBeenCalledWith('faster:standard', 10);
  });

  it('highlights the signed-in player with a You badge', async () => {
    localStorage.setItem('speedtiers.auth.user', JSON.stringify({ displayName: 'PikaFast' }));
    renderScreen();
    await screen.findByText('PikaFast');
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows the empty state when a board has no scores', async () => {
    vi.mocked(fetchLeaderboard).mockResolvedValue(result({ entries: [] }));
    renderScreen();
    expect(
      await screen.findByText('No scores yet. Play a ranked round to claim the top spot.'),
    ).toBeInTheDocument();
  });

  it('shows an error when the board fails to load', async () => {
    vi.mocked(fetchLeaderboard).mockRejectedValue(new Error('boom'));
    renderScreen();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't load the leaderboard. Try again.",
    );
  });

  it('switches to the How Fast? board from its tab', async () => {
    renderScreen();
    await screen.findByText('Ash');
    await userEvent.click(screen.getByRole('tab', { name: 'How Fast?' }));
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalledWith('howfast:standard', 10));
  });

  it('toggles the Hard and Natures chips as independent boards', async () => {
    renderScreen();
    await screen.findByText('Ash');

    // Natures on its own is a board of its own, no Hard required.
    await userEvent.click(screen.getByRole('button', { name: 'Natures' }));
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalledWith('faster:natures', 10));

    // Adding Hard moves to the combined board.
    await userEvent.click(screen.getByRole('button', { name: 'Hard' }));
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalledWith('faster:hard+natures', 10));

    // Dropping Natures leaves the Hard-only board.
    await userEvent.click(screen.getByRole('button', { name: 'Natures' }));
    await waitFor(() => expect(fetchLeaderboard).toHaveBeenCalledWith('faster:hard', 10));
  });

  it("surfaces the player's own standing when they are not in the visible top-N", async () => {
    localStorage.setItem('speedtiers.auth.user', JSON.stringify({ displayName: 'FarBehind' }));
    vi.mocked(fetchLeaderboard).mockResolvedValue(result({ me: { streak: 2, rank: 57 } }));
    renderScreen();
    await screen.findByText('Ash');
    expect(screen.getByText('57')).toBeInTheDocument();
    expect(screen.getByText('FarBehind')).toBeInTheDocument();
  });

  it('renders a cached board instantly and still revalidates in the background', () => {
    // The board is already cached; leave the fetch pending so the rows can only have come from cache.
    vi.mocked(cachedLeaderboard).mockReturnValue(result());
    vi.mocked(fetchLeaderboard).mockReturnValue(new Promise<LeaderboardResult>(() => {}));
    renderScreen();
    // No await: the rows are on the first render, and there is no loading spinner.
    expect(screen.getByText('Ash')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    // A background revalidation still fires.
    expect(fetchLeaderboard).toHaveBeenCalledWith('faster:standard', 10);
  });

  it('closes when the close control is clicked', async () => {
    const onClose = vi.fn();
    renderScreen(onClose);
    await screen.findByText('Ash');
    await userEvent.click(screen.getByRole('button', { name: 'Close leaderboard' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
