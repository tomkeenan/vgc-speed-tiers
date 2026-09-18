// Client for the ranked leaderboard endpoints. Same-origin fetch, so the HttpOnly session cookie
// set at sign-in flows automatically and authorizes score submissions.

import type { BoardKey } from '../../worker/boards';

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

// Last successful read per (board, limit). The leaderboard modal reads this synchronously so
// revisiting a tab is instant, then revalidates in the background (stale-while-revalidate). Boards
// are few (four Who's Faster? variants plus How Fast?), so the map stays tiny.
const cache = new Map<string, LeaderboardResult>();
const cacheKey = (board: BoardKey, limit?: number) => `${board}:${limit ?? 'all'}`;

/** The last-read result for a board, if one is cached. Synchronous; safe to call during render. */
export function cachedLeaderboard(board: BoardKey, limit?: number): LeaderboardResult | undefined {
  return cache.get(cacheKey(board, limit));
}

/** Records a ranked streak and returns the player's resulting best and rank on the board. */
export async function submitScore(boardKey: BoardKey, streak: number): Promise<MyStanding> {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ boardKey, streak }),
  });
  if (!res.ok) throw new Error(`score_failed_${res.status}`);
  // A new score can change this board's standings, so drop any cached reads for it.
  for (const key of cache.keys()) {
    if (key.startsWith(`${boardKey}:`)) cache.delete(key);
  }
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

/** Fetches a board's public top-N (default 50) plus the caller's own standing when signed in. */
export async function fetchLeaderboard(
  board: BoardKey,
  limit?: number,
): Promise<LeaderboardResult> {
  try {
    const params = new URLSearchParams({ board });
    if (limit != null) params.set('limit', String(limit));
    const res = await fetch(`/api/leaderboard?${params.toString()}`);
    if (!res.ok) throw new Error(`leaderboard_failed_${res.status}`);
    const result = (await res.json()) as LeaderboardResult;
    cache.set(cacheKey(board, limit), result);
    return result;
  } catch (err) {
    if (USE_DEV_MOCK) {
      const result = devLeaderboard(board);
      cache.set(cacheKey(board, limit), result);
      return result;
    }
    throw err;
  }
}
