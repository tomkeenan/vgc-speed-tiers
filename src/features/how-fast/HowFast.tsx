import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import { ALL_DECK_ID } from '../../decks/store';
import { submitScore } from '../../ranked/api';
import { CelebrationDialog } from '../../ranked/CelebrationDialog';
import { practiceCelebration, rankedCelebration, type Celebration } from '../../ranked/celebration';
import { HOW_FAST_GUESS_LIMIT_MS, useGuessTimer } from '../../ranked/useGuessTimer';
import { HOWFAST_BOARD, type BoardKey } from '../../../worker/boards';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { MysteryArt } from '../../components/MysteryArt';
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
const AUTOSUBMIT_DELAY_MS = 700;

/**
 * How Fast? feature: shows a Pokemon's artwork and asks the player to type its exact base Speed.
 * Submitting reveals the answer and tints the card green (exact match) or red; a correct guess
 * auto-advances to the next card while a wrong one holds until Try again. Returns the element.
 */
interface HowFastProps {
  /** Whether the app is in ranked mode; ranked plays the full roster against a timed clock. */
  ranked?: boolean;
  /** Opens the leaderboard on the given board, offered after a leaderboard personal best. */
  onViewLeaderboard?: (board: BoardKey) => void;
}

export function HowFast({ ranked = false, onViewLeaderboard }: HowFastProps) {
  const { t, i18n } = useTranslation();
  const { activePokemon: deckPool, activeDeckId: deckId } = useDecks();
  // Ranked opens on the card masked as a mystery, with a Play button in place of Submit; play begins
  // only once the player starts it, which reveals the real card. Mirrors Who's Faster?.
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
  // Ranked only: the round's clock ran out before the player submitted. Forces a failure even if the
  // typed value happened to be right, and holds the streak until Try again.
  const [timedOut, setTimedOut] = useState(false);
  // Bumps once per card so the ranked countdown restarts from full each time.
  const [roundId, setRoundId] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => loadBestStreak(activeDeckId));
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const bestBeforeRun = useRef(best);

  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoSubmitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const submitRef = useRef<() => void>(() => {});
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (autoSubmitTimer.current) clearTimeout(autoSubmitTimer.current);
    autoSubmitTimer.current = undefined;
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
    setTimedOut(false);
    setRoundId((n) => n + 1);
    setIndex(nextIndex);
    setNextIndex(pickNext(nextIndex));
  };

  // Wrong guesses hold the streak on screen; it only zeroes when the player taps Try again.
  const tryAgain = () => {
    setStreak(0);
    bestBeforeRun.current = best;
    nextCard();
  };

  useEffect(() => {
    clearTimers();
    setRevealed(false);
    setGuess('');
    setTimedOut(false);
    setStreak(0);
    const loadedBest = loadBestStreak(activeDeckId);
    setBest(loadedBest);
    bestBeforeRun.current = loadedBest;
    const first = randomIndex(pool.length || 1);
    setIndex(first);
    setNextIndex(pickNext(first));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId, ranked]);

  // Ranked always opens on the mystery card; leaving ranked drops straight back to casual play.
  useEffect(() => {
    setRankedStarted(false);
  }, [ranked]);

  // Play reveals the real card and begins a fresh ranked run.
  const startRanked = () => {
    setStreak(0);
    bestBeforeRun.current = best;
    setRankedStarted(true);
    nextCard();
  };

  // While ranked is on but not yet started, the game shows the masked mystery card in place of play.
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

  useEffect(() => {
    if (roundId > 0 && !revealed && !showRankedIntro) inputRef.current?.focus();
  }, [roundId, revealed, showRankedIntro]);

  // A ranked run ends on a wrong guess or a timeout; submit the streak it reached (the server keeps
  // only the best).
  const submitRankedRun = () => {
    if (ranked && streak >= 1) {
      submitScore(HOWFAST_BOARD, streak)
        .then((result) => setCelebration(rankedCelebration(result, HOWFAST_BOARD)))
        .catch(() => {});
    }
  };

  const celebratePracticeBest = () => {
    if (!ranked && streak > bestBeforeRun.current) setCelebration(practiceCelebration(streak));
  };

  // Ranked only: the clock ran out before the player submitted. Reveal the answer as a failure (the
  // typed value no longer counts) and hold the streak until Try again.
  const handleTimeout = () => {
    if (revealed || showRankedIntro) return;
    clearTimers();
    setTimedOut(true);
    setRevealed(true);
    submitRankedRun();
  };

  // The per-round countdown runs only while a ranked card is actually awaiting an answer.
  const secondsLeft = useGuessTimer({
    running: ranked && rankedStarted && !revealed && pool.length > 0,
    roundKey: roundId,
    onExpire: handleTimeout,
    durationMs: HOW_FAST_GUESS_LIMIT_MS,
  });

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
  // A timed-out round is always a loss, even if the value in the box happened to be right.
  const correct = revealed && !timedOut && Number(guess) === base;
  const canSubmit = guess.trim() !== '';

  const submit = () => {
    if (!canSubmit || revealed) return;
    setRevealed(true);
    if (Number(guess) !== base) {
      submitRankedRun();
      celebratePracticeBest();
      return;
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
  submitRef.current = submit;

  const scheduleAutoSubmit = (value: string) => {
    if (autoSubmitTimer.current) clearTimeout(autoSubmitTimer.current);
    autoSubmitTimer.current = undefined;
    if (value.trim() === '') return;
    autoSubmitTimer.current = setTimeout(() => submitRef.current(), AUTOSUBMIT_DELAY_MS);
  };

  // Renders the play card. When masked, it shows the mystery placeholder (question-mark art, name,
  // types and speed) that ranked opens on; its footprint matches the played card exactly, so
  // revealing the real card on Play never shifts the surface.
  const playCard = (masked = false) => (
    <Card
      state={masked ? undefined : revealed ? (correct ? 'correct' : 'wrong') : undefined}
      ariaLabel={masked ? undefined : t('howFast.cardAria', { name })}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box sx={{ width: { xs: 192, sm: 224 }, maxWidth: '100%' }}>
          {masked ? <MysteryArt /> : <PokemonImage src={pokemon.sprite} name={name} eager />}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {masked ? t('common.unown') : name}
        </Typography>
        {masked ? (
          <Box aria-hidden sx={{ visibility: 'hidden' }}>
            <TypeBadges types={pokemon.types} />
          </Box>
        ) : (
          <TypeBadges types={pokemon.types} />
        )}

        <SpeedReveal value={base} revealed={masked ? false : revealed} />
      </Stack>
    </Card>
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={streak} label={t('common.streak')} color="text.primary" />
        </Box>
        {/* Ranked adds a per-round countdown between the counters; it darkens on the last second. */}
        {ranked && (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <StreakStat
              value={secondsLeft}
              label={t('common.time')}
              color={secondsLeft <= 1 ? 'primary.dark' : 'primary.main'}
            />
          </Box>
        )}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={best} label={t('common.best')} color="gold.main" />
        </Box>
      </Stack>

      <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
        {t('howFast.prompt')}
      </Typography>

      {showRankedIntro ? playCard(true) : playCard()}

      {!showRankedIntro && (
        <TextField
          type="number"
          inputRef={inputRef}
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            if (!revealed) scheduleAutoSubmit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !revealed) submit();
          }}
          disabled={revealed}
          placeholder={t('howFast.placeholder')}
          fullWidth
          inputProps={{
            inputMode: 'numeric',
            enterKeyHint: 'done',
            min: 0,
            'aria-label': t('howFast.inputAria'),
          }}
        />
      )}

      {/* Before a ranked run starts this row holds Play; during play it holds Submit; once a card is
          revealed it holds Try again (hidden but space-reserved on a correct answer so the surface
          never jumps while the card auto-advances). Submit is desktop-only: on mobile the input is
          the last element so the on-screen keyboard sits directly under it, and Enter/auto-submit
          stand in for the button. */}
      {showRankedIntro ? (
        <Button onClick={startRanked}>{t('common.play')}</Button>
      ) : !revealed ? (
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column' }}>
          <Button onClick={submit} disabled={!canSubmit}>
            {t('howFast.submit')}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            visibility: correct ? 'hidden' : 'visible',
          }}
          aria-hidden={correct}
        >
          <Button onClick={tryAgain} tabIndex={correct ? -1 : undefined}>
            {t('common.tryAgain')}
          </Button>
        </Box>
      )}

      <CelebrationDialog
        celebration={celebration}
        onClose={() => setCelebration(null)}
        onViewLeaderboard={onViewLeaderboard}
      />
    </Stack>
  );
}
