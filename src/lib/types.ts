/** The six stat keys, matching pokemon.schema.json. */
export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export type BaseStats = Record<StatKey, number>;

/** One Pokemon record from the dataset. Mirrors pokemon.schema.json (purely factual). */
export interface Pokemon {
  id: string;
  num: number;
  name: string;
  /** Localized display names keyed by language tag; English stays in `name`. Sparse - the UI falls back to `name`. */
  names?: Record<string, string>;
  types: string[];
  baseStats: BaseStats;
  sprite: string;
  usage: number;
  usageRank: number;
}

export interface DatasetMeta {
  format: string;
  generatedAt: string;
  level: number;
  count: number;
  source: string;
}

/** The full dataset shape loaded from data/pokemon.json. */
export interface Dataset {
  meta: DatasetMeta;
  pokemon: Pokemon[];
}
