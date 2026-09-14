import { readFile, writeFile } from 'node:fs/promises';
import { fetchPokemon } from './lib/pokeapi.mjs';

// Stage 2: read data/roster.json, fetch each Pokemon from PokeAPI, and emit the factual
// app dataset data/pokemon.json (base stats, types, sprite, usage). No speed math here.
const STAT_KEY = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spa',
  'special-defense': 'spd',
  speed: 'spe',
};

// Showdown names with no PokeAPI /pokemon entry. Excluded without counting as failures.
const SKIP = new Set([]);

const roster = JSON.parse(await readFile(new URL('../data/roster.json', import.meta.url), 'utf8'));

const pokemon = [];
const failures = [];
for (const entry of roster.pokemon) {
  if (SKIP.has(entry.showdownName)) continue;
  try {
    const p = await fetchPokemon(entry.id);
    const baseStats = {};
    for (const s of p.stats) baseStats[STAT_KEY[s.stat.name]] = s.base_stat;
    const speciesNum = Number(p.species.url.split('/').filter(Boolean).pop());
    pokemon.push({
      id: entry.id,
      num: speciesNum,
      name: entry.showdownName,
      types: p.types
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name[0].toUpperCase() + t.type.name.slice(1)),
      baseStats,
      sprite:
        p.sprites?.other?.['official-artwork']?.front_default ?? p.sprites?.front_default ?? '',
      usage: entry.usage,
      usageRank: entry.usageRank,
    });
  } catch (e) {
    failures.push({ id: entry.id, showdownName: entry.showdownName, error: String(e.message ?? e) });
  }
}

const dataset = {
  meta: {
    format: roster.meta.format,
    generatedAt: new Date().toISOString(),
    level: 50,
    count: pokemon.length,
    source: `pokeapi.co + ${roster.meta.source}`,
  },
  pokemon,
};

await writeFile(new URL('../data/pokemon.json', import.meta.url), JSON.stringify(dataset, null, 2) + '\n');
console.log(`dataset: ${pokemon.length} written, ${failures.length} failures`);
if (failures.length) {
  console.error('Unresolved (add overrides to tools/lib/name-map.mjs):');
  for (const f of failures) console.error(`  - ${f.showdownName} -> ${f.id}: ${f.error}`);
  process.exitCode = 1;
}
