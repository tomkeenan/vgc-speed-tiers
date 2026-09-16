import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { SpeedReveal } from '../../components/SpeedReveal';
import { TypeBadges } from '../../components/TypeBadges';
import { displayName } from '../../lib/data';
import { randomIndex } from '../random';

/**
 * Flashcards feature: shows a Pokemon's artwork, flips to reveal its base Speed,
 * and shuffles to the next card. Returns the element.
 */
export function Flashcards() {
  const { t, i18n } = useTranslation();
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
          <Typography sx={{ color: 'text.secondary' }}>{t('common.noPokemon')}</Typography>
        </Card>
      </Stack>
    );
  }

  const pokemon = pool[Math.min(index, pool.length - 1)];
  const name = displayName(pokemon, i18n.language);
  const base = pokemon.baseStats.spe;

  const next = () => {
    setRevealed(false);
    setIndex(nextIndex);
    setNextIndex(pickNext(nextIndex));
  };

  return (
    <Stack spacing={2}>
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
        {t('flashcards.prompt')}
      </Typography>

      <Card
        onClick={() => setRevealed((r) => !r)}
        ariaLabel={t('flashcards.cardAria', {
          name,
          state: revealed ? t('flashcards.showing') : t('flashcards.hiding'),
        })}
      >
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: { xs: 192, sm: 224 }, maxWidth: '100%' }}>
            <PokemonImage src={pokemon.sprite} name={name} eager />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {name}
          </Typography>
          <TypeBadges types={pokemon.types} />

          <SpeedReveal value={base} revealed={revealed} />
        </Stack>
      </Card>

      <Button onClick={next}>{t('flashcards.next')}</Button>
    </Stack>
  );
}
