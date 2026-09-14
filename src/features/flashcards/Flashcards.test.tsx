import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcards } from './Flashcards';
import { DecksProvider } from '../../decks/DecksContext';
import { renderWithTheme } from '../../test/renderWithTheme';

describe('Flashcards', () => {
  it('masks the speed tiers as ??? and spins them in when the card is tapped', async () => {
    renderWithTheme(
      <DecksProvider>
        <Flashcards />
      </DecksProvider>,
    );
    // Tiers are laid out from the start; the labels show but every value is masked.
    expect(screen.getByText('Base Speed')).toBeTruthy();
    expect(screen.getByText('0 EVs')).toBeTruthy();
    expect(screen.getByText('32 Spd +Nat')).toBeTruthy();
    expect(screen.getAllByText('???')).toHaveLength(4); // base speed + three level-50 tiers

    await userEvent.click(screen.getByRole('button', { name: /flashcard/i }));

    expect(screen.queryByText('???')).toBeNull(); // values spin in, masks gone
  });
});
