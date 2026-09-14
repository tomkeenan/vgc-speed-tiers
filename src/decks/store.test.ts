import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_DECK_ID, defaultState, loadState, newDeckId, saveState } from './store';

const STORAGE_KEY = 'vgc-speed-tiers/decks';

describe('decks store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the default state when storage is empty', () => {
    expect(loadState()).toEqual({ version: 1, decks: [], activeDeckId: ALL_DECK_ID });
  });

  it('falls back to default on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadState()).toEqual(defaultState());
  });

  it('falls back to default on a version mismatch', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, decks: [], activeDeckId: 'all' }),
    );
    expect(loadState()).toEqual(defaultState());
  });

  it('falls back to default on a malformed deck', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        decks: [{ id: 1, name: 'x', pokemonIds: [] }],
        activeDeckId: 'all',
      }),
    );
    expect(loadState()).toEqual(defaultState());
  });

  it('round-trips a saved state', () => {
    const state = {
      version: 1,
      decks: [{ id: 'd1', name: 'Trick Room', pokemonIds: ['kingambit', 'garchomp'] }],
      activeDeckId: 'd1',
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('generates non-empty, distinct deck ids', () => {
    const a = newDeckId();
    const b = newDeckId();
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});
