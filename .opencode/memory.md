# Memory & System Log

## Constraints
- No Docker/MCP sandboxing available in current environment — code runs locally
- Token budgets apply to sub-agent calls

## Past Failures
- (none recorded)

## Security Vulnerabilities
- (none recorded)

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
