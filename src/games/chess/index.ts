import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

type Color = 'w' | 'b';
type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type Piece = `${Color}${PieceType}` | null;

const PIECE_SYMBOLS: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

const PIECE_VALUES: Record<PieceType, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const PIECE_ORDER: PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];
const CAPTURE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

const PST_PAWN = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];
const PST_KNIGHT = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];
const PST_BISHOP = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];
const PST_ROOK = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];
const PST_QUEEN = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];
const PST_KING = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const PST: Record<PieceType, number[][]> = {
  p: PST_PAWN, n: PST_KNIGHT, b: PST_BISHOP,
  r: PST_ROOK, q: PST_QUEEN, k: PST_KING,
};

interface CastlingRights { wk: boolean; wq: boolean; bk: boolean; bq: boolean; }

interface ChessMove {
  from: [number, number];
  to: [number, number];
  captured: Piece;
  promotion: PieceType | null;
  castling: 'k' | 'q' | null;
  enPassant: boolean;
}

export class ChessGame implements Game {
  readonly id = 'chess';
  state: GameState = 'idle';
  private board: Piece[][] = [];
  private turn: Color = 'w';
  private selected: [number, number] | null = null;
  private validMoves: [number, number][] = [];
  private enPassantTarget: [number, number] | null = null;
  private castlingRights: CastlingRights = { wk: true, wq: true, bk: true, bq: true };
  private gameOver = false;
  private winner: string | null = null;
  private lastMove: [number, number, number, number] | null = null;
  private capturedByWhite: PieceType[] = [];
  private capturedByBlack: PieceType[] = [];
  private isCheck = false;
  private _aiTimer: ReturnType<typeof setTimeout> | null = null;
  private _boundClick: ((e: MouseEvent) => void) | null = null;
  private _boundTouch: ((e: TouchEvent) => void) | null = null;
  private _boundNewGame: (() => void) | null = null;
  private boardEl: HTMLElement;
  private turnEl: HTMLElement;
  private statusEl: HTMLElement;
  private capturedEl: HTMLElement;
  private newGameBtn: HTMLElement;

  constructor() {
    this.boardEl = document.getElementById('chess-board')!;
    this.turnEl = document.getElementById('chess-turn')!;
    this.statusEl = document.getElementById('chess-status')!;
    this.capturedEl = document.getElementById('chess-captured')!;
    this.newGameBtn = document.getElementById('chess-new-btn')!;
  }

