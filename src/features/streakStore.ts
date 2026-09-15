/** A best-streak store backed by localStorage, never throwing on unavailable storage. */
export interface StreakStore {
  load: () => number;
  save: (value: number) => void;
}

/**
 * Builds a best-streak store for one localStorage key.
 * Takes the storage key, returns { load, save }; load returns 0 on missing/corrupt/unavailable
 * storage and save silently no-ops when storage is unavailable.
 */
export function createStreakStore(key: string): StreakStore {
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return 0;
        const value = JSON.parse(raw) as unknown;
        return typeof value === 'number' && Number.isFinite(value) && value >= 0
          ? Math.floor(value)
          : 0;
      } catch {
        return 0;
      }
    },
    save(value: number) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage unavailable (private mode, quota); run with in-memory state only.
      }
    },
  };
}
