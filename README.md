# ♞ Knight's Tour

A self-contained browser game: guide a knight across a chessboard, visiting every square exactly once.

## Play

Open `index.html` in any modern browser — no server or build step needed.

## How to play

1. Pick a board size (5×5 – 10×10) and difficulty.
2. Click any square to place the knight.
3. Click a highlighted square to move in an L-shape (2+1).
4. Visit every square exactly once to win.

## Features

- **Three hint modes**: show all legal moves, Warnsdorff-ordered hints, or none.
- **Auto-solver**: Warnsdorff-heuristic DFS (capped at 5M nodes) animates a solution from the current position.
- **Undo**: step back as far as you like.
- **Best-time tracking**: per-size best times saved in `localStorage`.
- **Keyboard shortcuts**: `Z` undo, `N` new game.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | HTML structure, links to CSS/JS |
| `style.css` | All styles |
| `app.js` | Game logic (IIFE-scoped) |

## Building / testing

Nothing to build. No dependencies, no CI, no test suite.
