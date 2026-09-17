import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { AuthProvider } from '../auth/AuthContext';
import { AuthControl } from './AuthControl';

// Treat sign-in as configured. loadGoogleIdentity never resolves, so the overlaid Google button
// is not rendered during the test; we only assert our own UI around it.
vi.mock('../auth/googleIdentity', () => ({
  isAuthConfigured: () => true,
  getClientId: () => 'test-client',
  loadGoogleIdentity: vi.fn(() => new Promise(() => {})),
}));

afterEach(() => {
  localStorage.clear();
});

describe('AuthControl', () => {
  it('opens the account menu with a sign-in option when signed out', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <AuthProvider>
        <AuthControl />
      </AuthProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByText('Sign in to access ranked mode.')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows the display name and a sign-out option when signed in', async () => {
    localStorage.setItem('speedtiers.auth.user', JSON.stringify({ displayName: 'PikaFast' }));
    const user = userEvent.setup();
    renderWithTheme(
      <AuthProvider>
        <AuthControl />
      </AuthProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByText('PikaFast')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
