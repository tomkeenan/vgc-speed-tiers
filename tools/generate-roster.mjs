import { readFile, writeFile } from 'node:fs/promises';
import { toPokeApiSlug } from './lib/name-map.mjs';
import { buildLimitlessRoster } from './limitless/aggregate.mjs';

// Stage 1: build the format's used-Pokemon pool with resolved PokeAPI slugs, ranked by usage.
// Output: data/roster.json. Two sources (SOURCE env, default `limitless`):
//   limitless - Reg M-C tournament team lists (play.limitlesstcg.com). Real M-C usage, incl. Megas.
//   smogon    - the @pkmn/Smogon ladder mirror (still Reg M-B) + manual Reg-MC stopgap additions.
const SOURCE = process.env.SOURCE ?? 'limitless';
const REGULATION = process.env.REGULATION ?? 'M-C';

/** Reads a JSON file relative to this module. */
const readJson = (p) => readFile(new URL(p, import.meta.url), 'utf8').then(JSON.parse);

/** Builds the roster pool from Limitless tournament data. Returns `{ pokemon, format, source }`. */
async function fromLimitless() {
  const { pokemon, meta, report } = await buildLimitlessRoster({ regulation: REGULATION });

  for (const [item, n] of [...report.unresolvedStones].sort((a, b) => b[1] - a[1])) {
    console.warn(`  ? unresolved stone: ${item} (x${n})`);
  }
  const unknown = [...report.unknownIds].sort((a, b) => b[1] - a[1]);
  if (unknown.length) {
    console.warn(`  ? ${unknown.length} unmapped Limitless ids (add to ID_OVERRIDES if unresolved downstream):`);
    for (const [id, n] of unknown) console.warn(`      ${id} (x${n})`);
  }

  const regSlug = REGULATION.toLowerCase().replace('-', '');
  return {
    pokemon,
    format: `gen9championsvgc2026reg${regSlug}`,
    source:
      `Limitless tournament team lists (https://play.limitlesstcg.com/api), Reg ${REGULATION}: ` +
      `${meta.events} events, ${meta.totalTeams} teams (team-presence usage)`,
  };
}

/** Builds the roster pool from the @pkmn/Smogon ladder mirror. Returns `{ pokemon, format, source }`. */
async function fromSmogon() {
  const FORMAT = process.env.FORMAT ?? 'gen9championsvgc2026';
  const MIN_USAGE = Number(process.env.MIN_USAGE ?? 0);
  const STATS_URL = `https://pkmn.github.io/smogon/data/stats/${FORMAT}.json`;

  const res = await fetch(STATS_URL);
  if (!res.ok) throw new Error(`stats fetch failed: ${res.status} ${STATS_URL}`);
  const stats = await res.json();

  const fromStats = Object.entries(stats.pokemon)
    .map(([showdownName, d]) => ({
      showdownName,
      id: toPokeApiSlug(showdownName),
      usage: d.usage.weighted,
    }))
    .filter((p) => p.usage >= MIN_USAGE)
    .sort((a, b) => b.usage - a.usage);

  // Stopgap additions not yet in the usage-stats mirror (which still serves Reg MB). Base species
  // resolve via PokeAPI in stage 2; the new Megas carry factual stats in manual-pokemon.json. Both
  // are appended after the ranked usage pool with usage 0, so MIN_USAGE never trims them.
  const [additions, manual] = await Promise.all([
    readJson('../data/reg-mc-additions.json'),
    readJson('../data/manual-pokemon.json'),
  ]);
  const extra = [
    ...additions.showdownNames.map((showdownName) => ({
      showdownName,
      id: toPokeApiSlug(showdownName),
      usage: 0,
    })),
    ...manual.pokemon.map((m) => ({ showdownName: m.showdownName, id: m.id, usage: 0 })),
  ];

  const seen = new Set(fromStats.map((p) => p.id));
  const merged = [...fromStats];
  for (const e of extra) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    merged.push(e);
  }
  return {
    pokemon: merged,
    format: FORMAT,
    source: `${STATS_URL} + manual Reg-MC additions (data/reg-mc-additions.json, data/manual-pokemon.json)`,
  };
}

const { pokemon: pool, format, source } = SOURCE === 'smogon' ? await fromSmogon() : await fromLimitless();
const pokemon = pool.map((p, i) => ({ ...p, usageRank: i + 1 }));

const roster = {
  meta: {
    format,
    generatedAt: new Date().toISOString(),
    source,
    count: pokemon.length,
  },
  pokemon,
};

await writeFile(
  new URL('../data/roster.json', import.meta.url),
  JSON.stringify(roster, null, 2) + '\n',
);
console.log(`roster: ${pokemon.length} Pokemon from ${SOURCE} (${format})`);
