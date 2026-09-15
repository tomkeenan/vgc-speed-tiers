import { createStreakStore } from '../streakStore';

const store = createStreakStore('vgc-speed-tiers/best-streak');

/** Reads the persisted best streak. Never throws: returns 0 on missing, corrupt, or unavailable storage. */
export const loadBestStreak = store.load;

/** Writes the best streak to localStorage; silently no-ops if storage is unavailable. */
export const saveBestStreak = store.save;
