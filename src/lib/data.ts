import type { Dataset, DatasetMeta, Pokemon } from './types';
import raw from '../../data/pokemon.json';

const dataset = raw as Dataset;

// Optimized sprites are bundled as hashed, long-cache Vite assets. The dataset stores the bare
// "<id>.webp" filename; map each to its fingerprinted URL once at module load. Missing assets fall
// back to the raw filename, which PokemonImage renders as a name-only placeholder on error.
const spriteUrls = import.meta.glob('../assets/sprites/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const spriteByFile = new Map<string, string>();
for (const [path, url] of Object.entries(spriteUrls)) {
  const file = path.split('/').pop();
  if (file) spriteByFile.set(file, url);
}

const pokemon: Pokemon[] = dataset.pokemon.map((p) => ({
  ...p,
  sprite: spriteByFile.get(p.sprite) ?? p.sprite,
}));

/** Returns every Pokemon in the dataset, in usage order. */
export function getAllPokemon(): Pokemon[] {
  return pokemon;
}

/**
 * The Pokemon's display name in the given language.
 * Takes a Pokemon and a language tag, returns the localized name or the default English `name`.
 */
export function displayName(p: Pick<Pokemon, 'name' | 'names'>, lang: string): string {
  return p.names?.[lang] ?? p.name;
}

/** Returns dataset metadata. */
export function getMeta(): DatasetMeta {
  return dataset.meta;
}

/**
 * Finds a Pokemon by its slug id.
 * Takes an id, returns the Pokemon or undefined.
 */
export function getPokemon(id: string): Pokemon | undefined {
  return pokemon.find((p) => p.id === id);
}
