# Memory — ZT Games Hub

## Project Identity
- **Name:** ZT Games Hub
- **Type:** Single-page PWA game portal with 33 classic games
- **Architecture:** Modular TypeScript (33 self-registering game modules, lazy-loaded via `import.meta.glob`), Vite-bundled, no backend
- **Storage:** localStorage for high scores and game state
- **PWA:** service-worker.js v2 with cache-first runtime strategy (`gamehub-v2` cache)

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
10. **Chess/Sudoku tests failing (3 of 378)** → ChessGame constructor used non-null assertions (`!`) on `getElementById` calls for `chess-status`, `chess-captured`, `chess-new-btn` — elements not in the test's DOM mock. Fixed: added missing IDs to test's `allIds` array. Sudoku was safe (used `HTMLElement | null` with guards).

## Known Constraints
- No backend API — all logic is client-side
- `_looping` flag pattern only applied to canvas-based games with `if (true)` bug; other games use `gameOver` check
- Agent1 (Lead Producer) supports both conversational and JSON output modes
- All 31 legacy standalone HTML pages removed; `index.html` is the sole entry point

## Security Notes
- No database or server-side code — no SQL injection risk
- localStorage used for high scores — no sensitive data stored
- No authentication or user accounts
- Third-party assets: none loaded externally

## Current State (Full Sweep Audit Complete)
- **All 33 games migrated** — 31 original + Chess (full AI engine) + Sudoku (puzzle generator), each implementing `Game` interface and self-registering
- **Lazy-loaded code-splitting** via `import.meta.glob('../games/*/index.ts')` — 33 individual game chunks (2–9 kB each), main JS payload dropped from 142 kB → 2.24 kB
- **Leaderboard module** (`src/utils/leaderboard.ts`) — top-10 per-game scores via `loadJson`/`saveJson`
- **Vite bundler configured** — `npm run build` succeeds (45 modules → ~2.2 kB main JS + 33 game chunks + ~46 kB CSS)
- **Vitest test suite** — 3 test files, 378 tests all passing:
  - `src/core/__tests__/registry.test.ts` — 7/7 passing
  - `src/core/__tests__/storage.test.ts` — 7/7 passing
  - `src/games/__tests__/game-interface.test.ts` — 364/364 passing (metadata, instantiation, interface methods, lifecycle transitions for all 33 games)
- **TypeScript** — `tsc --noEmit`: zero errors across entire codebase
- **Mobile touch controls** on all 33 games (canvas + DOM)
- **PWA** — service-worker.js v2 (cache-first runtime, `skipWaiting()`, `clients.claim()`), manifest v2 (maskable icons, 512x512, categories), iOS meta tags, install prompt
- **Accessibility** — ARIA roles/attributes on game cards, theme switcher, filter buttons; focus management; `aria-live` regions on key status displays
- **UI/UX polish** — button active states, hover guards on touch, hub↔game CSS crossfade, search clear button, theme transition via canvas snapshot overlay
- **CI/CD** — GitHub Actions workflow committed
- **Git repo initialized** on `main` with multiple commits

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

## Touch/Mobile UX (Sprint 2 & 3 Work)
- **All 4 remaining keyboard-only DOM games** (boggle, countmaster, sprint, wordle) now have mobile touch controls.
  - **Boggle**: `touchstart` on grid cells, Submit, and Clear buttons with `preventDefault` to eliminate 300ms tap delay.
  - **CountMaster**: `touchstart` on all numeric keypad buttons; added on-screen Backspace/⌫ button (was missing entirely).
  - **Sprint**: Already had touch handlers but were dead code (null `boardEl`). Changed `passive: true → false + preventDefault` to prevent scroll interference. Added a visual "HOLD TO RUN" button for mobile.
  - **Wordle**: `touchstart` on all QWERTY keys, Enter, and Backspace with `touchAction: manipulation`.
- **Critical structural fix**: All 4 games had `boardEl` and `turnEl` references pointing to non-existent DOM elements. Added `#X-board` divs and corrected turn-element IDs in `index.html`.
- Typingtest and spellingbee inherently keyboard-first — may not need touch adaptations.

## Critical Bug Fixes (Hub UI Audit)
- **No game instances were ever created** — `script.js` used to do `window.checkersGame = new CheckersGame()` globally. The modular system imported/registered games but never instantiated them. Fixed: `showGame()` in hub.ts now calls `getGameConstructor(id)` from the registry, creates an instance, stores it on `window[id + 'Game']`, and calls `init()`.
- **Back button** (`onclick="showHub()"`) broken — modules don't expose globals. Fixed: changed to `id="back-btn"`, wired via `addEventListener` in main.ts.
- **Checkers "Play Again"** (`onclick="window.checkersGame.newGame()"`) broken. Fixed: changed to `id="checkers-play-again"`, wired in main.ts.
- **Dead standalone links** in game cards — pointed to `${id}.html` pages that don't exist. Removed from `buildHub()`.

## Full Sweep Audit Fixes (June 2026 Sprint)

### Sprint 1 — PWA Overhaul
- Integrated `vite-plugin-pwa` (Workbox `generateSW`): auto-generated SW pre-caches all 45 assets (~240 KB)
- Cache-first for hashed JS/CSS, NetworkFirst for HTML navigation
- Auto-update flow — eliminates manual reinstall requirement
- Real SVG icons in `public/` replacing broken data URIs
- `localStorage` writes/reads wrapped in try/catch
- Global error handler (`window.onerror` + `unhandledrejection`) with user-facing toast
- Removed old `manifest.json` and `service-worker.js` (plugin generates both)

### Sprint 2 — DOM Container Fixes
- Added 12 missing `#X-board` divs to `index.html` (10 canvas games + anagrams + wordsearch)
- Fixed wrong DOM IDs in 6 games (hangman, minesweeper, game2048, simon, mastermind, anagrams/wordsearch)

### Sprint 3 — Lifecycle Bug Fixes
- **Boggle/Snake/Countmaster/Simon** — `resume()` correctly restarts timers/loops
- **Snake/Chess/Checkers** — event listeners use guard pattern + proper cleanup in `destroy()`
- **Memory** — flip timeout cleared in `init()`
- **Hub** — game instances destroyed and `window[key]` deleted on navigation

### Sprint 4 — Performance
- Background canvas + all 10 canvas games pause RAF on `document.hidden`
- Sprint game: DOM elements created once in `init()`, `render()` updates textContent only
- `will-change: transform` added to all animated canvas elements

### Sprint 5 — Code Quality
- Removed dead exports (`destroyBackground`, `getActiveFilter`, `StorageData`) and dead files (`leaderboard.ts`, empty stubs)
- Fixed `import type` ordering in `connect4/index.ts`
- Game load failures now show user-facing error message
- Updated README (modular architecture, removed "No dependencies" claims)

### Sprint 6 — Security/CI
- `.gitignore` updated with `.env`/`.env.*` patterns
- `tests/smoke.spec.js` — hardcoded path replaced with `__dirname`
- CI workflow expanded: added `npm audit --audit-level=high`
- Lockfile regenerated (previously mislabeled "Web Calculator")
