import { describe, it, expect } from 'vitest';
import { serializeDeck, parseDeckJson } from './deckIO';

describe('deckIO', () => {
  it('round-trips a deck through serialize and parse', () => {
    const json = serializeDeck('Trick Room', ['torkoal', 'hatterene']);
    const result = parseDeckJson(json);
    expect(result).toEqual({
      ok: true,
      deck: { name: 'Trick Room', pokemonIds: ['torkoal', 'hatterene'] },
    });
  });

  it('trims the name and accepts an empty member list', () => {
    const result = parseDeckJson('{"name":"  Empty  ","pokemonIds":[]}');
    expect(result).toEqual({ ok: true, deck: { name: 'Empty', pokemonIds: [] } });
  });

  it('rejects invalid JSON', () => {
    const result = parseDeckJson('{not json');
    expect(result.ok).toBe(false);
  });

  it('rejects a missing name and a non-string-array pokemonIds', () => {
    expect(parseDeckJson('{"pokemonIds":[]}').ok).toBe(false);
    expect(parseDeckJson('{"name":"x","pokemonIds":"nope"}').ok).toBe(false);
    expect(parseDeckJson('{"name":"x","pokemonIds":[1,2]}').ok).toBe(false);
    expect(parseDeckJson('[]').ok).toBe(false);
  });
});
