import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class OthelloGame implements Game {
  readonly id = 'othello';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private size = 8;
  private board: (string | null)[][] = [];
  private currentPlayer: 'black' | 'white' = 'black';
  private gameOver = false;
  private _aiTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.boardEl = document.getElementById('othello-board')!;
    this.turnEl = document.getElementById('oth-turn');
    this.scoreEl = document.getElementById('oth-score');
  }

  init(): void {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    const m = Math.floor(this.size / 2);
    this.board[m-1][m-1] = 'white'; this.board[m-1][m] = 'black';
    this.board[m][m-1] = 'black'; this.board[m][m] = 'white';
    this.currentPlayer = 'black'; this.gameOver = false;
    this.state = 'playing';
    this.render();
  }

  private inBounds(r: number, c: number): boolean { return r >= 0 && r < this.size && c >= 0 && c < this.size; }

  private getValidMoves(player: string): [number, number][] {
    const moves: [number, number][] = [];
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++)
      if (!this.board[r][c] && this.isValidMove(r, c, player)) moves.push([r, c]);
    return moves;
  }

  private isValidMove(r: number, c: number, player: string): boolean {
    if (this.board[r][c]) return false;
    const opp = player === 'black' ? 'white' : 'black';
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if (!this.inBounds(nr, nc) || this.board[nr][nc] !== opp) continue;
      nr += dr; nc += dc;
      while (this.inBounds(nr, nc) && this.board[nr][nc] === opp) { nr += dr; nc += dc; }
      if (this.inBounds(nr, nc) && this.board[nr][nc] === player) return true;
    }
    return false;
  }

  makeMove(r: number, c: number): void {
    if (this.gameOver || !this.isValidMove(r, c, this.currentPlayer)) return;
    const player = this.currentPlayer;
    const opp = player === 'black' ? 'white' : 'black';
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    this.board[r][c] = player;
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if (!this.inBounds(nr, nc) || this.board[nr][nc] !== opp) continue;
      const toFlip: [number, number][] = [];
      while (this.inBounds(nr, nc) && this.board[nr][nc] === opp) { toFlip.push([nr, nc]); nr += dr; nc += dc; }
      if (this.inBounds(nr, nc) && this.board[nr][nc] === player)
        for (const [fr, fc] of toFlip) this.board[fr][fc] = player;
    }
    const oppMoves = this.getValidMoves(opp);
    if (oppMoves.length > 0) this.currentPlayer = opp as 'black' | 'white';
    else if (this.getValidMoves(player).length === 0) this.gameOver = true;
    this.render();
    if (!this.gameOver && this.currentPlayer === 'black')
      this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300);
  }

  aiMove(): void {
    if (this.gameOver || this.currentPlayer !== 'black') return;
    const moves = this.getValidMoves('black');
    if (moves.length === 0) return;
    const boardCopy = () => this.board.map(r => [...r]);
    let bestScore = -Infinity;
    let bestMove = moves[0];
    for (const [r, c] of moves) {
      const sim = this.simulateMove(boardCopy(), r, c, 'black');
      const score = this.minimax(sim, 3, -Infinity, Infinity, false, 'white');
      if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
    }
    this.makeMove(bestMove[0], bestMove[1]);
  }

  private simulateMove(board: (string | null)[][], r: number, c: number, player: string): (string | null)[][] {
    const opp = player === 'black' ? 'white' : 'black';
    board[r][c] = player;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if (!this.inBounds(nr, nc) || board[nr][nc] !== opp) continue;
      const toFlip: [number, number][] = [];
      while (this.inBounds(nr, nc) && board[nr][nc] === opp) { toFlip.push([nr, nc]); nr += dr; nc += dc; }
      if (this.inBounds(nr, nc) && board[nr][nc] === player)
        for (const [fr, fc] of toFlip) board[fr][fc] = player;
    }
    return board;
  }

  private minimax(board: (string | null)[][], depth: number, alpha: number, beta: number, isMaximizing: boolean, player: string): number {
    const opp = player === 'black' ? 'white' : 'black';
    const moves = this.getValidMovesOn(board, player);
    if (depth === 0 || moves.length === 0) {
      if (moves.length === 0 && this.getValidMovesOn(board, opp).length === 0) {
        let b = 0, w = 0;
        for (const row of board) for (const v of row) { if (v === 'black') b++; else if (v === 'white') w++; }
        return b > w ? 10000 + depth : w > b ? -10000 - depth : 0;
      }
      return this.evaluateBoard(board);
    }
    const next = opp;
    if (isMaximizing) {
      let best = -Infinity;
      for (const [r, c] of moves) {
        const sim = this.simulateMove(board.map(row => [...row]), r, c, player);
        const val = this.minimax(sim, depth - 1, alpha, beta, false, next);
        best = Math.max(best, val);
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const [r, c] of moves) {
        const sim = this.simulateMove(board.map(row => [...row]), r, c, player);
        const val = this.minimax(sim, depth - 1, alpha, beta, true, next);
        best = Math.min(best, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  private getValidMovesOn(board: (string | null)[][], player: string): [number, number][] {
    const moves: [number, number][] = [];
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++)
      if (!board[r][c] && this.isValidMoveOn(board, r, c, player)) moves.push([r, c]);
    return moves;
  }

  private isValidMoveOn(board: (string | null)[][], r: number, c: number, player: string): boolean {
    if (board[r][c]) return false;
    const opp = player === 'black' ? 'white' : 'black';
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if (!this.inBounds(nr, nc) || board[nr][nc] !== opp) continue;
      nr += dr; nc += dc;
      while (this.inBounds(nr, nc) && board[nr][nc] === opp) { nr += dr; nc += dc; }
      if (this.inBounds(nr, nc) && board[nr][nc] === player) return true;
    }
    return false;
  }

  private evaluateBoard(board: (string | null)[][]): number {
    let score = 0;
    const corners = [[0,0],[0,7],[7,0],[7,7]];
    const cSquares = [[0,1],[0,6],[1,0],[1,7],[6,0],[6,7],[7,1],[7,6]];
    const xSquares = [[1,1],[1,6],[6,1],[6,6]];
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      const v = board[r][c];
      if (!v) continue;
      const sign = v === 'black' ? 1 : -1;
      let bonus = 1;
      if (corners.some(([cr, cc]) => cr === r && cc === c)) bonus = 20;
      else if (cSquares.some(([cr, cc]) => cr === r && cc === c)) bonus = 8;
      else if (xSquares.some(([cr, cc]) => cr === r && cc === c)) bonus = 5;
      else if (r === 0 || r === 7 || c === 0 || c === 7) bonus = 3;
      score += sign * bonus;
    }
    const bMoves = this.getValidMovesOn(board, 'black').length;
    const wMoves = this.getValidMovesOn(board, 'white').length;
    score += (bMoves - wMoves) * 0.5;
    return score;
  }

  render(): void {
    this.boardEl.innerHTML = '';
    const valid = this.getValidMoves(this.currentPlayer);
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      const cell = document.createElement('div');
      cell.className = 'oth-cell';
      cell.addEventListener('click', () => this.makeMove(r, c));
      if (this.board[r][c]) {
        const piece = document.createElement('div');
        piece.className = 'oth-piece ' + this.board[r][c];
        cell.appendChild(piece);
      } else if (!this.gameOver && valid.some(([vr, vc]) => vr === r && vc === c))
        cell.classList.add('oth-valid');
      this.boardEl.appendChild(cell);
    }
    let black = 0, white = 0;
    for (const row of this.board) for (const v of row) { if (v === 'black') black++; else if (v === 'white') white++; }
    if (this.turnEl) {
      if (this.gameOver) {
        const w = black > white ? 'Black' : white > black ? 'White' : 'Draw';
        this.turnEl.textContent = w + (w !== 'Draw' ? ' wins!' : ''); this.turnEl.style.color = '#ffd700';
      } else { this.turnEl.textContent = 'Turn: ' + (this.currentPlayer === 'black' ? 'Black' : 'White'); this.turnEl.style.color = this.currentPlayer === 'black' ? '#888' : '#eee'; }
    }
    if (this.scoreEl) this.scoreEl.textContent = 'Black: ' + black + ' | White: ' + white;
  }

  pause(): void { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }
  resume(): void { this.state = 'playing'; }
  destroy(): void { this.pause(); }
}

registerGame(
  { id: 'othello', title: 'Othello', category: 'board', description: 'Flip the board', icon: '⚫⚪', wrapperId: 'othello-wrapper' },
  OthelloGame,
);
