import { describe, it, expect } from 'vitest';
import { practiceCelebration, rankedCelebration } from './celebration';
import type { ScoreResult } from './api';

const result = (over: Partial<ScoreResult> = {}): ScoreResult => ({
  streak: 10,
  rank: 5,
  previousRank: null,
  isPersonalBest: true,
  ...over,
});

describe('rankedCelebration', () => {
  it('celebrates a first score in the top ranks as a best, a fresh placement, and its board', () => {
    expect(
      rankedCelebration(result({ rank: 5, previousRank: null, isPersonalBest: true }), 'faster:hard'),
    ).toEqual({ streak: 10, personalBest: true, rank: 5, climbed: true, board: 'faster:hard' });
  });

  it('celebrates a personal best outside the top ranks without a rank but with its board', () => {
    expect(
      rankedCelebration(result({ rank: 42, previousRank: 88, isPersonalBest: true }), 'faster:hard'),
    ).toEqual({ streak: 10, personalBest: true, rank: null, climbed: false, board: 'faster:hard' });
  });

  it('celebrates a climb into the top ranks from outside', () => {
    expect(
      rankedCelebration(result({ rank: 8, previousRank: 15, isPersonalBest: true }), 'howfast:standard'),
    ).toEqual({ streak: 10, personalBest: true, rank: 8, climbed: true, board: 'howfast:standard' });
  });

  it('keeps the placement (not climbed) on a best that holds the rank (beat your own best while #1)', () => {
    expect(
      rankedCelebration(result({ rank: 1, previousRank: 1, isPersonalBest: true }), 'faster:standard'),
    ).toEqual({ streak: 10, personalBest: true, rank: 1, climbed: false, board: 'faster:standard' });
  });

  it('never announces a worse placement: 3rd stays quiet about landing at 9th', () => {
    expect(
      rankedCelebration(result({ rank: 9, previousRank: 3, isPersonalBest: false }), 'faster:hard'),
    ).toBeNull();
  });

  it('returns null when the run set neither a best nor a better placement', () => {
    expect(
      rankedCelebration(result({ rank: 12, previousRank: 12, isPersonalBest: false }), 'faster:hard'),
    ).toBeNull();
  });
});

describe('practiceCelebration', () => {
  it('is a personal best with no rank and no board', () => {
    expect(practiceCelebration(7)).toEqual({
      streak: 7,
      personalBest: true,
      rank: null,
      climbed: false,
      board: null,
    });
  });
});
