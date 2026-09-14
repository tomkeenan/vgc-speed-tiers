import { writeFile } from 'node:fs/promises';
import { toPokeApiSlug } from './lib/name-map.mjs';

// Stage 1: pull the Champions VGC used-Pokemon pool from Smogon/pkmn usage stats and resolve
// each name to a PokeAPI slug. Output: data/roster.json. Tune via FORMAT / MIN_USAGE env vars.
const FORMAT = process.env.FORMAT ?? 'gen9championsvgc2026';
const MIN_USAGE = Number(process.env.MIN_USAGE ?? 0);
const STATS_URL = `https://pkmn.github.io/smogon/data/stats/${FORMAT}.json`;

const res = await fetch(STATS_URL);
if (!res.ok) throw new Error(`stats fetch failed: ${res.status} ${STATS_URL}`);
const stats = await res.json();

const pokemon = Object.entries(stats.pokemon)
  .map(([showdownName, d]) => ({ showdownName, id: toPokeApiSlug(showdownName), usage: d.usage.weighted }))
  .filter((p) => p.usage >= MIN_USAGE)
  .sort((a, b) => b.usage - a.usage)
  .map((p, i) => ({ ...p, usageRank: i + 1 }));

const roster = {
  meta: {
    format: FORMAT,
    generatedAt: new Date().toISOString(),
    source: STATS_URL,
    count: pokemon.length,
  },
  pokemon,
};

await writeFile(new URL('../data/roster.json', import.meta.url), JSON.stringify(roster, null, 2) + '\n');
console.log(`roster: ${pokemon.length} Pokemon (>= ${MIN_USAGE * 100}% usage) in ${FORMAT}`);
