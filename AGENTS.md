# Agent Harness - VGC Speed Tiers

A small React SPA for learning VGC (Champions format) Pokemon **speed tiers**: flashcards
and a "who's faster?" game.

This file is the contract every agent works to. Read it fully before writing code.

## Golden rules

1. **Respect file ownership** (see agent briefs). Do not edit another agent's files.
2. **The data is factual; the interpretation is code.** `data/pokemon.json` holds only base stats,
   types, sprite, usage. All speed math (tiers, natures, EVs, Tailwind, stages, Scarf) lives in
   `src/lib/speed.ts`. Never bake computed speeds into the dataset.
3. **Build against the frozen contracts**, not against each other: the JSON schema
   (`schema/pokemon.schema.json`), the `src/lib/speed.ts` API, and the fixture
   (`data/pokemon.sample.json`). These do not change without updating this file.
4. **Definition of Done:** `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run format`
   all pass (`npm run check` runs the first three); `npm run dev` boots with no console errors.
5. **Every user-facing string is translated.** Never hardcode display text. Route it through
   `t('namespace.key')` / `<Trans>` and add the key to `src/locales/en.json` (see i18n conventions
   below). `npm run lint` fails on any literal string in JSX; `npm run test` fails if a used key is
   missing from `en.json` or if a locale file drifts out of sync.

## Commands

| Command              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Vite dev server                                  |
| `npm run test`       | Vitest (single run)                              |
| `npm run typecheck`  | `tsc --noEmit`                                   |
| `npm run lint`       | ESLint - fails on hardcoded UI strings           |
| `npm run check`      | typecheck + lint + test (the gate)               |
| `npm run format`     | Prettier write                                   |
| `npm run roster`     | Stage 1: usage stats -> `data/roster.json`       |
| `npm run build:data` | Stage 2: roster + PokeAPI -> `data/pokemon.json` |
| `npm run validate`   | Validate both data files against schemas         |
| `npm run data`       | roster -> build:data -> validate                 |

## Contracts

- **Dataset:** `schema/pokemon.schema.json`, typed in `src/lib/types.ts` (`Dataset`, `Pokemon`).
  Load it only via `src/lib/data.ts` (`getAllPokemon`, `getPokemon`, `getMeta`). Every Pokemon
  carries `usage` (0..1) and `usageRank` (1 = most used); the pool is ordered by usage. `sprite` is
  a local `<id>.webp` filename (self-hosted, optimized), which `src/lib/data.ts` resolves to a
  hashed asset under `src/assets/sprites/`. Regenerate the assets with `npm run sprites` (part of
  `npm run data`); the sources are recorded in `data/sprite-sources.json`.
- **Speed engine (`src/lib/speed.ts`), frozen API:**
  - `computeSpeed({ base, ev?, iv?, nature?, level? }) => number`
  - `applyModifiers(speed, { stage?, tailwind?, choiceScarf?, paralysis?, multiplier? }) => number`
  - `speedTiers(base, level=50) => { min, neutralMax, max }`
  - Level 50 is the VGC default. `min` = 0 EV / 0 IV / negative nature; `neutralMax` = 252 EV /
    31 IV / neutral; `max` = 252 EV / 31 IV / positive nature.
- **Fixture:** `data/pokemon.sample.json` (6 Pokemon, schema-valid, includes a Mega + a form).
  UI work uses the fixture until Agent A ships real data; both share the exact same shape.

## Conventions

- **Languages:** app is TypeScript (`src/**`); pipeline tools are ES modules (`tools/**/*.mjs`).
- **Comments = JSDoc, sparingly.** Only on exported / main functions and components. Concise:
  what it takes, what it returns. Do **not** explain why or how it exists. Example:
  ```ts
  /**
   * Computes the min/neutral-max/max Speed tiers for a base stat.
   * Takes a base Speed and level (default 50), returns SpeedTiers.
   */
  ```
