// Resolving Mega Evolutions from Limitless decklists.
//
// In Reg M-C a Mega is recorded as the BASE species id plus a mega-stone `item` (e.g.
// `salamence` + "Salamencite", `charizard` + "Charizardite Y"), never as a `-mega` form id.
// So we detect the stone and remap. Detection is two-factor and species-anchored, which keeps it
// robust against the wildly inconsistent stone spellings players type into team sheets
// ("Carchacrokite Z" for Garchomp, "Frosslasite", "metagrossite", ...):
//
//   1. The item is stone-SHAPED: normalised, it ends in "ite" (optionally + x/y/z), and is not a
//      known non-stone "-ite" item (Eviolite).
//   2. The holder's base species actually HAS a Mega (`MEGA_BASES`).
//
// The clean species id does the real work; the messy item only has to look like a stone and give
// the X/Y/Z suffix. The base species itself always counts too (see aggregate.mjs) - the base speed
// still matters turn 1 or if the Pokemon never Megas - so a stone adds the Mega line ON TOP of it.

/** Base species ids (our dataset slugs) that have no `-mega` in their Limitless id but should map
 *  to a differently-stemmed mega slug. Everything else uses `<baseId>-mega[-suffix]`. */
const BASE_STEM = {
  'floette-eternal': 'floette',
  'meowstic-f': 'meowstic-female',
  'meowstic-m': 'meowstic-male',
  meowstic: 'meowstic-male',
};

/** "-ite" items that are NOT Mega Stones. Normalised (lowercase, no spaces/punctuation). */
const NOT_A_STONE = new Set(['eviolite']);

/** Reverse of BASE_STEM: mega-slug stem -> the Limitless base id that produces it. */
const STEM_TO_BASE = Object.fromEntries(Object.entries(BASE_STEM).map(([base, stem]) => [stem, base]));

/**
 * Derives the set of Limitless base ids that have a Mega, from our valid mega slugs.
 * Takes an iterable of mega slugs (e.g. 'charizard-mega-y'), returns a Set of base ids.
 */
export function megaBasesFrom(megaSlugs) {
  const bases = new Set();
  for (const slug of megaSlugs) {
    const stem = slug.replace(/-mega(-[xyz])?$/, '');
    bases.add(STEM_TO_BASE[stem] ?? stem);
  }
  return bases;
}

const normalize = (s) => (s ?? '').toLowerCase().replace(/[^a-z]/g, '');

/**
 * Detects a Mega Stone and its variant from an item name.
 * Takes the raw item string, returns `{ suffix }` (suffix is '', 'x', 'y', or 'z') or null.
 */
export function readStone(item) {
  if (!item) return null;
  const norm = normalize(item);
  if (NOT_A_STONE.has(norm)) return null;
  // Trailing variant letter, from either "Charizardite Y" or a run-together "charizarditey".
  const m = /ite([xyz])?$/.exec(norm);
  if (!m) return null;
  return { suffix: m[1] ?? '' };
}

/**
 * Resolves the Mega slug for a Limitless decklist entry, or null if it is not a Mega.
 * Takes `{ id, item }` and the set of Pokemon ids that have a Mega, returns the mega slug or null.
 * Unresolved stones (species has no such Mega) return null so the caller keeps the base + warns.
 */
export function resolveMega({ id, item }, megaBases) {
  const stone = readStone(item);
  if (!stone) return null;
  if (!megaBases.has(id)) return null;
  const stem = BASE_STEM[id] ?? id;
  return stone.suffix ? `${stem}-mega-${stone.suffix}` : `${stem}-mega`;
}
