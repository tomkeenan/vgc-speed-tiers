import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import { ALL_DECK_ID } from '../../decks/store';
import { useAuth } from '../../auth/AuthContext';
import { RankedIntroCard } from '../../ranked/RankedIntroCard';
import { RankedPanel } from '../../ranked/RankedPanel';
import { submitScore, type MyStanding } from '../../ranked/api';
import { HOWFAST_BOARD } from '../../../worker/boards';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { slotSpinMs } from '../../components/SlotNumber';
import { SpeedReveal } from '../../components/SpeedReveal';
import { StreakStat } from '../../components/StreakStat';
import { TypeBadges } from '../../components/TypeBadges';
import { displayName, getAllPokemon } from '../../lib/data';
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
  const { t, i18n } = useTranslation();
  const { activePokemon: deckPool, activeDeckId: deckId } = useDecks();
  const { configured, user } = useAuth();
  const [ranked, setRanked] = useState(false);
  const [standing, setStanding] = useState<MyStanding | null>(null);
  // Ranked opens on a single centered intro card (not a play card) that explains the mode and holds
  // a Start button; play begins only once the player starts it. Mirrors Who's Faster?.
  const [rankedStarted, setRankedStarted] = useState(false);

  // Ranked always plays the canonical roster (all Pokemon) so every score is comparable; custom
  // decks stay casual and local-only.
  const allPokemon = useMemo(() => getAllPokemon(), []);
  const pool = ranked ? allPokemon : deckPool;
  const activeDeckId = ranked ? ALL_DECK_ID : deckId;

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
  }, [activeDeckId, ranked]);

  // Ranked play needs a signed-in player; a sign-out mid-session drops back to casual.
  useEffect(() => {
    if (ranked && !user) setRanked(false);
  }, [ranked, user]);

  // A fresh ranked standing only applies to the run that produced it; clear it when ranked toggles.
  useEffect(() => {
    setStanding(null);
  }, [ranked]);

  const changeRanked = (next: boolean) => setRanked(next);

  // Ranked always opens on the intro card; toggling it off drops straight back to casual play.
  useEffect(() => {
    setRankedStarted(false);
  }, [ranked]);

  // Start leaves the intro card for a fresh ranked run.
  const startRanked = () => {
    setStreak(0);
    setRankedStarted(true);
    nextCard();
  };

  // While ranked is on but not yet started, the game shows its single intro card in place of play.
  const showRankedIntro = ranked && !rankedStarted;

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
          <Typography sx={{ color: 'text.secondary' }}>{t('common.noPokemon')}</Typography>
        </Card>
      </Stack>
    );
  }

  const pokemon = pool[Math.min(index, pool.length - 1)];
  const name = displayName(pokemon, i18n.language);
  const base = pokemon.baseStats.spe;
  const correct = revealed && Number(guess) === base;
  const canSubmit = guess.trim() !== '';

  const submit = () => {
    if (!canSubmit || revealed) return;
    setRevealed(true);
    if (Number(guess) !== base) {
      // The run just ended: submit the streak it reached. The server keeps only the best.
      if (ranked && streak >= 1) {
        void submitScore(HOWFAST_BOARD, streak)
          .then(setStanding)
          .catch(() => {});
      }
      return; // wrong: hold the streak until Try again
    }
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

  const playCard = () => (
    <Card
      state={revealed ? (correct ? 'correct' : 'wrong') : undefined}
      ariaLabel={t('howFast.cardAria', { name })}
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
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={streak} label={t('common.streak')} color="primary.main" />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={best} label={t('common.best')} color="text.primary" />
        </Box>
      </Stack>

      <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
        {t('howFast.prompt')}
      </Typography>

      {showRankedIntro ? (
        <RankedIntroCard onStart={startRanked} cardSx={{ width: '100%' }} footprint={playCard()} />
      ) : (
        playCard()
      )}

      {/* The input and submit stay in place through the intro (inert until Start) so the surface
          keeps the same shape whether ranked is starting or being played. */}
      <TextField
        type="number"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !revealed && !showRankedIntro) submit();
        }}
        disabled={revealed || showRankedIntro}
        placeholder={t('howFast.placeholder')}
        fullWidth
        inputProps={{ inputMode: 'numeric', min: 0, 'aria-label': t('howFast.inputAria') }}
      />

      {!revealed && (
        <Button onClick={submit} disabled={!canSubmit || showRankedIntro}>
          {t('howFast.submit')}
        </Button>
      )}
      {revealed && !correct && <Button onClick={tryAgain}>{t('common.tryAgain')}</Button>}

      <RankedPanel
        configured={configured}
        signedIn={Boolean(user)}
        ranked={ranked}
        onRankedChange={changeRanked}
        standing={standing}
      />
    </Stack>
  );
}
