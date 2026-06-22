import type { Game } from '../../core/game.js';
import { registerGame } from '../../core/registry.js';

export class Connect4Game implements Game {
  readonly id = 'connect4';
  state: GameState = 'idle';
  private ROWS = 6; private COLS = 7;
  board: (string | null)[][] = [];
  currentPlayer: 'red' | 'yellow' = 'red';
  private gameOver = false;
  private winner: string | null = null;
  private previewCol = -1;
  aiEnabled = false;
  private _aiTimer: ReturnType<typeof setTimeout> | null = null;
  private _boundClick: ((e: MouseEvent) => void) | null = null;
  private _boundMove: ((e: MouseEvent) => void) | null = null;
  private _boundLeave: ((e: MouseEvent) => void) | null = null;

  init(): void {
    this.board = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(null));
    this.currentPlayer = 'red'; this.gameOver = false; this.winner = null; this.previewCol = -1;
    this.state = 'playing';
    this.render();
    const btn = document.getElementById('c4-ai-btn');
    if (btn) btn.textContent = this.aiEnabled ? 'Vs Computer: On' : 'Vs Computer: Off';
    if (!this._boundClick) {
      this._boundClick = (e: MouseEvent) => {
        const cell = (e.target as HTMLElement).closest('.c4-cell') as HTMLElement | null;
        if (!cell) return;
        const parent = cell.parentElement;
        if (!parent) return;
        const col = Array.from(parent.children).indexOf(cell);
        if (this.aiEnabled && this.currentPlayer === 'yellow') return;
        this.drop(col);
      };
      this._boundMove = (e: MouseEvent) => {
        if (this.gameOver) return;
        const cell = (e.target as HTMLElement).closest('.c4-cell') as HTMLElement | null;
        if (!cell) return;
        const parent = cell.parentElement;
        if (!parent) return;
        this.previewCol = Array.from(parent.children).indexOf(cell);
        this.renderPreview();
      };
      this._boundLeave = () => { this.previewCol = -1; this.renderPreview(); };
      const boardEl = document.getElementById('connect4-board');
      boardEl?.addEventListener('click', this._boundClick);
      boardEl?.addEventListener('mouseover', this._boundMove);
      boardEl?.addEventListener('mouseleave', this._boundLeave);
    }
  }

  toggleAI(): void { this.aiEnabled = !this.aiEnabled; this.init(); }

  private getDropRow(col: number): number {
    let r = this.ROWS - 1; while (r >= 0 && this.board[r][col] !== null) r--;
    return r;
  }

  drop(col: number): boolean {
    if (this.gameOver) return false;
    if (this.board[0][col] !== null) return false;
    const row = this.getDropRow(col);
    if (row < 0) return false;
    this.board[row][col] = this.currentPlayer;
    if (this.checkWin(row, col, this.currentPlayer)) {
      this.gameOver = true; this.winner = this.currentPlayer; this.render(); return true;
    }
    if (this.board[0].every(c => c !== null)) {
      this.gameOver = true; this.winner = 'draw'; this.render(); return true;
    }
    this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
    this.render();
    if (this.aiEnabled && !this.gameOver && this.currentPlayer === 'yellow') this._scheduleAI();
    return true;
  }

  private checkWin(row: number, col: number, player: string): boolean {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (const sign of [-1, 1]) {
        let r = row + dr * sign, c = col + dc * sign;
        while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
          count++; r += dr * sign; c += dc * sign;
        }
      }
      if (count >= 4) return true;
    }
    return false;
  }

  aiMove(): void {
    if (this.gameOver || this.currentPlayer !== 'yellow') return;
    for (let c = 0; c < this.COLS; c++) {
      const r = this.getDropRow(c); if (r < 0) continue;
      this.board[r][c] = 'yellow';
      if (this.checkWin(r, c, 'yellow')) { this.board[r][c] = null; this.drop(c); return; }
      this.board[r][c] = null;
    }
    for (let c = 0; c < this.COLS; c++) {
      const r = this.getDropRow(c); if (r < 0) continue;
      this.board[r][c] = 'red';
      if (this.checkWin(r, c, 'red')) { this.board[r][c] = null; this.drop(c); return; }
      this.board[r][c] = null;
    }
    for (const c of [3, 2, 4, 1, 5, 0, 6]) { if (this.board[0][c] === null) { this.drop(c); return; } }
  }

  private _scheduleAI(): void { this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300); }

  private renderPreview(): void {
    document.querySelectorAll('.c4-preview-red, .c4-preview-yellow').forEach(c =>
      c.classList.remove('c4-preview-red', 'c4-preview-yellow'));
    if (this.gameOver || this.previewCol < 0) return;
    const col = this.previewCol;
    let row = this.ROWS - 1;
    while (row >= 0 && this.board[row][col] !== null) row--;
    if (row < 0) return;
    const rows = document.querySelectorAll('.c4-row');
    if (rows[row]) {
      const cell = rows[row].children[col] as HTMLElement;
      if (cell) cell.classList.add(this.currentPlayer === 'red' ? 'c4-preview-red' : 'c4-preview-yellow');
    }
  }

  render(): void {
    const board = document.getElementById('connect4-board');
    if (!board) return;
    board.innerHTML = '';
    for (let r = 0; r < this.ROWS; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'c4-row';
      for (let c = 0; c < this.COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'c4-cell';
        const val = this.board[r][c];
        if (val === 'red') cell.classList.add('c4-cell-red');
        else if (val === 'yellow') cell.classList.add('c4-cell-yellow');
        if (this.gameOver && this.winner && this.winner !== 'draw' && val === this.winner) cell.classList.add('c4-win');
        rowEl.appendChild(cell);
      }
      board.appendChild(rowEl);
    }
    const turnEl = document.getElementById('c4-turn');
    if (turnEl) {
      if (this.gameOver) {
        turnEl.textContent = this.winner === 'draw' ? 'Draw!' : `${this.winner!.charAt(0).toUpperCase() + this.winner!.slice(1)} wins!`;
        turnEl.style.color = '#ffd700';
      } else {
        turnEl.textContent = `Turn: ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}`;
        turnEl.style.color = this.currentPlayer === 'red' ? '#ff6b6b' : '#ffe66d';
      }
    }
  }

  pause(): void { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }
  resume(): void { this.state = 'playing'; }
  destroy(): void { this.pause(); }
}

import type { GameState } from '../../core/types.js';
registerGame(
  { id: 'connect4', title: 'Connect 4', category: 'board', description: 'Four in a row', icon: '🔴🟡', wrapperId: 'connect4-wrapper' },
  Connect4Game,
);
