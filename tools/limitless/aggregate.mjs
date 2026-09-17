// Aggregates Reg M-C tournament team lists from Limitless into a usage-ranked roster.
//
// Usage metric: TEAM-PRESENCE. A species counts once per team that includes it (deduped within a
// team), and usage% = teams-with-it / total-teams. A Mega-stone slot counts for BOTH the base
// species (base speed still matters) AND the specific Mega, so an always-Mega mon like Salamence
// puts both `salamence` and `salamence-mega` on the board. See megas.mjs for the remap.

import { readFile } from 'node:fs/promises';
import { listTournaments, getStandings } from './client.mjs';
import { isRegulation } from './regulation.mjs';
import { resolveMega, megaBasesFrom, readStone } from './megas.mjs';

// Limitless base id -> our dataset slug, where the two conventions differ. Seeded from known
// form-name mismatches; extend from the "unknown ids" report below when build-dataset can't resolve one.
const ID_OVERRIDES = {
  'indeedee-f': 'indeedee-female',
  'indeedee-m': 'indeedee-male',
  indeedee: 'indeedee-male',
  'basculegion-f': 'basculegion-female',
  basculegion: 'basculegion-male',
  toxtricity: 'toxtricity-amped',
  squawkabilly: 'squawkabilly-green-plumage',
  maushold: 'maushold-family-of-four',
  mimikyu: 'mimikyu-disguised',
  aegislash: 'aegislash-shield',
  palafin: 'palafin-zero',
  morpeko: 'morpeko-full-belly',
  lycanroc: 'lycanroc-midday',
  meowstic: 'meowstic-male',
  'meowstic-m': 'meowstic-male',
  'meowstic-f': 'meowstic-female',
  floette: 'floette-eternal',
  pyroar: 'pyroar-male',
  gourgeist: 'gourgeist-average',
  'tauros-paldea-aqua': 'tauros-paldea-aqua-breed',
  'tauros-paldea-blaze': 'tauros-paldea-blaze-breed',
  'tauros-paldea-combat': 'tauros-paldea-combat-breed',
};

/** Reads the current dataset as the catalog of valid ids, Mega slugs, and display names. */
async function loadCatalog() {
  const data = JSON.parse(await readFile(new URL('../../data/pokemon.json', import.meta.url), 'utf8'));
  const ids = data.pokemon.map((p) => p.id);
  const megaSlugs = new Set(ids.filter((id) => id.includes('-mega')));
  const megaBases = megaBasesFrom(megaSlugs);
  // A Limitless id that overrides onto a mega-capable base is itself mega-capable
  // (e.g. `floette` -> `floette-eternal`), so its stone still resolves.
  for (const [from, to] of Object.entries(ID_OVERRIDES)) {
    if (megaBases.has(to)) megaBases.add(from);
  }
  return {
    validIds: new Set(ids),
    megaSlugs,
    megaBases,
    nameById: new Map(data.pokemon.map((p) => [p.id, p.name])),
  };
}

const toSlug = (id) => ID_OVERRIDES[id] ?? id;

/**
 * Builds a usage-ranked roster from Reg M-C Limitless tournaments.
 * Takes `{ regulation, game, limit }`, returns `{ pokemon, meta, report }`.
 * `pokemon` is `[{ showdownName, id, usage }]` sorted by usage descending (no rank yet).
 */
export async function buildLimitlessRoster({ regulation = 'M-C', game = 'VGC', limit = 500 } = {}) {
  const catalog = await loadCatalog();
  const all = await listTournaments({ game, limit });
  const events = all.filter((t) => isRegulation(t, regulation));

  const counts = new Map(); // entity id -> number of teams
  const nameOf = new Map(); // entity id -> display name
  const unknownIds = new Map(); // unmapped limitless id -> count
  const unresolvedStones = new Map(); // stone-shaped item on a non-Mega species -> count
  let totalTeams = 0;
  const usedEvents = [];

  const note = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

  for (const t of events) {
    let standings;
    try {
      standings = await getStandings(t.id);
    } catch (e) {
      console.warn(`  ! skipped ${t.id} (${t.name}): ${e.message}`);
      continue;
    }
    usedEvents.push(t);

    for (const player of standings) {
      const deck = player.decklist;
      if (!Array.isArray(deck) || deck.length === 0) continue;
      totalTeams++;
      const present = new Set(); // dedupe entities within this one team

      for (const mon of deck) {
        const baseSlug = toSlug(mon.id);
        present.add(baseSlug);
        if (catalog.validIds.has(baseSlug)) {
          if (!nameOf.has(baseSlug)) nameOf.set(baseSlug, catalog.nameById.get(baseSlug) ?? mon.name);
        } else {
          note(unknownIds, mon.id);
          if (!nameOf.has(baseSlug)) nameOf.set(baseSlug, mon.name);
        }

        let mega = resolveMega({ id: mon.id, item: mon.item }, catalog.megaBases);
        if (mega && !catalog.megaSlugs.has(mega)) {
          note(unresolvedStones, `${mon.item} -> ${mega}?`);
          mega = null;
        } else if (!mega && readStone(mon.item)) {
          note(unresolvedStones, `${mon.item} on ${mon.id}`);
        }
        if (mega) {
          present.add(mega);
          if (!nameOf.has(mega)) nameOf.set(mega, catalog.nameById.get(mega) ?? mon.name);
        }
      }

      for (const id of present) note(counts, id);
    }
  }

  const pokemon = [...counts.entries()]
    .map(([id, n]) => ({ showdownName: nameOf.get(id) ?? id, id, usage: n / totalTeams }))
    .sort((a, b) => b.usage - a.usage || a.id.localeCompare(b.id));

  return {
    pokemon,
    meta: { events: usedEvents.length, totalTeams },
    report: { unknownIds, unresolvedStones },
  };
}
