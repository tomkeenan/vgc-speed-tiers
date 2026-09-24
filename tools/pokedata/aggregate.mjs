/**
 * Aggregates official Reg M-C event team lists from pokedata.ovh into a usage-ranked roster.
 *
 * Usage metric: TEAM-PRESENCE, matching the Limitless source. A species counts once per team that
 * includes it (deduped within a team), and usage% = teams-with-it / total-teams. A Mega-stone slot
 * counts for BOTH the base species and the specific Mega, so an always-Mega mon like Salamence puts
 * both `salamence` and `salamence-mega` on the board. See ../limitless/megas.mjs for the stone remap.
 */

import { readFile } from 'node:fs/promises';
import { getMastersStandings } from './client.mjs';
import { toSlug } from './names.mjs';
import { resolveMega, megaBasesFrom, readStone } from '../limitless/megas.mjs';

/** Reads the curated list of official M-C events to pool. Returns `{ meta, events }`. */
const readEvents = () =>
  readFile(new URL('../../data/pokedata-events.json', import.meta.url), 'utf8').then(JSON.parse);

/** Reads the current dataset as the catalog of valid ids, Mega slugs, and display names. */
async function loadCatalog() {
  const data = JSON.parse(
    await readFile(new URL('../../data/pokemon.json', import.meta.url), 'utf8'),
  );
  const ids = data.pokemon.map((p) => p.id);
  const megaSlugs = new Set(ids.filter((id) => id.includes('-mega')));
  return {
    validIds: new Set(ids),
    megaSlugs,
    megaBases: megaBasesFrom(megaSlugs),
    nameById: new Map(data.pokemon.map((p) => [p.id, p.name])),
  };
}

/**
 * Builds a usage-ranked roster from the curated official Reg M-C events on pokedata.ovh.
 * Returns `{ pokemon, meta, report }`. `pokemon` is `[{ showdownName, id, usage }]` sorted by usage
 * descending (no rank yet).
 */
export async function buildPokedataRoster() {
  const catalog = await loadCatalog();
  const { events } = await readEvents();

  const teamCountById = new Map();
  const displayNameById = new Map();
  const unknownNames = new Map();
  const unresolvedStones = new Map();
  let totalTeams = 0;
  const usedEvents = [];

  const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

  for (const ev of events) {
    let standings;
    try {
      standings = await getMastersStandings(ev.code);
    } catch (e) {
      console.warn(`  ! skipped ${ev.code} (${ev.name}): ${e.message}`);
      continue;
    }
    usedEvents.push(ev);

    for (const player of standings) {
      const deck = player.decklist;
      if (!Array.isArray(deck) || deck.length === 0) continue;
      totalTeams++;
      const entitiesOnTeam = new Set();

      for (const mon of deck) {
        const slug = toSlug(mon.name);
        if (slug === null) {
          bump(unknownNames, mon.name);
          continue;
        }
        entitiesOnTeam.add(slug);
        if (catalog.validIds.has(slug)) {
          if (!displayNameById.has(slug))
            displayNameById.set(slug, catalog.nameById.get(slug) ?? mon.name);
        } else {
          bump(unknownNames, mon.name);
          if (!displayNameById.has(slug)) displayNameById.set(slug, mon.name);
        }

        let mega = resolveMega({ id: slug, item: mon.item }, catalog.megaBases);
        if (mega && !catalog.megaSlugs.has(mega)) {
          bump(unresolvedStones, `${mon.item} -> ${mega}?`);
          mega = null;
        } else if (!mega && readStone(mon.item)) {
          bump(unresolvedStones, `${mon.item} on ${mon.name}`);
        }
        if (mega) {
          entitiesOnTeam.add(mega);
          if (!displayNameById.has(mega))
            displayNameById.set(mega, catalog.nameById.get(mega) ?? mon.name);
        }
      }

      for (const id of entitiesOnTeam) bump(teamCountById, id);
    }
  }

  const pokemon = [...teamCountById.entries()]
    .map(([id, n]) => ({ showdownName: displayNameById.get(id) ?? id, id, usage: n / totalTeams }))
    .sort((a, b) => b.usage - a.usage || a.id.localeCompare(b.id));

  return {
    pokemon,
    meta: { events: usedEvents.length, totalTeams },
    report: { unknownNames, unresolvedStones },
  };
}
