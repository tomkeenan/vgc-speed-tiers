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

// Formes PokeAPI has no entry for (new Z-A Megas): trusted straight from the manual dataset,
// keyed by id. See data/manual-pokemon.json.
const manual = JSON.parse(
  await readFile(new URL('../data/manual-pokemon.json', import.meta.url), 'utf8'),
);
const manualById = new Map(manual.pokemon.map((m) => [m.id, m]));

const pokemon = [];
const spriteSources = {};
const failures = [];
for (const entry of roster.pokemon) {
  if (SKIP.has(entry.showdownName)) continue;
  const m = manualById.get(entry.id);
  if (m) {
    if (m.spriteUrl) spriteSources[m.id] = m.spriteUrl;
    pokemon.push({
      id: m.id,
      num: m.num,
      name: entry.showdownName,
      types: m.types,
      baseStats: m.baseStats,
      sprite: `${m.id}.webp`,
      usage: entry.usage,
      usageRank: entry.usageRank,
    });
    continue;
  }
  try {
    const p = await fetchPokemon(entry.id);
    const baseStats = {};
    for (const s of p.stats) baseStats[STAT_KEY[s.stat.name]] = s.base_stat;
    const speciesNum = Number(p.species.url.split('/').filter(Boolean).pop());
    const remoteSprite =
      p.sprites?.other?.['official-artwork']?.front_default ?? p.sprites?.front_default ?? '';
    if (remoteSprite) spriteSources[entry.id] = remoteSprite;
    pokemon.push({
      id: entry.id,
      num: speciesNum,
      name: entry.showdownName,
      types: p.types
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.type.name[0].toUpperCase() + t.type.name.slice(1)),
      baseStats,
      // Local optimized-WebP reference; tools/optimize-sprites.mjs fetches remoteSprite (kept in
      // data/sprite-sources.json) and produces src/assets/sprites/<id>.webp.
      sprite: `${entry.id}.webp`,
      usage: entry.usage,
      usageRank: entry.usageRank,
    });
  } catch (e) {
    failures.push({
      id: entry.id,
      showdownName: entry.showdownName,
      error: String(e.message ?? e),
    });
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

await writeFile(
  new URL('../data/pokemon.json', import.meta.url),
  JSON.stringify(dataset, null, 2) + '\n',
);
// Provenance for the optimizer: which remote artwork each local sprite is derived from.
await writeFile(
  new URL('../data/sprite-sources.json', import.meta.url),
  JSON.stringify(spriteSources, null, 2) + '\n',
);
console.log(`dataset: ${pokemon.length} written, ${failures.length} failures`);
if (failures.length) {
  console.error('Unresolved (add overrides to tools/lib/name-map.mjs):');
  for (const f of failures) console.error(`  - ${f.showdownName} -> ${f.id}: ${f.error}`);
  process.exitCode = 1;
}
