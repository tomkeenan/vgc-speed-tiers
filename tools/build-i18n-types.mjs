import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchResource } from './lib/pokeapi.mjs';
import { LANGUAGE_TO_POKEAPI, pickLocalizedNames } from './lib/languages.mjs';

// Generates the `types.*` i18n block in every src/locales/<tag>.json from PokeAPI's /type endpoint.
// Types are a closed set of 18, so they live in the locale files (not the per-Pokemon dataset).
// Languages PokeAPI lacks (Finnish) fall back to English so the key-parity test stays green.
// TypeBadges renders these via t('types.<lowercase type>').
const TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
];

const LOCALES_DIR = fileURLToPath(new URL('../src/locales/', import.meta.url));

// English names + a per-language map, both keyed by type slug.
const english = {};
const localized = {}; // { <ourTag>: { <type>: name } }
for (const tag of Object.keys(LANGUAGE_TO_POKEAPI)) localized[tag] = {};

for (const type of TYPES) {
  const data = await fetchResource(`type/${type}`);
  english[type] = data.names.find((n) => n.language.name === 'en')?.name ?? type;
  const picked = pickLocalizedNames(data.names);
  for (const [tag, value] of Object.entries(picked)) localized[tag][type] = value;
}

const files = (await readdir(LOCALES_DIR)).filter((f) => f.endsWith('.json'));
for (const file of files) {
  const tag = file.replace(/\.json$/, '');
  const path = new URL(`../src/locales/${file}`, import.meta.url);
  const json = JSON.parse(await readFile(path, 'utf8'));
  const perLang = localized[tag] ?? {};
  // Every type key must exist in every locale (parity); fill gaps with English.
  json.types = Object.fromEntries(TYPES.map((t) => [t, perLang[t] ?? english[t]]));
  await writeFile(path, JSON.stringify(json, null, 2) + '\n');
}

console.log(`i18n types: ${TYPES.length} types written to ${files.length} locale files`);
