// Leaderboard reads and writes over D1. Scores are keyed by the stable players.id; the display
// name is joined in only for reads. best_scores holds the current best per (player, board); scores
// is an append-only audit log.

import type { BoardKey } from './boards';

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  streak: number;
  achievedAt: number;
}

export interface MyStanding {
  streak: number;
  rank: number;
}

/** Number of recent submissions by a player within the rate-limit window. */
export async function recentSubmissionCount(
  db: D1Database,
  playerId: string,
  sinceMs: number,
): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM scores WHERE player_id = ? AND created_at > ?')
    .bind(playerId, sinceMs)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Records a streak: appends to the audit log and updates the player's best for the board if higher.
 * Returns the player's resulting best and rank on that board.
 */
export async function submitScore(
  db: D1Database,
  playerId: string,
  boardKey: BoardKey,
  streak: number,
): Promise<MyStanding> {
  const now = Date.now();
  await db
    .prepare('INSERT INTO scores (player_id, board_key, streak, created_at) VALUES (?, ?, ?, ?)')
    .bind(playerId, boardKey, streak, now)
    .run();
  await db
    .prepare(
      `INSERT INTO best_scores (player_id, board_key, streak, achieved_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(player_id, board_key)
       DO UPDATE SET streak = excluded.streak, achieved_at = excluded.achieved_at
       WHERE excluded.streak > best_scores.streak`,
    )
    .bind(playerId, boardKey, streak, now)
    .run();

  const standing = await getStanding(db, playerId, boardKey);
  // A player who just submitted always has a row; fall back defensively.
  return standing ?? { streak, rank: 1 };
}

/** The player's best streak and rank on a board, or null if they have no score there. */
export async function getStanding(
  db: D1Database,
  playerId: string,
  boardKey: BoardKey,
): Promise<MyStanding | null> {
  const row = await db
    .prepare('SELECT streak FROM best_scores WHERE player_id = ? AND board_key = ?')
    .bind(playerId, boardKey)
    .first<{ streak: number }>();
  if (!row) return null;
  return { streak: row.streak, rank: await rankForStreak(db, boardKey, row.streak) };
}

/** 1-based rank of a streak on a board (players with a strictly higher streak rank above). */
async function rankForStreak(db: D1Database, boardKey: BoardKey, streak: number): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM best_scores WHERE board_key = ? AND streak > ?')
    .bind(boardKey, streak)
    .first<{ n: number }>();
  return (row?.n ?? 0) + 1;
}

/** Top N entries for a board, highest streak first (earlier achiever wins ties). */
export async function getLeaderboard(
  db: D1Database,
  boardKey: BoardKey,
  limit: number,
): Promise<LeaderboardEntry[]> {
  const { results } = await db
    .prepare(
      `SELECT p.handle AS displayName, b.streak AS streak, b.achieved_at AS achievedAt
       FROM best_scores b JOIN players p ON p.id = b.player_id
       WHERE b.board_key = ?
       ORDER BY b.streak DESC, b.achieved_at ASC
       LIMIT ?`,
    )
    .bind(boardKey, limit)
    .all<{ displayName: string; streak: number; achievedAt: number }>();
  return results.map((r, i) => ({
    rank: i + 1,
    displayName: r.displayName,
    streak: r.streak,
    achievedAt: r.achievedAt,
  }));
}
