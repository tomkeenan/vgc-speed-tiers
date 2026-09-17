// Player records in D1. A player is one row keyed by the opaque Google subject (auth_sub). We store
// only that hidden key, the chosen display name, and when it was last changed - never the Google
// name, email, or picture.

export interface Player {
  handle: string;
  /** When the name was last changed (epoch ms), or null if never renamed since registration. */
  renamedAt: number | null;
}

export type RegisterResult =
  | { ok: true; handle: string }
  | { ok: false; reason: 'name_taken' }
  | { ok: false; reason: 'already_registered'; handle: string };

export type RenameResult =
  | { ok: true; handle: string; renamedAt: number | null }
  | { ok: false; reason: 'name_taken' }
  | { ok: false; reason: 'cooldown'; nextAt: number }
  | { ok: false; reason: 'not_registered' };

/** Returns the player for a Google subject, or null if they have not registered. */
export async function getPlayerBySub(db: D1Database, sub: string): Promise<Player | null> {
  const row = await db
    .prepare('SELECT handle, renamed_at FROM players WHERE auth_sub = ?')
    .bind(sub)
    .first<{ handle: string; renamed_at: number | null }>();
  return row ? { handle: row.handle, renamedAt: row.renamed_at } : null;
}

/**
 * Registers a new player with a chosen display name. Enforces case-insensitive uniqueness and
 * one registration per Google subject. `handle` must already be normalized/validated.
 */
export async function registerPlayer(
  db: D1Database,
  sub: string,
  handle: string,
): Promise<RegisterResult> {
  const existing = await getPlayerBySub(db, sub);
  if (existing) return { ok: false, reason: 'already_registered', handle: existing.handle };

  const handleLower = handle.toLowerCase();
  if (await isTaken(db, handleLower, sub)) return { ok: false, reason: 'name_taken' };

  try {
    await db
      .prepare(
        'INSERT INTO players (id, auth_sub, handle, handle_lower, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(crypto.randomUUID(), sub, handle, handleLower, Date.now())
      .run();
  } catch (err) {
    // Lost a race for the same name between the check above and the insert.
    if (String(err).includes('UNIQUE')) return { ok: false, reason: 'name_taken' };
    throw err;
  }
  return { ok: true, handle };
}

/**
 * Changes a registered player's display name. Enforces case-insensitive uniqueness (excluding their
 * own row) and a rename cooldown. A case-only change to their own name is always allowed and does
 * not consume the cooldown. `handle` must already be normalized/validated.
 */
export async function renamePlayer(
  db: D1Database,
  sub: string,
  handle: string,
  cooldownMs: number,
): Promise<RenameResult> {
  const row = await db
    .prepare('SELECT handle_lower, renamed_at FROM players WHERE auth_sub = ?')
    .bind(sub)
    .first<{ handle_lower: string; renamed_at: number | null }>();
  if (!row) return { ok: false, reason: 'not_registered' };

  const handleLower = handle.toLowerCase();

  // Re-casing their own name (e.g. "ash" -> "Ash"): allow freely, no cooldown.
  if (handleLower === row.handle_lower) {
    await db.prepare('UPDATE players SET handle = ? WHERE auth_sub = ?').bind(handle, sub).run();
    return { ok: true, handle, renamedAt: row.renamed_at };
  }

  const now = Date.now();
  if (row.renamed_at !== null && now - row.renamed_at < cooldownMs) {
    return { ok: false, reason: 'cooldown', nextAt: row.renamed_at + cooldownMs };
  }
  if (await isTaken(db, handleLower, sub)) return { ok: false, reason: 'name_taken' };

  try {
    await db
      .prepare('UPDATE players SET handle = ?, handle_lower = ?, renamed_at = ? WHERE auth_sub = ?')
      .bind(handle, handleLower, now, sub)
      .run();
  } catch (err) {
    if (String(err).includes('UNIQUE')) return { ok: false, reason: 'name_taken' };
    throw err;
  }
  return { ok: true, handle, renamedAt: now };
}

/** Whether a lowercased handle is already used by a different player. */
async function isTaken(db: D1Database, handleLower: string, sub: string): Promise<boolean> {
  const taken = await db
    .prepare('SELECT 1 FROM players WHERE handle_lower = ? AND auth_sub <> ?')
    .bind(handleLower, sub)
    .first();
  return taken !== null;
}
