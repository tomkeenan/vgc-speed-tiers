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
import { TypeBadges } from '../../components/TypeBadges';
import { pickTwo } from '../random';

type Phase = 'idle' | 'revealClicked' | 'revealBoth' | 'resolved';
type Outcome = 'correct' | 'wrong' | 'tie';

const REVEAL_DELAY_MS = 600;
const SETTLE_BUFFER_MS = 150; // ensure the verdict lands firmly after the reel stops
const RESOLVE_HOLD_MS = 1800; // how long the verdict shows before auto-advancing

const speedOf = (p: Pokemon) => p.baseStats.spe;

/**
 * Who's Faster? feature: pick the faster of two Pokemon by base Speed, reveal the picked speed
 * then the other, tint the card green/red, and auto-advance on a correct guess.
 * Returns the element.
 */
export function FasterGame() {
  const { activePokemon: pool, activeDeckId } = useDecks();
  const [pair, setPair] = useState<[Pokemon, Pokemon] | null>(() =>
    pool.length >= 2 ? pickTwo(pool) : null,
  );
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<Pokemon | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);

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
    setPair(pool.length >= 2 ? pickTwo(pool) : null);
  };

  // Start a fresh matchup whenever the active deck changes.
  useEffect(() => {
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeckId]);

  // Clear any pending timers on unmount.
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
    setRounds((n) => n + 1);
    if (result === 'wrong') {
      setStreak(0);
    } else {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    }

    // The second value reveals after REVEAL_DELAY_MS, then spins; the verdict lands once it settles.
    const resolveAt = REVEAL_DELAY_MS + slotSpinMs(speedOf(other)) + SETTLE_BUFFER_MS;
    timers.current.push(setTimeout(() => setPhase('revealBoth'), REVEAL_DELAY_MS));
    timers.current.push(setTimeout(() => setPhase('resolved'), resolveAt));
    if (result !== 'wrong') {
      timers.current.push(setTimeout(startRound, resolveAt + RESOLVE_HOLD_MS));
    }
  };

  const contender = (p: Pokemon) => {
    const isPicked = picked === p;
    const bothShown = phase === 'revealBoth' || phase === 'resolved';
    const showSpeed = isPicked ? phase !== 'idle' : bothShown;
    // Hold the verdict border until the second reel has finished spinning.
    const state =
      isPicked && outcome && phase === 'resolved'
        ? outcome === 'wrong'
          ? 'wrong'
          : 'correct'
        : undefined;
    return (
      <Card onClick={() => guess(p)} ariaLabel={`Choose ${p.name}`} state={state} sx={{ flex: 1 }}>
        <Stack alignItems="center" spacing={1} sx={{ textAlign: 'center' }}>
          <Box sx={{ width: { xs: 128, sm: 160 }, maxWidth: '100%' }}>
            <PokemonImage src={p.sprite} name={p.name} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {p.name}
          </Typography>
          <TypeBadges types={p.types} />
          {/* Both pills show immediately; the value stays masked as ??? then spins in on reveal. */}
          <Box sx={{ width: '100%' }}>
            <StatPill
              label="Base Speed"
              value={showSpeed ? <SlotNumber value={speedOf(p)} /> : '???'}
            />
          </Box>
        </Stack>
      </Card>
    );
  };

  const banner = () => {
    if (outcome !== 'wrong' || phase !== 'resolved') return null;
    return (
      <Box
        sx={{
          borderRadius: '12px',
          px: 2,
          py: 1.5,
          textAlign: 'center',
          fontWeight: 600,
          color: 'common.white',
          bgcolor: 'primary.main',
        }}
      >
        Not quite.
      </Box>
    );
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
          Score: {score}/{rounds}
        </Typography>
        <Typography sx={{ color: 'primary.main', fontWeight: 600 }}>Streak: {streak}</Typography>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        Which Pokemon has the higher base Speed?
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {contender(left)}
        {contender(right)}
      </Stack>

      {banner()}

      {outcome === 'wrong' && phase === 'resolved' && (
        <Button onClick={startRound}>Try again</Button>
      )}
    </Stack>
  );
}
