import { readFile, writeFile } from 'node:fs/promises';
import { fetchPokemon, fetchResource } from './lib/pokeapi.mjs';
import { pickLocalizedNames } from './lib/languages.mjs';

/**
 * Collects localized display names for one Pokemon: the localized species name, overlaid with the
 * localized form name where PokeAPI has one (so a form shows its own name, else the species name).
 * Takes the /pokemon response and the roster id, returns `{ <lang>: name }` (possibly empty).
 */
async function fetchLocalizedNames(p, id) {
  let names = {};
  if (p.species?.url) {
    const species = await fetchResource(p.species.url);
    names = pickLocalizedNames(species.names);
  }
  const form = p.forms?.find((f) => f.name === id) ?? p.forms?.[0];
  if (form?.url) {
    const formData = await fetchResource(form.url);
    names = { ...names, ...pickLocalizedNames(formData.names) };
  }
  return names;
}

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
    const names = await fetchLocalizedNames(p, entry.id);
    pokemon.push({
      id: entry.id,
      num: speciesNum,
      name: entry.showdownName,
      ...(Object.keys(names).length ? { names } : {}),
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
