import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'https://pokeapi.co/api/v2';
const CACHE_DIR = fileURLToPath(new URL('../../.cache/pokeapi/', import.meta.url));

/**
 * Fetches an arbitrary PokeAPI resource, caching the raw JSON on disk.
 * Takes an endpoint path (e.g. `pokemon/pikachu`, `type/fire`) or a full API URL, returns the
 * parsed response.
 */
export async function fetchResource(pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${BASE}/${pathOrUrl}`;
  const cacheKey = url.replace(`${BASE}/`, '').replace(/\/+$/, '').replace(/[/]/g, '_');
  const cachePath = `${CACHE_DIR}${cacheKey}.json`;
  if (existsSync(cachePath)) {
    return JSON.parse(await readFile(cachePath, 'utf8'));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, JSON.stringify(json));
  return json;
}

/**
 * Fetches a Pokemon resource from PokeAPI, caching the raw JSON on disk.
 * Takes a slug, returns the parsed PokeAPI /pokemon response.
 */
export async function fetchPokemon(slug) {
  return fetchResource(`pokemon/${slug}`);
}
