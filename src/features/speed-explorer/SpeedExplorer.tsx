import { useMemo, useState } from 'react';
import { getAllPokemon } from '../../lib/data';
import { applyModifiers, computeSpeed } from '../../lib/speed';
import type { NatureEffect } from '../../lib/speed';
import { Card } from '../../components/Card';
import { PokemonImage } from '../../components/PokemonImage';
import { SegmentedControl } from '../../components/SegmentedControl';
import { StatPill } from '../../components/StatPill';
import { Stepper } from '../../components/Stepper';
import { Toggle } from '../../components/Toggle';

const NATURE_OPTIONS: { label: string; value: NatureEffect }[] = [
  { label: 'Negative', value: 'negative' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Positive', value: 'positive' },
];

const EV_OPTIONS = [
  { label: '0 EVs', value: '0' },
  { label: '252 EVs', value: '252' },
];

/**
 * Speed Explorer feature: pick a Pokemon and adjust nature, EVs, stat stage, Tailwind,
 * Choice Scarf, and paralysis to see its live Speed at level 50. Returns the element.
 */
export function SpeedExplorer() {
  const pool = useMemo(() => getAllPokemon(), []);
  const [id, setId] = useState(() => pool[0]?.id ?? '');
  const [nature, setNature] = useState<NatureEffect>('positive');
  const [ev, setEv] = useState<'0' | '252'>('252');
  const [stage, setStage] = useState(0);
  const [tailwind, setTailwind] = useState(false);
  const [choiceScarf, setChoiceScarf] = useState(false);
  const [paralysis, setParalysis] = useState(false);

  const pokemon = pool.find((p) => p.id === id) ?? pool[0];

  if (!pokemon) {
    return (
      <Card>
        <p className="text-ink-muted">No Pokemon available.</p>
      </Card>
    );
  }

  const base = pokemon.baseStats.spe;
  const statSpeed = computeSpeed({ base, ev: Number(ev), nature });
  const finalSpeed = applyModifiers(statSpeed, { stage, tailwind, choiceScarf, paralysis });

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3">
        <div className="w-40 max-w-full">
          <PokemonImage src={pokemon.sprite} name={pokemon.name} />
        </div>
        <label className="w-full">
          <span className="text-ink-muted mb-1 block text-sm font-semibold">Pokemon</span>
          <select
            value={pokemon.id}
            onChange={(e) => setId(e.target.value)}
            className="border-ink/10 bg-surface text-ink w-full rounded-xl border px-4 py-3 text-base font-semibold"
          >
            {pool.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid w-full grid-cols-3 gap-2">
          <StatPill label="Base Stat" value={base} />
          <StatPill label="Stat @ 50" value={statSpeed} />
          <StatPill label="Live Speed" value={finalSpeed} emphasis />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <SegmentedControl
          label="Nature"
          options={NATURE_OPTIONS}
          value={nature}
          onChange={setNature}
        />
        <SegmentedControl
          label="Speed EVs"
          options={EV_OPTIONS}
          value={ev}
          onChange={(v) => setEv(v as '0' | '252')}
        />
        <Stepper
          label="Stat stage"
          value={stage}
          min={-6}
          max={6}
          onChange={setStage}
          format={(v) => (v > 0 ? `+${v}` : String(v))}
        />
        <div className="flex flex-col gap-2">
          <Toggle label="Tailwind (x2)" checked={tailwind} onChange={setTailwind} />
          <Toggle label="Choice Scarf (x1.5)" checked={choiceScarf} onChange={setChoiceScarf} />
          <Toggle label="Paralysis (x0.5)" checked={paralysis} onChange={setParalysis} />
        </div>
      </Card>
    </div>
  );
}
