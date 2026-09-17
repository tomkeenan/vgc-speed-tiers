-- Track when a player last changed their name, so renames can be rate-limited (once a week).
-- NULL means they have never renamed (only the initial registration), so the first rename is free.
ALTER TABLE players ADD COLUMN renamed_at INTEGER;
