import { readJson, writeJson } from '../streakStore';

/** The two independent Who's Faster? game-mode toggles. */
export interface GameMode {
  hardMode: boolean;
  allowNatures: boolean;
}

export const DEFAULT_MODE: GameMode = { hardMode: false, allowNatures: false };

const KEY = 'vgc-speed-tiers/faster-mode';

const isGameMode = (v: unknown): v is GameMode =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as GameMode).hardMode === 'boolean' &&
  typeof (v as GameMode).allowNatures === 'boolean';

/** Reads the persisted game mode, falling back to DEFAULT_MODE on missing/corrupt/unavailable storage. */
export function loadMode(): GameMode {
  return readJson(KEY, DEFAULT_MODE, isGameMode);
}

/** Persists the game mode; silently no-ops when storage is unavailable. */
export function saveMode(mode: GameMode): void {
  writeJson(KEY, mode);
}

/**
 * The best-streak slot id for a deck under a given mode.
 * Takes a deck id and mode; returns the deck id unchanged for the default (easy, no natures) mode
 * so legacy streaks are preserved, or a mode-suffixed id otherwise so each mode keeps its own best.
 */
export function streakSlot(deckId: string, mode: GameMode): string {
  const flags = [mode.hardMode && 'hard', mode.allowNatures && 'natures'].filter(Boolean);
  return flags.length ? `${deckId}::${flags.join('+')}` : deckId;
}
