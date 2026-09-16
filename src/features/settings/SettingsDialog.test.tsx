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

// Picks the first Pokemon in the create form's member picker (a deck needs at least one member).
const pickFirstMember = () => {
  const first = getAllPokemon()[0];
  fireEvent.change(screen.getByLabelText('Pokemon'), { target: { value: first.name } });
  fireEvent.click(screen.getByRole('checkbox', { name: new RegExp(first.name, 'i') }));
};

describe('SettingsDialog', () => {
  beforeEach(() => localStorage.clear());

  it('renders the Poke Ball icon inline in the explainer (self-closing <icon/> in the string)', () => {
    renderDialog();

    // The "Pick one..." bullet uses <Trans> with an `icon` slot; a self-closing <icon/> tag keeps
    // the component's own children, so the PokeballIcon SVG must actually render in the explainer.
    const explainer = screen.getByText(/A deck is a custom list/i).closest('div');
    expect(explainer?.querySelectorAll('svg')).toHaveLength(1);
  });

  it('creates a deck that starts collapsed and expands/collapses via the edit icon', () => {
    renderDialog();

    // The create form is hidden until the "Create a deck" control is clicked.
    expect(screen.queryByLabelText('Deck name')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Create a deck' }));

    fireEvent.change(screen.getByLabelText('Deck name'), { target: { value: 'Rain' } });
    pickFirstMember();
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

  it('requires both a name and a member before saving, flagging what is missing', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Create a deck' }));

    // Nothing filled in: Save creates no deck and flags both the name and the empty selection.
    fireEvent.click(screen.getByRole('button', { name: 'Save deck' }));
    expect(screen.queryByRole('button', { name: /^Edit / })).toBeNull();
    expect(screen.getByText('Enter a deck name')).toBeInTheDocument();
    expect(screen.getByText('Add at least one Pokemon')).toBeInTheDocument();

    // A name alone is still not enough - the empty-deck hint remains.
    fireEvent.change(screen.getByLabelText('Deck name'), { target: { value: 'Rain' } });
    expect(screen.queryByText('Enter a deck name')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save deck' }));
    expect(screen.queryByRole('button', { name: /^Edit / })).toBeNull();
    expect(screen.getByText('Add at least one Pokemon')).toBeInTheDocument();

    // Adding a member clears the hint and lets the deck save.
    pickFirstMember();
    expect(screen.queryByText('Add at least one Pokemon')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save deck' }));
    expect(screen.getByRole('button', { name: 'Edit Rain' })).toBeInTheDocument();
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
    pickFirstMember();
    fireEvent.click(screen.getByRole('button', { name: 'Save deck' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Sun' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export deck' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"name": "Sun"'));
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });
});
