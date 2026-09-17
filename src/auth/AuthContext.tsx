import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { isAuthConfigured } from './googleIdentity';

/** A signed-in player. Only the display name (and when they may next rename) is kept locally. */
export interface AuthUser {
  displayName: string;
  /** When the player may next change their name (epoch ms), or null if allowed now. */
  canRenameAt: number | null;
}

/** Thrown by register()/rename() so dialogs can show a specific message. */
export type NameActionError = 'name_taken' | 'invalid_name' | 'cooldown' | 'reauth' | 'failed';

/** The auth API exposed to consumers via useAuth(). */
export interface AuthApi {
  user: AuthUser | null;
  configured: boolean;
  /** True after a Google sign-in when the account has no display name yet. */
  needsDisplayName: boolean;
  /** Verify a Google credential and start a session. Opens the name step if not yet registered. */
  signIn: (credential: string) => Promise<void>;
  /** Claim a unique display name for the session. Rejects with a NameActionError. */
  register: (displayName: string) => Promise<void>;
  /** Change the display name. Rejects with a NameActionError ('cooldown' if within the week). */
  rename: (displayName: string) => Promise<void>;
  /** Abandon the display-name step (e.g. the player closed the dialog). */
  cancelRegistration: () => void;
  signOut: () => void;
}

const STORAGE_KEY = 'speedtiers.auth.user';
const AuthContext = createContext<AuthApi | null>(null);

interface NameResponse {
  displayName: string;
  canRenameAt: number | null;
}

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof parsed.displayName !== 'string') return null;
    return {
      displayName: parsed.displayName,
      canRenameAt: typeof parsed.canRenameAt === 'number' ? parsed.canRenameAt : null,
    };
  } catch {
    return null;
  }
}

function disableGoogleAutoSelect() {
  try {
    window.google?.accounts.id.disableAutoSelect();
  } catch {
    // GIS not loaded yet; nothing to disable.
  }
}

/** Maps an HTTP status from a name action to a NameActionError. */
function nameError(status: number): NameActionError {
  if (status === 409) return 'name_taken';
  if (status === 429) return 'cooldown';
  if (status === 400) return 'invalid_name';
  if (status === 401) return 'reauth';
  return 'failed';
}

/** Provides Google sign-in state (verified server-side) to the tree. Wrap the app in this. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStored);
  // Set after a Google sign-in for an account that has not chosen a display name yet.
  const [pendingRegistration, setPendingRegistration] = useState(false);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable (private mode); sign-in still works for the session.
    }
  }, [user]);

  const signIn = useCallback(async (credential: string) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) throw new Error('Sign-in verification failed');
    const { registered, displayName, canRenameAt } = (await res.json()) as {
      registered: boolean;
      displayName: string | null;
      canRenameAt: number | null;
    };
    if (registered && displayName) {
      setPendingRegistration(false);
      setUser({ displayName, canRenameAt });
    } else {
      // Verified Google account with no name yet: prompt for a display name (session cookie is set).
      setUser(null);
      setPendingRegistration(true);
    }
  }, []);

  // Shared POST for register/rename: both are authorized by the session cookie and return a name.
  const submitName = useCallback(async (path: string, displayName: string) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });
    if (!res.ok) throw nameError(res.status);
    return (await res.json()) as NameResponse;
  }, []);

  const register = useCallback(
    async (displayName: string) => {
      const saved = await submitName('/api/register', displayName);
      setPendingRegistration(false);
      setUser({ displayName: saved.displayName, canRenameAt: saved.canRenameAt });
    },
    [submitName],
  );

  const rename = useCallback(
    async (displayName: string) => {
      const saved = await submitName('/api/rename', displayName);
      setUser({ displayName: saved.displayName, canRenameAt: saved.canRenameAt });
    },
    [submitName],
  );

  const cancelRegistration = useCallback(() => {
    setPendingRegistration(false);
    void fetch('/api/signout', { method: 'POST' }).catch(() => {});
    disableGoogleAutoSelect();
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setPendingRegistration(false);
    void fetch('/api/signout', { method: 'POST' }).catch(() => {});
    disableGoogleAutoSelect();
  }, []);

  const value = useMemo<AuthApi>(
    () => ({
      user,
      configured: isAuthConfigured(),
      needsDisplayName: pendingRegistration && user === null,
      signIn,
      register,
      rename,
      cancelRegistration,
      signOut,
    }),
    [user, pendingRegistration, signIn, register, rename, cancelRegistration, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth API. Throws if used outside an AuthProvider. */
export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
