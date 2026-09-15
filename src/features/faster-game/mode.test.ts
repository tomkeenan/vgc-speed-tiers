import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_MODE, loadMode, saveMode, streakSlot } from './mode';

describe('game mode persistence', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to easy, no natures when unset or corrupt', () => {
    expect(loadMode()).toEqual(DEFAULT_MODE);
    localStorage.setItem('vgc-speed-tiers/faster-mode', 'not-json');
    expect(loadMode()).toEqual(DEFAULT_MODE);
  });

  it('round-trips a saved mode', () => {
    saveMode({ hardMode: true, allowNatures: true });
    expect(loadMode()).toEqual({ hardMode: true, allowNatures: true });
  });
});

describe('streakSlot', () => {
  it('keeps the bare deck id for the default mode so legacy streaks survive', () => {
    expect(streakSlot('all', DEFAULT_MODE)).toBe('all');
  });

  it('gives each toggle combination its own slot', () => {
    expect(streakSlot('all', { hardMode: true, allowNatures: false })).toBe('all::hard');
    expect(streakSlot('all', { hardMode: false, allowNatures: true })).toBe('all::natures');
    expect(streakSlot('all', { hardMode: true, allowNatures: true })).toBe('all::hard+natures');
  });
});
