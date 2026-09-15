/** The portable shape of a deck: its name and member ids, without the local deck id. */
export interface DeckExport {
  name: string;
  pokemonIds: string[];
}

/** Result of parsing pasted deck JSON: the deck, or a human-readable error. */
export type ParseResult = { ok: true; deck: DeckExport } | { ok: false; error: string };

/**
 * Serializes a deck to shareable, pretty-printed JSON.
 * Takes the deck name and member ids, returns the JSON string.
 */
export function serializeDeck(name: string, pokemonIds: string[]): string {
  return JSON.stringify({ name, pokemonIds }, null, 2);
}

/**
 * Parses pasted deck JSON into a name and member ids, validating the shape.
 * Takes the raw text, returns { ok: true, deck } or { ok: false, error }.
 */
export function parseDeckJson(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "That doesn't look like valid JSON." };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'Expected a deck object with "name" and "pokemonIds".' };
  }
  const obj = data as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (!name) return { ok: false, error: 'Deck is missing a "name".' };
  if (!Array.isArray(obj.pokemonIds) || !obj.pokemonIds.every((id) => typeof id === 'string')) {
    return { ok: false, error: '"pokemonIds" must be an array of Pokemon ids.' };
  }
  return { ok: true, deck: { name, pokemonIds: obj.pokemonIds as string[] } };
}
