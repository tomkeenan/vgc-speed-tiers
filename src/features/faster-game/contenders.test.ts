import { describe, it, expect } from 'vitest';
import { buildContenders, sameSpecies } from './contenders';
import { speedTiers } from '../../lib/speed';
import type { Pokemon } from '../../lib/types';

const mon = (id: string, spe: number): Pokemon => ({
  id,
  num: 1,
  name: id,
  types: ['normal'],
  baseStats: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe },
  sprite: `${id}.webp`,
  usage: 0,
  usageRank: 1,
});

describe('buildContenders', () => {
  it('yields one base-Speed contender per Pokemon when natures are off', () => {
    const [a, b] = buildContenders([mon('a', 60), mon('b', 100)], false);
    expect(a).toMatchObject({ key: 'a', nature: 'base', speed: 60 });
    expect(b).toMatchObject({ key: 'b', nature: 'base', speed: 100 });
  });

  it('yields neutral-max and +Spd-max contenders per Pokemon when natures are on', () => {
    const tiers = speedTiers(100);
    const built = buildContenders([mon('a', 100)], true);
    expect(built).toHaveLength(2);
    expect(built[0]).toMatchObject({
      key: 'a:neutral',
      nature: 'neutral',
      speed: tiers.neutralMax,
    });
    expect(built[1]).toMatchObject({ key: 'a:positive', nature: 'positive', speed: tiers.max });
  });

  it('sameSpecies matches a Pokemon against its own nature variants only', () => {
    const [neutral, positive] = buildContenders([mon('a', 100)], true);
    const [other] = buildContenders([mon('b', 100)], true);
    expect(sameSpecies(neutral, positive)).toBe(true);
    expect(sameSpecies(neutral, other)).toBe(false);
  });
});
