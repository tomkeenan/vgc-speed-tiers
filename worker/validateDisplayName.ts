// Display-name rules, shared shape for client and server. The name is the ONLY thing ever shown
// for a player; nothing from the Google account is displayed. Uniqueness is enforced separately,
// case-insensitively, by the players table.

export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 20;

// Letters or numbers at each end; letters, numbers, spaces, hyphens and underscores inside. The
// \p{L}/\p{N} classes accept non-Latin scripts so the rule is fair across locales.
const DISPLAY_NAME_RE = /^[\p{L}\p{N}](?:[\p{L}\p{N} _-]*[\p{L}\p{N}])?$/u;

/** Why a display name was rejected, so the UI can show a specific message. */
export type DisplayNameError = 'length' | 'chars';

export type DisplayNameCheck = { ok: true; name: string } | { ok: false; error: DisplayNameError };

/**
 * Normalizes a raw display name (trim, collapse internal whitespace) and validates it, reporting
 * why it failed: 'length' when outside 3-20 characters, 'chars' for disallowed characters.
 */
export function checkDisplayName(raw: unknown): DisplayNameCheck {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) {
    return { ok: false, error: 'length' };
  }
  if (!DISPLAY_NAME_RE.test(name)) return { ok: false, error: 'chars' };
  return { ok: true, name };
}

/** Convenience wrapper: the cleaned name if valid, otherwise null. */
export function normalizeDisplayName(raw: unknown): string | null {
  const result = checkDisplayName(raw);
  return result.ok ? result.name : null;
}
