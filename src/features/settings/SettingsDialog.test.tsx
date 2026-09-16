import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { SettingsDialog } from './SettingsDialog';
import { DecksProvider } from '../../decks/DecksContext';
import { getAllPokemon } from '../../lib/data';
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

    // The create form is hidden until the "Create a deck" control is clicked.
    expect(screen.queryByLabelText('Deck name')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Create a deck' }));

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

  it('imports a deck from pasted JSON, keeping only known Pokemon', () => {
    renderDialog();
    const known = getAllPokemon()[0].id;
    const json = JSON.stringify({ name: 'Imported', pokemonIds: [known, 'not-a-real-mon'] });

    // The import form is hidden until the "Import a deck" control is clicked.
    expect(screen.queryByLabelText('Paste deck JSON')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Import a deck' }));
    fireEvent.change(screen.getByLabelText('Paste deck JSON'), { target: { value: json } });
    fireEvent.click(screen.getByRole('button', { name: 'Import deck' }));

    // The deck appears in the list with a size of 1 (the unknown id was dropped).
    const row = screen.getByRole('button', { name: 'Edit Imported' }).closest('div');
    expect(row?.textContent).toContain('· 1');
  });

  it('shows an error for invalid import JSON and imports nothing', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Import a deck' }));
    fireEvent.change(screen.getByLabelText('Paste deck JSON'), { target: { value: '{bad json' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import deck' }));

    expect(screen.getByText(/valid JSON/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit / })).toBeNull();
  });

  it('copies a deck to the clipboard as JSON', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Create a deck' }));
    fireEvent.change(screen.getByLabelText('Deck name'), { target: { value: 'Sun' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save deck' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sun' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export deck' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"name": "Sun"'));
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });
});
