/**
 * Resolving a pokedata decklist entry's display name to our dataset slug.
 *
 * pokedata writes species as a base name plus a bracketed form, e.g. "Arcanine [Hisuian Form]",
 * "Rotom [Heat Rotom]", "Indeedee [Female]". We turn the bracket into the Showdown-style suffix the
 * existing name-map already understands, then reuse toPokeApiSlug. Forms that collapse to a single
 * dataset slug (stat-identical alt-forms the dataset does not carry separately - Sinistcha's two
 * forms, Squawkabilly plumages, Maushold family sizes) map to the base the dataset does carry.
 */

import { toPokeApiSlug } from '../lib/name-map.mjs';

/** Normalised bracket content -> Showdown-style suffix appended to the base name ('' = drop it). */
const FORM_SUFFIX = {
  'hisuian form': '-Hisui',
  'alolan form': '-Alola',
  'galarian form': '-Galar',
  female: '-F',
  male: '',
  'dusk form': '-Dusk',
  'eternal flower': '-Eternal',
  'low key form': '-Low-Key',
  'heat rotom': '-Heat',
  'wash rotom': '-Wash',
  'mow rotom': '-Mow',
  'frost rotom': '-Frost',
  'fan rotom': '-Fan',
  'paldean form - aqua breed': '-Paldea-Aqua',
  'paldean form - blaze breed': '-Paldea-Blaze',
  'paldean form - combat breed': '-Paldea-Combat',
  'family of four': '',
  'family of three': '',
  'masterpiece form': '',
  'unremarkable form': '',
  'white plumage': '',
  'blue plumage': '',
  'yellow plumage': '',
};

const BRACKET = /^(.*?)\s*\[([^\]]+)\]\s*$/;

/**
 * Converts a pokedata display name to a Showdown-style name.
 * Takes the raw name, returns the Showdown name (base + form suffix), or null on an unknown form.
 */
function toShowdownName(name) {
  const match = BRACKET.exec(name);
  if (!match) return name;
  const [, base, form] = match;
  const suffix = FORM_SUFFIX[form.trim().toLowerCase()];
  if (suffix === undefined) return null;
  return `${base.trim()}${suffix}`;
}

/**
 * Resolves a pokedata display name to a dataset slug.
 * Takes the raw name, returns the slug, or null if the bracketed form is unrecognised.
 */
export function toSlug(name) {
  const showdownName = toShowdownName(name);
  return showdownName === null ? null : toPokeApiSlug(showdownName);
}
