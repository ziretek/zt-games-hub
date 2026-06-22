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

  constructor() {
    this.boardEl = document.getElementById('sprint-board')!;
    this.turnEl = document.getElementById('sprint-turn');
  }

  private _touchStartHandler: (() => void) | null = null;
  private _touchEndHandler: (() => void) | null = null;

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
      this._touchStartHandler = () => { this.pressed = true; };
      this._touchEndHandler = () => { this.pressed = false; };
      this.boardEl.addEventListener('touchstart', this._touchStartHandler, { passive: true });
      this.boardEl.addEventListener('touchend', this._touchEndHandler, { passive: true });
      this.boardEl.addEventListener('touchcancel', this._touchEndHandler, { passive: true });
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
    this.boardEl.innerHTML = '';
    const track = document.createElement('div');
    track.style.cssText = 'position:relative;width:100%;height:120px;background:#2d4a2d;border-radius:8px;overflow:hidden;margin:20px 0;';
    const progress = document.createElement('div');
    progress.style.cssText = 'position:absolute;top:50%;left:0;width:' + (this.distance / this.raceLength * 100) + '%;height:4px;background:#ffd700;transform:translateY(-50%);transition:width 0.1s;';
    track.appendChild(progress);
    const runner = document.createElement('div');
    runner.textContent = '🏃';
    runner.style.cssText = 'position:absolute;bottom:10px;left:calc(' + (this.distance / this.raceLength * 100) + '% - 12px);font-size:28px;transition:left 0.1s;';
    track.appendChild(runner);
    const finish = document.createElement('div');
    finish.textContent = '🏁';
    finish.style.cssText = 'position:absolute;right:0;top:0;font-size:24px;';
    track.appendChild(finish);
    this.boardEl.appendChild(track);

    const info = document.createElement('div');
    info.style.cssText = 'color:#fff;font-size:20px;text-align:center;';
    if (this.raceOver) {
      info.textContent = '🎉 Finished! Time: ' + this.time.toFixed(2) + 's';
      info.style.color = '#ffd700';
    } else {
      info.textContent = 'Speed: ' + this.speed.toFixed(1) + ' | ' + Math.round(this.distance) + 'm';
      const hint = document.createElement('div');
      hint.style.cssText = 'color:#aaa;font-size:14px;margin-top:8px;';
      hint.textContent = 'Hold SPACE or UP to run!';
      this.boardEl.appendChild(hint);
    }
    this.boardEl.appendChild(info);
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
