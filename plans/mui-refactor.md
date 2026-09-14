# MUI Refactor Plan

Migrate the hand-built component layer to Material UI (MUI) while keeping the app's current visual identity.

## Decisions (locked)

- **Keep the current look.**
The existing `brand` / `speed` / `correct` / `ink` tokens and the type colors are mapped into an MUI theme rather than adopting Material Design's default palette.
- **Single styling system.**
Tailwind is removed entirely; styling is done through the MUI theme and the `sx` prop.

## Target stack

- **`@mui/material` v7** - the first line with full React 19 support (the app is on React 19.3).
- **`@emotion/react` + `@emotion/styled`** - MUI's default styling engine; mature and has no SSR concerns for this SPA.
- **Remove:** `tailwindcss`, `@tailwindcss/vite`, `prettier-plugin-tailwindcss`.
- **Skip Roboto / `@fontsource`.**
We keep the current look, so the theme keeps the existing `system-ui` font stack.
- **`@mui/icons-material` is optional.**
It is only needed for real +/- glyphs in the Stepper.
Recommendation: skip it and keep text `+` / `−`, one fewer dependency.

## The theme is the whole game

Everything tuned in the last styling pass moves into one `src/theme.ts` (`createTheme`) so it is not re-derived per component.

| Current token | MUI mapping |
| --- | --- |
| `brand` `#ef4444` / dark `#b91c1c` | `palette.primary` |
| `correct` `#16a34a` | `palette.success` (override `.main`) |
| `speed` `#2563eb` / dark `#1d4ed8` | **custom `palette.speed`** (TS module augmentation) |
| `ink` `#18181b` | `text.primary` + the neutral "selected" color |
| `ink-muted` `#71717a` | `text.secondary` |
| `surface` `#fff` / `surface-muted` `#f4f4f5` | `background.paper` / `background.default` |
| rounded-xl / pills | `shape.borderRadius: 12` |
| type colors | stay as the `TYPE_COLORS` data map |

Two theming details preserve the current look, because MUI defaults these to the primary (red) color:

- **Tabs / ToggleButton / Switch "selected" state = neutral ink**, not primary.
This is set via `components` overrides in the theme.
- **`speed` is a custom palette key** used through `sx={{ bgcolor: 'speed.main' }}`.
It needs a small module-augmentation block but no per-component prop override.

## Component mapping

| Current | MUI target | Notes |
| --- | --- | --- |
| `Button` | `Button` | `primary` -> `variant="contained"`, `ghost` -> `variant="outlined"` |
| `Card` | `Card variant="outlined"` + **`CardActionArea`** for clickable cards | CardActionArea provides role=button and keyboard handling for free, which deletes the manual `onKeyDown` / `tabIndex` in Flashcards and FasterGame |
| `TabNav` | `Tabs` + `Tab` (`variant="fullWidth"`) | neutral indicator via theme |
| `StatPill` | thin wrapper over `Box` + `Typography` | emphasis -> `speed.main` |
| `SegmentedControl` | `ToggleButtonGroup` (exclusive, fullWidth) | Nature / EVs |
| `Stepper` | keep custom: `IconButton` x2 + `Typography` | clamp logic unchanged |
| `Toggle` | `Switch` + `FormControlLabel` | neutral track |
| `TypeBadges` | `Chip[]` with per-type `sx` | reuse color + YIQ logic |
| `PokemonImage` | `Box` + **`Skeleton`** + `img` | Skeleton replaces the hand-rolled pulse; keep the load/error state machine |
| Explorer `<select>` (283 items) | **`Autocomplete`** | this folds in the earlier "searchable picker" candidate for free, since we are touching this file anyway |

## Phases

1. **Deps and config.**
Add MUI and Emotion, remove Tailwind.
Strip `tailwind()` from `vite.config.ts`, the plugin from `.prettierrc`, and `@import 'tailwindcss'` + `@theme` from `index.css`.
2. **Theme and providers.**
Write `src/theme.ts` (palette, shape, typography, component overrides, `speed` augmentation).
Wrap `App` in `ThemeProvider` + `CssBaseline` in `main.tsx`.
3. **Shared components, leaf-first.**
Button -> Card -> StatPill -> TypeBadges -> Toggle -> SegmentedControl -> Stepper -> TabNav -> PokemonImage.
4. **Features and App.**
Flashcards, FasterGame, SpeedExplorer (plus Autocomplete), then `App.tsx` layout -> `Container` / `Stack`.
5. **Cleanup and verify.**
Delete residual Tailwind classes, update `AGENTS.md` (the "Styling = Tailwind v4" convention and the component notes), then run `typecheck` / `test` / `format` / `dev`.

## Testing

- Add a `renderWithTheme` helper in `src/test/` that wraps `ThemeProvider`, and route the three existing tests through it.
- The existing tests are behavior-based (`getByText`, `getByRole('button')`), so they should largely survive.
- One to watch: `Button.test.tsx` if it asserts on class names, and MUI `Switch` exposes role `checkbox` (not `switch`) if any test targets the toggle (none currently do).

## Risks and watch-items

- **Version pinning.**
Lock MUI v7.x for React 19 and verify `npm ls react` stays single-versioned.
- **Bundle size grows** (MUI + Emotion), which is fine for this app and tree-shakes under ESM.
- **No dual baseline.**
Because Tailwind is cut entirely, there is no Tailwind-preflight vs MUI-CssBaseline conflict; the one rule is not to reintroduce a global CSS reset.
- **`speed.main` typos fail only at runtime** unless the augmentation is correct, so do the augmentation in Phase 2 before first use.

## Scope

9 components + 3 features + App + config + theme.
This is a contained, one-sitting migration: phases 1-2 are quick, phase 3 is the bulk, and phases 4-5 are mechanical.

## Open questions

- Execute in one focused pass, or stage into separate commits per phase for eyeballing between steps?
- Confirm the Autocomplete searchable picker is rolled into phase 4.
