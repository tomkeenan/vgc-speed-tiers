import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { DisplayNameDialog } from './DisplayNameDialog';

describe('DisplayNameDialog', () => {
  it('submits a cleaned name', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithTheme(
      <DisplayNameDialog open mode="register" onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText('Display name'), '  PikaFast  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith('PikaFast');
  });

  it('shows a character error and does not submit for disallowed punctuation', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(
      <DisplayNameDialog open mode="register" onSubmit={onSubmit} onClose={vi.fn()} />,
    );
    await user.type(screen.getByLabelText('Display name'), 'bad.name');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Only letters, numbers, spaces, - and _ are allowed.')).toBeVisible();
  });

  it('surfaces a taken-name error from the server', async () => {
    const onSubmit = vi.fn().mockRejectedValue('name_taken');
    const user = userEvent.setup();
    renderWithTheme(
      <DisplayNameDialog
        open
        mode="rename"
        initialName="Ash"
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    await user.clear(screen.getByLabelText('Display name'));
    await user.type(screen.getByLabelText('Display name'), 'Taken');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('That name is already taken.')).toBeVisible();
  });
});
