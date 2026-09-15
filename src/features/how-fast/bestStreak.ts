import { createStreakStore } from '../streakStore';

const store = createStreakStore('vgc-speed-tiers/how-fast-best-streak');

/** Reads the persisted How Fast? best streak. Never throws: returns 0 on missing/corrupt/unavailable storage. */
export const loadBestStreak = store.load;

/** Writes the How Fast? best streak to localStorage; silently no-ops if storage is unavailable. */
export const saveBestStreak = store.save;
