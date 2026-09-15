import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../test/renderWithTheme';
import { MemberPicker } from './MemberPicker';
import type { Pokemon } from '../lib/types';

const mon = (id: string, name: string): Pokemon => ({
  id,
  num: 1,
  name,
  types: ['Electric'],
  baseStats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 },
  sprite: `${id}.png`,
  usage: 0.1,
  usageRank: 1,
});

const pikachu = mon('pikachu', 'Pikachu');
const bulbasaur = mon('bulbasaur', 'Bulbasaur');

describe('MemberPicker', () => {
  it('renders its search label and lists every option', () => {
    renderWithTheme(
      <MemberPicker
        label="Pokemon"
        options={[pikachu, bulbasaur]}
        value={[]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Pokemon')).toBeInTheDocument();
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
  });

  it('adds an option when its checkbox is clicked', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <MemberPicker
        label="Pokemon"
        options={[pikachu, bulbasaur]}
        value={[]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /pikachu/i }));
    expect(onChange).toHaveBeenCalledWith([pikachu]);
  });

  it('removes an already-selected option when clicked again', () => {
    const onChange = vi.fn();
    renderWithTheme(
      <MemberPicker
        label="Pokemon"
        options={[pikachu, bulbasaur]}
        value={[pikachu]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /pikachu/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('filters the list by the search query without touching the selection', () => {
    renderWithTheme(
      <MemberPicker
        label="Pokemon"
        options={[pikachu, bulbasaur]}
        value={[]}
        onChange={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('Pokemon'), { target: { value: 'bulba' } });
    expect(screen.queryByText('Pikachu')).toBeNull();
    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
  });
});
