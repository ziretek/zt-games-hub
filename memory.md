# Memory - ZT Games Hub

This root memory is the quick source of truth for Agent1. The detailed sprint log lives in `.opencode/memory.md`.

## Current State
- ZT Games Hub is a single-page PWA game portal with 27 classic games.
- The app is client-only: Vite, TypeScript, modular self-registering game modules, localStorage persistence, and no backend.
- Sports games were removed on Jun 23, 2026 because they were not mobile-ready: Penalty Kicker, Sprint, Bowling, Archery, and Baseball.
- `src/core/registry-data.ts` is the authoritative game catalog.
- Game modules are lazy-loaded through `import.meta.glob('../games/*/index.ts')`.
- PWA caching is handled by `vite-plugin-pwa` and Workbox. The cache version is timestamp-based per build.
- Game instances are intentionally exposed on `window[id + 'Game']` for launcher control.

## Current Catalog
- Board: Chess, Checkers, Connect 4, Tic-Tac-Toe, Othello, Battleship, Gomoku.
- Puzzle: Minesweeper, Memory, Hangman, 2048, Simon, Mastermind, Sudoku.
- Arcade: Snake, Pong, Breakout, Space Invaders, Flappy Bird, Dino Runner, Count Master.
- Word: Wordle, Boggle, Anagrams, Word Search, Typing Test, Spelling Bee.

## Workflow Rules
- Read this file before routing new feature or sprint work.
- Do not auto-approve changes to database schemas, monetization logic, economy math, or production merges.
- No Docker/MCP sandbox is available in this local environment, so validation runs locally.
- After implementation work, run the relevant validation gate: typecheck, unit tests, build, and browser smoke tests when UI behavior changes.
- If the same implementation bug fails validation 3 consecutive times, pause and request human review.

## Security Notes
- No database, authentication, user accounts, or server-side API.
- localStorage stores non-sensitive scores, preferences, recent games, and favorites.
- `npm audit` currently reports one low advisory noted in `.opencode/memory.md`.
- Security headers are configured in `vercel.json`.

## Recent Completed Work
- Moved fast arcade mobile controls below the playfield so touch buttons do not cover gameplay.
- Fixed CI smoke failures caused by `registration.update()` rejecting after the temporary self-destroying service worker unregisters itself.
- Added a responsive hub footer with brand, copyright, and category chips.
- Temporarily enabled production self-destroying service worker mode to flush already-stuck Vercel browsers out of old PWA caches.
- Added a dev-only `/sw.js` rescue worker so stale localhost service workers can update, clear old caches, unregister themselves, and reload tabs instead of serving previous builds.
- Hardened PWA cache freshness: dev builds unregister stale localhost service workers and clear old Workbox/gamehub caches, while production builds auto-activate fresh service workers.
- Added an in-game Pong countdown: after the shared Start Game loader, Pong now shows a 3-second countdown over the playfield before ball and AI movement begin.
- Fixed PWA update flow: update prompt now activates the waiting service worker, checks for updates periodically, shortens dismiss cooldown, and cleans outdated caches.
- Added a shared Start Game gate so every selected game waits for explicit start, then shows a 3-second loading state before initialization.
- Added shared Help panels for all 27 games with goal, controls, tips, and local play stats.
- Mobile mode QA and mobile fixes are complete.
- AI bugs were fixed for Checkers, Chess, Battleship, Gomoku, Connect4, TicTacToe, and Pong.
- AI timer stacking was fixed across Checkers, Chess, Connect4, Othello, Gomoku, TicTacToe, and Battleship.
- Connect4, Othello, Gomoku, and Chess AI were improved.
- Word Search visibility and touch CSS were fixed.
- iOS search zoom is addressed by keeping the native search input at 16px text size.

## Known Improvement Targets
- Keep hardcoded game counts out of docs and metadata where possible.
- Maintain browser smoke coverage for hub launch, search/filter, random game, favorites, and every game opening from the hub.
- Continue improving local-only progression: stats, achievements, streaks, and save import/export.
- Standardize game controls over time through registry metadata.
