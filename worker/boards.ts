// Ranked leaderboard definitions, shared by client and server. A board is a fixed (game + mode)
// combination played against the canonical roster (all Pokemon), so every score on a board is
// comparable. Custom decks and other mode combos stay casual/local-only.

export const BOARD_KEYS = [
  'faster:standard', // Who's Faster? - any Speed gap, ties allowed, no natures
  'faster:hard', // Who's Faster? - close gaps only, no ties, no natures
  'faster:natures', // Who's Faster? - any Speed gap, with +Spd/neutral nature variants
  'faster:hard+natures', // Who's Faster? - hard, with +Spd/neutral nature variants
  'howfast:standard', // How Fast? - type the exact base Speed
] as const;

export type BoardKey = (typeof BOARD_KEYS)[number];

// Sanity ceiling for a submitted streak. Real streaks never approach this; it just rejects absurd
// or malformed values. Not a substitute for real anti-cheat (rate limits, later Turnstile).
export const MAX_PLAUSIBLE_STREAK = 100_000;

export function isBoardKey(value: unknown): value is BoardKey {
  return typeof value === 'string' && (BOARD_KEYS as readonly string[]).includes(value);
}

/**
 * The Who's Faster? ranked board for a mode. Hard and Natures are independent modifiers, so each of
 * the four combinations maps to its own board.
 */
export function fasterBoard(hardMode: boolean, allowNatures: boolean): BoardKey {
  if (hardMode && allowNatures) return 'faster:hard+natures';
  if (allowNatures) return 'faster:natures';
  if (hardMode) return 'faster:hard';
  return 'faster:standard';
}

/** The single How Fast? ranked board. */
export const HOWFAST_BOARD: BoardKey = 'howfast:standard';
