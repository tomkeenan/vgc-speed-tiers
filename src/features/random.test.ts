import { describe, it, expect } from 'vitest';
import { pickPairWithin } from './random';

const valueOf = (n: number) => n;

describe('pickPairWithin', () => {
  it('returns null when fewer than two items', () => {
    expect(pickPairWithin([5], { valueOf })).toBeNull();
  });

  it('draws any distinct pair with no constraints', () => {
    const [a, b] = pickPairWithin([10, 20, 30], { valueOf })!;
    expect(a).not.toBe(b);
  });

  it('only draws pairs within maxDiff', () => {
    const items = [10, 15, 60];
    for (let i = 0; i < 50; i++) {
      const [a, b] = pickPairWithin(items, { valueOf, maxDiff: 10 })!;
      expect(Math.abs(a - b)).toBeLessThanOrEqual(10);
    }
  });

  it('returns null when no pair is within maxDiff', () => {
    expect(pickPairWithin([10, 40], { valueOf, maxDiff: 10 })).toBeNull();
  });

  it('never draws a tie when allowEqual is false', () => {
    const items = [50, 50, 55];
    for (let i = 0; i < 50; i++) {
      const [a, b] = pickPairWithin(items, { valueOf, maxDiff: 10, allowEqual: false })!;
      expect(a).not.toBe(b);
    }
  });

  it('returns null when the only close pair is a forbidden tie', () => {
    expect(pickPairWithin([50, 50], { valueOf, maxDiff: 10, allowEqual: false })).toBeNull();
  });

  it('honours canPair, refusing pairs it rejects', () => {
    // Forbid pairing equal values (stand-in for "same species").
    const canPair = (a: number, b: number) => a !== b;
    expect(pickPairWithin([7, 7], { valueOf, canPair })).toBeNull();
    const [a, b] = pickPairWithin([7, 7, 9], { valueOf, canPair })!;
    expect(a).not.toBe(b);
  });
});
