import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpeedExplorer } from './SpeedExplorer';

const liveSpeed = () => Number(screen.getByText('Live Speed').nextElementSibling?.textContent);

describe('SpeedExplorer', () => {
  it('doubles the live speed when Tailwind is enabled', async () => {
    render(<SpeedExplorer />);
    const before = liveSpeed();

    await userEvent.click(screen.getByRole('switch', { name: 'Tailwind (x2)' }));

    expect(liveSpeed()).toBe(before * 2);
  });
});
