import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FasterGame } from './FasterGame';
import { renderWithTheme } from '../../test/renderWithTheme';

describe('FasterGame', () => {
  it('scores a round and reveals both speeds when a Pokemon is chosen', async () => {
    renderWithTheme(<FasterGame />);
    expect(screen.getByText('Score: 0/0')).toBeTruthy();

    const choices = screen.getAllByRole('button', { name: /choose/i });
    await userEvent.click(choices[0]);

    expect(screen.getByText(/Score: [01]\/1/)).toBeTruthy();
    expect(screen.getAllByText('Max Speed').length).toBe(2);
    expect(screen.getByRole('button', { name: 'Next Matchup' })).toBeTruthy();
  });
});
