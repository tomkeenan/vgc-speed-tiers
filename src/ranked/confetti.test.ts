import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Celebration } from './celebration';

const confettiFn = vi.hoisted(() =>
  vi.fn((_options: Record<string, unknown>) => Promise.resolve()),
);
vi.mock('canvas-confetti', () => ({ default: confettiFn }));

import { fireCelebration } from './confetti';

const celebration = (over: Partial<Celebration>): Celebration => ({
  streak: 10,
  personalBest: true,
  rank: null,
  board: null,
  ...over,
});

const firstCallColors = () => (confettiFn.mock.calls[0][0] as { colors?: string[] }).colors;

describe('fireCelebration', () => {
  beforeEach(() => confettiFn.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it('fires a single burst for a plain best', async () => {
    await fireCelebration(celebration({ rank: null }));
    expect(confettiFn).toHaveBeenCalledTimes(1);
    expect(firstCallColors()).toBeUndefined();
  });

  it('fires a grand multi-burst tinted with the medal colours for first place', async () => {
    await fireCelebration(celebration({ rank: 1, board: 'faster:hard' }));
    expect(confettiFn.mock.calls.length).toBeGreaterThan(1);
    expect(firstCallColors()).toContain('#E4B21E');
  });

  it('stays silent when the viewer prefers reduced motion', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    await fireCelebration(celebration({ rank: 1, board: 'faster:hard' }));
    expect(confettiFn).not.toHaveBeenCalled();
  });
});
