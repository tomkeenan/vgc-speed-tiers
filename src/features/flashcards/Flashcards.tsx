import { useMemo, useState } from 'react';
import { getAllPokemon } from '../../lib/data';
import { speedTiers } from '../../lib/speed';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { StatPill } from '../../components/StatPill';
import { TypeBadges } from '../../components/TypeBadges';
import { randomIndex } from '../random';

/**
 * Flashcards feature: shows a Pokemon's artwork, flips to reveal its level-50 speed tiers,
 * and shuffles to the next card. Returns the element.
 */
export function Flashcards() {
  const pool = useMemo(() => getAllPokemon(), []);
  const [index, setIndex] = useState(() => randomIndex(pool.length));
  const [revealed, setRevealed] = useState(false);

  if (pool.length === 0) {
    return (
      <Card>
        <p className="text-ink-muted">No Pokemon available.</p>
      </Card>
    );
  }

  const pokemon = pool[index];
  const tiers = speedTiers(pokemon.baseStats.spe);

  const next = () => {
    setRevealed(false);
    let nextIndex = randomIndex(pool.length);
    if (pool.length > 1) {
      while (nextIndex === index) nextIndex = randomIndex(pool.length);
    }
    setIndex(nextIndex);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-ink-muted text-center text-sm">
        Tap the card to reveal its Speed tiers at level 50.
      </p>

      <Card
        role="button"
        tabIndex={0}
        aria-label={`${pokemon.name} flashcard, ${revealed ? 'showing' : 'hiding'} speed tiers`}
        onClick={() => setRevealed((r) => !r)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setRevealed((r) => !r);
          }
        }}
        className="flex cursor-pointer flex-col items-center gap-3 select-none"
      >
        <div className="w-48 max-w-full sm:w-56">
          <PokemonImage src={pokemon.sprite} name={pokemon.name} />
        </div>
        <h2 className="text-ink text-xl font-bold">{pokemon.name}</h2>
        <TypeBadges types={pokemon.types} />

        {revealed ? (
          <div className="mt-2 w-full">
            <p className="text-ink-muted mb-1 text-center text-xs font-medium tracking-wide uppercase">
              Base Speed {pokemon.baseStats.spe} - Level 50 tiers
            </p>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="Min" value={tiers.min} />
              <StatPill label="Neutral Max" value={tiers.neutralMax} />
              <StatPill label="Max" value={tiers.max} emphasis />
            </div>
          </div>
        ) : (
          <p className="text-ink-muted mt-2 text-sm">Tap to reveal Speed tiers</p>
        )}
      </Card>

      <Button onClick={next}>Next Pokemon</Button>
    </div>
  );
}
