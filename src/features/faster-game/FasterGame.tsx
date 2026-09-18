import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import { ALL_DECK_ID } from '../../decks/store';
import { useAuth } from '../../auth/AuthContext';
import { RankedIntroCard } from '../../ranked/RankedIntroCard';
import { RankedPanel } from '../../ranked/RankedPanel';
import { submitScore, type MyStanding } from '../../ranked/api';
import { useGuessTimer } from '../../ranked/useGuessTimer';
import { fasterBoard } from '../../../worker/boards';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { NatureBadge } from '../../components/NatureBadge';
import { PokemonImage } from '../../components/PokemonImage';
import { SlotNumber, slotSpinMs } from '../../components/SlotNumber';
import { StatPill } from '../../components/StatPill';
import { StreakStat } from '../../components/StreakStat';
import { TypeBadges } from '../../components/TypeBadges';
import { displayName, getAllPokemon } from '../../lib/data';
import { pickPairWithin, type PairConstraints } from '../random';
import { loadBestStreak, saveBestStreak } from './bestStreak';
import { buildContenders, sameSpecies, speedOf, type Contender } from './contenders';
import { loadMode, saveMode, streakSlot, type GameMode } from './mode';
import { ModeToggles } from './ModeToggles';

type Phase = 'idle' | 'revealClicked' | 'revealBoth' | 'resolved';
type Outcome = 'correct' | 'wrong' | 'tie';

const REVEAL_DELAY_MS = 600;
const SETTLE_BUFFER_MS = 150;
const RESOLVE_HOLD_MS = 1800;
const CLOSE_SPEED = 10;
// A Pokemon already shown this streak is this many times as likely to be drawn as an unseen one,
// so recent faces recur less without ever being fully banned (which would exhaust hard mode's pool).
const REPEAT_PENALTY = 0.12;

/**
 * Who's Faster? feature: pick the faster of two contenders by Speed, reveal the picked speed
 * then the other, tint the card green/red, and auto-advance on a correct guess. Hard mode draws
 * only close, non-tied pairs; allowing natures compares level-50 max Speed across nature variants.
 * Returns the element.
 */
