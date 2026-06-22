import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class TicTacToeGame implements Game {
  readonly id = 'tictactoe';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  board: (string | null)[] = Array(9).fill(null);
  currentPlayer: 'X' | 'O' = 'X';
  private gameOver = false;
  private winner: string | null = null;
  aiEnabled = true;
  private winCombo: number[] | null = null;
  private _aiTimer: ReturnType<typeof setTimeout> | null = null;
  private _boundAiToggle: (() => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('tictactoe-board')!;
  }

  init(): void {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X'; this.gameOver = false; this.winner = null; this.winCombo = null;
    this.state = 'playing';
    this.render();
    if (!this._boundAiToggle) {
      this._boundAiToggle = () => this.toggleAI();
      const btn = document.getElementById('ttt-ai-btn');
      if (btn) btn.addEventListener('click', this._boundAiToggle);
    }
  }

  private getWinCombo(): number[] | null {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) return [a,b,c];
    }
    return null;
  }

  makeMove(i: number): void {
    if (this.gameOver || this.board[i]) return;
    this.board[i] = this.currentPlayer;
    this.winCombo = this.getWinCombo();
    if (this.winCombo) { this.gameOver = true; this.winner = this.currentPlayer; this.render(); return; }
    if (this.board.every(c => c)) { this.gameOver = true; this.render(); return; }
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.render();
    if (this.aiEnabled && !this.gameOver && this.currentPlayer === 'O')
      this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 200);
  }

  aiMove(): void {
    if (this.gameOver || this.currentPlayer !== 'O') return;
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) { this.board[i] = 'O'; if (this.getWinCombo()) { this.board[i] = null; this.makeMove(i); return; } this.board[i] = null; }
    }
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) { this.board[i] = 'X'; if (this.getWinCombo()) { this.board[i] = null; this.makeMove(i); return; } this.board[i] = null; }
    }
    if (!this.board[4]) { this.makeMove(4); return; }
    const empty = this.board.map((c,i) => c === null ? i : null).filter(i => i !== null);
    if (empty.length > 0) this.makeMove(empty[Math.floor(Math.random() * empty.length)]);
  }

  toggleAI(): void {
    this.aiEnabled = !this.aiEnabled;
    const btn = document.getElementById('ttt-ai-btn');
    if (btn) btn.textContent = 'Vs Computer: ' + (this.aiEnabled ? 'On' : 'Off');
    this.init();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      if (this.board[i]) { cell.classList.add(this.board[i] === 'X' ? 'ttt-x' : 'ttt-o'); cell.textContent = this.board[i]!; }
      if (this.winCombo?.includes(i)) cell.classList.add('ttt-win');
      cell.addEventListener('click', () => { if (this.aiEnabled && this.currentPlayer === 'O') return; this.makeMove(i); });
      this.boardEl.appendChild(cell);
    }
    const turnEl = document.getElementById('ttt-turn');
    if (turnEl) {
      if (this.gameOver) { turnEl.textContent = this.winner ? this.winner + ' wins!' : 'Draw!'; turnEl.style.color = '#ffd700'; }
      else { turnEl.textContent = 'Turn: ' + this.currentPlayer; turnEl.style.color = this.currentPlayer === 'X' ? '#60a5fa' : '#f472b6'; }
    }
  }

  pause(): void { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }
  resume(): void { this.state = 'playing'; }
  destroy(): void { this.pause(); if (this._boundAiToggle) { const btn = document.getElementById('ttt-ai-btn'); if (btn) btn.removeEventListener('click', this._boundAiToggle); this._boundAiToggle = null; } }
}

registerGame(
  { id: 'tictactoe', title: 'Tic-Tac-Toe', category: 'board', description: 'Three in a row', icon: '❌⭕', wrapperId: 'tictactoe-wrapper' },
  TicTacToeGame,
);
