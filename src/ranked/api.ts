// Client for the ranked leaderboard endpoints. Same-origin fetch, so the HttpOnly session cookie
// set at sign-in flows automatically and authorizes score submissions.

import { BOARD_KEYS, type BoardKey } from '../../worker/boards';

/** One row on a public board, highest streak first. */
export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  streak: number;
  achievedAt: number;
}

/** The signed-in player's own best and rank on a board. */
export interface MyStanding {
  streak: number;
  rank: number;
}

/** A board read: the public top-N plus the caller's own standing when signed in and registered. */
export interface LeaderboardResult {
  board: BoardKey;
  entries: LeaderboardEntry[];
  me: MyStanding | null;
}

// Last successful all-boards read per limit. The leaderboard modal reads this synchronously so a
// reopen paints instantly, then revalidates in the background (stale-while-revalidate). All boards
// come in one fetch, so switching between tabs and chips inside the modal never hits the network.
const cache = new Map<string, LeaderboardResult[]>();
const cacheKey = (limit?: number) => `all:${limit ?? 'all'}`;

/** The last all-boards read for a limit, if cached. Synchronous; safe to call during render. */
export function cachedLeaderboards(limit?: number): LeaderboardResult[] | undefined {
  return cache.get(cacheKey(limit));
}

/** Records a ranked streak and returns the player's resulting best and rank on the board. */
export async function submitScore(boardKey: BoardKey, streak: number): Promise<MyStanding> {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ boardKey, streak }),
  });
  if (!res.ok) throw new Error(`score_failed_${res.status}`);
  // A new score can change the standings, so drop cached reads; the next open refetches every board.
  cache.clear();
  return (await res.json()) as MyStanding;
}

// In `vite dev` the API is proxied to a locally-running `wrangler dev`; when that Worker is not up,
// fall back to canned data so the leaderboard is still previewable. Gated to real dev only so it
// never masks failures under test (MODE === 'test') or in production builds (DEV === false).
const USE_DEV_MOCK = import.meta.env.DEV && import.meta.env.MODE !== 'test';

const DEV_NAMES = [
  'Cynthia',
  'Leon',
  'Wolfe',
  'Marnie',
  'Nemona',
  'Iono',
  'Larry',
  'Hop',
  'Gloria',
  'Bede',
];

/** Ten descending streaks plus an out-of-view standing, so top-3 medals and the "you" row both show. */
function devLeaderboard(board: BoardKey): LeaderboardResult {
  const base = board.includes('hard') ? 58 : 41;
  const entries: LeaderboardEntry[] = DEV_NAMES.map((displayName, i) => ({
    rank: i + 1,
    displayName,
    streak: base - i * 3 - (i % 2),
    achievedAt: Date.now() - i * 3_600_000,
  }));
  return { board, entries, me: { streak: 6, rank: 128 } };
}

/**
 * Fetches every board's public top-N (default 50) plus the caller's own standing on each, in a
 * single request. The modal calls this once on open so switching tabs and chips is instant.
 */
export async function fetchAllLeaderboards(limit?: number): Promise<LeaderboardResult[]> {
  try {
    const params = new URLSearchParams();
    if (limit != null) params.set('limit', String(limit));
    const query = params.toString();
    const res = await fetch(`/api/leaderboards${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`leaderboards_failed_${res.status}`);
    const { boards } = (await res.json()) as { boards: LeaderboardResult[] };
    cache.set(cacheKey(limit), boards);
    return boards;
  } catch (err) {
    if (USE_DEV_MOCK) {
      const boards = BOARD_KEYS.map((board) => devLeaderboard(board));
      cache.set(cacheKey(limit), boards);
      return boards;
    }
    throw err;
  }
}
