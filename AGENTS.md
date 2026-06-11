# KnightsTour — AGENTS.md

## Structure

Three-file app: `index.html`, `style.css`, `app.js`. No build step, no dependencies, no framework.

## Running

Open `index.html` directly in a browser. No server required.

## Key facts

- Board sizes: 5×5 through 10×10 (default 6×6).
- State persisted via `localStorage` (`kt_last_size`, `kt_best_<N>`).
- Auto-solver uses Warnsdorff-heuristic DFS, capped at 5M nodes (`app.js:108`).
- Keyboard shortcuts: `Z` = undo, `N` = new game.
- JS is wrapped in an IIFE for scope isolation.
- No tests, linter, formatter, or CI configured.
