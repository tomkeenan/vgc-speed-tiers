import { useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { getAllPokemon } from '../../lib/data';
import { applyModifiers, computeSpeed } from '../../lib/speed';
import type { NatureEffect } from '../../lib/speed';
import type { Pokemon } from '../../lib/types';
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
        <Typography sx={{ color: 'text.secondary' }}>No Pokemon available.</Typography>
      </Card>
    );
  }

  const base = pokemon.baseStats.spe;
  const statSpeed = computeSpeed({ base, ev: Number(ev), nature });
  const finalSpeed = applyModifiers(statSpeed, { stage, tailwind, choiceScarf, paralysis });

  return (
    <Stack spacing={2}>
      <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 160, maxWidth: '100%' }}>
          <PokemonImage src={pokemon.sprite} name={pokemon.name} />
        </Box>
        <Box sx={{ width: '100%' }}>
          <Autocomplete<Pokemon, false, true, false>
            fullWidth
            disableClearable
            options={pool}
            getOptionLabel={(p) => p.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            value={pokemon}
            onChange={(_, next) => {
              if (next) setId(next.id);
            }}
            renderInput={(params) => <TextField {...params} label="Pokemon" />}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, width: '100%' }}>
          <StatPill label="Base Stat" value={base} />
          <StatPill label="Stat @ 50" value={statSpeed} />
          <StatPill label="Live Speed" value={finalSpeed} emphasis />
        </Box>
      </Card>

      <Card sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Toggle label="Tailwind (x2)" checked={tailwind} onChange={setTailwind} />
          <Toggle label="Choice Scarf (x1.5)" checked={choiceScarf} onChange={setChoiceScarf} />
          <Toggle label="Paralysis (x0.5)" checked={paralysis} onChange={setParalysis} />
        </Box>
      </Card>
    </Stack>
  );
}
