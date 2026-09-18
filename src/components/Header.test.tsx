import { afterEach, describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { DecksProvider } from '../decks/DecksContext';
import { AuthProvider } from '../auth/AuthContext';
import { renderWithTheme } from '../test/renderWithTheme';

// Sign-in configuration is toggled per test; loadGoogleIdentity never resolves so no Google UI
// mounts. Header only reads `configured` to decide whether the Practice/Ranked switch shows.
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
        <Header onOpenSettings={vi.fn()} ranked={false} onRankedChange={vi.fn()} {...props} />
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

  it('hides the mode switch when sign-in is not configured', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: 'Game mode' })).toBeNull();
  });

  it('disables the Ranked option until the player signs in', async () => {
    configured = true;
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Game mode' }));
    expect(screen.getByRole('menuitem', { name: 'Practice' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: 'Ranked' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('switches to ranked from the mode menu when signed in', async () => {
    configured = true;
    signIn();
    const onRankedChange = vi.fn();
    renderHeader({ onRankedChange });

    await userEvent.click(screen.getByRole('button', { name: 'Game mode' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Ranked' }));
    expect(onRankedChange).toHaveBeenCalledWith(true);
  });

  it('greys out the deck selector in ranked mode', () => {
    configured = true;
    signIn();
    const { rerender } = renderHeader({ ranked: false });
    expect(screen.getByRole('button', { name: /Deck:/ })).toBeEnabled();

    rerender(
      <AuthProvider>
        <DecksProvider>
          <Header onOpenSettings={vi.fn()} ranked onRankedChange={vi.fn()} />
        </DecksProvider>
      </AuthProvider>,
    );
    expect(screen.getByRole('button', { name: /Deck:/ })).toBeDisabled();
  });
});
