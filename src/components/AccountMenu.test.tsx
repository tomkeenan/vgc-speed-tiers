import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { AuthProvider } from '../auth/AuthContext';
import { AccountMenu } from './AccountMenu';

// Sign-in configuration is read through isAuthConfigured; a mutable flag lets each test choose. When
// configured, loadGoogleIdentity never resolves, so the overlaid Google button is not rendered during
// the test - we only assert our own UI around it.
let mockConfigured = true;
vi.mock('../auth/googleIdentity', () => ({
  isAuthConfigured: () => mockConfigured,
  getClientId: () => 'test-client',
  loadGoogleIdentity: vi.fn(() => new Promise(() => {})),
}));

const themeButtonName = /Switch to (light|dark) mode/;

function renderMenu() {
  return renderWithTheme(
    <AuthProvider>
      <AccountMenu onOpenSettings={() => {}} />
    </AuthProvider>,
  );
}

beforeEach(() => {
  mockConfigured = true;
});

afterEach(() => {
  localStorage.clear();
});

describe('AccountMenu', () => {
  it('offers sign-in plus settings and theme when signed out', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByText('Sign in to access ranked mode.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: themeButtonName })).toBeInTheDocument();
  });

  it('shows the display name, sign out, settings and theme when signed in', async () => {
    localStorage.setItem('speedtiers.auth.user', JSON.stringify({ displayName: 'PikaFast' }));
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByText('PikaFast')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: themeButtonName })).toBeInTheDocument();
  });

  it('toggles the theme from the menu, leaving it open', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Account' }));

    const themeButton = await screen.findByRole('button', { name: themeButtonName });
    const before = themeButton.getAttribute('aria-label') ?? themeButton.textContent;
    await user.click(themeButton);

    const after = screen.getByRole('button', { name: themeButtonName });
    expect(after.textContent).not.toBe(before);
  });

  it('drops the account section but keeps settings and theme when sign-in is not configured', async () => {
    mockConfigured = false;
    const user = userEvent.setup();
    renderMenu();

    // With no account concept, the trigger is the settings gear rather than the account icon.
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.queryByText('Sign in to access ranked mode.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: themeButtonName })).toBeInTheDocument();
  });
});
