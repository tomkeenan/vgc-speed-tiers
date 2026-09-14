import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/renderWithTheme';
import { SpeedExplorer } from './SpeedExplorer';

const liveSpeed = () => Number(screen.getByText('Live Speed').nextElementSibling?.textContent);

describe('SpeedExplorer', () => {
  it('doubles the live speed when Tailwind is enabled', async () => {
    renderWithTheme(<SpeedExplorer />);
    const before = liveSpeed();

    await userEvent.click(screen.getByRole('switch', { name: 'Tailwind (x2)' }));

    expect(liveSpeed()).toBe(before * 2);
  });
});
