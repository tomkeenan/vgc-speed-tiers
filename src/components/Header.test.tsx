import { afterEach, describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { DecksProvider } from '../decks/DecksContext';
import { AuthProvider } from '../auth/AuthContext';
import { renderWithTheme } from '../test/renderWithTheme';

// Sign-in configuration is toggled per test; loadGoogleIdentity never resolves so no Google UI
// mounts. Header only reads `configured` to decide whether the leaderboard crown shows.
let configured = false;
vi.mock('../auth/googleIdentity', () => ({
  isAuthConfigured: () => configured,
  getClientId: () => (configured ? 'test-client' : ''),
  loadGoogleIdentity: vi.fn(() => new Promise(() => {})),
}));

const renderHeader = (props: Partial<Parameters<typeof Header>[0]> = {}) =>
  renderWithTheme(
    <AuthProvider>
      <DecksProvider>
        <Header
          onOpenSettings={vi.fn()}
          onToggleLeaderboard={vi.fn()}
          leaderboardActive={false}
          {...props}
        />
      </DecksProvider>
    </AuthProvider>,
  );

afterEach(() => {
  configured = false;
  vi.clearAllMocks();
});

describe('Header', () => {
  it('renders the title and fires onOpenSettings when the cog is clicked', async () => {
    const onOpenSettings = vi.fn();
    renderHeader({ onOpenSettings });

    expect(screen.getByRole('heading', { name: 'Just Move First' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('hides the leaderboard crown when sign-in is not configured', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: 'Leaderboard' })).toBeNull();
  });

  it('shows the crown and toggles the leaderboard when configured', async () => {
    configured = true;
    const onToggleLeaderboard = vi.fn();
    renderHeader({ onToggleLeaderboard });
    await userEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
    expect(onToggleLeaderboard).toHaveBeenCalledTimes(1);
  });
});
