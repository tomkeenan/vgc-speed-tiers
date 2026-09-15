/** A per-deck best-streak store backed by localStorage, never throwing on unavailable storage. */
export interface StreakStore {
  load: (deckId: string) => number;
  save: (deckId: string, value: number) => void;
}

/**
 * Builds a best-streak store namespaced under a base key, with one slot per deck id.
 * Takes the base storage key, returns { load, save }; load returns 0 on missing/corrupt/unavailable
 * storage and save silently no-ops when storage is unavailable.
 */
export function createStreakStore(base: string): StreakStore {
  const keyFor = (deckId: string) => `${base}/${deckId}`;
  return {
    load(deckId: string) {
      try {
        const raw = localStorage.getItem(keyFor(deckId));
        if (!raw) return 0;
        const value = JSON.parse(raw) as unknown;
        return typeof value === 'number' && Number.isFinite(value) && value >= 0
          ? Math.floor(value)
          : 0;
      } catch {
        return 0;
      }
    },
    save(deckId: string, value: number) {
      try {
        localStorage.setItem(keyFor(deckId), JSON.stringify(value));
      } catch {
        // Storage unavailable (private mode, quota); run with in-memory state only.
      }
    },
  };
}
