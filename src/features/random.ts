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
}

/** Returns the list's indices in a uniformly shuffled order. */
function shuffledIndices(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Picks a random unordered pair subject to a maximum value gap, a tie rule, and a pairing predicate.
 * Takes the items and constraints (valueOf; optional maxDiff, allowEqual defaulting to true, and
 * canPair); returns a pair in random left/right order, or null when no pair qualifies.
 */
export function pickPairWithin<T>(items: T[], c: PairConstraints<T>): [T, T] | null {
  const { valueOf, maxDiff, allowEqual = true, canPair } = c;
  if (items.length < 2) return null;

  const eligible = (a: T, b: T): boolean => {
    if (canPair && !canPair(a, b)) return false;
    const diff = Math.abs(valueOf(a) - valueOf(b));
    if (maxDiff !== undefined && diff > maxDiff) return false;
    if (!allowEqual && diff === 0) return false;
    return true;
  };

  // Try anchors in random order; the first with any eligible partner yields a uniform-ish pair.
  for (const i of shuffledIndices(items.length)) {
    const partners: number[] = [];
    for (let j = 0; j < items.length; j++) {
      if (j !== i && eligible(items[i], items[j])) partners.push(j);
    }
    if (partners.length) {
      const j = partners[randomIndex(partners.length)];
      return randomIndex(2) === 0 ? [items[i], items[j]] : [items[j], items[i]];
    }
  }
  return null;
}
