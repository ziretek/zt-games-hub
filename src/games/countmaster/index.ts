import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class CountMasterGame implements Game {
  readonly id = 'countmaster';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private num1 = 0;
  private num2 = 0;
  private operator = '+';
  private answer = 0;
  private score = 0;
  private total = 0;
  private gameOver = false;
  private timeLeft = 60;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _buffer = '';

  constructor() {
    this.boardEl = document.getElementById('countmaster-board')!;
    this.turnEl = document.getElementById('cm-turn');
    this.scoreEl = document.getElementById('cm-score');
    this.boardEl.style.touchAction = 'manipulation';
  }

  init(): void {
    this.score = 0; this.total = 0; this.timeLeft = 60; this.gameOver = false;
    this.state = 'playing';
    this.newQuestion();
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.gameOver = true; this.state = 'idle';
        if (this._timer) clearInterval(this._timer); this._timer = null;
      }
      this.render();
    }, 1000);
    this.render();
  }

  private newQuestion(): void {
    const ops = ['+', '-', '*'];
    this.operator = ops[Math.floor(Math.random() * 3)];
    if (this.operator === '+') { this.num1 = Math.floor(Math.random() * 50) + 1; this.num2 = Math.floor(Math.random() * 50) + 1; this.answer = this.num1 + this.num2; }
    else if (this.operator === '-') { this.num1 = Math.floor(Math.random() * 50) + 10; this.num2 = Math.floor(Math.random() * this.num1) + 1; this.answer = this.num1 - this.num2; }
    else { this.num1 = Math.floor(Math.random() * 12) + 2; this.num2 = Math.floor(Math.random() * 12) + 2; this.answer = this.num1 * this.num2; }
    this.total++;
  }

  private handlePadTap(value: string): void {
    if (this.gameOver) return;
    if (value === 'Enter') {
      if (this._buffer) { this.submitAnswer(this._buffer); this._buffer = ''; }
    } else if (value === 'Backspace') {
      this._buffer = this._buffer.slice(0, -1);
    } else if (value === '-' || /^\d$/.test(value)) {
      this._buffer += value;
    }
  }

  submitAnswer(input: string): void {
    if (this.gameOver) return;
    const val = parseInt(input, 10);
    if (val === this.answer) this.score++;
    this._buffer = '';
    this.newQuestion();
    this.render();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    if (this.gameOver) {
      const msg = document.createElement('div');
      msg.textContent = 'Time\'s Up! Score: ' + this.score + '/' + this.total;
      msg.style.cssText = 'color:#ffd700;font-size:24px;font-weight:700;text-align:center;';
      this.boardEl.appendChild(msg);
      return;
    }
    const q = document.createElement('div');
    q.textContent = this.num1 + ' ' + this.operator + ' ' + this.num2 + ' = ?';
    q.style.cssText = 'color:#fff;font-size:32px;font-weight:700;text-align:center;padding:20px;';
    this.boardEl.appendChild(q);
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'cm-input';
    input.style.cssText = 'display:block;margin:10px auto;padding:10px 20px;font-size:24px;text-align:center;border:2px solid var(--border);border-radius:12px;background:var(--glass);color:#fff;width:200px;';
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { this.submitAnswer(input.value); input.value = ''; input.focus(); } });
    this.boardEl.appendChild(input);
    input.focus();

    const display = document.createElement('div');
    display.textContent = this._buffer || '?';
    display.style.cssText = 'color:#fff;font-size:28px;font-weight:700;text-align:center;padding:8px;margin:8px 0;letter-spacing:4px;';
    this.boardEl.appendChild(display);

    const pad = document.createElement('div');
    pad.style.cssText = 'display:grid;grid-template-columns:repeat(3,60px);gap:6px;justify-content:center;margin:10px 0;';
    const keys = ['1','2','3','4','5','6','7','8','9','-','0','⌫','Enter'];
    for (const k of keys) {
      const btn = document.createElement('div');
      btn.textContent = k === 'Enter' ? '✓' : k;
      const tapValue = k === '⌫' ? 'Backspace' : k;
      btn.style.cssText = 'padding:10px;text-align:center;font-size:20px;font-weight:700;border:2px solid var(--border);border-radius:8px;background:var(--glass);color:#fff;cursor:pointer;user-select:none;';
      btn.addEventListener('click', () => this.handlePadTap(tapValue));
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.handlePadTap(tapValue); }, { passive: false });
      pad.appendChild(btn);
    }
    this.boardEl.appendChild(pad);

    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + '/' + this.total;
    if (this.turnEl) this.turnEl.textContent = 'Time: ' + this.timeLeft + 's';
  }

  pause(): void { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
  resume(): void { if (this.gameOver || this.timeLeft <= 0) { this.state = 'idle'; return; } this.state = 'playing'; if (!this._timer) { this._timer = setInterval(() => { this.timeLeft--; if (this.timeLeft <= 0) { this.gameOver = true; this.state = 'idle'; if (this._timer) clearInterval(this._timer); this._timer = null; } this.render(); }, 1000); } }
  destroy(): void { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
}

registerGame(
  { id: 'countmaster', title: 'CountMaster', category: 'puzzle', description: 'Quick math challenge', icon: '🧮', wrapperId: 'countmaster-wrapper' },
  CountMasterGame,
);
