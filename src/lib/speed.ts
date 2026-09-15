export type NatureEffect = 'positive' | 'neutral' | 'negative';

/** A Speed EV/IV/nature spread at a given level. Unset fields default to a max-IV, level-50 build. */
export interface SpeedSpread {
  base: number;
  ev?: number;
  iv?: number;
  nature?: NatureEffect;
  level?: number;
}

/** In-battle Speed modifiers, applied on top of the raw stat. */
export interface SpeedModifiers {
  stage?: number;
  tailwind?: boolean;
  choiceScarf?: boolean;
  paralysis?: boolean;
  multiplier?: number;
}

/** The three canonical Speed tiers of a base stat at a level. */
export interface SpeedTiers {
  min: number;
  neutralMax: number;
  max: number;
}

const NATURE_MULT: Record<NatureEffect, number> = { positive: 1.1, neutral: 1, negative: 0.9 };

const DEFAULT_LEVEL = 50;
const MAX_EV = 252;
const MAX_IV = 31;
const TAILWIND_MULT = 2;
const CHOICE_SCARF_MULT = 1.5;
const PARALYSIS_MULT = 0.5;

/**
 * Computes a Pokemon's Speed stat from a spread.
 * Takes a SpeedSpread, returns the raw stat value.
 */
export function computeSpeed(spread: SpeedSpread): number {
  const { base, ev = 0, iv = MAX_IV, nature = 'neutral', level = DEFAULT_LEVEL } = spread;
  const inner = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(inner * NATURE_MULT[nature]);
}

/**
 * Applies in-battle modifiers to a Speed stat.
 * Takes a raw stat and SpeedModifiers, returns the modified stat.
 */
export function applyModifiers(speed: number, mods: SpeedModifiers = {}): number {
  const { stage = 0, tailwind, choiceScarf, paralysis, multiplier = 1 } = mods;
  const [num, den] = stage >= 0 ? [2 + stage, 2] : [2, 2 - stage];
  let result = Math.floor((speed * num) / den);
  if (tailwind) result = Math.floor(result * TAILWIND_MULT);
  if (choiceScarf) result = Math.floor(result * CHOICE_SCARF_MULT);
  if (multiplier !== 1) result = Math.floor(result * multiplier);
  if (paralysis) result = Math.floor(result * PARALYSIS_MULT);
  return result;
}

/**
 * Computes the min / neutral-max / max Speed tiers for a base stat.
 * Takes a base Speed and level (default 50), returns SpeedTiers.
 */
export function speedTiers(base: number, level = DEFAULT_LEVEL): SpeedTiers {
  return {
    min: computeSpeed({ base, ev: 0, iv: 0, nature: 'negative', level }),
    neutralMax: computeSpeed({ base, ev: MAX_EV, iv: MAX_IV, nature: 'neutral', level }),
    max: computeSpeed({ base, ev: MAX_EV, iv: MAX_IV, nature: 'positive', level }),
  };
}
