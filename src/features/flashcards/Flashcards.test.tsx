import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcards } from './Flashcards';
import { DecksProvider } from '../../decks/DecksContext';
import { renderWithTheme } from '../../test/renderWithTheme';

describe('Flashcards', () => {
  it('masks the base Speed as ??? and spins it in when the card is tapped', async () => {
    renderWithTheme(
      <DecksProvider>
        <Flashcards />
      </DecksProvider>,
    );
    expect(screen.getByText('Base Speed')).toBeTruthy();
    expect(screen.getAllByText('???')).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: /flashcard/i }));

    expect(screen.queryByText('???')).toBeNull();
  });
});
