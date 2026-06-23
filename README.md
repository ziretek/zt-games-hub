# ZT Games Hub

ZT Games Hub is a client-only PWA portal for 27 classic games. It uses Vite, TypeScript, lazy-loaded game modules, localStorage persistence, and Workbox-powered offline support.

## Games

- Board: Chess, Checkers, Connect 4, Tic-Tac-Toe, Othello, Battleship, Gomoku
- Puzzle: Minesweeper, Memory, Hangman, 2048, Simon, Mastermind, Sudoku
- Arcade: Snake, Pong, Breakout, Space Invaders, Flappy Bird, Dino Runner, Count Master
- Word: Wordle, Boggle, Anagrams, Word Search, Typing Test, Spelling Bee

## Features

- Search, category filters, random game launch, recent games, and local favorites
- Difficulty and AI labels on game cards
- Shared per-game Help panels with goals, controls, tips, and local play counts
- Shared Start Game gate with a 3-second pre-game loading state before each game instance initializes
- Responsive mobile-first game layouts with touch controls
- PWA install support and offline asset caching
- Local-only persistence for scores, preferences, recent games, and favorites

## Architecture

- `src/core/registry-data.ts` contains the authoritative game catalog.
- `src/core/registry.ts` stores constructors registered by each game module.
- `src/core/lazy-load.ts` maps game IDs to lazy-loaded chunks with `import.meta.glob`.
- `src/core/hub.ts` renders the launcher, search/filter state, recent games, favorites, help panels, and game navigation.
- `src/core/help-data.ts` stores per-game goals, controls, and tips.
- `src/utils/game-stats.ts` tracks local play counts and last-played dates.
- `src/games/*/index.ts` contains each self-registering game implementation.

There is no backend, database, authentication, or external asset pipeline.

## Scripts

```bash
npm run dev
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run check
```

`npm run check` runs typecheck, unit tests, production build, Playwright smoke tests, and a high-severity npm audit.

## Validation

Unit tests verify registry/storage behavior and game interface compliance. Playwright smoke tests verify that the hub loads, search/filter/favorites/random controls work, game help opens with stats, and every registered game opens from the launcher and returns to the hub.

## Deployment

The app builds to `dist/` with Vite. PWA service worker generation is handled by `vite-plugin-pwa` during production builds.
