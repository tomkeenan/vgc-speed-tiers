/**
 * Dependency-free client over pokedata.ovh's static VGC standings files
 * (https://www.pokedata.ovh/standingsVGC). Each official event publishes its Masters division as a
 * downloadable JSON array of players, each carrying an open-team-sheet `decklist`. Static files with
 * no key and no documented rate limit, so we fetch politely and retry transient 5xx only.
 */

const BASE = 'https://www.pokedata.ovh/standingsVGC';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches one URL as JSON, retrying transient failures with backoff.
 * Takes a full URL, returns the parsed body.
 */
async function getJson(url, { retries = 4 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': 'vgc-speed-tiers/roster-builder' } });
    } catch (e) {
      if (attempt >= retries) throw e;
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (res.ok) return res.json();
    if (res.status < 500 || attempt >= retries) {
      throw new Error(`pokedata ${res.status} ${res.statusText} for ${url}`);
    }
    await sleep(500 * 2 ** attempt);
  }
}

/**
 * Fetches an event's Masters-division standings, each player with their open-team-sheet `decklist`
 * (up to six mons: id, name, ability, item, stat_alignment, badges). Takes the pokedata event code
 * (e.g. '0000192'), returns the players array.
 */
export function getMastersStandings(code) {
  return getJson(`${BASE}/${code}/masters/${code}_Masters.json`);
}
