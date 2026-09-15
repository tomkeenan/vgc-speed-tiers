/**
 * Reads a JSON value from localStorage, never throwing.
 * Takes a key, a fallback, and a validator; returns the parsed value when valid, else the fallback
 * (also used on missing, corrupt, or unavailable storage).
 */
export function readJson<T>(key: string, fallback: T, valid: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw) as unknown;
    return valid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/** Writes a JSON value to localStorage; silently no-ops when storage is unavailable. */
export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota); run with in-memory state only.
  }
}

/** A per-slot best-streak store backed by localStorage, never throwing on unavailable storage. */
export interface StreakStore {
  load: (slot: string) => number;
  save: (slot: string, value: number) => void;
}

const isNonNegativeNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0;

/**
 * Builds a best-streak store namespaced under a base key, with one slot per id.
 * Takes the base storage key, returns { load, save }; load returns 0 on missing/corrupt/unavailable
 * storage and save silently no-ops when storage is unavailable.
 */
export function createStreakStore(base: string): StreakStore {
  const keyFor = (slot: string) => `${base}/${slot}`;
  return {
    load: (slot) => Math.floor(readJson(keyFor(slot), 0, isNonNegativeNumber)),
    save: (slot, value) => writeJson(keyFor(slot), value),
  };
}
