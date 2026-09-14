# Agent Harness - VGC Speed Tiers

A small React SPA for learning VGC (Champions format) Pokemon **speed tiers**: flashcards,
a "who's faster?" game, and a speed explorer with nature/EV/field-effect modifiers.

This file is the contract every agent works to. Read it fully before writing code.

## Golden rules

1. **Respect file ownership** (see agent briefs). Do not edit another agent's files.
2. **The data is factual; the interpretation is code.** `data/pokemon.json` holds only base stats,
   types, sprite, usage. All speed math (tiers, natures, EVs, Tailwind, stages, Scarf) lives in
   `src/lib/speed.ts`. Never bake computed speeds into the dataset.
3. **Build against the frozen contracts**, not against each other: the JSON schema
   (`schema/pokemon.schema.json`), the `src/lib/speed.ts` API, and the fixture
   (`data/pokemon.sample.json`). These do not change without updating this file.
4. **Definition of Done:** `npm run typecheck`, `npm run test`, and `npm run format` all pass;
   `npm run dev` boots with no console errors.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run test` | Vitest (single run) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |
| `npm run roster` | Stage 1: usage stats -> `data/roster.json` |
| `npm run build:data` | Stage 2: roster + PokeAPI -> `data/pokemon.json` |
| `npm run validate` | Validate both data files against schemas |
| `npm run data` | roster -> build:data -> validate |

## Contracts

- **Dataset:** `schema/pokemon.schema.json`, typed in `src/lib/types.ts` (`Dataset`, `Pokemon`).
  Load it only via `src/lib/data.ts` (`getAllPokemon`, `getPokemon`, `getMeta`). Every Pokemon
  carries `usage` (0..1) and `usageRank` (1 = most used); the pool is ordered by usage.
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
- **Component-first.** One component per file in `src/components/` (shared) or a feature folder.
  Components are small and single-purpose; presentational components take props and do no data
  fetching. Features compose components; no monolithic files.
- **Styling = Tailwind v4, consistent.** Use utility classes and the shared tokens in
  `src/index.css` (`bg-surface`, `text-ink`, `bg-brand`, ...). Extract repeated markup into a
  component rather than copy-pasting class strings.
- **Mobile-first.** Base styles target mobile; add `sm:` / `md:` for larger screens. Buttons and
  images are full-width on mobile (`w-full sm:w-auto`, `w-full` images). See `Button.tsx`.

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
- **Task:** Build the three features against the fixture + frozen `speed.ts` API:
  - **Flashcards:** artwork front; flip/click reveals the speed tier (min / neutral-max / max).
  - **Who's Faster?:** two Pokemon, pick the faster, reveal + running score.
  - **Speed Explorer:** pick a Pokemon; toggle nature / EVs / Tailwind / stage / Choice Scarf /
    paralysis and show the live Speed via `applyModifiers`.
  - Replace the stub shell in `App.tsx` with real navigation + layout. Mobile-first throughout.
- **DoD:** `npm run typecheck` + `npm run test` pass; `npm run dev` boots clean on mobile widths.
