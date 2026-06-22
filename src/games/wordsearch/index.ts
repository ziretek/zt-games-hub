import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class WordSearchGame implements Game {
  readonly id = 'wordsearch';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private size = 12;
  private words = ['JAVASCRIPT','PYTHON','TYPESCRIPT','RUST','SWIFT','KOTLIN','GOLANG','RUBY','SCALA','DART','LUA','ELIXIR','CLOJURE','HASKELL','ERLANG'];
  private grid: string[][] = [];
  private wordList: string[] = [];
  private found: Set<string> = new Set();
  private selecting = false;
  private startCell: [number, number] | null = null;
  private _selectedCells: [number, number][] = [];

  constructor() {
    this.boardEl = document.getElementById('wordsearch-board')!;
    this.turnEl = document.getElementById('ws-turn');
  }

  init(): void {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(''));
    this.wordList = this.words.sort(() => Math.random() - 0.5).slice(0, 6);
    this.found = new Set(); this.selecting = false; this.startCell = null; this._selectedCells = [];
    this.fillGrid();
    this.state = 'playing';
    this.render();
  }

  private fillGrid(): void {
    const dirs = [[1,0],[0,1],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
    for (const word of this.wordList) {
      for (let a = 0; a < 200; a++) {
        const r = Math.floor(Math.random() * this.size), c = Math.floor(Math.random() * this.size);
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          const nr = r + dir[0] * i, nc = c + dir[1] * i;
          if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) { ok = false; break; }
          if (this.grid[nr][nc] !== '' && this.grid[nr][nc] !== word[i]) { ok = false; break; }
        }
        if (ok) { for (let i = 0; i < word.length; i++) this.grid[r + dir[0] * i][c + dir[1] * i] = word[i]; break; }
      }
    }
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++)
      if (this.grid[r][c] === '') this.grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }

  handleStart(r: number, c: number): void {
    if (this.found.size >= this.wordList.length) return;
    this.selecting = true; this.startCell = [r, c]; this._selectedCells = [[r, c]];
    this.render();
  }

  handleMove(r: number, c: number): void {
    if (!this.selecting || !this.startCell) return;
    const [sr, sc] = this.startCell;
    const dr = r - sr === 0 ? 0 : (r - sr > 0 ? 1 : -1);
    const dc = c - sc === 0 ? 0 : (c - sc > 0 ? 1 : -1);
    if (Math.abs(r - sr) !== Math.abs(c - sc) && dr !== 0 && dc !== 0) return;
    if (dr === 0 && dc === 0) return;
    this._selectedCells = [];
    const len = Math.max(Math.abs(r - sr), Math.abs(c - sc)) + 1;
    for (let i = 0; i < len; i++) this._selectedCells.push([sr + dr * i, sc + dc * i]);
    this.render();
  }

  handleEnd(): void {
    if (!this.selecting) return;
    this.selecting = false;
    const word = this._selectedCells.map(([r, c]) => this.grid[r][c]).join('');
    const rev = word.split('').reverse().join('');
    if (this.wordList.includes(word) && !this.found.has(word)) this.found.add(word);
    else if (this.wordList.includes(rev) && !this.found.has(rev)) this.found.add(rev);
    this._selectedCells = []; this.startCell = null;
    this.render();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    const gridDiv = document.createElement('div'); gridDiv.className = 'ws-grid';
    gridDiv.addEventListener('mouseup', () => this.handleEnd());
    gridDiv.addEventListener('mouseleave', () => this.handleEnd());
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      const cell = document.createElement('div'); cell.className = 'ws-cell';
      cell.textContent = this.grid[r][c];
      if (this._selectedCells.some(([sr, sc]) => sr === r && sc === c)) cell.classList.add('ws-selected');
      cell.addEventListener('mousedown', (e) => { e.preventDefault(); this.handleStart(r, c); });
      cell.addEventListener('mouseenter', () => { if (this.selecting) this.handleMove(r, c); });
      cell.addEventListener('touchstart', (e) => { e.preventDefault(); this.handleStart(r, c); });
      cell.addEventListener('touchmove', (e) => { e.preventDefault(); const t = e.changedTouches[0]; const el = document.elementFromPoint(t.clientX, t.clientY); if (el) { const idx = Array.from(gridDiv.children).indexOf(el); if (idx >= 0) this.handleMove(Math.floor(idx / this.size), idx % this.size); } });
      cell.addEventListener('touchend', () => this.handleEnd());
      gridDiv.appendChild(cell);
    }
    this.boardEl.appendChild(gridDiv);
    const wordsDiv = document.createElement('div'); wordsDiv.className = 'ws-words';
    for (const w of this.wordList) {
      const span = document.createElement('span'); span.className = 'ws-word';
      if (this.found.has(w)) span.classList.add('ws-found');
      span.textContent = w; wordsDiv.appendChild(span);
    }
    this.boardEl.appendChild(wordsDiv);
    if (this.turnEl) {
      if (this.found.size >= this.wordList.length) { this.turnEl.textContent = '🎉 All found!'; this.turnEl.style.color = '#4ade80'; }
      else this.turnEl.textContent = 'Found: ' + this.found.size + '/' + this.wordList.length;
    }
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'wordsearch', title: 'Word Search', category: 'puzzle', description: 'Find hidden words', icon: '🔍', wrapperId: 'wordsearch-wrapper' },
  WordSearchGame,
);
