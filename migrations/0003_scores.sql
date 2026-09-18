-- Leaderboard storage. Two tables:
--   best_scores  - one row per (player, board): the current best streak. This is what boards read.
--   scores       - append-only audit log of every submission, for anti-cheat / later analysis.
-- board_key is one of the fixed ranked boards (faster:standard, faster:hard, faster:hard+natures,
-- howfast:standard). Scores reference players.id (the stable key), never the display name.

CREATE TABLE IF NOT EXISTS best_scores (
  player_id   TEXT NOT NULL REFERENCES players(id),
  board_key   TEXT NOT NULL,
  streak      INTEGER NOT NULL,
  achieved_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, board_key)
);

-- Board leaderboard read: top streaks for a board.
CREATE INDEX IF NOT EXISTS idx_best_board ON best_scores (board_key, streak DESC);

CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id  TEXT NOT NULL REFERENCES players(id),
  board_key  TEXT NOT NULL,
  streak     INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Rate-limit lookup: recent submissions by a player.
CREATE INDEX IF NOT EXISTS idx_scores_player_time ON scores (player_id, created_at);
