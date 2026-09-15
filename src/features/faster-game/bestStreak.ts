const STORAGE_KEY = 'vgc-speed-tiers/best-streak';

/** Reads the persisted best streak. Never throws: returns 0 on missing, corrupt, or unavailable storage. */
export function loadBestStreak(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const value = JSON.parse(raw) as unknown;
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : 0;
  } catch {
    return 0;
  }
}

/** Writes the best streak to localStorage; silently no-ops if storage is unavailable. */
export function saveBestStreak(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota); run with in-memory state only.
  }
}
