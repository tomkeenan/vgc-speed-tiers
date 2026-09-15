/**
 * Returns a random integer in [0, max).
 * Takes an exclusive upper bound, returns the index.
 */
export function randomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Picks two distinct random elements from a list.
 * Takes a list (length >= 2), returns a pair.
 */
export function pickTwo<T>(items: T[]): [T, T] {
  const first = randomIndex(items.length);
  let second = randomIndex(items.length);
  if (items.length > 1) {
    while (second === first) second = randomIndex(items.length);
  }
  return [items[first], items[second]];
}

/** Constraints on a pair drawn by pickPairWithin. */
export interface PairConstraints<T> {
  valueOf: (item: T) => number;
  maxDiff?: number;
  allowEqual?: boolean;
  canPair?: (a: T, b: T) => boolean;
  weightOf?: (item: T) => number;
}

/** Picks an index into `weights` in proportion to its non-negative weight; uniform when all zero. */
function weightedIndex(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return randomIndex(weights.length);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= Math.max(0, weights[i]);
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/** Chooses one of `candidate` indices, biased by each candidate item's weight. */
function chooseWeighted<T>(candidates: number[], items: T[], weight: (item: T) => number): number {
  return candidates[weightedIndex(candidates.map((i) => weight(items[i])))];
}

/** Returns the two items in a random left/right order. */
function inRandomOrder<T>(a: T, b: T): [T, T] {
  return randomIndex(2) === 0 ? [a, b] : [b, a];
}

/**
 * Picks a random unordered pair subject to a maximum value gap, a tie rule, and a pairing predicate.
 * Takes the items and constraints (valueOf; optional maxDiff, allowEqual defaulting to true, canPair,
 * and weightOf to bias selection toward higher-weight items); returns a pair in random left/right
 * order, or null when no pair qualifies.
 */
export function pickPairWithin<T>(items: T[], c: PairConstraints<T>): [T, T] | null {
  const { valueOf, maxDiff, allowEqual = true, canPair, weightOf } = c;
  if (items.length < 2) return null;

  const weight = weightOf ?? (() => 1);

  const canBePaired = (a: T, b: T): boolean => {
    if (canPair && !canPair(a, b)) return false;
    const gap = Math.abs(valueOf(a) - valueOf(b));
    if (maxDiff !== undefined && gap > maxDiff) return false;
    if (!allowEqual && gap === 0) return false;
    return true;
  };
  const partnersOf = (i: number): number[] =>
    [...items.keys()].filter((j) => j !== i && canBePaired(items[i], items[j]));

  const anchors = [...items.keys()].filter((i) => partnersOf(i).length > 0);
  if (anchors.length === 0) return null;

  const anchor = chooseWeighted(anchors, items, weight);
  const partner = chooseWeighted(partnersOf(anchor), items, weight);
  return inRandomOrder(items[anchor], items[partner]);
}
