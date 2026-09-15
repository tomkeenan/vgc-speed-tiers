import { createStreakStore } from '../streakStore';

const store = createStreakStore('vgc-speed-tiers/best-streak');

/** Reads a deck's persisted best streak. Never throws: returns 0 on missing/corrupt/unavailable storage. */
export const loadBestStreak = store.load;

/** Writes a deck's best streak to localStorage; silently no-ops if storage is unavailable. */
export const saveBestStreak = store.save;
