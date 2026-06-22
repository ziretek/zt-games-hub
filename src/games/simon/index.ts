import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class SimonGame implements Game {
  readonly id = 'simon';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private sequence: number[] = [];
  private playerIndex = 0;
  private round = 0;
  private playing = false;
  private gameOver = false;
  private _isShowing = false;
  private _timeouts: ReturnType<typeof setTimeout>[] = [];
  private colors = ['green', 'red', 'blue', 'yellow'];

  constructor() {
    this.boardEl = document.getElementById('simon-board')!;
    this.turnEl = document.getElementById('sim-status');
  }

  init(): void {
    this.sequence = []; this.playerIndex = 0; this.round = 0; this.playing = false; this.gameOver = false;
    this.state = 'playing';
    this._timeouts.forEach(clearTimeout); this._timeouts = [];
    this.render();
    this.nextRound();
  }

  private nextRound(): void {
    this.round++;
    this.playerIndex = 0;
    this.sequence.push(Math.floor(Math.random() * 4));
    if (this.turnEl) this.turnEl.textContent = 'Round ' + this.round + ' - Watch!';
    this._isShowing = true;
    this.sequence.forEach((color, i) => {
      this._timeouts.push(setTimeout(() => { this.flash(color); if (i === this.sequence.length - 1) { setTimeout(() => { this._isShowing = false; if (this.turnEl) this.turnEl.textContent = 'Your turn!'; }, 400); } }, (i + 1) * 800));
    });
    setTimeout(() => { this.playing = true; }, this.sequence.length * 800 + 400);
  }

  private flash(i: number): void {
    const pad = this.boardEl.children[i] as HTMLElement;
    pad.style.opacity = '1';
    setTimeout(() => { pad.style.opacity = '0.6'; }, 300);
  }

  press(i: number): void {
    if (this._isShowing || !this.playing || this.gameOver) return;
    this.flash(i);
    if (i !== this.sequence[this.playerIndex]) {
      this.gameOver = true; this.playing = false;
      if (this.turnEl) { this.turnEl.textContent = 'Game Over! Score: ' + (this.round - 1); this.turnEl.style.color = '#ff6b6b'; }
      this.boardEl.classList.add('simon-error');
      setTimeout(() => this.boardEl.classList.remove('simon-error'), 300);
      return;
    }
    this.playerIndex++;
    if (this.playerIndex >= this.sequence.length) {
      this.playing = false;
      if (this.round >= 20) { if (this.turnEl) { this.turnEl.textContent = '🎉 You Win!'; this.turnEl.style.color = '#ffd700'; } return; }
      setTimeout(() => this.nextRound(), 600);
    }
  }

  render(): void {
    this.boardEl.innerHTML = '';
    this.colors.forEach((color, i) => {
      const pad = document.createElement('div');
      pad.className = 'simon-pad simon-' + color;
      pad.addEventListener('click', () => this.press(i));
      this.boardEl.appendChild(pad);
    });
  }

  pause(): void { this._timeouts.forEach(clearTimeout); this._timeouts = []; }
  resume(): void {
    if (this.gameOver) { this.state = 'idle'; return; }
    this.state = 'playing';
    if (this._isShowing) {
      this.sequence.forEach((color, i) => {
        this._timeouts.push(setTimeout(() => { this.flash(color); if (i === this.sequence.length - 1) { setTimeout(() => { this._isShowing = false; if (this.turnEl) this.turnEl.textContent = 'Your turn!'; }, 400); } }, (i + 1) * 800));
      });
      setTimeout(() => { this.playing = true; }, this.sequence.length * 800 + 400);
    }
  }
  destroy(): void { this._timeouts.forEach(clearTimeout); this._timeouts = []; }
}

registerGame(
  { id: 'simon', title: 'Simon', category: 'arcade', description: 'Remember the pattern', icon: '🟢🔴🔵🟡', wrapperId: 'simon-wrapper' },
  SimonGame,
);
