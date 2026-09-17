import { describe, expect, it } from 'vitest';
import { checkDisplayName, normalizeDisplayName } from './validateDisplayName';

describe('checkDisplayName', () => {
  it('accepts and trims a valid name', () => {
    expect(checkDisplayName('  PikaFast  ')).toEqual({ ok: true, name: 'PikaFast' });
  });

  it('collapses internal whitespace', () => {
    expect(checkDisplayName('Ash   Ketchum')).toEqual({ ok: true, name: 'Ash Ketchum' });
  });

  it('allows letters, numbers, spaces, hyphens and underscores', () => {
    expect(checkDisplayName('red_9-x')).toEqual({ ok: true, name: 'red_9-x' });
  });

  it('accepts non-Latin scripts', () => {
    expect(checkDisplayName('サトシ')).toEqual({ ok: true, name: 'サトシ' });
  });

  it('reports a length error when too short or too long', () => {
    expect(checkDisplayName('ab')).toEqual({ ok: false, error: 'length' });
    expect(checkDisplayName('a'.repeat(21))).toEqual({ ok: false, error: 'length' });
    expect(checkDisplayName(123)).toEqual({ ok: false, error: 'length' });
  });

  it('reports a chars error for disallowed punctuation and symbols', () => {
    expect(checkDisplayName('bad@name')).toEqual({ ok: false, error: 'chars' });
    expect(checkDisplayName('no.dots')).toEqual({ ok: false, error: 'chars' });
    expect(checkDisplayName('emoji😀here')).toEqual({ ok: false, error: 'chars' });
  });

  it('reports a chars error for leading/trailing separators', () => {
    expect(checkDisplayName('-name')).toEqual({ ok: false, error: 'chars' });
    expect(checkDisplayName('name_')).toEqual({ ok: false, error: 'chars' });
  });
});

describe('normalizeDisplayName', () => {
  it('returns the cleaned name or null', () => {
    expect(normalizeDisplayName('  Valid_Name ')).toBe('Valid_Name');
    expect(normalizeDisplayName('bad@name')).toBeNull();
  });
});
