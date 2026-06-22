import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class SprintGame implements Game {
  readonly id = 'sprint';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private distance = 0;
  private speed = 0;
  private raceOver = false;
  private raceLength = 100;
  private _animId: number | null = null;
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private pressed = false;
  private time = 0;
  private _trackEl: HTMLDivElement | null = null;
  private _progressEl: HTMLDivElement | null = null;
  private _runnerEl: HTMLDivElement | null = null;
  private _infoEl: HTMLDivElement | null = null;
  private _hintEl: HTMLDivElement | null = null;
  private _holdBtnEl: HTMLDivElement | null = null;

  constructor() {
    this.boardEl = document.getElementById('sprint-board')!;
    this.turnEl = document.getElementById('sprint-time');
    this.boardEl.style.touchAction = 'none';
  }

  private _touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private _touchEndHandler: ((e: TouchEvent) => void) | null = null;

  init(): void {
    this.distance = 0; this.speed = 0; this.raceOver = false; this.pressed = false; this.time = 0;
    this.state = 'playing';
    if (!this._keyHandler) {
      this._keyHandler = (e: KeyboardEvent) => { if ([' ', 'ArrowUp'].includes(e.key)) { e.preventDefault(); this.pressed = true; } };
      this._keyUpHandler = (e: KeyboardEvent) => { if ([' ', 'ArrowUp'].includes(e.key)) { e.preventDefault(); this.pressed = false; } };
      document.addEventListener('keydown', this._keyHandler);
      document.addEventListener('keyup', this._keyUpHandler);
    }
    if (!this._touchStartHandler) {
      this._touchStartHandler = (e: TouchEvent) => { e.preventDefault(); this.pressed = true; };
      this._touchEndHandler = (e: TouchEvent) => { e.preventDefault(); this.pressed = false; };
      this.boardEl.addEventListener('touchstart', this._touchStartHandler, { passive: false });
      this.boardEl.addEventListener('touchend', this._touchEndHandler, { passive: false });
      this.boardEl.addEventListener('touchcancel', this._touchEndHandler, { passive: false });
    }
    if (!this._trackEl) {
      this._trackEl = document.createElement('div');
      this._trackEl.style.cssText = 'position:relative;width:100%;height:120px;background:#2d4a2d;border-radius:8px;overflow:hidden;margin:20px 0;';
      this._progressEl = document.createElement('div');
      this._progressEl.style.cssText = 'position:absolute;top:50%;left:0;height:4px;background:#ffd700;transform:translateY(-50%);transition:width 0.1s;';
      this._trackEl.appendChild(this._progressEl);
      this._runnerEl = document.createElement('div');
      this._runnerEl.textContent = '🏃';
      this._runnerEl.style.cssText = 'position:absolute;bottom:10px;font-size:28px;transition:left 0.1s;';
      this._trackEl.appendChild(this._runnerEl);
      const finish = document.createElement('div');
      finish.textContent = '🏁';
      finish.style.cssText = 'position:absolute;right:0;top:0;font-size:24px;';
      this._trackEl.appendChild(finish);
      this.boardEl.appendChild(this._trackEl);
      this._infoEl = document.createElement('div');
      this._infoEl.style.cssText = 'color:#fff;font-size:20px;text-align:center;';
      this.boardEl.appendChild(this._infoEl);
      this._hintEl = document.createElement('div');
      this._hintEl.style.cssText = 'color:#aaa;font-size:14px;margin-top:8px;';
      this._hintEl.textContent = 'Hold SPACE/UP or touch the track to run!';
      this.boardEl.appendChild(this._hintEl);
      this._holdBtnEl = document.createElement('div');
      this._holdBtnEl.textContent = 'HOLD TO RUN';
      this._holdBtnEl.style.cssText = 'padding:16px 32px;margin:12px auto;font-size:20px;font-weight:700;border-radius:12px;border:2px solid #ffd700;color:#ffd700;background:var(--glass);cursor:pointer;user-select:none;text-align:center;max-width:200px;touch-action:none;';
      this._holdBtnEl.addEventListener('touchstart', (e) => { e.preventDefault(); this.pressed = true; }, { passive: false });
      this._holdBtnEl.addEventListener('touchend', (e) => { e.preventDefault(); this.pressed = false; }, { passive: false });
      this._holdBtnEl.addEventListener('touchcancel', () => { this.pressed = false; });
      this.boardEl.appendChild(this._holdBtnEl);
    }
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (this.state !== 'playing') { this._animId = null; return; }
      this.update();
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  private update(): void {
    if (this.raceOver) return;
    if (this.pressed) { this.speed = Math.min(10, this.speed + 0.5); this.time += 0.016; }
    else this.speed = Math.max(0, this.speed - 0.3);
    this.distance += this.speed * 1.5;
    if (this.distance >= this.raceLength) { this.distance = this.raceLength; this.raceOver = true; }
  }

  render(): void {
    const pct = this.distance / this.raceLength * 100;
    this._progressEl!.style.width = pct + '%';
    this._runnerEl!.style.left = `calc(${pct}% - 12px)`;
    if (this.raceOver) {
      this._infoEl!.textContent = '🎉 Finished! Time: ' + this.time.toFixed(2) + 's';
      this._infoEl!.style.color = '#ffd700';
      if (this._hintEl) this._hintEl.style.display = 'none';
      if (this._holdBtnEl) this._holdBtnEl.style.display = 'none';
    } else {
      this._infoEl!.textContent = 'Speed: ' + this.speed.toFixed(1) + ' | ' + Math.round(this.distance) + 'm';
      this._infoEl!.style.color = '#fff';
      if (this._hintEl) this._hintEl.style.display = '';
      if (this._holdBtnEl) this._holdBtnEl.style.display = '';
    }
    if (this.turnEl) {
      if (this.raceOver) this.turnEl.textContent = 'Press Restart to play again';
      else this.turnEl.textContent = 'Time: ' + this.time.toFixed(2) + 's';
    }
  }

  pause(): void { if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; if (this._animId === null) this.startLoop(); }
  destroy(): void {
    this.pause();
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    if (this._keyUpHandler) document.removeEventListener('keyup', this._keyUpHandler);
    if (this._touchStartHandler) {
      this.boardEl.removeEventListener('touchstart', this._touchStartHandler);
      this.boardEl.removeEventListener('touchend', this._touchEndHandler!);
      this.boardEl.removeEventListener('touchcancel', this._touchEndHandler!);
    }
  }
}

registerGame(
  { id: 'sprint', title: 'Sprint', category: 'sports', description: 'Dash to the finish', icon: '🏃', wrapperId: 'sprint-wrapper' },
  SprintGame,
);
