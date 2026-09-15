import { describe, it, expect, beforeEach } from 'vitest';
import { createStreakStore } from './streakStore';

describe('createStreakStore', () => {
  beforeEach(() => localStorage.clear());

  it('keeps a separate best per deck id', () => {
    const store = createStreakStore('test/best');
    store.save('all', 7);
    store.save('deck-a', 3);

    expect(store.load('all')).toBe(7);
    expect(store.load('deck-a')).toBe(3);
    expect(store.load('deck-b')).toBe(0); // unseen deck starts at 0
  });

  it('namespaces two stores under different base keys', () => {
    const faster = createStreakStore('faster');
    const howFast = createStreakStore('howfast');
    faster.save('all', 5);

    expect(faster.load('all')).toBe(5);
    expect(howFast.load('all')).toBe(0); // different base key, independent
  });

  it('returns 0 on missing or corrupt storage', () => {
    const store = createStreakStore('test/best');
    expect(store.load('all')).toBe(0);
    localStorage.setItem('test/best/all', 'not-json');
    expect(store.load('all')).toBe(0);
  });
});
