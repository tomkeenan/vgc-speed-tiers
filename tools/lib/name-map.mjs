// Showdown/Smogon name -> PokeAPI slug. The generic rule handles most names; OVERRIDES cover
// forms whose PokeAPI slug is irregular. When build-dataset reports an unresolved slug, add it here.

const OVERRIDES = {
  'Charizard-Mega-Y': 'charizard-mega-y',
  'Charizard-Mega-X': 'charizard-mega-x',
  'Mewtwo-Mega-Y': 'mewtwo-mega-y',
  'Mewtwo-Mega-X': 'mewtwo-mega-x',
  'Ogerpon-Wellspring': 'ogerpon-wellspring-mask',
  'Ogerpon-Hearthflame': 'ogerpon-hearthflame-mask',
  'Ogerpon-Cornerstone': 'ogerpon-cornerstone-mask',
  Indeedee: 'indeedee-male',
  'Indeedee-F': 'indeedee-female',
  Toxtricity: 'toxtricity-amped',
  Squawkabilly: 'squawkabilly-green-plumage',
  Basculegion: 'basculegion-male',
  'Basculegion-F': 'basculegion-female',
  Maushold: 'maushold-family-of-four',
  Mimikyu: 'mimikyu-disguised',
  Aegislash: 'aegislash-shield',
  Palafin: 'palafin-zero',
  Meowstic: 'meowstic-male',
  'Meowstic-M-Mega': 'meowstic-male-mega',
  'Meowstic-F-Mega': 'meowstic-female-mega',
  Lycanroc: 'lycanroc-midday',
  Morpeko: 'morpeko-full-belly',
  'Tauros-Paldea-Combat': 'tauros-paldea-combat-breed',
  'Tauros-Paldea-Blaze': 'tauros-paldea-blaze-breed',
  'Tauros-Paldea-Aqua': 'tauros-paldea-aqua-breed',
  "Farfetch'd": 'farfetchd',
  "Sirfetch'd": 'sirfetchd',
  'Mr. Mime': 'mr-mime',
  'Mr. Rime': 'mr-rime',
  'Type: Null': 'type-null',
  Flabébé: 'flabebe',
};

/**
 * Resolves a Showdown name to a PokeAPI slug.
 * Takes the Showdown name, returns the slug.
 */
export function toPokeApiSlug(name) {
  if (OVERRIDES[name]) return OVERRIDES[name];
  return name
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[.:]/g, '')
    .replace(/é/g, 'e')
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/\s+/g, '-');
}
