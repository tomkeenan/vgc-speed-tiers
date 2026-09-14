import { describe, it, expect } from 'vitest';
import { computeSpeed, applyModifiers, speedTiers } from './speed';

describe('computeSpeed', () => {
  it('max investment with a positive nature', () => {
    expect(computeSpeed({ base: 135, ev: 252, iv: 31, nature: 'positive' })).toBe(205);
  });

  it('zero investment with a negative nature', () => {
    expect(computeSpeed({ base: 135, ev: 0, iv: 0, nature: 'negative' })).toBe(126);
  });
});

describe('applyModifiers', () => {
  it('tailwind doubles Speed', () => {
    expect(applyModifiers(100, { tailwind: true })).toBe(200);
  });

  it('a +1 stage is x1.5', () => {
    expect(applyModifiers(100, { stage: 1 })).toBe(150);
  });

  it('paralysis halves Speed', () => {
    expect(applyModifiers(100, { paralysis: true })).toBe(50);
  });
});

describe('speedTiers', () => {
  it('returns ordered min < neutralMax < max', () => {
    expect(speedTiers(102)).toEqual({ min: 96, neutralMax: 154, max: 169 });
  });
});