  init(): void {
    if (!this._boundNewGame) {
      this._boundNewGame = () => this.newGame();
      this.newGameBtn.addEventListener('click', this._boundNewGame);
    }
    this.startNewGame();
    if (!this._boundClick) {
      this._boundClick = (e: MouseEvent) => {
        const cell = (e.target as HTMLElement).closest('[data-r]') as HTMLElement | null;
        if (!cell) return;
        this.onCellClick(+cell.dataset.r!, +cell.dataset.c!);
      };
      this.boardEl.addEventListener('click', this._boundClick);
    }
    if (!this._boundTouch) {
      this._boundTouch = (e: TouchEvent) => {
        const target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) as HTMLElement | null;
        const cell = target?.closest('[data-r]') as HTMLElement | null;
        if (!cell) return;
        e.preventDefault();
        this.onCellClick(+cell.dataset.r!, +cell.dataset.c!);
      };
      this.boardEl.addEventListener('touchstart', this._boundTouch, { passive: false });
    }
  }

  private startNewGame(): void {
    this.board = this.createInitialBoard();
    this.turn = 'w';
    this.selected = null;
    this.validMoves = [];
    this.enPassantTarget = null;
    this.castlingRights = { wk: true, wq: true, bk: true, bq: true };
    this.gameOver = false;
    this.winner = null;
    this.lastMove = null;
    this.capturedByWhite = [];
    this.capturedByBlack = [];
    this.isCheck = false;
    this.state = 'playing';
    this.render();
  }

  private createInitialBoard(): Piece[][] {
    const b: Piece[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
      b[0][c] = ('b' + backRank[c]) as Piece;
      b[1][c] = 'bp' as Piece;
      b[6][c] = 'wp' as Piece;
      b[7][c] = ('w' + backRank[c]) as Piece;
    }
    return b;
  }

  private colorOf(piece: Piece): Color | null {
    if (!piece) return null;
    return piece[0] as Color;
  }

  private typeOf(piece: Piece): PieceType | null {
    if (!piece) return null;
    return piece[1] as PieceType;
  }

  private opponent(color: Color): Color {
    return color === 'w' ? 'b' : 'w';
  }

  private inBounds(r: number, c: number): boolean {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  private getKingPos(board: Piece[][], color: Color): [number, number] {
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        if (board[r][c] === (color + 'k') as Piece) return [r, c];
    return [-1, -1];
  }

  private isSquareAttacked(board: Piece[][], row: number, col: number, byColor: Color): boolean {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || this.colorOf(piece) !== byColor) continue;
        const type = this.typeOf(piece)!;
        const dr = row - r;
        const dc = col - c;
        const adr = Math.abs(dr);
        const adc = Math.abs(dc);

        if (type === 'p') {
          const dir = byColor === 'w' ? -1 : 1;
          if (r + dir === row && (c - 1 === col || c + 1 === col)) return true;
        } else if (type === 'n') {
          if ((adr === 2 && adc === 1) || (adr === 1 && adc === 2)) return true;
        } else if (type === 'b') {
          if (adr === adc && adr > 0) {
            const rd = dr / adr;
            const cd = dc / adc;
            let rr = r + rd, cc = c + cd;
            let blocked = false;
            while (rr !== row || cc !== col) {
              if (board[rr][cc] !== null) { blocked = true; break; }
              rr += rd; cc += cd;
            }
            if (!blocked) return true;
          }
        } else if (type === 'r') {
          if ((dr === 0 || dc === 0) && (adr > 0 || adc > 0)) {
            const rd = dr === 0 ? 0 : dr / adr;
            const cd = dc === 0 ? 0 : dc / adc;
            let rr = r + rd, cc = c + cd;
            let blocked = false;
            while (rr !== row || cc !== col) {
              if (board[rr][cc] !== null) { blocked = true; break; }
              rr += rd; cc += cd;
            }
            if (!blocked) return true;
          }
        } else if (type === 'q') {
          if ((dr === 0 || dc === 0 || adr === adc) && (adr > 0 || adc > 0)) {
            const rd = dr === 0 ? 0 : dr / adr;
            const cd = dc === 0 ? 0 : dc / adc;
            let rr = r + rd, cc = c + cd;
            let blocked = false;
            while (rr !== row || cc !== col) {
              if (board[rr][cc] !== null) { blocked = true; break; }
              rr += rd; cc += cd;
            }
            if (!blocked) return true;
          }
        } else if (type === 'k') {
          if (adr <= 1 && adc <= 1 && (adr + adc > 0)) return true;
        }
      }
    }
    return false;
  }

  private inCheck(board: Piece[][], color: Color): boolean {
    const [kr, kc] = this.getKingPos(board, color);
    if (kr === -1) return false;
    return this.isSquareAttacked(board, kr, kc, this.opponent(color));
  }

  private cloneBoard(board: Piece[][]): Piece[][] {
    return board.map(r => [...r]);
  }

  private makeMove(board: Piece[][], move: ChessMove, _ep: [number, number] | null, cr: CastlingRights): { board: Piece[][]; ep: [number, number] | null; cr: CastlingRights } {
    const nb = this.cloneBoard(board);
    const piece = nb[move.from[0]][move.from[1]];
    nb[move.to[0]][move.to[1]] = piece;
    nb[move.from[0]][move.from[1]] = null;

    let newEp: [number, number] | null = null;
    const newCr = { ...cr };

    if (move.enPassant) {
      nb[move.from[0]][move.to[1]] = null;
    }

    if (piece === 'wp' && move.from[0] === 6 && move.to[0] === 4) newEp = [5, move.from[1]];
    if (piece === 'bp' && move.from[0] === 1 && move.to[0] === 3) newEp = [2, move.from[1]];

    if (move.castling === 'k') {
      nb[move.to[0]][5] = nb[move.to[0]][7];
      nb[move.to[0]][7] = null;
    } else if (move.castling === 'q') {
      nb[move.to[0]][3] = nb[move.to[0]][0];
      nb[move.to[0]][0] = null;
    }

    if (move.promotion) {
      nb[move.to[0]][move.to[1]] = (this.colorOf(piece!)! + move.promotion) as Piece;
    }

    if (piece === 'wk') { newCr.wk = false; newCr.wq = false; }
    if (piece === 'bk') { newCr.bk = false; newCr.bq = false; }
    if (piece === 'wr') {
      if (move.from[1] === 0) newCr.wq = false;
      if (move.from[1] === 7) newCr.wk = false;
    }
    if (piece === 'br') {
      if (move.from[1] === 0) newCr.bq = false;
      if (move.from[1] === 7) newCr.bk = false;
    }
    if (move.captured === 'wr') { if (move.to[1] === 0) newCr.wq = false; if (move.to[1] === 7) newCr.wk = false; }
    if (move.captured === 'br') { if (move.to[1] === 0) newCr.bq = false; if (move.to[1] === 7) newCr.bk = false; }

    return { board: nb, ep: newEp, cr: newCr };
  }

  private generatePseudoMoves(board: Piece[][], color: Color, ep: [number, number] | null, cr: CastlingRights): ChessMove[] {
    const moves: ChessMove[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece || this.colorOf(piece) !== color) continue;
        const type = this.typeOf(piece)!;
        const enemy = this.opponent(color);

        if (type === 'p') {
          const dir = color === 'w' ? -1 : 1;
          const startRow = color === 'w' ? 6 : 1;
          const promoRow = color === 'w' ? 0 : 7;

          if (this.inBounds(r + dir, c) && board[r + dir][c] === null) {
            if (r + dir === promoRow) {
              moves.push({ from: [r, c], to: [r + dir, c], captured: null, promotion: 'q', castling: null, enPassant: false });
            } else {
              moves.push({ from: [r, c], to: [r + dir, c], captured: null, promotion: null, castling: null, enPassant: false });
            }
            if (r === startRow && board[r + 2 * dir][c] === null) {
              moves.push({ from: [r, c], to: [r + 2 * dir, c], captured: null, promotion: null, castling: null, enPassant: false });
            }
          }
          for (const dc of [-1, 1]) {
            const nc = c + dc;
            if (this.inBounds(r + dir, nc)) {
              const target = board[r + dir][nc];
              if (target && this.colorOf(target) === enemy) {
                if (r + dir === promoRow) {
                  moves.push({ from: [r, c], to: [r + dir, nc], captured: target, promotion: 'q', castling: null, enPassant: false });
                } else {
                  moves.push({ from: [r, c], to: [r + dir, nc], captured: target, promotion: null, castling: null, enPassant: false });
                }
              }
              if (ep && ep[0] === r + dir && ep[1] === nc) {
                moves.push({ from: [r, c], to: [r + dir, nc], captured: board[r][nc], promotion: null, castling: null, enPassant: true });
              }
            }
          }
        } else if (type === 'n') {
          for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc) && !board[nr][nc]) {
              moves.push({ from: [r, c], to: [nr, nc], captured: null, promotion: null, castling: null, enPassant: false });
            } else if (this.inBounds(nr, nc) && board[nr][nc] && this.colorOf(board[nr][nc]) === enemy) {
              moves.push({ from: [r, c], to: [nr, nc], captured: board[nr][nc], promotion: null, castling: null, enPassant: false });
            }
          }
        } else if (type === 'b') {
          for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            let nr = r + dr, nc = c + dc;
            while (this.inBounds(nr, nc)) {
              if (board[nr][nc] === null) {
                moves.push({ from: [r, c], to: [nr, nc], captured: null, promotion: null, castling: null, enPassant: false });
              } else {
                if (this.colorOf(board[nr][nc]) === enemy) {
                  moves.push({ from: [r, c], to: [nr, nc], captured: board[nr][nc], promotion: null, castling: null, enPassant: false });
                }
                break;
              }
              nr += dr; nc += dc;
            }
          }
        } else if (type === 'r') {
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            let nr = r + dr, nc = c + dc;
            while (this.inBounds(nr, nc)) {
              if (board[nr][nc] === null) {
                moves.push({ from: [r, c], to: [nr, nc], captured: null, promotion: null, castling: null, enPassant: false });
              } else {
                if (this.colorOf(board[nr][nc]) === enemy) {
                  moves.push({ from: [r, c], to: [nr, nc], captured: board[nr][nc], promotion: null, castling: null, enPassant: false });
                }
                break;
              }
              nr += dr; nc += dc;
            }
          }
        } else if (type === 'q') {
          for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
            let nr = r + dr, nc = c + dc;
            while (this.inBounds(nr, nc)) {
              if (board[nr][nc] === null) {
                moves.push({ from: [r, c], to: [nr, nc], captured: null, promotion: null, castling: null, enPassant: false });
              } else {
                if (this.colorOf(board[nr][nc]) === enemy) {
                  moves.push({ from: [r, c], to: [nr, nc], captured: board[nr][nc], promotion: null, castling: null, enPassant: false });
                }
                break;
              }
              nr += dr; nc += dc;
            }
          }
        } else if (type === 'k') {
          for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
            const nr = r + dr, nc = c + dc;
            if (this.inBounds(nr, nc)) {
              if (board[nr][nc] === null) {
                moves.push({ from: [r, c], to: [nr, nc], captured: null, promotion: null, castling: null, enPassant: false });
              } else if (this.colorOf(board[nr][nc]) === enemy) {
                moves.push({ from: [r, c], to: [nr, nc], captured: board[nr][nc], promotion: null, castling: null, enPassant: false });
              }
            }
          }

          const row = color === 'w' ? 7 : 0;
          if (r === row && c === 4) {
            if (cr.wk && color === 'w' && board[7][5] === null && board[7][6] === null && board[7][7] === 'wr') {
              if (!this.inCheck(board, 'w') && !this.isSquareAttacked(board, 7, 5, 'b') && !this.isSquareAttacked(board, 7, 6, 'b')) {
                moves.push({ from: [7, 4], to: [7, 6], captured: null, promotion: null, castling: 'k', enPassant: false });
              }
            }
            if (cr.bk && color === 'b' && board[0][5] === null && board[0][6] === null && board[0][7] === 'br') {
              if (!this.inCheck(board, 'b') && !this.isSquareAttacked(board, 0, 5, 'w') && !this.isSquareAttacked(board, 0, 6, 'w')) {
                moves.push({ from: [0, 4], to: [0, 6], captured: null, promotion: null, castling: 'k', enPassant: false });
              }
            }
            if (cr.wq && color === 'w' && board[7][3] === null && board[7][2] === null && board[7][1] === null && board[7][0] === 'wr') {
              if (!this.inCheck(board, 'w') && !this.isSquareAttacked(board, 7, 3, 'b') && !this.isSquareAttacked(board, 7, 2, 'b')) {
                moves.push({ from: [7, 4], to: [7, 2], captured: null, promotion: null, castling: 'q', enPassant: false });
              }
            }
            if (cr.bq && color === 'b' && board[0][3] === null && board[0][2] === null && board[0][1] === null && board[0][0] === 'br') {
              if (!this.inCheck(board, 'b') && !this.isSquareAttacked(board, 0, 3, 'w') && !this.isSquareAttacked(board, 0, 2, 'w')) {
                moves.push({ from: [0, 4], to: [0, 2], captured: null, promotion: null, castling: 'q', enPassant: false });
              }
            }
          }
        }
      }
    }
    return moves;
  }

  private generateLegalMoves(board: Piece[][], color: Color, ep: [number, number] | null, cr: CastlingRights): ChessMove[] {
    const pseudo = this.generatePseudoMoves(board, color, ep, cr);
    const legal: ChessMove[] = [];
    for (const move of pseudo) {
      const result = this.makeMove(board, move, ep, cr);
      if (!this.inCheck(result.board, color)) {
        legal.push(move);
      }
    }
    return legal;
  }

  private onCellClick(r: number, c: number): void {
    if (this.gameOver) return;
    if (this.turn === 'b') return;

    const piece = this.board[r][c];

    if (this.selected) {
      const moveTarget = this.validMoves.find(m => m[0] === r && m[1] === c);
      if (moveTarget) {
        this.executePlayerMove(this.selected[0], this.selected[1], r, c);
        this.selected = null;
        this.validMoves = [];
        this.render();
        if (!this.gameOver) this._scheduleAI();
        return;
      }
    }

    if (piece && this.colorOf(piece) === 'w') {
      this.selected = [r, c];
      this.validMoves = this.generateLegalMoves(this.board, 'w', this.enPassantTarget, this.castlingRights)
        .filter(m => m.from[0] === r && m.from[1] === c)
        .map(m => m.to);
    } else {
      this.selected = null;
      this.validMoves = [];
    }
    this.render();
  }

  private executePlayerMove(sr: number, sc: number, tr: number, tc: number): void {
    const moves = this.generateLegalMoves(this.board, 'w', this.enPassantTarget, this.castlingRights)
      .filter(m => m.from[0] === sr && m.from[1] === sc && m.to[0] === tr && m.to[1] === tc);
    if (moves.length === 0) return;
    this.applyMove(moves[0]);
  }

  private applyMove(move: ChessMove): void {
    const result = this.makeMove(this.board, move, this.enPassantTarget, this.castlingRights);
    this.board = result.board;
    this.enPassantTarget = result.ep;
    this.castlingRights = result.cr;
    this.lastMove = [move.from[0], move.from[1], move.to[0], move.to[1]];

    if (move.captured) {
      const capType = this.typeOf(move.captured)!;
      if (this.turn === 'w') this.capturedByWhite.push(capType);
      else this.capturedByBlack.push(capType);
    }
    if (move.enPassant) {
      this.capturedByWhite.push('p');
    }

    this.turn = this.opponent(this.turn);
    this.checkGameState();
  }

  private checkGameState(): void {
    this.isCheck = this.inCheck(this.board, this.turn);
    const legal = this.generateLegalMoves(this.board, this.turn, this.enPassantTarget, this.castlingRights);

    if (legal.length === 0) {
      this.gameOver = true;
      if (this.isCheck) {
        this.winner = this.turn === 'w' ? 'Black' : 'White';
        this.state = this.winner === 'White' ? 'won' : 'lost';
      } else {
        this.winner = 'Draw';
        this.state = 'idle';
      }
    }
  }

  private _scheduleAI(): void {
    if (this._aiTimer) clearTimeout(this._aiTimer);
    this._aiTimer = setTimeout(() => {
      this._aiTimer = null;
      this.aiMove();
    }, 200);
  }

  private aiMove(): void {
    if (this.gameOver || this.turn !== 'b') return;
    const moves = this.generateLegalMoves(this.board, 'b', this.enPassantTarget, this.castlingRights);
    if (moves.length === 0) return;

    const ordered = this.orderMoves(moves, 'b');

    let bestScore = -Infinity;
    let bestMove: ChessMove | null = null;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of ordered) {
      const result = this.makeMove(this.board, move, this.enPassantTarget, this.castlingRights);
      if (this.inCheck(result.board, 'b')) continue;
      const score = this.minimax(result.board, 4, alpha, beta, false, 'w', result.ep, result.cr);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (score > alpha) alpha = score;
    }

    if (bestMove) {
      this.applyMove(bestMove);
    }
    this.selected = null;
    this.validMoves = [];
    this.render();
  }

  private orderMoves(moves: ChessMove[], _color: Color): ChessMove[] {
    return [...moves].sort((a, b) => {
      const aCap = a.captured ? CAPTURE_VALUE[this.typeOf(a.captured)!] || 0 : 0;
      const bCap = b.captured ? CAPTURE_VALUE[this.typeOf(b.captured)!] || 0 : 0;
      if (aCap !== bCap) return bCap - aCap;
      return 0;
    });
  }

  private minimax(
    board: Piece[][], depth: number, alpha: number, beta: number,
    maximizing: boolean, color: Color, ep: [number, number] | null, cr: CastlingRights
  ): number {
    const moves = this.generateLegalMoves(board, color, ep, cr);

    if (moves.length === 0) {
      if (this.inCheck(board, color)) {
        return maximizing ? -100000 - depth : 100000 + depth;
      }
      return 0;
    }

    if (depth === 0) {
      return this.evaluate(board);
    }

    const ordered = this.orderMoves(moves, color);
    const nextColor = this.opponent(color);

    if (maximizing) {
      let best = -Infinity;
      for (const move of ordered) {
        const result = this.makeMove(board, move, ep, cr);
        if (this.inCheck(result.board, color)) continue;
        let val: number;
        const newEp = result.ep;
        const newCr = result.cr;
        if (this.inCheck(result.board, nextColor) && this.generateLegalMoves(result.board, nextColor, newEp, newCr).length === 0) {
          val = 100000 + depth;
        } else {
          val = this.minimax(result.board, depth - 1, alpha, beta, false, nextColor, newEp, newCr);
        }
        best = Math.max(best, val);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const move of ordered) {
        const result = this.makeMove(board, move, ep, cr);
        if (this.inCheck(result.board, color)) continue;
        let val: number;
        const newEp = result.ep;
        const newCr = result.cr;
        if (this.inCheck(result.board, nextColor) && this.generateLegalMoves(result.board, nextColor, newEp, newCr).length === 0) {
          val = -100000 - depth;
        } else {
          val = this.minimax(result.board, depth - 1, alpha, beta, true, nextColor, newEp, newCr);
        }
        best = Math.min(best, val);
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  private evaluate(board: Piece[][]): number {
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        const color = this.colorOf(piece)!;
        const type = this.typeOf(piece)!;
        const sign = color === 'w' ? 1 : -1;
        const pst = PST[type];
        const pstRow = color === 'w' ? r : 7 - r;

        score += sign * PIECE_VALUES[type];
        score += sign * pst[pstRow][c] * 0.1;
      }
    }

    const wMoves = this.generateLegalMoves(board, 'w', null, {
      wk: false, wq: false, bk: false, bq: false
    }).length;
    const bMoves = this.generateLegalMoves(board, 'b', null, {
      wk: false, wq: false, bk: false, bq: false
    }).length;
    score += (wMoves - bMoves) * 2;

    return score;
  }

  newGame(): void {
    if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; }
    this.startNewGame();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = `ch-cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);

        const isSel = this.selected?.[0] === r && this.selected?.[1] === c;
        const isValid = this.validMoves.some(m => m[0] === r && m[1] === c);

        if (isValid) {
          if (this.board[r][c]) {
            cell.classList.add('valid-capture');
          } else {
            cell.classList.add('valid-move');
          }
        }
        if (isSel) cell.classList.add('selected');
        if (this.lastMove) {
          if ((this.lastMove[0] === r && this.lastMove[1] === c) ||
              (this.lastMove[2] === r && this.lastMove[3] === c)) {
            cell.classList.add('last-move');
          }
        }

        const piece = this.board[r][c];
        if (piece) {
          const color = this.colorOf(piece)!;
          const type = this.typeOf(piece)!;
          const symbol = PIECE_SYMBOLS[piece];
          const span = document.createElement('span');
          span.className = `ch-piece ${color}`;
          span.textContent = symbol;
          cell.appendChild(span);

          if (this.isCheck && type === 'k' && color === this.turn) {
            cell.classList.add('check');
          }
        }

        this.boardEl.appendChild(cell);
      }
    }
    this.updateUI();
  }

  private updateUI(): void {
    if (this.gameOver) {
      if (this.winner === 'Draw') {
        this.turnEl.textContent = 'Draw: ½-½';
      } else {
        const winnerColor = this.winner === 'White' ? 'White' : 'Black';
        this.turnEl.textContent = winnerColor + ' wins!';
      }
      this.statusEl.textContent = this.winner === 'Draw' ? 'Stalemate' : 'Checkmate';
    } else {
      this.turnEl.textContent = 'Turn: ' + (this.turn === 'w' ? 'White' : 'Black');
      if (this.isCheck) {
        this.turnEl.textContent += ' (check!)';
        this.statusEl.textContent = 'Check!';
      } else {
        this.statusEl.textContent = '';
      }
    }

    const overlay = document.getElementById('chess-overlay');
    if (overlay) {
      overlay.style.display = this.gameOver ? 'flex' : 'none';
      if (this.gameOver) {
        const wt = overlay.querySelector('.winner-text');
        if (wt) {
          if (this.winner === 'Draw') wt.textContent = '½ - ½  Draw';
          else wt.textContent = '🏆 ' + this.winner + ' wins!';
        }
      }
    }

    this.capturedByWhite.sort((a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b));
    this.capturedByBlack.sort((a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b));
    this.capturedEl.innerHTML = '';
    if (this.capturedByBlack.length > 0) {
      const capDiv = document.createElement('div');
      capDiv.className = 'chess-captured-group';
      const label = document.createElement('span');
      label.className = 'chess-captured-label';
      label.textContent = 'White lost: ';
      capDiv.appendChild(label);
      for (const t of this.capturedByBlack) {
        const s = document.createElement('span');
        s.className = 'ch-piece b';
        s.textContent = PIECE_SYMBOLS['b' + t];
        capDiv.appendChild(s);
      }
      this.capturedEl.appendChild(capDiv);
    }
    if (this.capturedByWhite.length > 0) {
      const capDiv = document.createElement('div');
      capDiv.className = 'chess-captured-group';
      const label = document.createElement('span');
      label.className = 'chess-captured-label';
      label.textContent = 'Black lost: ';
      capDiv.appendChild(label);
      for (const t of this.capturedByWhite) {
        const s = document.createElement('span');
        s.className = 'ch-piece w';
        s.textContent = PIECE_SYMBOLS['w' + t];
        capDiv.appendChild(s);
      }
      this.capturedEl.appendChild(capDiv);
    }
  }

  pause(): void {
    if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; }
  }

  resume(): void {
    this.state = 'playing';
  }

  destroy(): void {
    this.pause();
    if (this._boundClick && this.boardEl) {
      this.boardEl.removeEventListener('click', this._boundClick);
      this._boundClick = null;
    }
    if (this._boundTouch && this.boardEl) {
      this.boardEl.removeEventListener('touchstart', this._boundTouch);
      this._boundTouch = null;
    }
    if (this._boundNewGame && this.newGameBtn) {
      this.newGameBtn.removeEventListener('click', this._boundNewGame);
      this._boundNewGame = null;
    }
  }
}

registerGame(
  { id: 'chess', title: 'Chess', category: 'board', description: 'Classic chess with AI opponent', icon: '♚', wrapperId: 'chess-wrapper' },
  ChessGame,
);
