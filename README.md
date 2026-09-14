# VGC Speed Tiers

A small React SPA for drilling Pokemon **speed tiers** in the VGC Champions format - flashcards
and a "who's faster?" game.

## Architecture

A three-stage, API-first pipeline. Data is made solid before any UI consumes it.

```
Stage 1  @pkmn (build-time)        Stage 2  PokeAPI (build-time)      Stage 3  React SPA (runtime)
─────────────────────────          ────────────────────────          ──────────────────────────
Champions usage stats    ─roster─▶  base stats + types + art ─pokemon─▶  flashcards / faster-game
→ names + usage %         .json     (factual only, no math)    .json     + shared src/lib/speed.ts
→ PokeAPI slug per form
```

Two frozen boundaries let work happen in parallel:

- **`data/roster.json`** - between the `@pkmn` pool generator and the PokeAPI dataset builder.
- **`data/pokemon.json` + `schema/pokemon.schema.json`** - between the data and the UI.

The dataset is **purely factual**. Every competitive interpretation (speed tiers, natures, EVs,
Tailwind, stages, Scarf, paralysis) lives in one pure module, `src/lib/speed.ts`. Adding a new
modifier is a code + test change, never a data regeneration.

## Quickstart

```bash
npm install
npm run dev        # app (uses data/pokemon.json; seeded from the fixture until data is built)
npm run data       # regenerate the real dataset (roster -> PokeAPI -> validate)
npm run check      # typecheck + tests
```

## Layout

```
schema/     JSON Schema contracts (roster, pokemon)
data/       roster.json, pokemon.json, pokemon.sample.json (fixture)
tools/      @pkmn + PokeAPI build-time pipeline (.mjs)
src/lib/    types, speed engine, dataset loader
src/features/  flashcards, faster-game
src/components/ shared UI primitives
```

## Regenerating data / new regulation

Set `FORMAT` (default `gen9championsvgc2026`) and run `npm run data`. By default every Pokemon in
the format's usage stats is pulled (`MIN_USAGE` default `0`); each carries a 1-based `usageRank`
(1 = most used), so the app can order or trim the pool by meta relevance. Raise `MIN_USAGE` (e.g.
`0.01`) to cut the long tail. No app changes needed.

## Contributing / agents

Conventions, contracts, and per-agent task briefs live in [`AGENTS.md`](./AGENTS.md).
