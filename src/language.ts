import { readJson, writeJson } from './features/streakStore';

/** Languages that ship with a translation bundle. The first entry is the fallback. */
export const SUPPORTED_LANGUAGES = [
  'en',
  'fi-FI',
  'fr',
  'de',
  'es',
  'es-419',
  'it',
  'ja',
  'ko',
  'zh-hans',
  'zh-hant',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'vgc-speed-tiers/language';
const FALLBACK: SupportedLanguage = 'en';

const isSupported = (v: unknown): v is SupportedLanguage =>
  typeof v === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(v);

/**
 * Matches one BCP-47 tag against the supported languages: an exact hit first, then a base-language
 * hit (e.g. 'fi' or 'fi-FI' -> 'fi-FI', 'en-GB' -> 'en'). Returns undefined when nothing matches.
 */
function matchTag(tag: string): SupportedLanguage | undefined {
  const lower = tag.toLowerCase();
  const exact = SUPPORTED_LANGUAGES.find((l) => l.toLowerCase() === lower);
  if (exact) return exact;
  const base = lower.split('-')[0];
  return SUPPORTED_LANGUAGES.find((l) => l.toLowerCase().split('-')[0] === base);
}

/** The browser's preferred supported language, or the fallback (English) when none match. */
export function detectBrowserLanguage(): SupportedLanguage {
  const tags =
    typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : [];
  for (const tag of tags) {
    if (!tag) continue;
    const match = matchTag(tag);
    if (match) return match;
  }
  return FALLBACK;
}

/**
 * The active language: a previously saved explicit choice, or - on first run - the browser's
 * preferred supported language, falling back to English.
 */
export function loadLanguage(): SupportedLanguage {
  return readJson<SupportedLanguage>(STORAGE_KEY, detectBrowserLanguage(), isSupported);
}

/** Persists an explicit language choice; silently no-ops when storage is unavailable. */
export function saveLanguage(lang: SupportedLanguage): void {
  writeJson(STORAGE_KEY, lang);
}
