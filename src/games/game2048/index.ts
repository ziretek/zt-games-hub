import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class Game2048 implements Game {
  readonly id = 'game2048';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private scoreEl: HTMLElement | null;
  private turnEl: HTMLElement | null;
  private size = 4;
  private board: number[][] = [];
  private score = 0;
  private gameOver = false;
  private won = false;
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _touchHandler: ((e: TouchEvent) => void) | null = null;
  private _touchStartX = 0;
  private _touchStartY = 0;

  constructor() {
    this.boardEl = document.getElementById('game2048-board')!;
    this.scoreEl = document.getElementById('g2048-score');
    this.turnEl = document.getElementById('g2048-turn');
  }

  init(): void {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.score = 0; this.gameOver = false; this.won = false;
    this.addRandom(); this.addRandom();
    this.state = 'playing';
    this.render();
    if (!this._keyHandler) {
      this._keyHandler = (e: KeyboardEvent) => {
        const keyMap: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
        if (keyMap[e.key]) { e.preventDefault(); this.move(keyMap[e.key]); }
      };
      document.addEventListener('keydown', this._keyHandler);
    }
    if (!this._touchHandler) {
      this._touchHandler = (e: TouchEvent) => {
        if (e.type === 'touchstart') {
          this._touchStartX = e.touches[0].clientX;
          this._touchStartY = e.touches[0].clientY;
        } else if (e.type === 'touchend') {
          const dx = e.changedTouches[0].clientX - this._touchStartX;
          const dy = e.changedTouches[0].clientY - this._touchStartY;
          if (Math.abs(dx) > Math.abs(dy)) {
            this.move(dx > 0 ? 'right' : 'left');
          } else {
            this.move(dy > 0 ? 'down' : 'up');
          }
        }
      };
      document.addEventListener('touchstart', this._touchHandler, { passive: true });
      document.addEventListener('touchend', this._touchHandler, { passive: true });
    }
  }

  private addRandom(): void {
    const empty: [number, number][] = [];
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) if (this.board[r][c] === 0) empty.push([r, c]);
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  private slideRow(row: number[]): { row: number[]; score: number } {
    let arr = row.filter(v => v !== 0);
    let s = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) { arr[i] *= 2; s += arr[i]; arr.splice(i + 1, 1); }
    }
    while (arr.length < this.size) arr.push(0);
    return { row: arr, score: s };
  }

  move(dir: string): void {
    if (this.gameOver) return;
    const prev = this.board.map(r => [...r]);
    let moved = false, totalScore = 0;
    for (let i = 0; i < this.size; i++) {
      let row: number[];
      if (dir === 'left') row = this.board[i];
      else if (dir === 'right') row = [...this.board[i]].reverse();
      else if (dir === 'up') row = this.board.map(r => r[i]);
      else row = [...this.board.map(r => r[i])].reverse();
      const result = this.slideRow(row);
      if (dir === 'left') this.board[i] = result.row;
      else if (dir === 'right') this.board[i] = result.row.reverse();
      else if (dir === 'up') for (let r = 0; r < this.size; r++) this.board[r][i] = result.row[r];
      else { const rev = result.row.reverse(); for (let r = 0; r < this.size; r++) this.board[r][i] = rev[r]; }
      totalScore += result.score;
    }
    const changed = !this.board.every((row, r) => row.every((v, c) => v === prev[r][c]));
    if (changed) { this.score += totalScore; this.addRandom(); moved = true; }
    if (this.board.some(row => row.some(v => v >= 2048))) { this.won = true; }
    if (moved && !this.canMove()) this.gameOver = true;
    this.render();
  }

  private canMove(): boolean {
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.board[r][c] === 0) return true;
      if (c < this.size - 1 && this.board[r][c] === this.board[r][c + 1]) return true;
      if (r < this.size - 1 && this.board[r][c] === this.board[r + 1][c]) return true;
    }
    return false;
  }

  render(): void {
    this.boardEl.innerHTML = '';
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      const cell = document.createElement('div');
      cell.className = 'g2048-cell';
      const val = this.board[r][c];
      if (val > 0) { cell.textContent = String(val); cell.classList.add('g2048-' + val); }
      this.boardEl.appendChild(cell);
    }
    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
    if (this.turnEl) {
      if (this.gameOver) { this.turnEl.textContent = 'Game Over!'; this.turnEl.style.color = '#ff6b6b'; }
      else if (this.won) { this.turnEl.textContent = '🎉 You Win! Keep going!'; this.turnEl.style.color = '#ffd700'; }
      else { this.turnEl.textContent = 'Arrow keys to move'; this.turnEl.style.color = ''; }
    }
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    if (this._touchHandler) {
      document.removeEventListener('touchstart', this._touchHandler);
      document.removeEventListener('touchend', this._touchHandler);
    }
  }
}

registerGame(
  { id: 'game2048', title: '2048', category: 'puzzle', description: 'Merge the tiles', icon: '🔢', wrapperId: 'game2048-wrapper' },
  Game2048,
);
