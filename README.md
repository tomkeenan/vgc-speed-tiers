# VGC Speed Tiers

A small React SPA for drilling Pokemon **speed tiers** in the VGC Champions format - flashcards
and a "who's faster?" game.

## Quickstart

```bash
npm install
npm run sprites    # fetch + optimize Pokemon artwork into src/assets/sprites (see Assets below)
npm run dev        # start the app
npm run check      # typecheck + tests
```

## How it works

A build-time pipeline turns raw sources into one **purely factual** dataset, then the app applies
all the competitive math at runtime:

1. **Roster** - `@pkmn` gives the Champions usage stats (names, usage %, form slugs) → `data/roster.json`.
2. **Dataset** - PokeAPI adds base stats, types, and art → `data/pokemon.json` (facts only, no math).
3. **App** - the React SPA reads the dataset; every interpretation (natures, EVs, Tailwind, stages,
   Scarf, paralysis) lives in one pure module, `src/lib/speed.ts`.

Two frozen contracts (`schema/*.schema.json`) let the stages evolve independently. Because the
dataset is factual, adding a new speed modifier is a code + test change - never a data rebuild.

## Layout

```
schema/         JSON Schema contracts (roster, pokemon)
data/           roster.json, pokemon.json, sprite-sources.json, fixture
tools/          @pkmn + PokeAPI build pipeline (.mjs)
src/lib/        types, speed engine, dataset loader
src/features/   flashcards, faster-game
src/components/ shared UI primitives
```

## Regenerating data (new regulation)

Set `FORMAT` (default `gen9championsvgc2026`) and run `npm run data` (roster → PokeAPI → sprites →
validate). Every Pokemon carries a 1-based `usageRank`; raise `MIN_USAGE` (default `0`) to trim the
long tail. No app changes needed.

## Assets

Pokemon artwork is **not committed** to this repo. `npm run sprites` fetches each official-artwork
PNG from PokeAPI (URLs in `data/sprite-sources.json`), downscales it, and writes optimized WebP into
`src/assets/sprites/`. Until you run it, the app renders name-only placeholders.

## Contributing / agents

Conventions, contracts, and per-agent task briefs live in [`AGENTS.md`](./AGENTS.md).

## License & credits

Code is MIT ([`LICENSE`](./LICENSE)). This is a non-commercial fan project. Pokemon and all related
artwork are © Nintendo / Game Freak / The Pokemon Company; artwork is sourced from
[PokeAPI](https://pokeapi.co) at build time and usage stats from Smogon via
[`@pkmn`](https://github.com/pkmn).
