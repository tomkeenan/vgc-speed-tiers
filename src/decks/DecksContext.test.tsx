import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { getAllPokemon } from '../lib/data';
import { DecksProvider, useDecks, type DecksApi } from './DecksContext';

function capture(onReady: (api: DecksApi) => void) {
  function Probe() {
    const api = useDecks();
    onReady(api);
    return (
      <div>
        <span data-testid="active">{api.activeDeckId}</span>
        <span data-testid="count">{api.activePokemon.length}</span>
        <span data-testid="decks">{api.decks.length}</span>
      </div>
    );
  }
  render(
    <DecksProvider>
      <Probe />
    </DecksProvider>,
  );
}

describe('DecksContext', () => {
  beforeEach(() => localStorage.clear());

  it('throws when used outside a provider', () => {
    function Bad() {
      useDecks();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/DecksProvider/);
  });

  it('defaults to the built-in All deck with the full pool', () => {
    let api!: DecksApi;
    capture((a) => (api = a));
    expect(api.activeDeckId).toBe('all');
    expect(api.decks[0].isBuiltIn).toBe(true);
    expect(api.activePokemon.length).toBe(getAllPokemon().length);
  });

  it('creates a user deck, activates it, and resolves members in usage order', () => {
    let api!: DecksApi;
    capture((a) => (api = a));
    const all = getAllPokemon();
    // Pass ids out of usage order; activePokemon should come back in usage order.
    const picked = [all[2].id, all[0].id];

    let id = '';
    act(() => {
      id = api.createDeck('My Deck', picked);
    });
    act(() => api.setActiveDeck(id));

    expect(screen.getByTestId('decks').textContent).toBe('2');
    expect(api.activeDeckId).toBe(id);
    expect(api.activePokemon.map((p) => p.id)).toEqual([all[0].id, all[2].id]);
  });

  it('does not auto-activate a newly created deck', () => {
    let api!: DecksApi;
    capture((a) => (api = a));
    act(() => {
      api.createDeck('Idle', [getAllPokemon()[0].id]);
    });
    expect(api.activeDeckId).toBe('all');
  });

  it('deleting the active deck falls back to All', () => {
    let api!: DecksApi;
    capture((a) => (api = a));
    let id = '';
    act(() => {
      id = api.createDeck('Temp', [getAllPokemon()[0].id]);
    });
    act(() => api.setActiveDeck(id));
    expect(api.activeDeckId).toBe(id);
    act(() => api.deleteDeck(id));
    expect(api.activeDeckId).toBe('all');
  });

  it('does not mutate the built-in All deck', () => {
    let api!: DecksApi;
    capture((a) => (api = a));
    act(() => api.renameDeck('all', 'Nope'));
    act(() => api.deleteDeck('all'));
    expect(api.decks[0].name).toBe('All Pokemon');
    expect(api.decks.length).toBe(1);
  });
});
