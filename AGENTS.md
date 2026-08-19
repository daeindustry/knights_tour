# KnightsTour — AGENTS.md

## Structure

Three-file app: `index.html`, `style.css`, `app.js`. No build step, no dependencies, no framework.

## Running

Open `index.html` directly in a browser. No server required.

## Key facts

- Board sizes: 5×5 through 12×12 (default 6×6).
- State persisted via `localStorage` (`kt_last_size`, `kt_best_<N>`, `kt-theme`).
- Auto-solver uses Warnsdorff-heuristic DFS, capped at 5M nodes (`app.js:108`).
- Keyboard: arrow keys move focus (roving tabindex tracked in `focusIdx`), `Enter`/`Space` move the knight, `Z` = undo, `N` = new game.
- JS is wrapped in an IIFE for scope isolation.
- Accessibility: cells are `role="button"` with dynamic `aria-label` (square name + state); knight glyph and move numbers are `aria-hidden`; `#toast` is `aria-live="polite"`. Keep `render()`'s label logic in sync when cell states change.
- Theme: `data-theme` on `<html>` (`dark` default, `light` via toggle/persisted `kt-theme`), seeded from `prefers-color-scheme` in `initTheme`. Light theme variables live in `:root[data-theme="light"]` in style.css; generic colors use `--btn`/`--btnHover`/`--field`/`--frame` variables.
- style.css has a `prefers-reduced-motion` guard at the bottom.
- No tests, linter, formatter, or CI configured.
