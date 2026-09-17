-- Players: one row per Google account. We store only the opaque Google subject (auth_sub) as the
-- hidden account key and the player's chosen display name. No Google name, email, or picture.
CREATE TABLE IF NOT EXISTS players (
  id           TEXT PRIMARY KEY,        -- uuid, minted on registration
  auth_sub     TEXT UNIQUE NOT NULL,    -- Google 'sub' claim; the hidden identity, never displayed
  handle       TEXT NOT NULL,           -- display name as entered (for casing)
  handle_lower TEXT UNIQUE NOT NULL,    -- lowercased handle; enforces case-insensitive uniqueness
  created_at   INTEGER NOT NULL
);