export function FasterGame() {
  const { t, i18n } = useTranslation();
  const { activePokemon: deckPool, activeDeckId: deckId } = useDecks();
  const { configured, user } = useAuth();
  const [mode, setMode] = useState<GameMode>(loadMode);
  const [ranked, setRanked] = useState(false);
  const [standing, setStanding] = useState<MyStanding | null>(null);
  // Ranked opens on a single centered intro card (not the two contenders) that explains the mode
  // and holds a Start button; play begins only once the player starts it.
  const [rankedStarted, setRankedStarted] = useState(false);

  // Ranked always plays the canonical roster (all Pokemon) so every score is comparable; custom
  // decks stay casual and local-only. The board is derived from the mode toggles.
  const allPokemon = useMemo(() => getAllPokemon(), []);
  const pool = ranked ? allPokemon : deckPool;
  const activeDeckId = ranked ? ALL_DECK_ID : deckId;
  const board = fasterBoard(mode.hardMode, mode.allowNatures);

  const contenders = useMemo(
    () => buildContenders(pool, mode.allowNatures),
    [pool, mode.allowNatures],
  );
  // Pokemon shown so far in the current streak; drawing weights against them, then it clears on reset.
  const seenThisStreak = useRef(new Set<string>());
  const wasSeenThisStreak = (c: Contender) => seenThisStreak.current.has(c.pokemon.id);

  const constraints = useMemo<PairConstraints<Contender>>(
    () => ({
      valueOf: speedOf,
      maxDiff: mode.hardMode ? CLOSE_SPEED : undefined,
      allowEqual: !mode.hardMode,
      canPair: mode.allowNatures ? (a, b) => !sameSpecies(a, b) : undefined,
      weightOf: (c) => (wasSeenThisStreak(c) ? REPEAT_PENALTY : 1),
    }),
    // wasSeenThisStreak reads a ref, so it stays current without being a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode.hardMode, mode.allowNatures],
  );
  const drawPair = (): [Contender, Contender] | null =>
    contenders.length >= 2 ? pickPairWithin(contenders, constraints) : null;

  const slot = streakSlot(activeDeckId, mode);
  const [pair, setPair] = useState<[Contender, Contender] | null>(drawPair);
  const [nextPair, setNextPair] = useState<[Contender, Contender] | null>(drawPair);
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<Contender | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // Ranked only: the round's clock ran out before the player answered. Freezes play like a wrong
  // guess (reveal both, hold the streak) until Try again, but with no picked card to tint.
  const [timedOut, setTimedOut] = useState(false);
  // Bumps once per round so the ranked countdown restarts from full each time.
  const [roundId, setRoundId] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => loadBestStreak(slot));

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const rememberSeen = (p: [Contender, Contender] | null) =>
    p?.forEach((c) => seenThisStreak.current.add(c.pokemon.id));
  const forgetSeen = () => {
    seenThisStreak.current = new Set();
  };

  // Show `shown`, then prefetch the next pair, recording both so the streak's weighting avoids them.
  const showAndPrefetch = (shown: [Contender, Contender] | null) => {
    rememberSeen(shown);
    setPair(shown);
    const next = drawPair();
    rememberSeen(next);
    setNextPair(next);
  };

  const startRound = () => {
    clearTimers();
    setPhase('idle');
    setPicked(null);
    setOutcome(null);
    setTimedOut(false);
    setRoundId((n) => n + 1);
    showAndPrefetch(nextPair ?? drawPair());
  };

  // Wrong guesses hold the streak on screen; it only zeroes when the player taps Try again.
  const tryAgain = () => {
    forgetSeen();
    setStreak(0);
    startRound();
  };

  const changeMode = (next: GameMode) => {
    saveMode(next);
    setMode(next);
    // In ranked, Hard and Natures pick which leaderboard board you play, and a streak can't carry
    // across boards. Changing one mid-run therefore drops back to the intro card to Start fresh on
    // the newly selected board (the mode-change reset effect below clears the streak and round).
    if (ranked) setRankedStarted(false);
  };

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
    forgetSeen();
    setStreak(0);
    setRankedStarted(true);
    startRound();
  };

  // While ranked is on but not yet started, the game shows its single intro card in place of play.
  const showRankedIntro = ranked && !rankedStarted;

  // A new deck or mode resets the round, the streak, and the best from that mode's own slot.
  useEffect(() => {
    clearTimers();
    setPhase('idle');
    setPicked(null);
    setOutcome(null);
    setTimedOut(false);
    setStreak(0);
    setBest(loadBestStreak(slot));
    forgetSeen();
    showAndPrefetch(drawPair());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId, mode.hardMode, mode.allowNatures, ranked]);

  useEffect(() => {
    if (typeof Image === 'undefined' || !nextPair) return;
    for (const c of nextPair) {
      const img = new Image();
      img.src = c.pokemon.sprite;
    }
  }, [nextPair]);

  useEffect(() => clearTimers, []);

  // A ranked run ends on a wrong guess or a timeout; submit the streak it reached (the server keeps
  // only the best). Reads the streak captured when the round ended, so it stays correct if called
  // from a delayed timer.
  const submitRankedRun = () => {
    if (ranked && streak >= 1) {
      void submitScore(board, streak)
        .then(setStanding)
        .catch(() => {});
    }
  };

  // Ranked only: the clock ran out before the player answered. Freeze the round like a loss - reveal
  // both speeds (no card is tinted, since nothing was picked) and hold the streak until Try again.
  const handleTimeout = () => {
    if (phase !== 'idle' || !pair) return;
    clearTimers();
    setTimedOut(true);
    setPhase('resolved');
    submitRankedRun();
  };

  // The per-round countdown runs only while a ranked round is actually awaiting an answer.
  const secondsLeft = useGuessTimer({
    running: ranked && rankedStarted && phase === 'idle' && Boolean(pair),
    roundKey: roundId,
    onExpire: handleTimeout,
  });
  // The clock counts down while the round is live, then holds where it stopped once answered (a
  // timeout holds at 0); it resets to full only when the next round begins.
  const guessFailed = timedOut || outcome === 'wrong';
  const showTryAgain = guessFailed && phase === 'resolved';

  const guess = (choice: Contender) => {
    if (phase !== 'idle' || !pair) return;
    const [left, right] = pair;
    const other = choice === left ? right : left;
    const diff = speedOf(choice) - speedOf(other);
    const result: Outcome = diff === 0 ? 'tie' : diff > 0 ? 'correct' : 'wrong';

    setPicked(choice);
    setOutcome(result);
    setPhase('revealClicked');

    const resolveAt = REVEAL_DELAY_MS + slotSpinMs(speedOf(other)) + SETTLE_BUFFER_MS;
    timers.current.push(setTimeout(() => setPhase('revealBoth'), REVEAL_DELAY_MS));
    // Advance the streak in step with the green/red highlight, which appears on 'resolved'.
    // A wrong guess holds the streak on screen until Try again; only correct/tie updates it.
    timers.current.push(
      setTimeout(() => {
        setPhase('resolved');
        if (result !== 'wrong') {
          const next = streak + 1;
          setStreak(next);
          if (next > best) {
            setBest(next);
            saveBestStreak(slot, next);
          }
        } else {
          // The run just ended on a wrong guess: submit the streak it reached.
          submitRankedRun();
        }
      }, resolveAt),
    );
    if (result !== 'wrong') {
      timers.current.push(setTimeout(startRound, resolveAt + RESOLVE_HOLD_MS));
    }
  };

  const speedLabel = mode.allowNatures ? t('common.maxSpeed') : t('common.baseSpeed');

  const contender = (c: Contender) => {
    const name = displayName(c.pokemon, i18n.language);
    const isPicked = picked === c;
    const bothShown = phase === 'revealBoth' || phase === 'resolved';
    const showSpeed = isPicked ? phase !== 'idle' : bothShown;
    const state =
      isPicked && outcome && phase === 'resolved'
        ? outcome === 'wrong'
          ? 'wrong'
          : 'correct'
        : undefined;
    return (
      <Card
        onClick={() => guess(c)}
        ariaLabel={t('faster.chooseAria', { name })}
        state={state}
        stretch
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Stack
          alignItems="center"
          spacing={{ xs: 0.75, sm: 1 }}
          useFlexGap
          sx={{ textAlign: 'center', flex: 1 }}
        >
          <Box sx={{ width: { xs: 112, sm: 160 }, maxWidth: '100%' }}>
            <PokemonImage src={c.pokemon.sprite} name={name} eager />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {name}
          </Typography>
          {/* Always reserve the nature-badge row (an invisible placeholder when there's no nature)
              so toggling Natures on or off never changes the card's height. */}
          {c.nature !== 'base' ? (
            <NatureBadge nature={c.nature} />
          ) : (
            <Box aria-hidden sx={{ visibility: 'hidden' }}>
              <NatureBadge nature="neutral" />
            </Box>
          )}
          <TypeBadges types={c.pokemon.types} />
          {/* Pinned to the bottom so the two cards' speeds line up whatever the type count. */}
          <Box sx={{ width: '100%', mt: 'auto', pt: 2 }}>
            <StatPill
              label={speedLabel}
              value={showSpeed ? <SlotNumber value={speedOf(c)} /> : '???'}
            />
          </Box>
        </Stack>
      </Card>
    );
  };

  // Ranked opens on a single centered intro card, the width of one contender and sitting where the
  // pair would, that holds the Start button. It reserves the pair's footprint (via RankedIntroCard)
  // so toggling ranked on never shrinks the surface.
  const rankedIntroCard = (shownPair: [Contender, Contender]) => (
    <RankedIntroCard
      onStart={startRanked}
      cardSx={{ width: { xs: 'calc(50% - 4px)', sm: 'calc(50% - 6px)' } }}
      footprint={
        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
          {contender(shownPair[0])}
          {contender(shownPair[1])}
        </Stack>
      }
    />
  );

  const body = () => {
    if (showRankedIntro && pair) {
      return rankedIntroCard(pair);
    }
    if (pool.length < 2) {
      return (
        <Card>
          <Typography sx={{ color: 'text.secondary' }}>{t('faster.needTwo')}</Typography>
        </Card>
      );
    }
    if (!pair) {
      return (
        <Card>
          <Typography sx={{ color: 'text.secondary' }}>
            {t('faster.noneClose', { max: CLOSE_SPEED })}
          </Typography>
        </Card>
      );
    }
    const [left, right] = pair;
    return (
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        {contender(left)}
        {contender(right)}
      </Stack>
    );
  };

  return (
    <Stack spacing={{ xs: 1.5, sm: 2 }}>
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={streak} label={t('common.streak')} color="primary.main" />
        </Box>
        {/* Ranked adds a per-round countdown between the counters; the last second flashes red. */}
        {ranked && (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <StreakStat
              value={secondsLeft}
              label={t('common.time')}
              color={secondsLeft <= 1 ? 'error.main' : 'text.primary'}
            />
          </Box>
        )}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={best} label={t('common.best')} color="text.primary" />
        </Box>
      </Stack>

      {pair && (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {mode.allowNatures ? t('faster.prompt') : t('faster.promptBase')}
        </Typography>
      )}

      {body()}

      {/* Always reserve the Try again row so the surface below never jumps when a round ends. The
          column flex stretches the button to full width just as it would as a direct Stack child. */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          visibility: showTryAgain ? 'visible' : 'hidden',
        }}
        aria-hidden={!showTryAgain}
      >
        <Button onClick={tryAgain} tabIndex={showTryAgain ? undefined : -1}>
          {t('common.tryAgain')}
        </Button>
      </Box>

      <RankedPanel
        configured={configured}
        signedIn={Boolean(user)}
        ranked={ranked}
        onRankedChange={changeRanked}
        standing={standing}
      />

      <ModeToggles mode={mode} onChange={changeMode} />
    </Stack>
  );
}
