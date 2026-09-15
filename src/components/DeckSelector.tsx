import { useMemo, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { getAllPokemon } from '../lib/data';
import { useDecks } from '../decks/DecksContext';
import { ALL_DECK_ID } from '../decks/store';
import { PokeballIcon } from './PokeballIcon';

/**
 * A Poke Ball button that opens a menu of decks and switches the active one.
 * Returns the element.
 */
export function DeckSelector() {
  const { decks, activeDeckId, activeDeck, setActiveDeck } = useDecks();
  const poolSize = useMemo(() => getAllPokemon().length, []);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const deckSize = (id: string, ids: string[]) => (id === ALL_DECK_ID ? poolSize : ids.length);

  const choose = (id: string) => {
    setActiveDeck(id);
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label={`Deck: ${activeDeck.name}`}
        aria-haspopup="true"
        aria-expanded={open ? true : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ flexShrink: 0, color: 'text.primary' }}
      >
        <PokeballIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {decks.map((deck) => (
          <MenuItem
            key={deck.id}
            selected={deck.id === activeDeckId}
            onClick={() => choose(deck.id)}
          >
            {`${deck.name} · ${deckSize(deck.id, deck.pokemonIds)}`}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
