import { speedTiers } from '../../lib/speed';
import type { Pokemon } from '../../lib/types';

/** Which Speed number a contender represents: the raw base stat, or a level-50 max build. */
export type ContenderNature = 'base' | 'neutral' | 'positive';

/** One entry in the Who's Faster? comparison pool: a Pokemon at a specific Speed reading. */
export interface Contender {
  key: string;
  pokemon: Pokemon;
  nature: ContenderNature;
  speed: number;
}

/**
 * Builds the Who's Faster? comparison pool from a Pokemon pool.
 * Takes the pool and whether natures are allowed; returns one base-Speed contender per Pokemon,
 * or a neutral-max and a +Spd-max contender each when natures are allowed.
 */
export function buildContenders(pool: Pokemon[], allowNatures: boolean): Contender[] {
  if (!allowNatures) {
    return pool.map((pokemon) => ({
      key: pokemon.id,
      pokemon,
      nature: 'base',
      speed: pokemon.baseStats.spe,
    }));
  }
  return pool.flatMap((pokemon) => {
    const tiers = speedTiers(pokemon.baseStats.spe);
    return [
      {
        key: `${pokemon.id}:neutral`,
        pokemon,
        nature: 'neutral' as const,
        speed: tiers.neutralMax,
      },
      { key: `${pokemon.id}:positive`, pokemon, nature: 'positive' as const, speed: tiers.max },
    ];
  });
}

/** The Speed value to compare and reveal for a contender. */
export const speedOf = (c: Contender) => c.speed;

/** True when two contenders are the same Pokemon (its neutral and +Spd variants). */
export const sameSpecies = (a: Contender, b: Contender) => a.pokemon.id === b.pokemon.id;
