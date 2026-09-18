# Account Flag Plan

Let a signed-in player pick a country flag for their account.
The flag is a profile field alongside `displayName`: persisted in D1, hydrated on sign-in, editable from the account menu, and shown next to the name on the leaderboard.

## Decisions (locked)

- **Library: `flag-icons`.**
  SVG-based, so flags render consistently across every OS including Windows (unlike Unicode emoji flags, which Windows renders as letters).
  MUI has no flag set of its own, so a dedicated library is required.
- **Storage format: ISO 3166-1 alpha-2, lowercase** (e.g. `gb`, `jp`).
  This is exactly the suffix `flag-icons` uses (`fi fi-gb`), so no mapping layer is needed.
- **Default is no flag.**
  `NULL` / absent means no flag; the picker includes a "None" option to clear back to this.
- **Free to change, anytime.**
  Unlike display names, flags are non-unique and have no cooldown.
- **Visibility: account menu and leaderboard.**
  Persisted server-side and shown publicly next to the name.

## Open sub-decision (deferred)

The **offered flag set** is not chosen yet:

- **All countries, searchable.**
  Full ISO 3166-1 (~250) in a searchable list; the picker needs a search field.
- **Curated grid.**
  A hand-picked shortlist (e.g. major VGC regions) as a plain grid, no search.

This choice affects only the picker layout and the validator's allow-list.
Every other section below is identical either way.

## 1. Database

- New migration `migrations/0004_player_flag.sql`: `ALTER TABLE players ADD COLUMN flag TEXT;` (nullable, defaults to `NULL`).
- No index - flags are neither queried nor unique.

## 2. Worker (`worker/`)

- `players.ts`:
  - `Player` interface gains `flag: string | null`.
  - `getPlayerBySub` SELECT adds `flag`.
  - New `setPlayerFlag(db, sub, flag)`: `UPDATE players SET flag = ? WHERE auth_sub = ?`; returns a `not_registered` result if no row.
- New shared validator `worker/validateFlag.ts`, imported by both worker and client: `isValidFlag(code)` accepts `null` or a code in the allowed set.
  The allowed set is the deferred flag-set decision.
- `index.ts`: new `POST /api/flag`, authorized by the session cookie (same pattern as `/api/rename`).
  Body `{ flag: string | null }`, validated, returns `{ flag }`.
  No cooldown or uniqueness checks.
- The sign-in (`/api/auth/google`) and `/api/register` responses include `flag` so it hydrates on login (`null` for a fresh registration).

## 3. Leaderboard

- `LeaderboardEntry` in both `worker/scores.ts` and `src/ranked/api.ts` gains `flag: string | null`.
- The leaderboard SELECT (`p.handle AS displayName, ...`) adds `p.flag AS flag`.
- `LeaderboardScreen.tsx` renders the flag next to each name; the `DEV_NAMES` mock in `api.ts` gets sample flags.

## 4. Frontend auth (`src/auth/AuthContext.tsx`)

- `AuthUser` gains `flag: string | null`; `loadStored` and the persist effect include it.
  This is backward-compatible: an existing stored user with no `flag` defaults to `null`.
- `AuthApi` gains `setFlag(flag: string | null): Promise<void>`, implemented like `rename`: POST `/api/flag`, then update user state.

## 5. Account menu UI (`src/components/`)

- Add the `flag-icons` dependency; import `flag-icons/css/flag-icons.min.css` once in `main.tsx`.
- New `FlagIcon.tsx`: renders `<span className={`fi fi-${code}`} />` with sizing, plus a "none" placeholder state.
- New flag picker (Popover or Dialog): lists the offered flags plus a "None" option to clear; selecting calls `setFlag`.
  Layout depends on the deferred flag-set decision (searchable list vs plain grid).
- In `AccountMenu.tsx`, add a flag row in the signed-in block near the display name, showing the current flag or the "no flag" placeholder, opening the picker.
- New i18n keys (`account.flag`, `account.chooseFlag`, `account.noFlag`, ...) added to every locale file.
  `src/locales/key-parity.test.ts` enforces parity, so all locales must be updated together.

## 6. Tests

- Worker: `setPlayerFlag` get/set, `/api/flag` validation (rejects invalid code, `null` clears, not-registered path), and a validator unit test.
- `AccountMenu.test.tsx`: picker opens, selecting sets the flag, None clears it.
- `LeaderboardScreen.test.tsx`: flag renders next to a name.
- `key-parity.test.ts`: passes with the new keys.
