import { readFile, writeFile } from 'node:fs/promises';
import { toPokeApiSlug } from './lib/name-map.mjs';
import { buildLimitlessRoster } from './limitless/aggregate.mjs';
import { buildPokedataRoster } from './pokedata/aggregate.mjs';

/**
 * Stage 1: build the format's used-Pokemon pool with resolved PokeAPI slugs, ranked by usage.
 * Output: data/roster.json. Sources (SOURCE env, default `limitless,pokedata`; comma-separated to pool):
 *   limitless - Reg M-C tournament team lists (play.limitlesstcg.com). Real M-C usage, incl. Megas.
 *   pokedata  - official Play! Pokemon Reg M-C event team sheets (pokedata.ovh, curated event list).
 *   smogon    - the @pkmn/Smogon ladder mirror (still Reg M-B) + manual Reg-MC stopgap additions.
 * Pooling combines team-presence sources (limitless, pokedata) by raw team counts; smogon (weighted
 * ladder usage, not team counts) is standalone and cannot be pooled.
 */
const SOURCE = process.env.SOURCE ?? 'limitless,pokedata';
const REGULATION = process.env.REGULATION ?? 'M-C';

/** Reads a JSON file relative to this module. */
const readJson = (p) => readFile(new URL(p, import.meta.url), 'utf8').then(JSON.parse);

/** Builds the roster pool from Limitless tournament data. Returns `{ pokemon, format, source, totalTeams }`. */
async function fromLimitless() {
  const { pokemon, meta, report } = await buildLimitlessRoster({ regulation: REGULATION });

  for (const [item, n] of [...report.unresolvedStones].sort((a, b) => b[1] - a[1])) {
    console.warn(`  ? unresolved stone: ${item} (x${n})`);
  }
  const unknown = [...report.unknownIds].sort((a, b) => b[1] - a[1]);
  if (unknown.length) {
    console.warn(
      `  ? ${unknown.length} unmapped Limitless ids (add to ID_OVERRIDES if unresolved downstream):`,
    );
    for (const [id, n] of unknown) console.warn(`      ${id} (x${n})`);
  }

  const regSlug = REGULATION.toLowerCase().replace('-', '');
  return {
    pokemon,
    format: `gen9championsvgc2026reg${regSlug}`,
    totalTeams: meta.totalTeams,
    source:
      `Limitless tournament team lists (https://play.limitlesstcg.com/api), Reg ${REGULATION}: ` +
      `${meta.events} events, ${meta.totalTeams} teams (team-presence usage)`,
  };
}

/** Builds the roster pool from curated official Reg M-C events on pokedata.ovh. Returns `{ pokemon, format, source, totalTeams }`. */
async function fromPokedata() {
  const { pokemon, meta, report } = await buildPokedataRoster();

  const unknown = [...report.unknownNames].sort((a, b) => b[1] - a[1]);
  if (unknown.length) {
    console.warn(`  ? ${unknown.length} unresolved pokedata names (add to tools/pokedata/names.mjs):`);
    for (const [name, n] of unknown) console.warn(`      ${name} (x${n})`);
  }
  for (const [item, n] of [...report.unresolvedStones].sort((a, b) => b[1] - a[1])) {
    console.warn(`  ? unresolved stone: ${item} (x${n})`);
  }

  const regSlug = REGULATION.toLowerCase().replace('-', '');
  return {
    pokemon,
    format: `gen9championsvgc2026reg${regSlug}`,
    totalTeams: meta.totalTeams,
    source:
      `pokedata.ovh official Reg ${REGULATION} event team sheets: ` +
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

const builders = { limitless: fromLimitless, pokedata: fromPokedata, smogon: fromSmogon };

/**
 * Pools several team-presence rosters into one by combining raw team counts across every event.
 * Takes rosters carrying `{ pokemon: [{ id, showdownName, usage }], totalTeams }`, returns
 * `{ pokemon, totalTeams }` with usage = pooled-teams-with-it / pooled-total-teams.
 */
function poolTeamPresence(rosters) {
  const totalTeams = rosters.reduce((sum, r) => sum + r.totalTeams, 0);
  const teamsById = new Map();
  const nameById = new Map();
  for (const r of rosters) {
    for (const p of r.pokemon) {
      const teams = Math.round(p.usage * r.totalTeams);
      teamsById.set(p.id, (teamsById.get(p.id) ?? 0) + teams);
      if (!nameById.has(p.id)) nameById.set(p.id, p.showdownName);
    }
  }
  const pokemon = [...teamsById.entries()]
    .map(([id, teams]) => ({ showdownName: nameById.get(id), id, usage: teams / totalTeams }))
    .sort((a, b) => b.usage - a.usage || a.id.localeCompare(b.id));
  return { pokemon, totalTeams };
}

const selected = SOURCE.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const rosters = [];
for (const key of selected) {
  const build = builders[key];
  if (!build) throw new Error(`unknown SOURCE '${key}' (expected: ${Object.keys(builders).join(', ')})`);
  rosters.push({ key, ...(await build()) });
}

let pool, format, source;
if (rosters.length <= 1) {
  ({ pokemon: pool, format, source } = rosters[0] ?? (await fromLimitless()));
} else {
  const unpoolable = rosters.filter((r) => r.totalTeams == null);
  if (unpoolable.length) {
    throw new Error(
      `cannot pool non-team-presence source(s): ${unpoolable.map((r) => r.key).join(', ')}`,
    );
  }
  ({ pokemon: pool } = poolTeamPresence(rosters));
  format = rosters[0].format;
  source = `pooled ${rosters.map((r) => r.key).join(' + ')} - ${rosters.map((r) => r.source).join(' | ')}`;
}
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
