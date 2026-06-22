import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class MinesweeperGame implements Game {
  readonly id = 'minesweeper';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private statusEl: HTMLElement | null;
  private rows = 9; private cols = 9; private mines = 10;
  private grid: number[][] = [];
  private revealed: boolean[][] = [];
  private flagged: boolean[][] = [];
  private gameOver = false;
  private _firstClick = true;
  private _flagMode = false;

  constructor() {
    this.boardEl = document.getElementById('minesweeper-board')!;
    this.statusEl = document.getElementById('ms-status');
  }

  init(): void {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.gameOver = false; this._firstClick = true;
    this._flagMode = false;
    this.state = 'playing';
    this.render();
  }

  private placeMines(exR: number, exC: number): void {
    let placed = 0;
    while (placed < this.mines) {
      const r = Math.floor(Math.random() * this.rows), c = Math.floor(Math.random() * this.cols);
      if (this.grid[r][c] === -1 || (Math.abs(r - exR) <= 1 && Math.abs(c - exC) <= 1)) continue;
      this.grid[r][c] = -1; placed++;
    }
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (this.grid[r][c] === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === -1) count++;
      }
      this.grid[r][c] = count;
    }
  }

  private reveal(r: number, c: number): void {
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols || this.revealed[r][c] || this.flagged[r][c]) return;
    this.revealed[r][c] = true;
    if (this.grid[r][c] === -1) { this.gameOver = true; if (this.statusEl) { this.statusEl.textContent = '💥 Game Over!'; this.statusEl.style.color = '#ff6b6b'; } this.render(); return; }
    if (this.grid[r][c] === 0) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) this.reveal(r + dr, c + dc);
    this.checkWin();
    this.render();
  }

  private checkWin(): void {
    let total = this.rows * this.cols;
    let revealed = 0;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.revealed[r][c]) revealed++;
    if (total - revealed === this.mines) { this.gameOver = true; if (this.statusEl) { this.statusEl.textContent = '🎉 You Win!'; this.statusEl.style.color = '#4ade80'; } }
  }

  handleClick(r: number, c: number): void {
    if (this.gameOver) return;
    if (this._flagMode) { this.flagged[r][c] = !this.flagged[r][c]; this.render(); return; }
    if (this.flagged[r][c]) return;
    if (this._firstClick) { this.placeMines(r, c); this._firstClick = false; }
    this.reveal(r, c);
  }

  toggleFlag(): void { this._flagMode = !this._flagMode; document.getElementById('ms-flag-btn')!.style.borderColor = this._flagMode ? '#ffd700' : ''; }

  render(): void {
    this.boardEl.innerHTML = '';
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'ms-cell';
      if (this.revealed[r][c]) {
        cell.classList.add('ms-revealed');
        if (this.grid[r][c] === -1) cell.classList.add('ms-mine');
        else if (this.grid[r][c] > 0) { cell.textContent = String(this.grid[r][c]); cell.style.color = ['','#60a5fa','#4ade80','#f472b6','#fbbf24','#fb923c','#f87171','#a78bfa','#e879f9'][this.grid[r][c]]; }
      } else {
        if (this.flagged[r][c]) cell.textContent = '🚩';
      }
      if (!this.gameOver) cell.addEventListener('click', () => this.handleClick(r, c));
      this.boardEl.appendChild(cell);
    }
    if (!this.statusEl) return;
    if (!this.gameOver && !this._firstClick) this.statusEl.textContent = this._flagMode ? '🚩 Flag mode' : '💣 Click to reveal';
    else if (this._firstClick) this.statusEl.textContent = 'Click any cell to start';
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'minesweeper', title: 'Minesweeper', category: 'puzzle', description: 'Avoid the mines', icon: '💣', wrapperId: 'minesweeper-wrapper' },
  MinesweeperGame,
);
