import type { BoardKey } from '../../worker/boards';
import type { ScoreResult } from './api';

/** How high a rank still counts as "the top" worth celebrating with a popup. */
export const TOP_RANKS = 10;

/** What a celebration popup should announce: a personal best, and optionally a new top-N placement. */
export interface Celebration {
  streak: number;
  personalBest: boolean;
  /** The new leaderboard rank when the run climbed into the top ranks, else null. */
  rank: number | null;
  /** The leaderboard board the run counted towards, or null for a local practice best. */
  board: BoardKey | null;
}

/**
 * Decides what to celebrate for a completed ranked run, or null when there's nothing new. A top-N
 * placement shows only when it improves on the player's previous rank (climbing from 3rd doesn't
 * pop for landing at 9th), and a rank can only improve on a new best, so a top-N popup is always
 * also a personal best.
 */
export function rankedCelebration(result: ScoreResult, board: BoardKey): Celebration | null {
  const climbedIntoTop =
    result.rank <= TOP_RANKS && (result.previousRank == null || result.rank < result.previousRank);
  if (!result.isPersonalBest && !climbedIntoTop) return null;
  return {
    streak: result.streak,
    personalBest: result.isPersonalBest,
    rank: climbedIntoTop ? result.rank : null,
    board,
  };
}

/** A local (practice) personal best, which has no leaderboard rank or board. */
export function practiceCelebration(streak: number): Celebration {
  return { streak, personalBest: true, rank: null, board: null };
}
