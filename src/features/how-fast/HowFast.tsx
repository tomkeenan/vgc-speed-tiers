import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { slotSpinMs } from '../../components/SlotNumber';
import { SpeedReveal } from '../../components/SpeedReveal';
import { StreakStat } from '../../components/StreakStat';
import { TypeBadges } from '../../components/TypeBadges';
import { randomIndex } from '../random';
import { loadBestStreak, saveBestStreak } from './bestStreak';

const SETTLE_BUFFER_MS = 150;
const RESOLVE_HOLD_MS = 1800;

/**
 * How Fast? feature: shows a Pokemon's artwork and asks the player to type its exact base Speed.
 * Submitting reveals the answer and tints the card green (exact match) or red; a correct guess
 * auto-advances to the next card while a wrong one holds until Try again. Returns the element.
 */
export function HowFast() {
  const { activePokemon: pool, activeDeckId } = useDecks();
  const [index, setIndex] = useState(() => randomIndex(pool.length));
  const [nextIndex, setNextIndex] = useState(() => randomIndex(pool.length));
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => loadBestStreak(activeDeckId));

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const pickNext = (exclude: number) => {
    let n = randomIndex(pool.length);
    if (pool.length > 1) while (n === exclude) n = randomIndex(pool.length);
    return n;
  };

  const nextCard = () => {
    clearTimers();
    setRevealed(false);
    setGuess('');
    setIndex(nextIndex);
    setNextIndex(pickNext(nextIndex));
  };

  // Wrong guesses hold the streak on screen; it only zeroes when the player taps Try again.
  const tryAgain = () => {
    setStreak(0);
    nextCard();
  };

  useEffect(() => {
    clearTimers();
    setRevealed(false);
    setGuess('');
    setStreak(0);
    setBest(loadBestStreak(activeDeckId));
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

  useEffect(() => clearTimers, []);

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
  const correct = revealed && Number(guess) === base;
  const canSubmit = guess.trim() !== '';

  const submit = () => {
    if (!canSubmit || revealed) return;
    setRevealed(true);
    if (Number(guess) !== base) return; // wrong: hold the streak until Try again
    const next = streak + 1;
    setStreak(next);
    if (next > best) {
      setBest(next);
      saveBestStreak(activeDeckId, next);
    }
    // Auto-advance once the number has settled and held for a beat, matching Who's Faster?.
    const advanceAt = slotSpinMs(base) + SETTLE_BUFFER_MS + RESOLVE_HOLD_MS;
    timers.current.push(setTimeout(nextCard, advanceAt));
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={streak} label="Streak" color="primary.main" />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={best} label="Best" color="text.primary" />
        </Box>
      </Stack>

      <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
        Type this Pokemon's exact base Speed.
      </Typography>

      <Card
        state={revealed ? (correct ? 'correct' : 'wrong') : undefined}
        ariaLabel={`${pokemon.name} card`}
      >
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: { xs: 192, sm: 224 }, maxWidth: '100%' }}>
            <PokemonImage src={pokemon.sprite} name={pokemon.name} eager />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {pokemon.name}
          </Typography>
          <TypeBadges types={pokemon.types} />

          <SpeedReveal value={base} revealed={revealed} />
        </Stack>
      </Card>

      <TextField
        type="number"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !revealed) submit();
        }}
        disabled={revealed}
        placeholder="Base Speed"
        fullWidth
        inputProps={{ inputMode: 'numeric', min: 0, 'aria-label': 'Your base Speed guess' }}
      />

      {!revealed && (
        <Button onClick={submit} disabled={!canSubmit}>
          Submit
        </Button>
      )}
      {revealed && !correct && <Button onClick={tryAgain}>Try again</Button>}
    </Stack>
  );
}
