import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { loadScore, saveScore } from '../../utils/storage.js';

type Piece = 'r' | 'b' | 'R' | 'B' | null;
type Side = 'red' | 'black';

interface Move {
  sr: number; sc: number; tr: number; tc: number; captured: { r: number; c: number }[];
}

export class CheckersGame implements Game {
  readonly id = 'checkers';
  state: GameState = 'idle';
  private el: HTMLElement;
  private board: Piece[][] = [];
  private selected: [number, number] | null = null;
  turn: Side = 'red';
  vsComputer = false;
  computerSide: Side = 'black';
  validMoves: { tr: number; tc: number }[] = [];
  private capturedRed = 0;
  private capturedBlack = 0;
  private gameOver = false;
  private winner: string | null = null;
  private lastMove: [number, number, number, number] | null = null;
  private wins: Record<string, number>;
  private _aiTimer: ReturnType<typeof setTimeout> | null = null;
  private _boundClick: ((e: MouseEvent) => void) | null = null;

  constructor() {
    this.el = document.getElementById('checkerGame')!;
    this.wins = { red: loadScore('ckRedWins'), black: loadScore('ckBlackWins') };
  }

  init(): void {
    this.createBoard();
    this.render();
    if (!this._boundClick) {
      this._boundClick = (e: MouseEvent) => {
        const cell = (e.target as HTMLElement).closest('[data-r]') as HTMLElement | null;
        if (!cell) return;
        this.onCellClick(+cell.dataset.r!, +cell.dataset.c!);
      };
      this.el.addEventListener('click', this._boundClick);
    }
  }

  private createBoard(): void {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 8; c++)
        if ((r + c) % 2 === 1) this.board[r][c] = 'b';
    for (let r = 5; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if ((r + c) % 2 === 1) this.board[r][c] = 'r';
    this.capturedRed = 0; this.capturedBlack = 0;
    this.selected = null; this.validMoves = [];
    this.gameOver = false; this.winner = null; this.lastMove = null;
    this.turn = 'red';
    this.state = 'playing';
  }

  private getSide(piece: Piece): Side | null {
    if (!piece) return null;
    return (piece === 'r' || piece === 'R') ? 'red' : 'black';
  }
  private isKing(piece: Piece): boolean { return piece === 'R' || piece === 'B'; }
  private opponent(side: Side): Side { return side === 'red' ? 'black' : 'red'; }

  private onCellClick(r: number, c: number): void {
    if (this.gameOver) return;
    if (this.vsComputer && this.turn === this.computerSide) return;
    const piece = this.board[r][c];
    const pieceSide = this.getSide(piece);
    if (this.selected) {
      const move = this.validMoves.find(m => m.tr === r && m.tc === c);
      if (move) {
        const [sr, sc] = this.selected;
        const hasMore = this.doMove(sr, sc, r, c);
        this.lastMove = [sr, sc, r, c];
        if (hasMore) {
          this.selected = [r, c];
          this.validMoves = this.getCaptureDestinations(r, c);
        } else {
          this.selected = null; this.validMoves = [];
          this.completeTurn();
        }
        this.render(); return;
      }
    }
    if (piece && pieceSide === this.turn && !this.selected) {
      this.selected = [r, c];
      this.validMoves = this.getValidDestinations(r, c);
    } else {
      this.selected = null; this.validMoves = [];
    }
    this.render();
  }

  private getValidDestinations(r: number, c: number): { tr: number; tc: number }[] {
    const side = this.getSide(this.board[r][c])!;
    const dests: { tr: number; tc: number }[] = [];
    const caps = this.getCaptures(r, c, side);
    if (caps.length > 0) { for (const cp of caps) dests.push({ tr: cp.tr, tc: cp.tc }); }
    else if (!this.hasAnyCapture(side)) {
      for (const m of this.getSimpleMoves(r, c, side)) dests.push({ tr: m.tr, tc: m.tc });
    }
    return dests;
  }

  private getCaptureDestinations(r: number, c: number): { tr: number; tc: number }[] {
    const side = this.getSide(this.board[r][c])!;
    return this.getCaptures(r, c, side).map(cp => ({ tr: cp.tr, tc: cp.tc }));
  }

