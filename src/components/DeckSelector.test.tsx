import { beforeEach, describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { DeckSelector } from './DeckSelector';
import { DecksProvider } from '../decks/DecksContext';

describe('DeckSelector', () => {
  beforeEach(() => localStorage.clear());

  it('opens a menu listing the built-in deck with its size', async () => {
    renderWithTheme(
      <DecksProvider>
        <DeckSelector />
      </DecksProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: /deck:/i }));
    expect(screen.getByRole('menuitem', { name: /All Pokemon ·/ })).toBeInTheDocument();
  });
});
