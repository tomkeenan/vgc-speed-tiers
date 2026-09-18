import { describe, expect, it } from 'vitest';
import { BOARD_KEYS, fasterBoard, isBoardKey } from './boards';

describe('isBoardKey', () => {
  it('accepts the fixed board keys', () => {
    for (const key of BOARD_KEYS) expect(isBoardKey(key)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isBoardKey('faster:easy')).toBe(false);
    expect(isBoardKey('howfast:hard')).toBe(false);
    expect(isBoardKey(42)).toBe(false);
    expect(isBoardKey(undefined)).toBe(false);
  });
});

describe('fasterBoard', () => {
  it('maps each hard/natures combination to its own board', () => {
    expect(fasterBoard(false, false)).toBe('faster:standard');
    expect(fasterBoard(true, false)).toBe('faster:hard');
    expect(fasterBoard(false, true)).toBe('faster:natures');
    expect(fasterBoard(true, true)).toBe('faster:hard+natures');
  });
});
