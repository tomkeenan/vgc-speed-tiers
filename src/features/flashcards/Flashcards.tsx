import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import { computeSpeed } from '../../lib/speed';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { SlotNumber } from '../../components/SlotNumber';
import { StatPill } from '../../components/StatPill';
import { TypeBadges } from '../../components/TypeBadges';
import { randomIndex } from '../random';

/**
 * Flashcards feature: shows a Pokemon's artwork, flips to reveal its level-50 speed tiers,
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

  // Reset to a fresh card whenever the active deck changes.
  useEffect(() => {
    setRevealed(false);
    const first = randomIndex(pool.length || 1);
    setIndex(first);
    setNextIndex(pickNext(first));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId]);

  // Warm the browser cache with the upcoming card's sprite so "Next" shows it instantly.
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
      <Card>
        <Typography sx={{ color: 'text.secondary' }}>No Pokemon available.</Typography>
      </Card>
    );
  }

  const pokemon = pool[Math.min(index, pool.length - 1)];
  const base = pokemon.baseStats.spe;
  const noEvs = computeSpeed({ base, ev: 0, nature: 'neutral' });
  const spd32 = computeSpeed({ base, ev: 32, nature: 'neutral' });
  const spd32Nat = computeSpeed({ base, ev: 32, nature: 'positive' });

  const next = () => {
    setRevealed(false);
    setIndex(nextIndex);
    setNextIndex(pickNext(nextIndex));
  };

  return (
    <Stack spacing={2}>
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
        Tap the card to reveal its Speed tiers at level 50.
      </Typography>

      <Card
        onClick={() => setRevealed((r) => !r)}
        ariaLabel={`${pokemon.name} flashcard, ${revealed ? 'showing' : 'hiding'} speed tiers`}
      >
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: { xs: 192, sm: 224 }, maxWidth: '100%' }}>
            <PokemonImage src={pokemon.sprite} name={pokemon.name} eager />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {pokemon.name}
          </Typography>
          <TypeBadges types={pokemon.types} />

          {/* The tiers are always laid out; values stay masked as ??? then spin in on reveal, so
              the card never reflows - matching the Who's Faster? reveal. */}
          <Box sx={{ mt: 1, width: '100%' }}>
            <Stack spacing={1.5} sx={{ width: '100%' }}>
              <Box
                sx={{
                  bgcolor: 'background.default',
                  color: 'text.primary',
                  borderRadius: '16px',
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
              <Box>
                <Typography
                  sx={{
                    mb: 0.5,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                  }}
                >
                  Level 50 Speed
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  <StatPill label="0 EVs" value={revealed ? <SlotNumber value={noEvs} /> : '???'} />
                  <StatPill
                    label="32 Spd"
                    value={revealed ? <SlotNumber value={spd32} /> : '???'}
                  />
                  <StatPill
                    label="32 Spd +Nat"
                    value={revealed ? <SlotNumber value={spd32Nat} /> : '???'}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Card>

      <Button onClick={next}>Next Pokemon</Button>
    </Stack>
  );
}
