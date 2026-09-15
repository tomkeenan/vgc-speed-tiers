import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
// Hermetic across runs: a manifest (.cache/sprites-manifest.json) records the source URL each
// existing WebP was built from, so a changed URL re-downloads and re-encodes even when the output
// already exists; the raw PNG cache is keyed by URL, so it never serves bytes from a stale URL.
// WebP outputs whose id is no longer in the dataset are pruned, so the eager glob in src/lib/data.ts
// only ever bundles current sprites. Pass --force to rebuild every sprite regardless.
//
// Side effects (all idempotent):
//   - writes/updates data/sprite-sources.json (provenance kept after refs go local).
//   - rewrites data/pokemon.json sprite fields to the local "<id>.webp" reference.
//   - writes .cache/sprites-manifest.json (build-local; gitignored).

const LONG_EDGE = 300;
const WEBP_QUALITY = 80;
const force = process.argv.includes('--force');

const DATA_URL = new URL('../data/pokemon.json', import.meta.url);
const SOURCES_URL = new URL('../data/sprite-sources.json', import.meta.url);
const MANIFEST_URL = new URL('../.cache/sprites-manifest.json', import.meta.url);
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

/** Manifest of { id -> sourceUrl } the current WebP was built from. Empty when absent/corrupt. */
async function loadManifest() {
  if (!existsSync(MANIFEST_URL)) return {};
  try {
    return JSON.parse(await readFile(MANIFEST_URL, 'utf8'));
  } catch {
    return {};
  }
}

/** Fetch a remote PNG, caching the raw bytes on disk keyed by URL so a URL change refetches. */
async function fetchPng(url) {
  const key = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const cachePath = `${CACHE_DIR}${key}.png`;
  if (existsSync(cachePath)) return readFile(cachePath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, buf);
  return buf;
}

const sources = await resolveSources();
const manifest = await loadManifest();
await mkdir(OUT_DIR, { recursive: true });

let written = 0;
let skipped = 0;
let bytes = 0;
const missing = [];

for (const p of dataset.pokemon) {
  const outPath = `${OUT_DIR}${p.id}.webp`;
  const url = sources[p.id];
  // Reuse the existing WebP only when it was built from the current source URL.
  const upToDate = existsSync(outPath) && manifest[p.id] === url && !force;
  if (upToDate) {
    skipped += 1;
    bytes += (await readFile(outPath)).byteLength;
    continue;
  }
  if (!url) {
    missing.push(p.id);
    continue;
  }
  try {
    const png = await fetchPng(url);
    const webp = await sharp(png)
      .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, alphaQuality: 100 })
      .toBuffer();
    await writeFile(outPath, webp);
    manifest[p.id] = url;
    written += 1;
    bytes += webp.byteLength;
  } catch (e) {
    missing.push(`${p.id} (${String(e.message ?? e)})`);
  }
}

// Prune orphan WebP (and manifest entries) for ids no longer in the dataset, so the eager glob in
// src/lib/data.ts never bundles a stale sprite left over from a renamed or removed entry.
const validIds = new Set(dataset.pokemon.map((p) => p.id));
let pruned = 0;
for (const file of await readdir(OUT_DIR)) {
  if (!file.endsWith('.webp')) continue;
  const id = file.slice(0, -'.webp'.length);
  if (!validIds.has(id)) {
    await unlink(`${OUT_DIR}${file}`);
    pruned += 1;
  }
}
for (const id of Object.keys(manifest)) {
  if (!validIds.has(id)) delete manifest[id];
}
await mkdir(new URL('../.cache/', import.meta.url), { recursive: true });
await writeFile(MANIFEST_URL, JSON.stringify(manifest, null, 2) + '\n');

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
  `sprites: ${written} written, ${skipped} skipped, ${pruned} pruned, ${dataset.pokemon.length} total, ` +
    `${kb} KB on disk; dataset refs rewritten: ${rewritten}`,
);
if (missing.length) {
  console.error(`No source for ${missing.length}:`);
  for (const m of missing) console.error(`  - ${m}`);
  process.exitCode = 1;
}
