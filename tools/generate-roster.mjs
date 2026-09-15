import { readFile, writeFile } from 'node:fs/promises';
import { toPokeApiSlug } from './lib/name-map.mjs';

// Stage 1: pull the Champions VGC used-Pokemon pool from Smogon/pkmn usage stats and resolve
// each name to a PokeAPI slug. Output: data/roster.json. Tune via FORMAT / MIN_USAGE env vars.
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

// Stopgap additions not yet in the usage-stats mirror (see each file's `note`). Base species
// resolve via PokeAPI in stage 2; the new Megas carry their own factual stats in manual-pokemon.
// Both are appended after the ranked usage pool with usage 0, so MIN_USAGE never trims them.
const readJson = (p) => readFile(new URL(p, import.meta.url), 'utf8').then(JSON.parse);
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
const pokemon = merged.map((p, i) => ({ ...p, usageRank: i + 1 }));

const roster = {
  meta: {
    format: FORMAT,
    generatedAt: new Date().toISOString(),
    source: `${STATS_URL} + manual Reg-MC additions (data/reg-mc-additions.json, data/manual-pokemon.json)`,
    count: pokemon.length,
  },
  pokemon,
};

await writeFile(
  new URL('../data/roster.json', import.meta.url),
  JSON.stringify(roster, null, 2) + '\n',
);
console.log(
  `roster: ${pokemon.length} Pokemon in ${FORMAT} ` +
    `(${fromStats.length} from usage stats >= ${MIN_USAGE * 100}%, ${pokemon.length - fromStats.length} manual additions)`,
);
