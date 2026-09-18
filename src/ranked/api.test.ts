import { afterEach, describe, expect, it, vi } from 'vitest';
import { cachedLeaderboard, fetchLeaderboard, submitScore } from './api';

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('submitScore', () => {
  it('POSTs the board and streak and returns the standing', async () => {
    const fetchMock = mockFetch(200, { streak: 7, rank: 3 });
    const standing = await submitScore('faster:hard', 7);
    expect(standing).toEqual({ streak: 7, rank: 3 });
    expect(fetchMock).toHaveBeenCalledWith('/api/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ boardKey: 'faster:hard', streak: 7 }),
    });
  });

  it('throws on a non-ok response', async () => {
    mockFetch(429, { error: 'rate_limited' });
    await expect(submitScore('faster:standard', 3)).rejects.toThrow('score_failed_429');
  });
});

describe('fetchLeaderboard', () => {
  it('builds the board query and returns the result', async () => {
    const result = { board: 'howfast:standard', entries: [], me: null };
    const fetchMock = mockFetch(200, result);
    const data = await fetchLeaderboard('howfast:standard');
    expect(data).toEqual(result);
    expect(fetchMock).toHaveBeenCalledWith('/api/leaderboard?board=howfast%3Astandard');
  });

  it('includes the limit when given', async () => {
    const fetchMock = mockFetch(200, { board: 'faster:standard', entries: [], me: null });
    await fetchLeaderboard('faster:standard', 10);
    expect(fetchMock).toHaveBeenCalledWith('/api/leaderboard?board=faster%3Astandard&limit=10');
  });

  it('throws on a non-ok response', async () => {
    mockFetch(400, { error: 'invalid_board' });
    await expect(fetchLeaderboard('faster:standard')).rejects.toThrow('leaderboard_failed_400');
  });
});

describe('leaderboard cache', () => {
  it('caches a successful read so it can be served synchronously', async () => {
    const result = { board: 'faster:hard' as const, entries: [], me: null };
    mockFetch(200, result);
    expect(cachedLeaderboard('faster:hard', 10)).toBeUndefined();
    await fetchLeaderboard('faster:hard', 10);
    expect(cachedLeaderboard('faster:hard', 10)).toEqual(result);
  });

  it('keys the cache by board and limit', async () => {
    mockFetch(200, { board: 'howfast:standard', entries: [], me: null });
    await fetchLeaderboard('howfast:standard', 5);
    expect(cachedLeaderboard('howfast:standard', 5)).toBeDefined();
    expect(cachedLeaderboard('howfast:standard', 10)).toBeUndefined();
  });

  it('invalidates a board in the cache when a score is submitted for it', async () => {
    mockFetch(200, { board: 'faster:natures', entries: [], me: null });
    await fetchLeaderboard('faster:natures', 10);
    expect(cachedLeaderboard('faster:natures', 10)).toBeDefined();

    mockFetch(200, { streak: 4, rank: 1 });
    await submitScore('faster:natures', 4);
    expect(cachedLeaderboard('faster:natures', 10)).toBeUndefined();
  });
});
