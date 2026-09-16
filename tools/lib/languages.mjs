// Maps the app's supported language tags (src/language.ts SUPPORTED_LANGUAGES) to PokeAPI's own
// language slugs, for pulling localized names and types. English is the default (stored in `name`
// / en.json) and Finnish has no PokeAPI data, so both are omitted here - the UI falls back to
// English for anything missing. Keys are our tags; keep this in sync with SUPPORTED_LANGUAGES.
export const LANGUAGE_TO_POKEAPI = {
  fr: 'fr',
  de: 'de',
  es: 'es',
  'es-419': 'es-419',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  'zh-hans': 'zh-hans',
  'zh-hant': 'zh-hant',
};

/**
 * Extracts localized strings from a PokeAPI `names` array into a map keyed by our language tags.
 * Takes a PokeAPI names array (`[{ name, language: { name } }]`), returns `{ <ourTag>: value }`,
 * including only non-empty values for languages we support.
 */
export function pickLocalizedNames(pokeApiNames) {
  const bySlug = new Map((pokeApiNames ?? []).map((n) => [n.language.name, n.name]));
  const out = {};
  for (const [tag, slug] of Object.entries(LANGUAGE_TO_POKEAPI)) {
    const value = bySlug.get(slug);
    if (value) out[tag] = value;
  }
  return out;
}
