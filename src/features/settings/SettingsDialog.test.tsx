import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { SettingsDialog } from './SettingsDialog';
import { DecksProvider } from '../../decks/DecksContext';
import { renderWithTheme } from '../../test/renderWithTheme';

const renderDialog = () =>
  renderWithTheme(
    <DecksProvider>
      <SettingsDialog open onClose={() => {}} />
    </DecksProvider>,
  );

describe('SettingsDialog', () => {
  beforeEach(() => localStorage.clear());

  it('creates a deck that starts collapsed and expands/collapses via the edit icon', () => {
    renderDialog();

    fireEvent.change(screen.getByLabelText('Deck name'), { target: { value: 'Rain' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save deck' }));

    // Collapsed by default: the editor (Delete button) is not mounted.
    expect(screen.queryByRole('button', { name: 'Delete deck' })).toBeNull();

    const editButton = screen.getByRole('button', { name: 'Edit Rain' });
    expect(editButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(editButton);
    expect(screen.getByRole('button', { name: 'Delete deck' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Rain' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // Toggling back flips the control immediately (the editor then unmounts after the transition).
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Rain' }));
    expect(screen.getByRole('button', { name: 'Edit Rain' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
