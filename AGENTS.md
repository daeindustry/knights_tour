# KnightsTour — AGENTS.md

## Structure

Single-file app: `knights_tour.html`. All HTML, CSS, and JS are inline. No build step, no dependencies, no framework.

## Running

Open `knights_tour.html` directly in a browser. No server required.

## Key facts

- Board sizes: 5×5 through 10×10 (default 6×6).
- State persisted via `localStorage` (`kt_last_size`, `kt_best_<N>`).
- Auto-solver uses Warnsdorff-heuristic DFS, capped at 5M nodes (`knights_tour.html:287`).
- Keyboard shortcuts: `Z` = undo, `N` = new game.
- No tests, linter, formatter, or CI configured.