  private doMove(sr: number, sc: number, tr: number, tc: number): boolean {
    const piece = this.board[sr][sc]!;
    const side = this.getSide(piece)!;
    this.board[tr][tc] = piece;
    this.board[sr][sc] = null;
    let wasCapture = false;
    if (Math.abs(tr - sr) === 2 && Math.abs(tc - sc) === 2) {
      wasCapture = true;
      const mr = sr + (tr - sr) / 2, mc = sc + (tc - sc) / 2;
      const captured = this.board[mr][mc];
      this.board[mr][mc] = null;
      if (captured === 'r' || captured === 'R') this.capturedBlack++;
      else this.capturedRed++;
    }
    if (side === 'red' && tr === 0 && piece === 'r') this.board[tr][tc] = 'R';
    if (side === 'black' && tr === 7 && piece === 'b') this.board[tr][tc] = 'B';
    return wasCapture && this.getCaptures(tr, tc, side).length > 0;
  }

  private getSimpleMoves(r: number, c: number, side: Side, board?: Piece[][]): Move[] {
    board = board ?? this.board;
    const piece = board[r][c]!;
    const moves: Move[] = [];
    const forward = side === 'red' ? -1 : 1;
    const dirs = this.isKing(piece) ? [[1,1],[1,-1],[-1,1],[-1,-1]] : [[forward,1],[forward,-1]];
    for (const [dr, dc] of dirs) {
      const tr = r + dr, tc = c + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && board[tr][tc] === null)
        moves.push({ sr: r, sc: c, tr, tc, captured: [] });
    }
    return moves;
  }

  private getCaptures(r: number, c: number, side: Side, board?: Piece[][]): Move[] {
    board = board ?? this.board;
    const piece = board[r][c]!;
    const caps: Move[] = [];
    const forward = side === 'red' ? -1 : 1;
    const dirs = this.isKing(piece) ? [[1,1],[1,-1],[-1,1],[-1,-1]] : [[forward,1],[forward,-1]];
    for (const [dr, dc] of dirs) {
      const tr = r + dr * 2, tc = c + dc * 2, mr = r + dr, mc = c + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && board[tr][tc] === null) {
        const mid = board[mr][mc];
        if (mid && this.getSide(mid) !== side)
          caps.push({ sr: r, sc: c, tr, tc, captured: [{ r: mr, c: mc }] });
      }
    }
    return caps;
  }

  private hasAnyCapture(side: Side, board?: Piece[][]): boolean {
    board = board ?? this.board;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (this.getSide(board[r][c]) === side && this.getCaptures(r, c, side, board).length > 0)
          return true;
    return false;
  }

  private completeTurn(): void {
    this.checkGameOver();
    if (this.gameOver) {
      const w = this.winner === 'Red' ? 'red' : 'black';
      this.wins[w]++; saveScore('ckRedWins', this.wins.red); saveScore('ckBlackWins', this.wins.black);
      this.render(); return;
    }
    this.switchTurn();
    if (this.vsComputer && this.turn === this.computerSide) this._scheduleAI();
  }

  private switchTurn(): void { this.turn = this.turn === 'red' ? 'black' : 'red'; }

  private checkGameOver(): void {
    const { red, black } = this.countPieces();
    if (red === 0) { this.gameOver = true; this.winner = 'Black'; return; }
    if (black === 0) { this.gameOver = true; this.winner = 'Red'; return; }
    if (this.getAllMoves(this.turn).length === 0) {
      this.gameOver = true; this.winner = this.turn === 'red' ? 'Black' : 'Red';
    }
  }

  private countPieces(board?: Piece[][]): { red: number; black: number } {
    board = board ?? this.board;
    let red = 0, black = 0;
    for (const row of board) for (const p of row) {
      if (p === 'r' || p === 'R') red++;
      if (p === 'b' || p === 'B') black++;
    }
    return { red, black };
  }

  newGame(): void { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } this.createBoard(); this.turn = 'red'; this.render(); }

  toggleComputer(): void {
    this.vsComputer = !this.vsComputer;
    const btn = document.getElementById('vsComputerBtn');
    if (btn) btn.textContent = 'Vs Computer: ' + (this.vsComputer ? 'On' : 'Off');
    if (this.vsComputer && this.turn === this.computerSide && !this.gameOver) this._scheduleAI();
  }

  private _scheduleAI(): void { this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300); }

  private applySeq(board: Piece[][], seq: Move[]): Piece[][] {
    const b = board.map(r => [...r]);
    for (const step of seq) {
      const p = b[step.sr][step.sc]; b[step.tr][step.tc] = p; b[step.sr][step.sc] = null;
      for (const cpt of step.captured) b[cpt.r][cpt.c] = null;
      if (p === 'r' && step.tr === 0) b[step.tr][step.tc] = 'R';
      if (p === 'b' && step.tr === 7) b[step.tr][step.tc] = 'B';
    }
    return b;
  }

  private getAllMoves(side: Side, board?: Piece[][]): Move[][] {
    board = board ?? this.board;
    const all: Move[][] = [];
    const hasCaps = this.hasAnyCapture(side, board);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (this.getSide(board[r][c]) !== side) continue;
      if (hasCaps) {
        const seqs = this.getCaptureSequences(r, c, side, board);
        for (const s of seqs) all.push(s);
      } else {
        for (const m of this.getSimpleMoves(r, c, side, board)) all.push([m]);
      }
    }
    return all;
  }

  private getCaptureSequences(r: number, c: number, side: Side, board: Piece[][]): Move[][] {
    const sequences: Move[][] = [];
    const findSeq = (row: number, col: number, bd: Piece[][], seq: Move[]) => {
      const p = bd[row][col];
      const fwd = side === 'red' ? -1 : 1;
      const dirs = this.isKing(p) ? [[1,1],[1,-1],[-1,1],[-1,-1]] : [[fwd,1],[fwd,-1]];
      let found = false;
      for (const [dr, dc] of dirs) {
        const tr = row + dr * 2, tc = col + dc * 2, mr = row + dr, mc = col + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && bd[tr][tc] === null) {
          const mid = bd[mr][mc];
          if (mid && this.getSide(mid) !== side) {
            found = true;
            const nb = bd.map(rr => [...rr]);
            const np = nb[row][col]; nb[tr][tc] = np; nb[row][col] = null; nb[mr][mc] = null;
            if (np === 'r' && tr === 0) nb[tr][tc] = 'R';
            if (np === 'b' && tr === 7) nb[tr][tc] = 'B';
            findSeq(tr, tc, nb, [...seq, { sr: row, sc: col, tr, tc, captured: [{ r: mr, c: mc }] }]);
          }
        }
      }
      if (!found && seq.length > 0) sequences.push([...seq]);
    };
    findSeq(r, c, board.map(rr => [...rr]), []);
    return sequences;
  }

  private evaluate(board: Piece[][], side: Side): number {
    let score = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = board[r][c]; if (!p) continue;
      const val = (p === 'R' || p === 'B') ? 5 : 3;
      const ps = this.getSide(p)!; const sign = ps === side ? 1 : -1;
      score += sign * val;
      if (p === 'r') score += sign * (7 - r) * 0.2;
      if (p === 'b') score += sign * r * 0.2;
    }
    return score;
  }

  private minimax(board: Piece[][], depth: number, alpha: number, beta: number, maximizing: boolean, side: Side): number {
    const { red, black } = this.countPieces(board);
    const cs = this.computerSide;
    if (red === 0) return cs === 'black' ? 1000 + depth : -1000 - depth;
    if (black === 0) return cs === 'red' ? 1000 + depth : -1000 - depth;
    const moves = this.getAllMoves(side, board);
    if (moves.length === 0) return side === cs ? -1000 - depth : 1000 + depth;
    if (depth === 0) return this.evaluate(board, cs);
    const opp = this.opponent(side);
    if (maximizing) {
      let best = -Infinity;
      for (const seq of moves) {
        const nb = this.applySeq(board, seq);
        if (this.getAllMoves(opp, nb).length === 0) return 1000 + depth;
        best = Math.max(best, this.minimax(nb, depth - 1, alpha, beta, false, opp));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const seq of moves) {
        const nb = this.applySeq(board, seq);
        if (this.getAllMoves(opp, nb).length === 0) return -1000 - depth;
        best = Math.min(best, this.minimax(nb, depth - 1, alpha, beta, true, opp));
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  private executeMoveSequence(sequence: Move[]): void {
    for (const step of sequence) {
      const piece = this.board[step.sr][step.sc];
      this.board[step.tr][step.tc] = piece; this.board[step.sr][step.sc] = null;
      for (const cpt of step.captured) {
        const cap = this.board[cpt.r][cpt.c];
        if (cap === 'r' || cap === 'R') this.capturedBlack++;
        else this.capturedRed++;
        this.board[cpt.r][cpt.c] = null;
      }
      if (piece === 'r' && step.tr === 0) this.board[step.tr][step.tc] = 'R';
      if (piece === 'b' && step.tr === 7) this.board[step.tr][step.tc] = 'B';
    }
  }

  private aiMove(): void {
    if (this.gameOver) return;
    const side = this.computerSide;
    const all = this.getAllMoves(side);
    if (all.length === 0) return;
    let bestScore = -Infinity;
    let bestSeq: Move[] | null = null;
    for (const seq of all) {
      const sim = this.applySeq(this.board, seq);
      const opp = this.opponent(side);
      if (this.getAllMoves(opp, sim).length === 0) { bestSeq = seq; break; }
      const score = this.minimax(sim, 3, -Infinity, Infinity, false, opp);
      if (score > bestScore) { bestScore = score; bestSeq = seq; }
    }
    if (bestSeq) { this.executeMoveSequence(bestSeq); this.render(); this.completeTurn(); }
  }

  private updateUI(): void {
    const turnEl = document.getElementById('turnIndicator');
    if (turnEl) {
      if (this.gameOver) { turnEl.textContent = '🏆 ' + this.winner + ' wins!'; turnEl.style.color = '#ffd700'; }
      else { turnEl.textContent = 'Turn: ' + (this.turn.charAt(0).toUpperCase() + this.turn.slice(1)); turnEl.style.color = '#ffd700'; }
    }
    const scoreEl = document.getElementById('scoreDisplay');
    if (scoreEl) scoreEl.textContent = 'Red: ' + (12 - this.capturedRed) + ' | Black: ' + (12 - this.capturedBlack) + '  |  W: ' + this.wins.red + '-' + this.wins.black;
    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) {
      overlay.style.display = this.gameOver ? 'flex' : 'none';
      if (this.gameOver) {
        const wt = overlay.querySelector('.winner-text');
        if (wt) wt.textContent = '🏆 ' + this.winner + ' wins!';
      }
    }
  }

  render(): void {
    this.el.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = `cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        cell.dataset.r = String(r); cell.dataset.c = String(c);
        const isSel = this.selected?.[0] === r && this.selected?.[1] === c;
        const isValid = this.validMoves.some(m => m.tr === r && m.tc === c);
        if (isValid) cell.classList.add('valid-move');
        if (isSel) cell.classList.add('selected');
        if (this.lastMove && ((this.lastMove[0] === r && this.lastMove[1] === c) || (this.lastMove[2] === r && this.lastMove[3] === c)))
          cell.classList.add('last-move');
        if (this.board[r][c]) {
          const p = this.board[r][c]!;
          const piece = document.createElement('span');
          piece.className = `piece ${p === 'r' || p === 'R' ? 'red' : 'black'}`;
          if (p === 'R' || p === 'B') piece.classList.add('king');
          cell.appendChild(piece);
        }
        this.el.appendChild(cell);
      }
    }
    this.updateUI();
  }

  pause(): void { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }
  resume(): void { this.state = 'playing'; }
  destroy(): void { this.pause(); if (this._boundClick && this.el) { this.el.removeEventListener('click', this._boundClick); this._boundClick = null; } }
}

registerGame(
  { id: 'checkers', title: 'Checkers', category: 'board', description: 'Capture all pieces', icon: '♟️', wrapperId: 'checkers-wrapper' },
  CheckersGame,
);
