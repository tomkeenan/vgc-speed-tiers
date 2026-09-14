import { useMemo, useState } from 'react';
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
        <p className="text-ink-muted">Need at least two Pokemon to play.</p>
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
    const tone = result.outcome === 'wrong' ? 'bg-ink text-white' : 'bg-correct text-white';
    return <div className={`rounded-xl px-4 py-3 text-center font-semibold ${tone}`}>{text}</div>;
  };

  const contender = (p: Pokemon, speed: number) => {
    const isPicked = result?.picked === p;
    const isFaster = result && speed >= (p === left ? rightSpeed : leftSpeed);
    return (
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Choose ${p.name}`}
        onClick={() => guess(p)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            guess(p);
          }
        }}
        className={`flex flex-1 cursor-pointer flex-col items-center gap-2 text-center select-none ${
          result ? 'cursor-default' : 'hover:border-ink/40'
        } ${isPicked ? 'ring-ink ring-2' : ''} ${result && isFaster ? 'border-correct' : ''}`}
      >
        <div className="w-32 max-w-full sm:w-40">
          <PokemonImage src={p.sprite} name={p.name} />
        </div>
        <h3 className="text-ink text-lg font-bold">{p.name}</h3>
        <TypeBadges types={p.types} />
        {result && (
          <div className="mt-1 w-full">
            <StatPill label="Max Speed" value={speed} emphasis={isFaster ?? false} />
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-ink flex items-center justify-between gap-2 text-sm font-semibold">
        <span>
          Score: {score}/{rounds}
        </span>
        <span className="text-brand">Streak: {streak}</span>
      </div>

      <p className="text-ink-muted text-center text-sm">Which Pokemon has the higher max Speed?</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        {contender(left, leftSpeed)}
        {contender(right, rightSpeed)}
      </div>

      {banner()}

      {result && <Button onClick={nextRound}>Next Matchup</Button>}
    </div>
  );
}
