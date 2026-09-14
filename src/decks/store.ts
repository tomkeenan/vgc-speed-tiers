/** The id of the virtual, built-in "All Pokemon" deck. Never stored; always available. */
export const ALL_DECK_ID = 'all';

const STORAGE_KEY = 'vgc-speed-tiers/decks';
const SCHEMA_VERSION = 1;

/** A user-created deck as persisted to storage (member ids only, no dataset objects). */
export interface StoredDeck {
  id: string;
  name: string;
  pokemonIds: string[];
}

/** The full persisted shape under STORAGE_KEY. */
export interface PersistedState {
  version: number;
  decks: StoredDeck[];
  activeDeckId: string;
}

/** Returns a fresh default state: no user decks, All Pokemon active. */
export function defaultState(): PersistedState {
  return { version: SCHEMA_VERSION, decks: [], activeDeckId: ALL_DECK_ID };
}

function isStoredDeck(value: unknown): value is StoredDeck {
  if (typeof value !== 'object' || value === null) return false;
  const deck = value as Record<string, unknown>;
  return (
    typeof deck.id === 'string' &&
    typeof deck.name === 'string' &&
    Array.isArray(deck.pokemonIds) &&
    deck.pokemonIds.every((id) => typeof id === 'string')
  );
}

/**
 * Reads the persisted state from localStorage.
 * Never throws: returns defaultState() on missing, corrupt, or version-mismatched data.
 */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return defaultState();
    const state = parsed as Record<string, unknown>;
    // Only v1 exists today; migrate older versions here when the schema changes.
    if (state.version !== SCHEMA_VERSION) return defaultState();
    if (!Array.isArray(state.decks) || !state.decks.every(isStoredDeck)) return defaultState();
    if (typeof state.activeDeckId !== 'string') return defaultState();
    return { version: SCHEMA_VERSION, decks: state.decks, activeDeckId: state.activeDeckId };
  } catch {
    return defaultState();
  }
}

/** Writes the persisted state to localStorage; silently no-ops if storage is unavailable. */
export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota); run with in-memory state only.
  }
}

/** Returns a unique deck id, preferring crypto.randomUUID with a Math.random fallback. */
export function newDeckId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
