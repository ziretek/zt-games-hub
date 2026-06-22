import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class GomokuGame implements Game {
  readonly id = 'gomoku';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private size = 15;
  private board: (string | null)[][] = [];
  private currentPlayer: 'black' | 'white' = 'black';
  private gameOver = false;
  private winner: string | null = null;
  aiEnabled = true;
  private _winCells: [number, number][] = [];
  private _aiTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.boardEl = document.getElementById('gomoku-board')!;
    this.turnEl = document.getElementById('gom-turn');
  }

  init(): void {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.currentPlayer = 'black'; this.gameOver = false; this.winner = null;
    this._winCells = []; this.state = 'playing';
    this.render();
    if (this.aiEnabled && this.currentPlayer === 'black')
      this._aiTimer = setTimeout(() => { this._aiTimer = null; if (!this.gameOver) this.makeMove(7, 7); }, 200);
  }

  private inBounds(r: number, c: number): boolean { return r >= 0 && r < this.size && c >= 0 && c < this.size; }

  makeMove(r: number, c: number): void {
    if (this.gameOver || this.board[r][c] !== null) return;
    this.board[r][c] = this.currentPlayer;
    if (this.checkWin(r, c, this.currentPlayer)) {
      this.gameOver = true; this.winner = this.currentPlayer;
      this._winCells = this.getWinCells(r, c, this.currentPlayer); this.render(); return;
    }
    if (this.board.every(row => row.every(cell => cell !== null))) { this.gameOver = true; this.render(); return; }
    this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
    this.render();
    if (this.aiEnabled && !this.gameOver && this.currentPlayer === 'black')
      this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300);
  }

  private checkWin(r: number, c: number, player: string): boolean {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (let sign = -1; sign <= 1; sign += 2) {
        let nr = r + dr * sign, nc = c + dc * sign;
        while (this.inBounds(nr, nc) && this.board[nr][nc] === player) { count++; nr += dr * sign; nc += dc * sign; }
      }
      if (count >= 5) return true;
    }
    return false;
  }

  private getWinCells(r: number, c: number, player: string): [number, number][] {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      const line: [number, number][] = [[r, c]];
      for (let sign = -1; sign <= 1; sign += 2) {
        let nr = r + dr * sign, nc = c + dc * sign;
        while (this.inBounds(nr, nc) && this.board[nr][nc] === player) { line.push([nr, nc]); nr += dr * sign; nc += dc * sign; }
      }
      if (line.length >= 5) return line;
    }
    return [[r, c]];
  }

  aiMove(): void {
    if (this.gameOver || this.currentPlayer !== 'black') return;
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.board[r][c] !== null) continue;
      this.board[r][c] = 'black';
      if (this.checkWin(r, c, 'black')) { this.board[r][c] = null; this.makeMove(r, c); return; }
      this.board[r][c] = null;
    }
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.board[r][c] !== null) continue;
      this.board[r][c] = 'white';
      if (this.checkWin(r, c, 'white')) { this.board[r][c] = null; this.makeMove(r, c); return; }
      this.board[r][c] = null;
    }
    let bestScore = -1; let bestMove: [number, number] | null = null;
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.board[r][c] !== null) continue;
      let score = Math.random() * 0.1;
      score += Math.max(0, 14 - (Math.abs(r - 7) + Math.abs(c - 7))) * 0.5;
      const dirs = [[1,0],[0,1],[1,1],[1,-1]];
      for (const [dr, dc] of dirs) {
        for (const player of ['black', 'white'] as const) {
          let count = 1;
          for (let sign = -1; sign <= 1; sign += 2) {
            let nr = r + dr * sign, nc = c + dc * sign;
            while (this.inBounds(nr, nc) && this.board[nr][nc] === player) { count++; nr += dr * sign; nc += dc * sign; }
          }
          if (player === 'black') score += Math.pow(2, count);
          else score += Math.pow(1.5, count);
        }
      }
      if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
    }
    if (bestMove) this.makeMove(bestMove[0], bestMove[1]);
  }

  toggleAI(): void {
    this.aiEnabled = !this.aiEnabled;
    document.getElementById('gom-ai-btn')!.textContent = 'Vs Computer: ' + (this.aiEnabled ? 'On' : 'Off');
    this.init();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      const cell = document.createElement('div');
      cell.className = 'gom-cell';
      cell.addEventListener('click', () => { if (this.aiEnabled && this.currentPlayer === 'black') return; this.makeMove(r, c); });
      if (this.board[r][c]) {
        const stone = document.createElement('div');
        stone.className = 'gom-stone ' + this.board[r][c];
        if (this._winCells.some(([wr, wc]) => wr === r && wc === c)) stone.classList.add('gom-win');
        cell.appendChild(stone);
      } else if (!this.gameOver) cell.classList.add('gom-valid');
      this.boardEl.appendChild(cell);
    }
    if (this.turnEl) {
      if (this.gameOver) { this.turnEl.textContent = this.winner === 'black' ? 'Black wins!' : 'White wins!'; this.turnEl.style.color = '#ffd700'; }
      else { this.turnEl.textContent = 'Turn: ' + (this.currentPlayer === 'black' ? 'Black' : 'White'); this.turnEl.style.color = this.currentPlayer === 'black' ? '#aaa' : '#eee'; }
    }
  }

  pause(): void { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }
  resume(): void { this.state = 'playing'; }
  destroy(): void { this.pause(); }
}

registerGame(
  { id: 'gomoku', title: 'Gomoku', category: 'board', description: 'Five in a row', icon: '⬛⬜', wrapperId: 'gomoku-wrapper' },
  GomokuGame,
);
