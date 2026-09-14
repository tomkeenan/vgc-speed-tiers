import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getAllPokemon } from '../../lib/data';
import { speedTiers } from '../../lib/speed';
import type { Pokemon } from '../../lib/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { StatPill } from '../../components/StatPill';
import { TypeBadges } from '../../components/TypeBadges';
import { pickTwo } from '../random';

type Outcome = 'correct' | 'wrong' | 'tie';

interface Result {
  picked: Pokemon;
  outcome: Outcome;
}

const maxSpeed = (p: Pokemon) => speedTiers(p.baseStats.spe).max;

/**
 * Who's Faster? feature: pick the faster of two Pokemon by max Speed, reveal both speeds,
 * and track score plus streak. Returns the element.
 */
export function FasterGame() {
  const pool = useMemo(() => getAllPokemon(), []);
  const [pair, setPair] = useState<[Pokemon, Pokemon]>(() => pickTwo(pool));
  const [result, setResult] = useState<Result | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);

  if (pool.length < 2) {
    return (
      <Card>
        <Typography sx={{ color: 'text.secondary' }}>Need at least two Pokemon to play.</Typography>
      </Card>
    );
  }

  const [left, right] = pair;
  const leftSpeed = maxSpeed(left);
  const rightSpeed = maxSpeed(right);

  const guess = (picked: Pokemon) => {
    if (result) return;
    const other = picked === left ? right : left;
    let outcome: Outcome;
    if (maxSpeed(picked) === maxSpeed(other)) outcome = 'tie';
    else if (maxSpeed(picked) > maxSpeed(other)) outcome = 'correct';
    else outcome = 'wrong';

    setResult({ picked, outcome });
    setRounds((n) => n + 1);
    if (outcome === 'correct' || outcome === 'tie') {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  const nextRound = () => {
    setResult(null);
    setPair(pickTwo(pool));
  };

  const banner = () => {
    if (!result) return null;
    const text =
      result.outcome === 'tie'
        ? 'Tie - both share the same max Speed!'
        : result.outcome === 'correct'
          ? 'Correct!'
          : 'Not quite.';
    return (
      <Box
        sx={{
          borderRadius: '12px',
          px: 2,
          py: 1.5,
          textAlign: 'center',
          fontWeight: 600,
          color: 'common.white',
          bgcolor: result.outcome === 'wrong' ? 'text.primary' : 'success.main',
        }}
      >
        {text}
      </Box>
    );
  };

  const contender = (p: Pokemon, speed: number) => {
    const isPicked = result?.picked === p;
    const isFaster = result && speed >= (p === left ? rightSpeed : leftSpeed);
    return (
      <Card
        onClick={() => guess(p)}
        ariaLabel={`Choose ${p.name}`}
        sx={{
          flex: 1,
          ...(isPicked && { outline: '2px solid', outlineColor: 'text.primary' }),
          ...(result && isFaster && { borderColor: 'success.main' }),
        }}
      >
        <Stack alignItems="center" spacing={1} sx={{ textAlign: 'center' }}>
          <Box sx={{ width: { xs: 128, sm: 160 }, maxWidth: '100%' }}>
            <PokemonImage src={p.sprite} name={p.name} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {p.name}
          </Typography>
          <TypeBadges types={p.types} />
          {result && (
            <Box sx={{ width: '100%' }}>
              <StatPill label="Max Speed" value={speed} emphasis={isFaster ?? false} />
            </Box>
          )}
        </Stack>
      </Card>
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
        Which Pokemon has the higher max Speed?
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {contender(left, leftSpeed)}
        {contender(right, rightSpeed)}
      </Stack>

      {banner()}

      {result && <Button onClick={nextRound}>Next Matchup</Button>}
    </Stack>
  );
}
