import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcards } from './Flashcards';
import { renderWithTheme } from '../../test/renderWithTheme';

describe('Flashcards', () => {
  it('reveals the speed tiers when the card is tapped', async () => {
    renderWithTheme(<Flashcards />);
    expect(screen.getByText('Tap to reveal Speed tiers')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /flashcard/i }));

    expect(screen.getByText('Base Speed')).toBeTruthy();
    expect(screen.getByText('0 EVs')).toBeTruthy();
    expect(screen.getByText('32 Spd +Nat')).toBeTruthy();
  });
});
