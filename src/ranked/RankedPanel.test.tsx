import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { RankedPanel } from './RankedPanel';

const renderPanel = (props: Partial<Parameters<typeof RankedPanel>[0]> = {}) =>
  renderWithTheme(
    <RankedPanel
      configured
      signedIn
      ranked={false}
      onRankedChange={vi.fn()}
      standing={null}
      {...props}
    />,
  );

describe('RankedPanel', () => {
  it('renders nothing when sign-in is not configured', () => {
    const { container } = renderPanel({ configured: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('gates the toggle behind sign-in when signed out', () => {
    renderPanel({ signedIn: false });
    expect(screen.getByText('Sign in from the account menu to play ranked.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Ranked' })).toBeDisabled();
  });

  it('lets a signed-in player toggle ranked on', async () => {
    const onRankedChange = vi.fn();
    renderPanel({ onRankedChange });
    const toggle = screen.getByRole('switch', { name: 'Ranked' });
    expect(toggle).toBeEnabled();
    await userEvent.click(toggle);
    expect(onRankedChange).toHaveBeenCalledWith(true);
  });

  it('shows standing feedback when ranked', () => {
    renderPanel({ ranked: true, standing: { rank: 4, streak: 8 } });
    expect(screen.getByText("You're #4 with a streak of 8.")).toBeInTheDocument();
  });
});
