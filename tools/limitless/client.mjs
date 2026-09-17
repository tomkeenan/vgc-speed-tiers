// Thin, dependency-free client over the public Limitless tournament API
// (https://play.limitlesstcg.com/api). Tournament data (list, details, standings, pairings) needs
// no API key. This module knows nothing about speed tiers - it just returns the JSON verbatim.
//
// Rate limit is 50 requests / 5 min. We stay under it by serialising calls and honouring the
// `RateLimit` response header (`...; r=<remaining>; t=<seconds-to-reset>`): when the window is
// nearly spent we sleep until it resets, and any 429 is retried with backoff.

const BASE = 'https://play.limitlesstcg.com/api';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Parses `"50-in-5min"; r=47; t=300` into `{ remaining, reset }` (reset in ms). Best-effort. */
function parseRateLimit(header) {
  if (!header) return null;
  const r = /(?:^|;)\s*r=(\d+)/.exec(header);
  const t = /(?:^|;)\s*t=(\d+)/.exec(header);
  return { remaining: r ? Number(r[1]) : null, reset: t ? Number(t[1]) * 1000 : null };
}

/**
 * Fetches one API path as JSON, serialised and rate-limit aware. Retries 429/5xx with backoff.
 * Takes a path like `/tournaments?game=VGC`, returns the parsed body.
 */
async function apiGet(path, { retries = 4 } = {}) {
  const url = `${BASE}${path}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'vgc-speed-tiers/roster-builder' } });
    const rate = parseRateLimit(res.headers.get('RateLimit'));

    if (res.ok) {
      const body = await res.json();
      // Pre-emptively idle when the window is almost spent, so the next call does not 429.
      if (rate && rate.remaining !== null && rate.remaining <= 1 && rate.reset) {
        await sleep(rate.reset + 250);
      }
      return body;
    }

    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable || attempt >= retries) {
      throw new Error(`Limitless ${res.status} ${res.statusText} for ${path}`);
    }
    // On 429 wait out the reset window; otherwise exponential backoff.
    const waitMs = res.status === 429 && rate?.reset ? rate.reset + 250 : 500 * 2 ** attempt;
    await sleep(waitMs);
  }
}

/**
 * Lists tournaments for a game, newest first. Takes `{ game, limit }`, returns the array.
 * `limit` up to a few hundred is served in one page; that easily spans the current regulation.
 */
export function listTournaments({ game = 'VGC', limit = 500 } = {}) {
  return apiGet(`/tournaments?game=${encodeURIComponent(game)}&limit=${limit}`);
}

/** Fetches one tournament's metadata (format, date, phases). Takes an id, returns the object. */
export function getDetails(id) {
  return apiGet(`/tournaments/${encodeURIComponent(id)}/details`);
}

/**
 * Fetches a tournament's final standings, each player with their open-team-sheet `decklist`
 * (six mons: id, name, item, ability, attacks, nature, tera). Takes an id, returns the array.
 */
export function getStandings(id) {
  return apiGet(`/tournaments/${encodeURIComponent(id)}/standings`);
}
