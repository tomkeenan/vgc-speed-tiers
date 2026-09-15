import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../test/renderWithTheme';
import { MemberPicker } from './MemberPicker';
import type { Pokemon } from '../lib/types';

const pikachu: Pokemon = {
  id: 'pikachu',
  num: 25,
  name: 'Pikachu',
  types: ['Electric'],
  baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
  sprite: 'pikachu.png',
  usage: 0.1,
  usageRank: 1,
};

describe('MemberPicker', () => {
  it('renders its label with the given selection', () => {
    renderWithTheme(
      <MemberPicker label="Pokemon" options={[pikachu]} value={[pikachu]} onChange={() => {}} />,
    );
    expect(screen.getByLabelText('Pokemon')).toBeInTheDocument();
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
  });
});
