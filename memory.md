# Memory — ZT Games Hub

## Project Identity
- **Name:** ZT Games Hub
- **Type:** Single-page PWA game portal with 31 classic games
- **Architecture:** Modular TypeScript (31 self-registering game modules), Vite-bundled, no backend
- **Storage:** localStorage for high scores and game state
- **PWA:** service-worker.js with cache-first strategy (`gamehub-v1` cache)

## Past Failures & Resolved Issues
1. **README & manifest mislabeled as "calculator"** → Fixed: rewritten to describe Game Hub
2. **Service worker `activate` deleted ALL caches** → Fixed: now filters only old caches
3. **AnagramsGame._getSolvedCount() always returned 0** → Fixed: returns `this.foundCount || 0`
4. **Animation loops in Baseball/Bowling/Archery/Basketball/Boggle had `if (true)`** → Fixed: replaced with `if (this._looping)` flag
5. **Game count displayed 37 but only 31 registered** → Fixed: now dynamic via `GAMES.length`
6. **Empty pause() stubs leaked event listeners** → Fixed: Game2048 removes keydown handler on pause
7. **PWA_GUIDE.md referenced "calculator"** → Fixed: updated to "Game Hub"
8. **game2048 id mismatch (class `id = '2048'` vs registry `id: 'game2048'`)** → Fixed: class id and registerGame call both use `'game2048'`
9. **Game interface compliance tests had 29 failures** → Fixed: mocked `HTMLCanvasElement.prototype.getContext`, `setLineDash`, and canvas element creation in jsdom test environment. All 356 tests now passing.

## Known Constraints
- No backend API — all logic is client-side
- Some games lack touch/mobile controls
- `_looping` flag pattern only applied to canvas-based games with `if (true)` bug; other games use `gameOver` check
- Agent1 (Lead Producer) supports both conversational and JSON output modes

## Security Notes
- No database or server-side code — no SQL injection risk
- localStorage used for high scores — no sensitive data stored
- No authentication or user accounts
- Third-party assets: none loaded externally

## Current State (as of Sprint 1 complete)
- **All 31 games migrated** from monolithic `script.js` to `src/games/<name>/index.ts` — each implements `Game` interface and self-registers via `registerGame()`
- **Vite bundler configured** — `npm run build` succeeds (41 modules → 126 kB JS + 42 kB CSS)
- **Vitest test suite** — 3 test files, 356 tests all passing:
  - `src/core/__tests__/registry.test.ts` — 7/7 passing
  - `src/core/__tests__/storage.test.ts` — 7/7 passing
  - `src/games/__tests__/game-interface.test.ts` — 342/342 passing (metadata, instantiation, interface methods, lifecycle transitions for all 31 games)
- **TypeScript** — `tsc --noEmit` passes on source code; minor type issues in test files (GameConstructor typing, module index type narrowing)
- **Cleanup** — empty `2048/` directory and stale `src/games/index.ts` barrel file removed
- **Agent1.md updated** — now supports dual-mode: conversational (with user) and JSON task-routing (with sub-agents)

## Module Architecture
- `src/core/game.ts` — `Game` interface (`id`, `state`, `init/pause/resume/destroy/render`)
- `src/core/types.ts` — shared type definitions (`GameState`, `GameEntry`, `GameInfo`, `GameConstructor`)
- `src/core/registry.ts` — `registerGame()`, `getGameConstructor()`, `getGameInfo()`, `getAllGameInfos()`, `clearRegistry()`
- `src/core/registry-data.ts` — `GAMES[]` (31 entries) + `CATEGORIES` data
- `src/core/hub.ts` — hub rendering, navigation, filter/search, theme controls
- `src/core/backgrounds.ts` — 3 background themes + `switchTheme()`
- `src/utils/storage.ts` — localStorage helpers
- `src/utils/touch.ts` — touch event helpers
- `src/main.ts` — entry point wiring (theme, filter, search, random button)

## Touch/Mobile UX (Sprint 2 Work)
- **5 sports games (archery, baseball, basketball, bowling, penaltykicker) were completely non-interactive** — exposed `setAim()`, `shoot()` etc. but bound zero mouse/touch/keyboard events. Fixed: each now binds canvas mousemove/click in `init()`, cleans up in `destroy()`, and calls `enableTouchOnCanvas()` for touch translation.
- **enableTouchOnCanvas wired** into all remaining canvas games (breakout, dino, flappy, pong, invaders) so touch events translate to mouse events on those canvases.
- **Pong** gained mousemove/touch control for paddle 1 (player).
- **Invaders** gained mousemove (player position) + click (shoot) touch controls.
- **Game2048** gained swipe detection (touchstart/touchend → direction → move).
- **Remaining keyboard-only DOM games** (boggle, countmaster, sprint, wordle) still need mobile controls.
- Some games inherently keyboard-first (typingtest, spellingbee) — may not need touch adaptations.

## Critical Bug Fixes (Hub UI Audit)
- **No game instances were ever created** — `script.js` used to do `window.checkersGame = new CheckersGame()` globally. The modular system imported/registered games but never instantiated them. Fixed: `showGame()` in hub.ts now calls `getGameConstructor(id)` from the registry, creates an instance, stores it on `window[id + 'Game']`, and calls `init()`.
- **Back button** (`onclick="showHub()"`) broken — modules don't expose globals. Fixed: changed to `id="back-btn"`, wired via `addEventListener` in main.ts.
- **Checkers "Play Again"** (`onclick="window.checkersGame.newGame()"`) broken. Fixed: changed to `id="checkers-play-again"`, wired in main.ts.
- **Dead standalone links** in game cards — pointed to `${id}.html` pages that don't exist. Removed from `buildHub()`.
