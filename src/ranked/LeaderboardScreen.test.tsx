import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { AuthProvider } from '../auth/AuthContext';
import { LeaderboardScreen } from './LeaderboardScreen';
import { cachedLeaderboards, fetchAllLeaderboards, type LeaderboardResult } from './api';
import { BOARD_KEYS, type BoardKey } from '../../worker/boards';

vi.mock('./api', () => ({ fetchAllLeaderboards: vi.fn(), cachedLeaderboards: vi.fn() }));

// Each board carries a distinct leader name so a tab/chip switch can be verified by the row it shows
// (there is no per-board fetch to assert on any more - every board arrives in the one open request).
const LEADER: Record<BoardKey, string> = {
  'faster:standard': 'Ash',
  'faster:hard': 'HardAce',
  'faster:natures': 'NatureAce',
  'faster:hard+natures': 'ComboAce',
  'howfast:standard': 'FastTyper',
};

const entriesFor = (board: BoardKey): LeaderboardResult['entries'] =>
  board === 'faster:standard'
    ? [
        { rank: 1, displayName: 'Ash', streak: 12, achievedAt: 1 },
        { rank: 2, displayName: 'PikaFast', streak: 9, achievedAt: 2 },
      ]
    : [{ rank: 1, displayName: LEADER[board], streak: 5, achievedAt: 1 }];

/** All boards, as the single open request returns them; override any board's slice per test. */
const boards = (
  over: Partial<Record<BoardKey, Partial<LeaderboardResult>>> = {},
): LeaderboardResult[] =>
  BOARD_KEYS.map((board) => ({ board, entries: entriesFor(board), me: null, ...over[board] }));

const renderScreen = () =>
  renderWithTheme(
    <AuthProvider>
      <LeaderboardScreen initialBoard="faster:standard" />
    </AuthProvider>,
  );

afterEach(() => {
  localStorage.clear();
  vi.mocked(fetchAllLeaderboards).mockReset();
  vi.mocked(cachedLeaderboards).mockReset();
});

describe('LeaderboardScreen', () => {
  beforeEach(() => {
    vi.mocked(fetchAllLeaderboards).mockResolvedValue(boards());
    // Default: nothing cached, so the boards load via the one open fetch.
    vi.mocked(cachedLeaderboards).mockReturnValue(undefined);
  });

  it('lists the ranked entries for the opening board', async () => {
    renderScreen();
    expect(await screen.findByText('Ash')).toBeInTheDocument();
    expect(screen.getByText('PikaFast')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(fetchAllLeaderboards).toHaveBeenCalledWith(10);
  });

  it('pins the You row for the signed-in player even when they are in the top-N', async () => {
    localStorage.setItem('speedtiers.auth.user', JSON.stringify({ displayName: 'PikaFast' }));
    vi.mocked(fetchAllLeaderboards).mockResolvedValue(
      boards({ 'faster:standard': { me: { streak: 9, rank: 2 } } }),
    );
    renderScreen();
    await screen.findByText('Ash');
    // Appears both in the list and in the pinned footer row.
    expect(screen.getAllByText('PikaFast')).toHaveLength(2);
    // The You chip only marks the footer row, never the list row.
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('shows a 0-streak You row when the signed-in player has no result on the board', async () => {
    localStorage.setItem('speedtiers.auth.user', JSON.stringify({ displayName: 'Newbie' }));
    // me stays null (no ranked result yet).
    renderScreen();
    await screen.findByText('Ash');
    expect(screen.getByText('Newbie')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // streak defaults to 0
    expect(screen.getByText('-')).toBeInTheDocument(); // no rank yet
  });

  it('invites a signed-out visitor to sign in from the footer', async () => {
    renderScreen(); // no user in storage
    await screen.findByText('Ash');
    expect(screen.getByText('Sign in to get on the leaderboard')).toBeInTheDocument();
    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });

  it('shows the empty state when a board has no scores', async () => {
    vi.mocked(fetchAllLeaderboards).mockResolvedValue(boards({ 'faster:standard': { entries: [] } }));
    renderScreen();
    expect(
      await screen.findByText('No scores yet. Play a ranked round to claim the top spot.'),
    ).toBeInTheDocument();
  });

  it('shows an error when the boards fail to load', async () => {
    vi.mocked(fetchAllLeaderboards).mockRejectedValue(new Error('boom'));
    renderScreen();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't load the leaderboard. Try again.",
    );
  });

  it('switches to the How Fast? board from its segment without another fetch', async () => {
    renderScreen();
    await screen.findByText('Ash');
    await userEvent.click(screen.getByRole('button', { name: 'How Fast?' }));
    expect(await screen.findByText('FastTyper')).toBeInTheDocument();
    // All boards came in the one open request; switching games must not hit the network again.
    expect(fetchAllLeaderboards).toHaveBeenCalledTimes(1);
  });

  it('toggles the Hard and Natures chips as independent boards', async () => {
    renderScreen();
    await screen.findByText('Ash');

    // Natures on its own is a board of its own, no Hard required.
    await userEvent.click(screen.getByRole('button', { name: 'Natures' }));
    expect(await screen.findByText('NatureAce')).toBeInTheDocument();

    // Adding Hard moves to the combined board.
    await userEvent.click(screen.getByRole('button', { name: 'Hard' }));
    expect(await screen.findByText('ComboAce')).toBeInTheDocument();

    // Dropping Natures leaves the Hard-only board.
    await userEvent.click(screen.getByRole('button', { name: 'Natures' }));
    expect(await screen.findByText('HardAce')).toBeInTheDocument();

    // Still just the single open request across every switch.
    expect(fetchAllLeaderboards).toHaveBeenCalledTimes(1);
  });

  it("surfaces the player's own standing when they are not in the visible top-N", async () => {
    localStorage.setItem('speedtiers.auth.user', JSON.stringify({ displayName: 'FarBehind' }));
    vi.mocked(fetchAllLeaderboards).mockResolvedValue(
      boards({ 'faster:standard': { me: { streak: 2, rank: 57 } } }),
    );
    renderScreen();
    await screen.findByText('Ash');
    expect(screen.getByText('57')).toBeInTheDocument();
    expect(screen.getByText('FarBehind')).toBeInTheDocument();
  });

  it('renders cached boards instantly and still revalidates in the background', () => {
    // Boards are already cached; leave the fetch pending so the rows can only have come from cache.
    vi.mocked(cachedLeaderboards).mockReturnValue(boards());
    vi.mocked(fetchAllLeaderboards).mockReturnValue(new Promise<LeaderboardResult[]>(() => {}));
    renderScreen();
    // No await: the rows are on the first render, and there is no loading spinner.
    expect(screen.getByText('Ash')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    // A background revalidation still fires.
    expect(fetchAllLeaderboards).toHaveBeenCalledWith(10);
  });
});
