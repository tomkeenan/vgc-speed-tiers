import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getAllPokemon } from '../lib/data';
import type { Pokemon } from '../lib/types';
import {
  ALL_DECK_ID,
  loadState,
  newDeckId,
  saveState,
  type PersistedState,
  type StoredDeck,
} from './store';

/** A deck as consumed by the UI, with the built-in flag resolved. */
export interface Deck {
  id: string;
  name: string;
  pokemonIds: string[];
  isBuiltIn: boolean;
}

/** The decks API exposed to consumers via useDecks(). */
export interface DecksApi {
  decks: Deck[];
  activeDeckId: string;
  activeDeck: Deck;
  activePokemon: Pokemon[];
  setActiveDeck: (id: string) => void;
  createDeck: (name: string, pokemonIds: string[]) => string;
  renameDeck: (id: string, name: string) => void;
  setDeckMembers: (id: string, pokemonIds: string[]) => void;
  deleteDeck: (id: string) => void;
}

const DecksContext = createContext<DecksApi | null>(null);

const ALL_DECK: Deck = { id: ALL_DECK_ID, name: 'All Pokemon', pokemonIds: [], isBuiltIn: true };

function toDeck(stored: StoredDeck): Deck {
  return { ...stored, isBuiltIn: false };
}

/** Provides deck state (persisted to localStorage) to the tree. Wrap the app in this. */
export function DecksProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const decks = useMemo<Deck[]>(() => [ALL_DECK, ...state.decks.map(toDeck)], [state.decks]);

  const activeDeckId = useMemo(() => {
    if (state.activeDeckId === ALL_DECK_ID) return ALL_DECK_ID;
    return state.decks.some((d) => d.id === state.activeDeckId) ? state.activeDeckId : ALL_DECK_ID;
  }, [state.activeDeckId, state.decks]);

  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId) ?? ALL_DECK,
    [decks, activeDeckId],
  );

  const activePokemon = useMemo<Pokemon[]>(() => {
    const all = getAllPokemon();
    if (activeDeck.id === ALL_DECK_ID) return all;
    const members = new Set(activeDeck.pokemonIds);
    return all.filter((p) => members.has(p.id));
  }, [activeDeck]);

  const setActiveDeck = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeDeckId: id }));
  }, []);

  const createDeck = useCallback((name: string, pokemonIds: string[]) => {
    const id = newDeckId();
    setState((prev) => ({ ...prev, decks: [...prev.decks, { id, name, pokemonIds }] }));
    return id;
  }, []);

  const renameDeck = useCallback((id: string, name: string) => {
    if (id === ALL_DECK_ID) return;
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) => (d.id === id ? { ...d, name } : d)),
    }));
  }, []);

  const setDeckMembers = useCallback((id: string, pokemonIds: string[]) => {
    if (id === ALL_DECK_ID) return;
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) => (d.id === id ? { ...d, pokemonIds } : d)),
    }));
  }, []);

  const deleteDeck = useCallback((id: string) => {
    if (id === ALL_DECK_ID) return;
    setState((prev) => ({
      ...prev,
      decks: prev.decks.filter((d) => d.id !== id),
      activeDeckId: prev.activeDeckId === id ? ALL_DECK_ID : prev.activeDeckId,
    }));
  }, []);

  const value = useMemo<DecksApi>(
    () => ({
      decks,
      activeDeckId,
      activeDeck,
      activePokemon,
      setActiveDeck,
      createDeck,
      renameDeck,
      setDeckMembers,
      deleteDeck,
    }),
    [
      decks,
      activeDeckId,
      activeDeck,
      activePokemon,
      setActiveDeck,
      createDeck,
      renameDeck,
      setDeckMembers,
      deleteDeck,
    ],
  );

  return <DecksContext.Provider value={value}>{children}</DecksContext.Provider>;
}

/** Returns the decks API. Throws if used outside a DecksProvider. */
export function useDecks(): DecksApi {
  const ctx = useContext(DecksContext);
  if (!ctx) throw new Error('useDecks must be used within a DecksProvider');
  return ctx;
}
