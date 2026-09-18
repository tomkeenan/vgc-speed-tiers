import type { BoardKey } from '../../worker/boards';
import type { ScoreResult } from './api';

/** How high a rank still counts as "the top" worth celebrating with a popup. */
export const TOP_RANKS = 10;

/** What a celebration popup should announce: a personal best, and optionally a new top-N placement. */
export interface Celebration {
  streak: number;
  personalBest: boolean;
  /** The current leaderboard rank when the run sits in the top ranks, else null. */
  rank: number | null;
  /** Whether that rank is a fresh climb (pure placement fanfare) rather than a held position. */
  climbed: boolean;
  /** The leaderboard board the run counted towards, or null for a local practice best. */
  board: BoardKey | null;
}

/**
 * Decides what to celebrate for a completed ranked run, or null when there's nothing new. Only a new
 * personal best pops (a run can only change the player's own best, and a rank never worsens on a
 * best). A top-N placement is shown whenever the best lands in the top ranks: `climbed` marks a rank
 * that improved on the previous one - the caller gives that the placement fanfare and gives a held
 * top-N rank a combined "new best, still #N" message instead.
 */
export function rankedCelebration(result: ScoreResult, board: BoardKey): Celebration | null {
  if (!result.isPersonalBest) return null;
  const inTop = result.rank <= TOP_RANKS;
  return {
    streak: result.streak,
    personalBest: true,
    rank: inTop ? result.rank : null,
    climbed: inTop && (result.previousRank == null || result.rank < result.previousRank),
    board,
  };
}

/** A local (practice) personal best, which has no leaderboard rank or board. */
export function practiceCelebration(streak: number): Celebration {
  return { streak, personalBest: true, rank: null, climbed: false, board: null };
}
