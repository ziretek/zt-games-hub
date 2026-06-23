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
  private _boundAiToggle: (() => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('gomoku-board')!;
    this.turnEl = document.getElementById('gom-turn');
  }

  init(): void {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.currentPlayer = 'black'; this.gameOver = false; this.winner = null;
    this._winCells = []; this.state = 'playing';
    this.render();
    if (this.aiEnabled && this.currentPlayer === 'black') {
      if (this._aiTimer) clearTimeout(this._aiTimer);
      this._aiTimer = setTimeout(() => { this._aiTimer = null; if (!this.gameOver && this.currentPlayer === 'black' && !this.board[7][7]) this.makeMove(7, 7); }, 200);
    }
    if (!this._boundAiToggle) {
      this._boundAiToggle = () => this.toggleAI();
      const btn = document.getElementById('gom-ai-btn');
      if (btn) btn.addEventListener('click', this._boundAiToggle);
    }
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
    if (this.aiEnabled && !this.gameOver && this.currentPlayer === 'black') {
      if (this._aiTimer) clearTimeout(this._aiTimer);
      this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300);
    }
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
    let bestScore = -Infinity; let bestMove: [number, number] | null = null;
    const candidates = this.getCandidates();
    for (const [r, c] of candidates) {
      this.board[r][c] = 'black';
      const oppMoves = this.getCandidatesOn(this.board);
      let oppCanWin = false;
      for (const [or2, oc2] of oppMoves) {
        this.board[or2][oc2] = 'white';
        if (this.checkWin(or2, oc2, 'white')) { this.board[or2][oc2] = null; oppCanWin = true; break; }
        this.board[or2][oc2] = null;
      }
      if (oppCanWin) { this.board[r][c] = null; continue; }
      const score = this.minimax(this.board, 2, -Infinity, Infinity, false, 'white', candidates);
      this.board[r][c] = null;
      if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
    }
    if (bestMove) this.makeMove(bestMove[0], bestMove[1]);
  }

  private getCandidates(): [number, number][] {
    const nearby = new Set<string>();
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (!this.board[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const nr = r + dr, nc = c + dc;
        if (this.inBounds(nr, nc) && !this.board[nr][nc]) nearby.add(nr + ',' + nc);
      }
    }
    if (nearby.size === 0) return [[7, 7]];
    return [...nearby].map(s => s.split(',').map(Number)) as [number, number][];
  }

  private getCandidatesOn(board: (string | null)[][]): [number, number][] {
    const nearby = new Set<string>();
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (!board[r][c]) continue;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (this.inBounds(nr, nc) && !board[nr][nc]) nearby.add(nr + ',' + nc);
      }
    }
    return [...nearby].map(s => s.split(',').map(Number)) as [number, number][];
  }

  private minimax(board: (string | null)[][], depth: number, alpha: number, beta: number, isMaximizing: boolean, player: string, candidates: [number, number][]): number {
    if (depth === 0) return this.evaluateGomoku(board);
    const cand = candidates.length > 0 ? candidates : this.getCandidatesOn(board);
    if (cand.length === 0) return 0;
    const opp = player === 'black' ? 'white' : 'black';
    if (isMaximizing) {
      let best = -Infinity;
      for (const [r, c] of cand) {
        board[r][c] = 'black';
        if (this.checkWinOnBoard(board, r, c, 'black')) { board[r][c] = null; return 1000 + depth; }
        const remaining = cand.filter(([cr, cc]) => cr !== r || cc !== c);
        const val = this.minimax(board, depth - 1, alpha, beta, false, opp, remaining);
        board[r][c] = null;
        best = Math.max(best, val);
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const [r, c] of cand) {
        board[r][c] = 'white';
        if (this.checkWinOnBoard(board, r, c, 'white')) { board[r][c] = null; return -1000 - depth; }
        const remaining = cand.filter(([cr, cc]) => cr !== r || cc !== c);
        const val = this.minimax(board, depth - 1, alpha, beta, true, opp, remaining);
        board[r][c] = null;
        best = Math.min(best, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  private checkWinOnBoard(board: (string | null)[][], r: number, c: number, player: string): boolean {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (let sign = -1; sign <= 1; sign += 2) {
        let nr = r + dr * sign, nc = c + dc * sign;
        while (this.inBounds(nr, nc) && board[nr][nc] === player) { count++; nr += dr * sign; nc += dc * sign; }
      }
      if (count >= 5) return true;
    }
    return false;
  }

  private evaluateGomoku(board: (string | null)[][]): number {
    let score = 0;
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (!board[r][c]) continue;
      const sign = board[r][c] === 'black' ? 1 : -1;
      score += sign * (1 + Math.max(0, 7 - (Math.abs(r - 7) + Math.abs(c - 7))) * 0.2);
      const dirs = [[1,0],[0,1],[1,1],[1,-1]];
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let sd = -1; sd <= 1; sd += 2) {
          let nr = r + dr * sd, nc = c + dc * sd;
          while (this.inBounds(nr, nc) && board[nr][nc] === board[r][c]) { count++; nr += dr * sd; nc += dc * sd; }
        }
        if (count >= 5) score += sign * 100;
        else if (count === 4) score += sign * 10;
        else if (count === 3) score += sign * 3;
        else if (count === 2) score += sign;
      }
    }
    return score;
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
  destroy(): void { this.pause(); if (this._boundAiToggle) { const btn = document.getElementById('gom-ai-btn'); if (btn) btn.removeEventListener('click', this._boundAiToggle); this._boundAiToggle = null; } }
}

registerGame(
  { id: 'gomoku', title: 'Gomoku', category: 'board', description: 'Five in a row', icon: '⬛⬜', wrapperId: 'gomoku-wrapper' },
  GomokuGame,
);
