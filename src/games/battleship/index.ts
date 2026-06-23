import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class BattleshipGame implements Game {
  readonly id = 'battleship';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private aiBtnEl: HTMLElement | null;
  private size = 10;
  private ships = [5, 4, 3, 3, 2];
  private phase: 'place' | 'play' | 'gameover' = 'place';
  private placingShip = 0;
  private placingDir = 0;
  private playerGrid: number[][] = [];
  private enemyGrid: number[][] = [];
  private enemyShips: number[][] = [];
  private playerHits = 0;
  private enemyHits = 0;
  private playerTargets: boolean[][] = [];
  private enemyTargets: boolean[][] = [];
  private p1Grid: number[][] = [];
  private p2Grid: number[][] = [];
  private p2Hits = 0;
  private p2Targets: boolean[][] = [];
  private gameOver = false;
  private vsComputer = true;
  private _aiLastHit: [number, number] | null = null;
  private _aiTimer: ReturnType<typeof setTimeout> | null = null;
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _boundHandler: (() => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('battleship-board')!;
    this.turnEl = document.getElementById('bs-turn');
    this.aiBtnEl = document.getElementById('bs-ai-btn');
  }

  init(): void {
    this.phase = 'place';
    this.placingShip = 0; this.placingDir = 0;
    this.playerGrid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.enemyGrid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.p1Grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.p2Grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.enemyShips = this.placeShipsRandom();
    this.playerHits = 0; this.enemyHits = 0; this.p2Hits = 0;
    this.playerTargets = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    this.enemyTargets = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    this.p2Targets = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    this.gameOver = false; this._aiLastHit = null;
    this.state = 'playing';
    if (this.aiBtnEl) this.aiBtnEl.textContent = 'Vs Computer: ' + (this.vsComputer ? 'On' : 'Off');
    this.render();
    if (!this._boundHandler && this.aiBtnEl) {
      this._boundHandler = () => { this.toggleAI(); };
      this.aiBtnEl.addEventListener('click', this._boundHandler);
    }
    if (!this._keyHandler) {
      this._keyHandler = (e: KeyboardEvent) => { if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.rotateShip(); } };
      document.addEventListener('keydown', this._keyHandler);
    }
  }

  toggleAI(): void {
    this.vsComputer = !this.vsComputer;
    if (this.aiBtnEl) this.aiBtnEl.textContent = 'Vs Computer: ' + (this.vsComputer ? 'On' : 'Off');
  }

  private placeShipsRandom(): number[][] {
    const grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    for (const len of this.ships) {
      for (let a = 0; a < 200; a++) {
        const r = Math.floor(Math.random() * this.size), c = Math.floor(Math.random() * this.size);
        const dir = Math.random() < 0.5 ? 0 : 1;
        if (this.canPlace(grid, r, c, len, dir)) { this.doPlace(grid, r, c, len, dir); break; }
      }
    }
    return grid;
  }

  private canPlace(grid: number[][], r: number, c: number, len: number, dir: number): boolean {
    if (dir === 0 && c + len > this.size) return false;
    if (dir === 1 && r + len > this.size) return false;
    for (let i = 0; i < len; i++) {
      const nr = dir === 0 ? r : r + i, nc = dir === 0 ? c + i : c;
      if (grid[nr][nc] !== 0) return false;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const ar = nr + dr, ac = nc + dc;
        if (ar >= 0 && ar < this.size && ac >= 0 && ac < this.size && grid[ar][ac] !== 0) return false;
      }
    }
    return true;
  }

  private doPlace(grid: number[][], r: number, c: number, len: number, dir: number, val = 1): void {
    for (let i = 0; i < len; i++) {
      const nr = dir === 0 ? r : r + i, nc = dir === 0 ? c + i : c;
      grid[nr][nc] = val;
    }
  }

  private p2Move(r: number, c: number): void {
    if (this.phase !== 'play' || this.gameOver || this.p2Targets[r][c]) return;
    this.p2Targets[r][c] = true;
    const ships = this.vsComputer ? this.playerGrid : this.p1Grid;
    const display = this.vsComputer ? this.playerGrid : this.p1Grid;
    if (ships[r][c] > 0) { display[r][c] = 2; this.p2Hits++; this.checkWin(); }
    else { display[r][c] = 1; }
    this.render();
    if (!this.gameOver && this.turnEl) this.turnEl.textContent = 'Your turn, P1';
  }

  private playerMove(r: number, c: number): void {
    if (this.phase !== 'play' || this.gameOver) return;
    const targets = this.vsComputer ? this.playerTargets : this.p2Targets;
    if (targets[r][c]) return;
    targets[r][c] = true;
    const ships = this.vsComputer ? this.enemyShips : this.p2Grid;
    if (ships[r][c] > 0) { this.enemyGrid[r][c] = 2; this.playerHits++; this.checkWin(); }
    else { this.enemyGrid[r][c] = 1; }
    this.render();
    if (this.gameOver) return;
    if (this.vsComputer) {
      if (this.turnEl) this.turnEl.textContent = 'Computer thinking...';
      if (this._aiTimer) clearTimeout(this._aiTimer);
      this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 400);
    } else {
      if (this.turnEl) this.turnEl.textContent = 'Your turn, P2';
    }
  }

  private aiMove(): void {
    if (this.gameOver) return;
    let targets: [number, number][] = [];
    if (this._aiLastHit) {
      const [lr, lc] = this._aiLastHit;
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const nr = lr + dr, nc = lc + dc;
        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && !this.enemyTargets[nr][nc]) targets.push([nr, nc]);
      }
    }
    if (targets.length === 0) for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) if (!this.enemyTargets[r][c]) targets.push([r, c]);
    if (targets.length === 0) return;
    const [r, c] = targets[Math.floor(Math.random() * targets.length)];
    this.enemyTargets[r][c] = true;
    if (this.playerGrid[r][c] > 0) { this.playerGrid[r][c] = 2; this.enemyHits++; this._aiLastHit = [r, c]; this.checkWin(); }
    else { this.playerGrid[r][c] = 1; this._aiLastHit = null; }
    this.render();
    if (!this.gameOver && this.turnEl) this.turnEl.textContent = 'Your turn';
  }

  private checkWin(): void {
    if (this.playerHits >= 17) { this.gameOver = true; if (this.turnEl) { this.turnEl.textContent = this.vsComputer ? 'You win!' : 'P1 wins!'; this.turnEl.style.color = '#ffd700'; } this.state = 'won'; }
    if (this.enemyHits >= 17) { this.gameOver = true; if (this.turnEl) { this.turnEl.textContent = this.vsComputer ? 'Computer wins!' : 'P2 wins!'; this.turnEl.style.color = '#ff6b6b'; } this.state = 'lost'; }
    if (this.p2Hits >= 17) { this.gameOver = true; if (this.turnEl) { this.turnEl.textContent = 'P2 wins!'; this.turnEl.style.color = '#ff6b6b'; } this.state = 'lost'; }
    if (this.gameOver) this.render();
  }

  private placeShip(r: number, c: number): void {
    if (this.placingShip >= this.ships.length) return;
    const len = this.ships[this.placingShip];
    if (!this.canPlace(this.playerGrid, r, c, len, this.placingDir)) return;
    this.doPlace(this.playerGrid, r, c, len, this.placingDir, this.placingShip + 1);
    this.placingShip++;
    if (this.placingShip >= this.ships.length) {
      if (this.vsComputer) { this.phase = 'play'; if (this.turnEl) this.turnEl.textContent = 'Your turn'; }
      else { this.placingShip = 0; this.placingDir = 0; this.p1Grid = this.playerGrid.map(r => [...r]); this.playerGrid = this.p2Grid; if (this.turnEl) this.turnEl.textContent = 'P2: Place ship: ' + this.ships[0]; }
    }
    this.render();
  }

  private rotateShip(): void { this.placingDir = this.placingDir === 0 ? 1 : 0; this.render(); }

  render(): void {
    this.boardEl.innerHTML = '';
    const sections: [number[][], string, boolean][] = [];
    if (this.phase === 'place') {
      sections.push([this.playerGrid === this.p2Grid ? this.p2Grid : this.playerGrid, this.playerGrid === this.p2Grid ? 'P2 Fleet' : 'Your Fleet', false]);
      if (!this.vsComputer) sections.push([this.enemyGrid, 'Enemy Waters', false]);
    } else {
      const p1DisplayGrid = this.vsComputer ? this.playerGrid : this.p1Grid;
      sections.push([p1DisplayGrid, this.vsComputer ? 'Your Fleet' : 'P1\'s Fleet', !this.vsComputer && !this.gameOver]);
      sections.push([this.enemyGrid, this.vsComputer ? 'Enemy Waters' : 'P2\'s Waters', !this.gameOver]);
    }
    for (const [grid, label, clickable] of sections) {
      const div = document.createElement('div'); div.className = 'bs-section';
      const lbl = document.createElement('div'); lbl.className = 'bs-label'; lbl.textContent = label; div.appendChild(lbl);
      const g = document.createElement('div'); g.className = 'bs-grid';
      for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div'); cell.className = 'bs-cell';
        const val = grid[r][c];
        if (val === 1) cell.classList.add('bs-miss');
        else if (val === 2) cell.classList.add('bs-hit');
        if (grid === this.playerGrid || grid === this.p2Grid || grid === this.p1Grid) { if (val >= 1) cell.classList.add('bs-ship'); }
        if (clickable) {
          if (grid === this.playerGrid || grid === this.p1Grid) cell.addEventListener('click', () => this.p2Move(r, c));
          else cell.addEventListener('click', () => this.playerMove(r, c));
        }
        if (grid === this.playerGrid && this.phase === 'place' && this.playerGrid !== this.p2Grid) cell.addEventListener('click', () => this.placeShip(r, c));
        if (grid === this.p2Grid && this.phase === 'place' && this.playerGrid === this.p2Grid) cell.addEventListener('click', () => this.placeShip(r, c));
        g.appendChild(cell);
      }
      div.appendChild(g); this.boardEl.appendChild(div);
    }
    if (this.phase === 'place') {
      const btn = document.createElement('button');
      btn.textContent = 'Rotate (R)';
      btn.style.cssText = 'padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--glass);color:var(--text);font-size:12px;font-weight:600;cursor:pointer;';
      btn.addEventListener('click', () => this.rotateShip());
      this.boardEl.appendChild(btn);
      const label = this.playerGrid === this.p2Grid ? 'P2' : 'P1';
      if (this.turnEl) this.turnEl.textContent = label + ': Place ship: ' + this.ships[this.placingShip] + ' (click grid, R to rotate)';
    }
  }

  pause(): void { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }
  resume(): void { this.state = 'playing'; }
  destroy(): void { this.pause(); if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler); if (this._boundHandler && this.aiBtnEl) { this.aiBtnEl.removeEventListener('click', this._boundHandler); this._boundHandler = null; } }
}

registerGame(
  { id: 'battleship', title: 'Battleship', category: 'board', description: 'Sink the fleet', icon: '🚢', wrapperId: 'battleship-wrapper' },
  BattleshipGame,
);
