import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { SlotNumber } from '../../components/SlotNumber';
import { TypeBadges } from '../../components/TypeBadges';
import { randomIndex } from '../random';

/**
 * Flashcards feature: shows a Pokemon's artwork, flips to reveal its base Speed,
 * and shuffles to the next card. Returns the element.
 */
export function Flashcards() {
  const { activePokemon: pool, activeDeckId } = useDecks();
  const [index, setIndex] = useState(() => randomIndex(pool.length));
  const [nextIndex, setNextIndex] = useState(() => randomIndex(pool.length));
  const [revealed, setRevealed] = useState(false);

  const pickNext = (exclude: number) => {
    let n = randomIndex(pool.length);
    if (pool.length > 1) while (n === exclude) n = randomIndex(pool.length);
    return n;
  };

  useEffect(() => {
    setRevealed(false);
    const first = randomIndex(pool.length || 1);
    setIndex(first);
    setNextIndex(pickNext(first));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId]);

  useEffect(() => {
    if (typeof Image === 'undefined') return;
    const url = pool[nextIndex]?.sprite;
    if (url) {
      const img = new Image();
      img.src = url;
    }
  }, [nextIndex, pool]);

  if (pool.length === 0) {
    return (
      <Stack spacing={2}>
        <Card>
          <Typography sx={{ color: 'text.secondary' }}>No Pokemon available.</Typography>
        </Card>
      </Stack>
    );
  }

  const pokemon = pool[Math.min(index, pool.length - 1)];
  const base = pokemon.baseStats.spe;

  const next = () => {
    setRevealed(false);
    setIndex(nextIndex);
    setNextIndex(pickNext(nextIndex));
  };

  return (
    <Stack spacing={2}>
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
        Tap the card to reveal its base Speed.
      </Typography>

      <Card
        onClick={() => setRevealed((r) => !r)}
        ariaLabel={`${pokemon.name} flashcard, ${revealed ? 'showing' : 'hiding'} base Speed`}
      >
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: { xs: 192, sm: 224 }, maxWidth: '100%' }}>
            <PokemonImage src={pokemon.sprite} name={pokemon.name} eager />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {pokemon.name}
          </Typography>
          <TypeBadges types={pokemon.types} />

          <Box sx={{ mt: 1, width: '100%' }}>
            <Box
              sx={{
                bgcolor: 'background.default',
                color: 'text.primary',
                borderRadius: 1,
                px: 2,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
              >
                Base Speed
              </Typography>
              <Typography
                sx={{
                  fontSize: '3rem',
                  lineHeight: 1,
                  fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {revealed ? <SlotNumber value={base} /> : '???'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Card>

      <Button onClick={next}>Next Pokemon</Button>
    </Stack>
  );
}
