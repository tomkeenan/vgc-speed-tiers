import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsDialog } from './SettingsDialog';
import { DecksProvider } from '../../decks/DecksContext';
import { renderWithTheme } from '../../test/renderWithTheme';

function renderDialog() {
  return renderWithTheme(
    <DecksProvider>
      <SettingsDialog open onClose={() => {}} />
    </DecksProvider>,
  );
}

describe('SettingsDialog', () => {
  beforeEach(() => localStorage.clear());

  it('shows the built-in All Pokemon deck as an option', () => {
    renderDialog();
    expect(screen.getByText(/All Pokemon ·/)).toBeTruthy();
  });

  it('enables Save deck only once a name is entered', async () => {
    renderDialog();
    const save = screen.getByRole('button', { name: 'Save deck' });
    expect(save).toBeDisabled();

    const nameFields = screen.getAllByLabelText('Deck name');
    await userEvent.type(nameFields[nameFields.length - 1], 'Speed control');
    expect(save).toBeEnabled();
  });
});
