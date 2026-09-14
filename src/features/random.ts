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
