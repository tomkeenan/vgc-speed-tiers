import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Flashcards } from './Flashcards';

describe('Flashcards', () => {
  it('reveals the speed tiers when the card is tapped', async () => {
    render(<Flashcards />);
    expect(screen.getByText('Tap to reveal Speed tiers')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /flashcard/i }));

    expect(screen.getByText('Neutral Max')).toBeTruthy();
    expect(screen.getByText('Min')).toBeTruthy();
  });
});
