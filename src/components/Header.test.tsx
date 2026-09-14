import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { renderWithTheme } from '../test/renderWithTheme';

describe('Header', () => {
  it('renders the title and fires onOpenSettings when the cog is clicked', async () => {
    const onOpenSettings = vi.fn();
    renderWithTheme(<Header onOpenSettings={onOpenSettings} />);

    expect(screen.getByRole('heading', { name: 'VGC Speed Tiers' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
