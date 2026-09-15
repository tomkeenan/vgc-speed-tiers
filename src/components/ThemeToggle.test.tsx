import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { renderWithTheme } from '../test/renderWithTheme';

describe('ThemeToggle', () => {
  it('toggles the accessible label between light and dark on click', async () => {
    renderWithTheme(<ThemeToggle />);

    const button = await screen.findByRole('button', { name: /Switch to (light|dark) mode/ });
    const before = button.getAttribute('aria-label');

    await userEvent.click(button);

    expect(screen.getByRole('button').getAttribute('aria-label')).not.toBe(before);
  });
});
