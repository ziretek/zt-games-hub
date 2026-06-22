import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

type Difficulty = 'easy' | 'medium' | 'hard';

const CELLS_TO_REMOVE: Record<Difficulty, number> = {
  easy: 36,
  medium: 46,
  hard: 56,
};

export class SudokuGame implements Game {
  readonly id = 'sudoku';
  state: GameState = 'idle';

  private boardEl: HTMLElement | null;
  private timerEl: HTMLElement | null;
  private diffEl: HTMLElement | null;
  private mistakesEl: HTMLElement | null;
  private newBtn: HTMLElement | null;

  private solution: number[][] = [];
  private puzzle: number[][] = [];
  private userGrid: number[][] = [];
  private isGiven: boolean[][] = [];

  private difficulty: Difficulty = 'easy';
  private selectedRow = -1;
  private selectedCol = -1;
  private timer = 0;
  private mistakes = 0;
  private maxMistakes = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private won = false;

  private _boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private _boundNewGame: (() => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('sudoku-board');
    this.timerEl = document.getElementById('sudoku-timer');
    this.diffEl = document.getElementById('sudoku-diff');
    this.mistakesEl = document.getElementById('sudoku-mistakes');
    this.newBtn = document.getElementById('sudoku-new-btn');
  }

  init(): void {
    this.selectedRow = -1;
    this.selectedCol = -1;
    this.timer = 0;
    this.mistakes = 0;
    this.won = false;
    this.maxMistakes = this.difficulty === 'hard' ? 3 : 0;
    this.generatePuzzle();
    this.state = 'playing';
    this.updateTimer();
    this.updateMistakes();
    this.render();
    this.startTimer();

    if (!this._boundKeydown) {
      this._boundKeydown = (e: KeyboardEvent) => {
        if (this.state !== 'playing' || this.won) return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 9) {
          e.preventDefault();
          this.placeNumber(n);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          this.moveSelection(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          this.clearCell();
        }
      };
      document.addEventListener('keydown', this._boundKeydown);
    }

    if (this.newBtn && !this._boundNewGame) {
      this._boundNewGame = () => this.init();
      this.newBtn.addEventListener('click', this._boundNewGame);
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.updateTimer();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimer(): void {
    if (this.timerEl) {
      const m = Math.floor(this.timer / 60);
      const s = this.timer % 60;
      this.timerEl.textContent = `Time: ${m}:${s.toString().padStart(2, '0')}`;
    }
  }

  private updateMistakes(): void {
    if (this.mistakesEl) {
      if (this.difficulty === 'hard') {
        this.mistakesEl.textContent = `Mistakes: ${this.mistakes}/${this.maxMistakes}`;
        this.mistakesEl.style.display = '';
      } else {
        this.mistakesEl.style.display = 'none';
      }
    }
  }

  // Sudoku generation

  private generatePuzzle(): void {
    this.solution = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.puzzle = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.userGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
    this.isGiven = Array.from({ length: 9 }, () => Array(9).fill(false));

    for (let box = 0; box < 3; box++) {
      this.fillBox(box * 3, box * 3);
    }
    this.solveSudoku(this.solution);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this.puzzle[r][c] = this.solution[r][c];
      }
    }

    const cellsToRemove = CELLS_TO_REMOVE[this.difficulty];
    const positions: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= cellsToRemove) break;
      this.puzzle[r][c] = 0;
      removed++;
    }

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.puzzle[r][c] !== 0) {
          this.isGiven[r][c] = true;
          this.userGrid[r][c] = this.puzzle[r][c];
        }
      }
    }
  }

  private fillBox(startRow: number, startCol: number): void {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    let idx = 0;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        this.solution[r][c] = nums[idx++];
      }
    }
  }

  private findEmpty(grid: number[][]): [number, number] | null {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  private isValid(grid: number[][], row: number, col: number, num: number): boolean {
    for (let c = 0; c < 9; c++) {
      if (grid[row][c] === num) return false;
    }
    for (let r = 0; r < 9; r++) {
      if (grid[r][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  }

  private solveSudoku(grid: number[][]): boolean {
    const empty = this.findEmpty(grid);
    if (!empty) return true;
    const [row, col] = empty;
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    for (const num of nums) {
      if (this.isValid(grid, row, col, num)) {
        grid[row][col] = num;
        if (this.solveSudoku(grid)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  // Interaction

  private selectCell(row: number, col: number): void {
    if (this.state !== 'playing') return;
    this.selectedRow = row;
    this.selectedCol = col;
    this.render();
  }

  private moveSelection(key: string): void {
    let r = this.selectedRow;
    let c = this.selectedCol;
    if (r < 0 || c < 0) {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (!this.isGiven[i][j]) {
            this.selectCell(i, j);
            return;
          }
        }
      }
      return;
    }
    switch (key) {
      case 'ArrowUp': r = Math.max(0, r - 1); break;
      case 'ArrowDown': r = Math.min(8, r + 1); break;
      case 'ArrowLeft': c = Math.max(0, c - 1); break;
      case 'ArrowRight': c = Math.min(8, c + 1); break;
    }
    this.selectCell(r, c);
  }

  private placeNumber(n: number): void {
    if (this.state !== 'playing' || this.won) return;
    const r = this.selectedRow;
    const c = this.selectedCol;
    if (r < 0 || c < 0) return;
    if (this.isGiven[r][c]) return;

    if (n !== this.solution[r][c]) {
      if (this.difficulty === 'hard') {
        this.mistakes++;
        this.updateMistakes();
        this.userGrid[r][c] = n;
        this.render();
        if (this.mistakes >= this.maxMistakes) {
          this.state = 'lost';
          this.stopTimer();
          setTimeout(() => this.showOverlay(false), 500);
        }
      } else {
        this.userGrid[r][c] = n;
        this.render();
      }
      return;
    }

    this.userGrid[r][c] = n;
    this.render();

    if (this.checkWin()) {
      this.won = true;
      this.state = 'won';
      this.stopTimer();
      setTimeout(() => this.showOverlay(true), 400);
    }
  }

  private clearCell(): void {
    if (this.state !== 'playing') return;
    const r = this.selectedRow;
    const c = this.selectedCol;
    if (r < 0 || c < 0) return;
    if (this.isGiven[r][c]) return;
    this.userGrid[r][c] = 0;
    this.render();
  }

  private checkWin(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.userGrid[r][c] !== this.solution[r][c]) return false;
      }
    }
    return true;
  }

  private showOverlay(won: boolean): void {
    if (!this.boardEl) return;
    const existing = this.boardEl.querySelector('.sudoku-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'sudoku-overlay';

    const text = document.createElement('div');
    text.className = 'sudoku-overlay-text';
    text.textContent = won ? 'You Win!' : 'Game Over';

    const info = document.createElement('div');
    info.className = 'sudoku-overlay-info';
    const m = Math.floor(this.timer / 60);
    const s = this.timer % 60;
    info.textContent = `Time: ${m}:${s.toString().padStart(2, '0')}`;

    const btn = document.createElement('button');
    btn.className = 'sudoku-overlay-btn';
    btn.textContent = 'Play Again';
    const handlePlayAgain = () => {
      overlay.remove();
      this.init();
    };
    btn.addEventListener('click', handlePlayAgain);
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handlePlayAgain();
    }, { passive: false });

    overlay.appendChild(text);
    overlay.appendChild(info);
    overlay.appendChild(btn);
    this.boardEl.appendChild(overlay);
  }

  // Difficulty

  private setDifficulty(d: Difficulty): void {
    this.difficulty = d;
    this.maxMistakes = d === 'hard' ? 3 : 0;
    if (this.diffEl) {
      this.diffEl.textContent = d.charAt(0).toUpperCase() + d.slice(1);
    }
    this.init();
  }

  // Render

  render(): void {
    if (!this.boardEl) return;
    this.boardEl.innerHTML = '';
    this.boardEl.style.touchAction = 'manipulation';
    this.boardEl.style.position = 'relative';

    const grid = document.createElement('div');
    grid.className = 'sudoku-grid';
    grid.style.cssText = [
      'display:grid',
      'grid-template-columns:repeat(9,1fr)',
      'gap:0',
      'width:min(90vw,360px)',
      'height:min(90vw,360px)',
      'border:2px solid rgba(255,255,255,0.6)',
      'user-select:none',
      'touch-action:manipulation',
    ].join(';');

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        const value = this.userGrid[r][c];
        const isGiven = this.isGiven[r][c];
        const isSelected = r === this.selectedRow && c === this.selectedCol;
        const selVal = this.selectedRow >= 0 && this.selectedRow < 9 && this.selectedCol >= 0 && this.selectedCol < 9
          ? this.userGrid[this.selectedRow][this.selectedCol]
          : 0;
        const isSameNumber = selVal !== 0 && value === selVal && value !== 0;
        const isConflict = value !== 0 && value !== this.solution[r][c];

        const isRightBorder = (c + 1) % 3 === 0 && c < 8;
        const isBottomBorder = (r + 1) % 3 === 0 && r < 8;

        let bg = 'rgba(255,255,255,0.03)';
        if (isSelected) bg = 'rgba(124,58,237,0.45)';
        else if (isSameNumber) bg = 'rgba(124,58,237,0.2)';

        cell.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:center',
          `font-size:clamp(14px,4vw,22px)`,
          `font-weight:${isGiven ? '700' : '500'}`,
          `color:${isGiven ? '#fff' : isConflict ? '#ff6b6b' : '#4ade80'}`,
          `background:${bg}`,
          `border-right:${isRightBorder ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)'}`,
          `border-bottom:${isBottomBorder ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)'}`,
          'cursor:pointer',
          'user-select:none',
          'touch-action:manipulation',
          'transition:background 0.1s',
        ].join(';');
        cell.textContent = value !== 0 ? String(value) : '';

        const handleSelect = () => this.selectCell(r, c);
        cell.addEventListener('click', handleSelect);
        cell.addEventListener('touchstart', (e) => {
          e.preventDefault();
          handleSelect();
        }, { passive: false });

        grid.appendChild(cell);
      }
    }

    this.boardEl.appendChild(grid);

    const palette = document.createElement('div');
    palette.className = 'sudoku-palette';
    palette.style.cssText = [
      'display:flex',
      'gap:4px',
      'margin-top:12px',
      'touch-action:manipulation',
      'user-select:none',
      'flex-wrap:wrap',
      'justify-content:center',
    ].join(';');

    for (let n = 1; n <= 9; n++) {
      const btn = document.createElement('div');
      btn.textContent = String(n);
      btn.style.cssText = [
        'width:36px',
        'height:36px',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'font-size:18px',
        'font-weight:700',
        'border-radius:6px',
        'background:rgba(255,255,255,0.1)',
        'color:#fff',
        'cursor:pointer',
        'user-select:none',
        'touch-action:manipulation',
        'transition:background 0.15s',
      ].join(';');

      const handleNum = () => this.placeNumber(n);
      btn.addEventListener('click', handleNum);
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleNum();
      }, { passive: false });

      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.2)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.1)'; });

      palette.appendChild(btn);
    }

    this.boardEl.appendChild(palette);

    const diffRow = document.createElement('div');
    diffRow.className = 'sudoku-diff-selector';
    diffRow.style.cssText = [
      'display:flex',
      'gap:8px',
      'margin-top:10px',
      'touch-action:manipulation',
      'user-select:none',
      'flex-wrap:wrap',
      'justify-content:center',
    ].join(';');

    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    for (const d of difficulties) {
      const btn = document.createElement('button');
      btn.textContent = d.charAt(0).toUpperCase() + d.slice(1);
      const isActive = d === this.difficulty;
      btn.style.cssText = [
        'padding:6px 14px',
        'border-radius:6px',
        `border:1px solid ${isActive ? '#4ade80' : 'rgba(255,255,255,0.2)'}`,
        `background:${isActive ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)'}`,
        'color:#fff',
        'cursor:pointer',
        'font-size:12px',
        'font-weight:600',
        'user-select:none',
        'touch-action:manipulation',
        'transition:all 0.15s',
      ].join(';');

      const handleDiff = () => this.setDifficulty(d);
      btn.addEventListener('click', handleDiff);
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDiff();
      }, { passive: false });

      diffRow.appendChild(btn);
    }

    this.boardEl.appendChild(diffRow);
  }

  pause(): void {
    this.stopTimer();
  }

  resume(): void {
    if (this.state === 'playing') {
      this.startTimer();
    }
  }

  destroy(): void {
    this.stopTimer();
    if (this._boundKeydown) {
      document.removeEventListener('keydown', this._boundKeydown);
      this._boundKeydown = null;
    }
    this._boundNewGame = null;
  }
}

registerGame(
  { id: 'sudoku', title: 'Sudoku', category: 'puzzle', description: 'Classic number puzzle', icon: '🧩', wrapperId: 'sudoku-wrapper' },
  SudokuGame,
);
