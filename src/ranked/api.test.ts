import { afterEach, describe, expect, it, vi } from 'vitest';
import { cachedLeaderboards, fetchAllLeaderboards, submitScore } from './api';

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

describe('fetchAllLeaderboards', () => {
  it('fetches all boards in one request and returns them', async () => {
    const boards = [{ board: 'faster:standard', entries: [], me: null }];
    const fetchMock = mockFetch(200, { boards });
    const data = await fetchAllLeaderboards();
    expect(data).toEqual(boards);
    expect(fetchMock).toHaveBeenCalledWith('/api/leaderboards');
  });

  it('includes the limit when given', async () => {
    const fetchMock = mockFetch(200, { boards: [] });
    await fetchAllLeaderboards(10);
    expect(fetchMock).toHaveBeenCalledWith('/api/leaderboards?limit=10');
  });

  it('throws on a non-ok response', async () => {
    mockFetch(500, { error: 'boom' });
    await expect(fetchAllLeaderboards()).rejects.toThrow('leaderboards_failed_500');
  });
});

describe('leaderboards cache', () => {
  // The cache is module-level and outlives each test, so these use limits no other test touches.
  it('caches a successful read so it can be served synchronously', async () => {
    const boards = [{ board: 'faster:hard' as const, entries: [], me: null }];
    mockFetch(200, { boards });
    expect(cachedLeaderboards(7)).toBeUndefined();
    await fetchAllLeaderboards(7);
    expect(cachedLeaderboards(7)).toEqual(boards);
  });

  it('keys the cache by limit', async () => {
    mockFetch(200, { boards: [{ board: 'howfast:standard', entries: [], me: null }] });
    await fetchAllLeaderboards(8);
    expect(cachedLeaderboards(8)).toBeDefined();
    expect(cachedLeaderboards(9)).toBeUndefined();
  });

  it('invalidates the cache when a score is submitted', async () => {
    mockFetch(200, { boards: [{ board: 'faster:natures', entries: [], me: null }] });
    await fetchAllLeaderboards(11);
    expect(cachedLeaderboards(11)).toBeDefined();

    mockFetch(200, { streak: 4, rank: 1 });
    await submitScore('faster:natures', 4);
    expect(cachedLeaderboards(11)).toBeUndefined();
  });
});
