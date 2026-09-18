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
          ranked={false}
          onRankedChange={vi.fn()}
          {...props}
        />
      </DecksProvider>
    </AuthProvider>,
  );

const signIn = () =>
  localStorage.setItem(
    'speedtiers.auth.user',
    JSON.stringify({ displayName: 'Tester', canRenameAt: null }),
  );

afterEach(() => {
  configured = false;
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Header', () => {
  it('renders the title and fires onOpenSettings from the account menu', async () => {
    // Configured, so the menu trigger is the account icon and the Settings item inside it is the
    // only control named "Settings" - no collision with the trigger.
    configured = true;
    const onOpenSettings = vi.fn();
    renderHeader({ onOpenSettings });

    expect(screen.getByRole('heading', { name: 'Just Move First' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Account' }));
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

  it('hides the mode switch when sign-in is not configured', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: 'Practice' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ranked' })).toBeNull();
  });

  it('disables the Ranked option until the player signs in', () => {
    configured = true;
    renderHeader();
    expect(screen.getByRole('button', { name: 'Practice' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Ranked' })).toBeDisabled();
  });

  it('switches to ranked from the mode switch when signed in', async () => {
    configured = true;
    signIn();
    const onRankedChange = vi.fn();
    renderHeader({ onRankedChange });

    const ranked = screen.getByRole('button', { name: 'Ranked' });
    expect(ranked).toBeEnabled();
    await userEvent.click(ranked);
    expect(onRankedChange).toHaveBeenCalledWith(true);
  });

  it('hides the deck selector in ranked mode', () => {
    configured = true;
    signIn();
    const { rerender } = renderHeader({ ranked: false });
    expect(screen.getByRole('button', { name: /Deck:/ })).toBeInTheDocument();

    rerender(
      <AuthProvider>
        <DecksProvider>
          <Header
            onOpenSettings={vi.fn()}
            onToggleLeaderboard={vi.fn()}
            leaderboardActive={false}
            ranked
            onRankedChange={vi.fn()}
          />
        </DecksProvider>
      </AuthProvider>,
    );
    expect(screen.queryByRole('button', { name: /Deck:/ })).toBeNull();
  });
});
