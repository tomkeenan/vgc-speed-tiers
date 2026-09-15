import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Build-time sprite optimizer. Fetches each Pokemon's remote official-artwork PNG once,
// downscales it to LONG_EDGE (long side, no upscaling), and writes a transparent WebP into
// src/assets/sprites/<id>.webp so Vite fingerprints it as a long-cache hashed asset.
//
// Source of the remote URLs, in order of preference:
//   1. data/sprite-sources.json  ({ id: remoteUrl }) - written by build-dataset.mjs.
//   2. any http(s) sprite still present in data/pokemon.json (first-run bootstrap).
//
// Side effects (both idempotent):
//   - writes/updates data/sprite-sources.json (provenance kept after refs go local).
//   - rewrites data/pokemon.json sprite fields to the local "<id>.webp" reference.
//
// Re-runnable: downloaded PNGs are cached under .cache/sprites/ and existing WebP outputs are
// skipped unless --force is passed.

const LONG_EDGE = 300;
const WEBP_QUALITY = 80;
const force = process.argv.includes('--force');

const DATA_URL = new URL('../data/pokemon.json', import.meta.url);
const SOURCES_URL = new URL('../data/sprite-sources.json', import.meta.url);
const OUT_DIR = fileURLToPath(new URL('../src/assets/sprites/', import.meta.url));
const CACHE_DIR = fileURLToPath(new URL('../.cache/sprites/', import.meta.url));

const dataset = JSON.parse(await readFile(DATA_URL, 'utf8'));

/** Resolve { id -> remote PNG url } from the sidecar, falling back to any http sprite in the dataset. */
async function resolveSources() {
  const sources = {};
  if (existsSync(SOURCES_URL)) {
    Object.assign(sources, JSON.parse(await readFile(SOURCES_URL, 'utf8')));
  }
  for (const p of dataset.pokemon) {
    if (!sources[p.id] && /^https?:\/\//.test(p.sprite)) sources[p.id] = p.sprite;
  }
  return sources;
}

/** Fetch a remote PNG, caching the raw bytes on disk. Returns a Buffer. */
async function fetchPng(id, url) {
  const cachePath = `${CACHE_DIR}${id}.png`;
  if (existsSync(cachePath)) return readFile(cachePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, buf);
  return buf;
}

const sources = await resolveSources();
await mkdir(OUT_DIR, { recursive: true });

let written = 0;
let skipped = 0;
let bytes = 0;
const missing = [];

for (const p of dataset.pokemon) {
  const outPath = `${OUT_DIR}${p.id}.webp`;
  if (existsSync(outPath) && !force) {
    skipped += 1;
    bytes += (await readFile(outPath)).byteLength;
    continue;
  }
  const url = sources[p.id];
  if (!url) {
    missing.push(p.id);
    continue;
  }
  try {
    const png = await fetchPng(p.id, url);
    const webp = await sharp(png)
      .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, alphaQuality: 100 })
      .toBuffer();
    await writeFile(outPath, webp);
    written += 1;
    bytes += webp.byteLength;
  } catch (e) {
    missing.push(`${p.id} (${String(e.message ?? e)})`);
  }
}

// Persist provenance, then point the dataset at the local assets.
await writeFile(SOURCES_URL, JSON.stringify(sources, null, 2) + '\n');
let rewritten = 0;
for (const p of dataset.pokemon) {
  const local = `${p.id}.webp`;
  if (p.sprite !== local) {
    p.sprite = local;
    rewritten += 1;
  }
}
if (rewritten > 0) {
  await writeFile(DATA_URL, JSON.stringify(dataset, null, 2) + '\n');
}

const kb = Math.round(bytes / 1024);
console.log(
  `sprites: ${written} written, ${skipped} skipped, ${dataset.pokemon.length} total, ` +
    `${kb} KB on disk; dataset refs rewritten: ${rewritten}`,
);
if (missing.length) {
  console.error(`No source for ${missing.length}:`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exitCode = 1;
}
