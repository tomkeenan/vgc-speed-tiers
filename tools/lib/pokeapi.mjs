import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'https://pokeapi.co/api/v2';
const CACHE_DIR = fileURLToPath(new URL('../../.cache/pokeapi/', import.meta.url));

/**
 * Fetches a Pokemon resource from PokeAPI, caching the raw JSON on disk.
 * Takes a slug, returns the parsed PokeAPI /pokemon response.
 */
export async function fetchPokemon(slug) {
  const cachePath = `${CACHE_DIR}${slug}.json`;
  if (existsSync(cachePath)) {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  }
  const res = await fetch(`${BASE}/pokemon/${slug}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, JSON.stringify(json));
  return json;
}
