import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDecks } from '../../decks/DecksContext';
import type { Pokemon } from '../../lib/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { SlotNumber, slotSpinMs } from '../../components/SlotNumber';
import { StatPill } from '../../components/StatPill';
import { StreakStat } from '../../components/StreakStat';
import { TypeBadges } from '../../components/TypeBadges';
import { pickTwo } from '../random';
import { loadBestStreak, saveBestStreak } from './bestStreak';

type Phase = 'idle' | 'revealClicked' | 'revealBoth' | 'resolved';
type Outcome = 'correct' | 'wrong' | 'tie';

const REVEAL_DELAY_MS = 600;
const SETTLE_BUFFER_MS = 150;
const RESOLVE_HOLD_MS = 1800;

const speedOf = (p: Pokemon) => p.baseStats.spe;

/**
 * Who's Faster? feature: pick the faster of two Pokemon by base Speed, reveal the picked speed
 * then the other, tint the card green/red, and auto-advance on a correct guess.
 * Returns the element.
 */
export function FasterGame() {
  const { activePokemon: pool, activeDeckId } = useDecks();
  const drawPair = (): [Pokemon, Pokemon] | null => (pool.length >= 2 ? pickTwo(pool) : null);
  const [pair, setPair] = useState<[Pokemon, Pokemon] | null>(drawPair);
  const [nextPair, setNextPair] = useState<[Pokemon, Pokemon] | null>(drawPair);
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<Pokemon | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(loadBestStreak);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const startRound = () => {
    clearTimers();
    setPhase('idle');
    setPicked(null);
    setOutcome(null);
    setPair(nextPair ?? drawPair());
    setNextPair(drawPair());
  };

  // Wrong guesses hold the streak on screen; it only zeroes when the player taps Try again.
  const tryAgain = () => {
    setStreak(0);
    startRound();
  };

  useEffect(() => {
    clearTimers();
    setPhase('idle');
    setPicked(null);
    setOutcome(null);
    setPair(drawPair());
    setNextPair(drawPair());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId]);

  useEffect(() => {
    if (typeof Image === 'undefined' || !nextPair) return;
    for (const p of nextPair) {
      const img = new Image();
      img.src = p.sprite;
    }
  }, [nextPair]);

  useEffect(() => clearTimers, []);

  if (pool.length < 2 || !pair) {
    return (
      <Stack spacing={2}>
        <Card>
          <Typography sx={{ color: 'text.secondary' }}>
            This deck needs at least two Pokemon to play. Add more in Settings.
          </Typography>
        </Card>
      </Stack>
    );
  }

  const [left, right] = pair;

  const guess = (choice: Pokemon) => {
    if (phase !== 'idle') return;
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
            saveBestStreak(next);
          }
        }
      }, resolveAt),
    );
    if (result !== 'wrong') {
      timers.current.push(setTimeout(startRound, resolveAt + RESOLVE_HOLD_MS));
    }
  };

  const contender = (p: Pokemon) => {
    const isPicked = picked === p;
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
        onClick={() => guess(p)}
        ariaLabel={`Choose ${p.name}`}
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
            <PokemonImage src={p.sprite} name={p.name} eager />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {p.name}
          </Typography>
          <TypeBadges types={p.types} />
          {/* Pinned to the bottom so the two cards' speeds line up whatever the type count. */}
          <Box sx={{ width: '100%', mt: 'auto', pt: 2 }}>
            <StatPill
              label="Base Speed"
              value={showSpeed ? <SlotNumber value={speedOf(p)} /> : '???'}
            />
          </Box>
        </Stack>
      </Card>
    );
  };

  return (
    <Stack spacing={{ xs: 1.5, sm: 2 }}>
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={streak} label="Streak" color="primary.main" />
        </Box>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <StreakStat value={best} label="Best" color="text.primary" />
        </Box>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        Which Pokemon has the higher base Speed?
      </Typography>

      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }}>
        {contender(left)}
        {contender(right)}
      </Stack>

      {outcome === 'wrong' && phase === 'resolved' && <Button onClick={tryAgain}>Try again</Button>}
    </Stack>
  );
}
