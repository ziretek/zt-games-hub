import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class TypingTestGame implements Game {
  readonly id = 'typingtest';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private passages = [
    'The quick brown fox jumps over the lazy dog.',
    'Programming is the art of telling another human being what one wants the computer to do.',
    'In the middle of difficulty lies opportunity.',
    'The best way to predict the future is to create it.',
    'Simplicity is the ultimate sophistication.',
    'Code is like humor when you have to explain it it is bad.',
    'First solve the problem then write the code.',
    'Talk is cheap show me the code.',
  ];
  private passage = '';
  private typed = '';
  private startTime = 0;
  private finished = false;
  private wpm = 0;
  private accuracy = 100;

  constructor() {
    this.boardEl = document.getElementById('typingtest-board')!;
    this.turnEl = document.getElementById('typingtest-wpm');
    this.scoreEl = document.getElementById('typingtest-accuracy');
  }

  init(): void {
    this.passage = this.passages[Math.floor(Math.random() * this.passages.length)];
    this.typed = ''; this.startTime = 0; this.finished = false; this.wpm = 0; this.accuracy = 100;
    this.state = 'playing';
    this.render();
    const input = this.boardEl.querySelector('.ttest-input') as HTMLInputElement;
    if (input) { input.focus(); input.value = ''; }
  }

  handleInput(value: string): void {
    if (this.finished) return;
    if (this.startTime === 0) this.startTime = Date.now();
    this.typed = value;
    if (this.typed.length >= this.passage.length) { this.finish(); return; }
    const correct = [...this.typed].filter((c, i) => c === this.passage[i]).length;
    this.accuracy = Math.round((correct / this.typed.length) * 100);
    this.render();
  }

  private finish(): void {
    this.finished = true;
    const elapsed = (Date.now() - this.startTime) / 1000 / 60;
    const words = this.passage.split(' ').length;
    this.wpm = Math.round(words / elapsed);
    if (this.turnEl) { this.turnEl.textContent = 'WPM: ' + this.wpm; this.turnEl.style.color = '#ffd700'; }
    this.render();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    if (!this.finished) {
      const display = document.createElement('div'); display.className = 'ttest-passage';
      for (let i = 0; i < this.passage.length; i++) {
        const span = document.createElement('span');
        if (i < this.typed.length) {
          span.textContent = this.passage[i];
          span.style.color = this.typed[i] === this.passage[i] ? '#4ade80' : '#ff6b6b';
        } else if (i === this.typed.length) { span.textContent = this.passage[i]; span.style.color = '#ffd700'; span.style.textDecoration = 'underline'; }
        else { span.textContent = this.passage[i]; span.style.color = '#666'; }
        display.appendChild(span);
      }
      this.boardEl.appendChild(display);
      const input = document.createElement('textarea');
      input.className = 'ttest-input';
      input.style.cssText = 'display:block;margin:15px auto;padding:12px;font-size:18px;width:90%;height:60px;border:2px solid var(--border);border-radius:8px;background:var(--glass);color:#fff;font-family:monospace;resize:none;';
      input.addEventListener('input', () => this.handleInput(input.value));
      input.addEventListener('touchstart', () => { input.focus(); }, { passive: true });
      this.boardEl.appendChild(input);
      input.focus();
      if (this.turnEl) this.turnEl.textContent = 'Start typing...';
    } else {
      const result = document.createElement('div');
      result.style.cssText = 'color:#ffd700;font-size:28px;font-weight:700;text-align:center;padding:20px;';
      result.textContent = 'WPM: ' + this.wpm + ' | Accuracy: ' + this.accuracy + '%';
      this.boardEl.appendChild(result);
    }
    if (this.scoreEl) this.scoreEl.textContent = 'Accuracy: ' + (this.finished ? this.accuracy : (this.typed.length > 0 ? this.accuracy : 100)) + '%';
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'typingtest', title: 'Typing Test', category: 'puzzle', description: 'Test your typing speed', icon: '⌨️', wrapperId: 'typingtest-wrapper' },
  TypingTestGame,
);
