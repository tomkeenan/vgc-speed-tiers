import type { Dataset, DatasetMeta, Pokemon } from './types';
import raw from '../../data/pokemon.json';

const dataset = raw as Dataset;

/** Returns every Pokemon in the dataset, in usage order. */
export function getAllPokemon(): Pokemon[] {
  return dataset.pokemon;
}

/** Returns dataset metadata. */
export function getMeta(): DatasetMeta {
  return dataset.meta;
}

/**
 * Finds a Pokemon by its slug id.
 * Takes an id, returns the Pokemon or undefined.
 */
export function getPokemon(id: string): Pokemon | undefined {
  return dataset.pokemon.find((p) => p.id === id);
}