- **Tests = Vitest only.** Keep them simple and minimal. Co-locate as `*.test.ts(x)` next to the
  code. Test behavior, not implementation. Core logic (`speed.ts`) gets real assertions; components
  get a single smoke test.
- **i18n.** All display text lives in `src/locales/en.json`, keyed `namespace.camelCaseKey`, grouped
  by feature (`faster.*`, `settings.*`) or `common.*` for shared strings. Reference keys with
  `t('faster.prompt')` / `<Trans i18nKey="...">`; interpolate with `{{name}}`, and use i18next plural
  suffixes (`key_one` / `key_other`, variable named `count`) for counted strings. Add the key to
  every locale file, not just `en.json` - the parity test fails otherwise. For a rare deliberate
  literal (a symbol or brand term that must not be translated), add
  `// eslint-disable-next-line i18next/no-literal-string` on the line above. The guards are the
  `i18next/no-literal-string` ESLint rule (`eslint.config.js`) and `src/locales/key-parity.test.ts`.
- **Component-first.** One component per file in `src/components/` (shared) or a feature folder.
  Components are small and single-purpose; presentational components take props and do no data
  fetching. Features compose components; no monolithic files.
- **Styling = Material UI (MUI v7), consistent.** All styling goes through the MUI theme in
  `src/theme.ts` and the `sx` prop. There is no Tailwind and no global CSS reset beyond MUI's
  `CssBaseline`. Use theme tokens (the `primary` / `success` / custom `speed` palette keys,
  `text.primary`, `text.secondary`, `background.paper`, `background.default`, `divider`) rather
  than raw hex. Extract repeated markup into a component rather than copy-pasting `sx` blocks.
- **Mobile-first.** Base styles target mobile; use MUI responsive values (`{ xs, sm }`) for larger
  screens. Buttons are full-width on mobile and auto-width from `sm` up. See `Button.tsx`.

> **This is the standard going forward.** MUI + the `src/theme.ts` theme + the `sx` prop is the
> single styling system for all new UI work. Do not reintroduce Tailwind, add a second global CSS
> reset, or hand-roll behavior MUI already provides (e.g. use `CardActionArea` for clickable cards,
> `Skeleton` for loading states, `Autocomplete` for searchable pickers). New look-and-feel is tuned
> in the theme, not re-derived per component. Component tests render through `renderWithTheme`
> (`src/test/`) so the theme context is present.

## Agents (parallel, disjoint file ownership)

### Agent A - Data pipeline

- **Owns:** `tools/**`, `data/roster.json`, `data/pokemon.json`, `tools/lib/name-map.mjs`.
- **Do not touch:** `src/**`, `schema/**`, `data/pokemon.sample.json`.
- **Task:** Run `npm run data`. Iterate `tools/lib/name-map.mjs` overrides until every roster
  entry resolves on PokeAPI and `npm run validate` is green. Deliver a real, complete
  `data/pokemon.json` covering the whole format (`MIN_USAGE` default `0`), each entry carrying a
  1-based `usageRank`. Names with no PokeAPI page go in the `SKIP` set in `build-dataset.mjs`.
  Report: count, any names that needed overrides, and any Pokemon dropped.
- **DoD:** `npm run data` exits 0; `data/pokemon.json` validates and covers the roster.

### Agent C - UI

- **Owns:** `src/App.tsx`, `src/components/**`, `src/features/**`, and UI styling.
- **Do not touch:** `src/lib/**`, `tools/**`, `schema/**`, `data/**`.
- **Task:** Build the two features against the fixture + frozen `speed.ts` API:
  - **Flashcards:** artwork front; flip/click reveals the speed tier (min / neutral-max / max).
  - **Who's Faster?:** two Pokemon, pick the faster by base Speed, reveal + running score.
  - Replace the stub shell in `App.tsx` with real navigation + layout. Mobile-first throughout.
- **DoD:** `npm run typecheck` + `npm run test` pass; `npm run dev` boots clean on mobile widths.
