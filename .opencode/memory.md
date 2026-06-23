# Memory & System Log

## Constraints
- No Docker/MCP sandboxing available in current environment — code runs locally
- Token budgets apply to sub-agent calls

## Workflow Rules
- **Auto-push:** After every successful commit on `main` branch, automatically run `git push origin main` — no HITL required unless the change touches critical infrastructure (DB schemas, monetization logic, economy math).
- **Cache busting:** Every build automatically gets a unique timestamp-based cache version (`gamehub-assets-{buildVersion}`) in the PWA workbox config. Production builds auto-activate fresh service workers, while dev builds unregister stale localhost service workers and clear old Workbox/gamehub caches so users do not need manual cache clearing.

## Past Failures
- (none recorded)

## Security Vulnerabilities
- (none recorded — audit date: Jun 22, 2026)

## Security Audit — All FIXED
### Dependencies
- `npm audit`: 1 LOW advisory (esbuild on Windows only — N/A on macOS)
### Codebase fixes applied:
- ✅ **MEDIUM** — Added X-Frame-Options: DENY, CSP, X-Content-Type-Options, Referrer-Policy to vercel.json
- ✅ **LOW** — Replaced inline onclick with addEventListener in main.ts
- ✅ **INFO** — Moved playwright from dependencies to devDependencies
- **INFO** (no fix needed) — Game instances on window is intentional for game access; innerHTML uses hardcoded constants

## Active Sprints
- Sprint: Mobile Mode QA Test (completed)
- Sprint: Mobile Mode Fixes (completed)

## Mobile QA Findings — Status

### HIGH Severity (all FIXED)
1. **✅ `touch-action: manipulation` added** to `.game-card`, `.filter-btn`, `.theme-btn`, `#hub-random-btn`, `.install-btn`, `#hub-search-clear`, and all game board cells (`.c4-cell`, `.ms-cell`, `.mem-card`, `.ttt-cell`, `.hang-key`, `.oth-cell`, `.bs-cell`, `.gom-cell`, `.sim-btn`, `.mm-slot`, `.mm-palette-btn`, `.sb-letter`)
2. **✅ Gomoku cells increased** — 720px: 24→28px, 560px: 20→26px, 380px: 16→24px
3. **✅ Battleship cells increased** — 720px: 26→28px, 560px: 22→26px, 380px: 18→24px
4. **✅ Canvas responsive rules added** at 560px and 380px for all canvas games
5. **✅ Sudoku responsive grid added** at all breakpoints (9×1fr grid)
6. **✅ Wordle keyboard keys increased** — min-width 14→22px, height 24→28px at 380px
7. **✅ Minesweeper cells increased** — 560px: 26→28px, 380px: 22→26px
8. **✅ Standalone icon visible on touch** — added `@media (hover: none)` fallback
9. **✅ Snake touch handler added** — `enableTouchOnCanvas` imported and called

### MEDIUM Severity (all FIXED)
- ✅ Chess responsive rules added at 720px (340px board, 28px font)
- ✅ Checkers board bumped 220→230px at 380px (28.75px per cell)
- ✅ Mastermind slots 26→28px at all breakpoints
- ✅ Hangman word display responsive (24px/8px at 560px, 20px/6px at 380px)
- ✅ Word Search word list padding increased (3px 8px → 6px 10px)
- ✅ Spelling Bee letters increased (36→40px at 560px, 30→36px at 380px)

### LOW Severity (fixed)
- ✅ Orphaned `<canvas>` elements removed from index.html (Word Search, Hangman)

## Sprint: Jun 23 — AI Bug Fixes & Mobile Redesign (COMPLETED)

### AI Bugs Fixed
- ✅ **Checkers** — AI toggle button `#vsComputerBtn` not wired to `toggleComputer()` click handler
- ✅ **Chess** — Alpha-beta pruning disabled at top level (`const alpha` never updated through move loop)
- ✅ **Battleship** — PvP mode: P1 ship positions lost on grid reassignment; `p2Move`/`playerMove` used wrong ship grids; `p2Hits` not checked in `checkWin()`
- ✅ **Gomoku** — Init center-move timeout could fire after human already played (added `currentPlayer` + `board[7][7]` guard)
- ✅ **Connect4** — AI toggle button not wired
- ✅ **TicTacToe** — AI toggle button not wired
- ✅ **Pong** — Added AI opponent (right paddle tracks ball); AI toggle button added

### Mobile Thumb-Friendly Redesign
- ✅ **Global controls** — All game action buttons: `min-height: 44px` (was ~26px); back button: `min-height: 44px` (was 29px)
- ✅ **Board cell size bumps at 380px:** Gomoku 22px, Battleship 32px, Connect4 40px, Othello 40px, Minesweeper 36px, Chess 280px board, Checkers 280px board, Sudoku 280px, Mastermind palette 36px
- ✅ **Canvas DPR scaling** — 9 games now retina-sharp (Pong, Breakout, Invaders, Flappy, Dino, PenaltyKicker, Bowling, Archery, Baseball) via `src/utils/dpr.ts`
- ✅ **Wordle keyboard** — Keys 28px min-width (was 22px), 32px height (was 28px)
- ✅ **PWA safe-area insets** — `env(safe-area-inset-top/bottom)` added to `#game-view`, `#game-hub`, `.gw.standalone`
- ✅ **Vertical space reclaimed** — Game view padding 20→16px, header margin 16→12px, wrapper gap 12→8px
- ✅ **New Game buttons** — All 32 button IDs aligned to `{gameId}-new-btn` pattern
- ✅ **Viewport** — Added `maximum-scale=1.0` to prevent iOS auto-zoom
- ✅ **Gomoku overflow** — Fixed 15×15 grid exceeding 380px viewport (gap 1→0px)
- ✅ **Sprint** — Added `touch-action: manipulation`

### Sprint: Jun 23 Late — AI Improvements & Sports Removal (COMPLETED)
- ✅ **Connect4 AI** — Upgraded from one-ply greedy to minimax α-β depth 4
- ✅ **Othello AI** — Upgraded from one-ply heuristic to minimax α-β depth 3 (with mobility + positional evaluation)
- ✅ **Gomoku AI** — Upgraded from heuristic + random to minimax α-β depth 2 (with candidate cell filtering for performance)
- ✅ **Chess AI** — Search depth increased from 3 to 4
- ✅ **AI timer stacking fix** — 7 games: added `clearTimeout` before `setTimeout` in AI schedulers to prevent double-moves (Checkers, Chess, Connect4, Othello, Gomoku, TicTacToe, Battleship)
- ✅ **Pong AI** — Added AI opponent with toggle button
- ✅ **Sports games removed** — Penalty Kicker, Sprint, Bowling, Archery, Baseball deleted (unplayable on mobile). Game count 32→27
- ✅ **Word Search fixed** — Grid was invisible (no CSS for `.ws-grid`, `.ws-cell`, `.ws-selected`). Added full CSS grid layout, touch-action, responsive breakpoints, fixed missing `#ws-turn` element
- ✅ **iOS search zoom** — Replaced `<input>` with `<div contenteditable>` to definitively prevent iOS auto-zoom on focus

## Token Usage
- (tracking started Jun 23 with Token-Optimizer agent)
- Sprint: AI Bug Fixes & Mobile Redesign — estimated ~45 tasks, ~8K input, ~12K output, ~$0.02 total
- Sprint: AI Improvements & Sports Removal — estimated ~25 tasks, ~5K input, ~8K output, ~$0.015 total
- Waste flags: AI timer stacking bug was a pattern that could have been caught earlier (same root cause in 7 games)
