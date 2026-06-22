import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class MastermindGame implements Game {
  readonly id = 'mastermind';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private secret: string[] = [];
  private guesses: string[][] = [];
  private feedback: { exact: number; color: number }[] = [];
  private maxGuesses = 10;
  private colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  private currentGuess: (string | null)[] = [];
  private gameOver = false;
  private won = false;

  constructor() {
    this.boardEl = document.getElementById('mastermind-board')!;
    this.turnEl = document.getElementById('mm-status');
  }

  init(): void {
    this.secret = [];
    const pool = [...this.colors];
    for (let i = 0; i < 4; i++) { const idx = Math.floor(Math.random() * pool.length); this.secret.push(pool[idx]); pool.splice(idx, 1); }
    this.guesses = []; this.feedback = []; this.currentGuess = Array(4).fill(null); this.gameOver = false; this.won = false;
    this.state = 'playing';
    this.render();
  }

  selectColor(color: string): void {
    if (this.gameOver) return;
    const idx = this.currentGuess.indexOf(null);
    if (idx === -1) return;
    this.currentGuess[idx] = color;
    this.render();
  }

  submitGuess(): void {
    if (this.gameOver || this.currentGuess.some(c => c === null)) return;
    const guess = [...this.currentGuess] as string[];
    this.guesses.push(guess);
    let exact = 0, color = 0;
    const sec = [...this.secret];
    const g = [...guess];
    for (let i = 0; i < 4; i++) { if (g[i] === sec[i]) { exact++; g[i] = ''; sec[i] = ''; } }
    for (let i = 0; i < 4; i++) { if (g[i] && sec.includes(g[i])) { color++; sec[sec.indexOf(g[i])] = ''; } }
    this.feedback.push({ exact, color });
    if (exact === 4) { this.won = true; this.gameOver = true; }
    else if (this.guesses.length >= this.maxGuesses) { this.gameOver = true; }
    this.currentGuess = Array(4).fill(null);
    this.render();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    const historyDiv = document.createElement('div'); historyDiv.className = 'mm-history';
    for (let i = 0; i < this.guesses.length; i++) {
      const row = document.createElement('div'); row.className = 'mm-row';
      for (const peg of this.guesses[i]) { const p = document.createElement('div'); p.className = 'mm-peg mm-' + peg; row.appendChild(p); }
      if (this.feedback[i]) {
        const fb = document.createElement('div'); fb.className = 'mm-feedback'; fb.textContent = '●'.repeat(this.feedback[i].exact) + '○'.repeat(this.feedback[i].color);
        row.appendChild(fb);
      }
      historyDiv.appendChild(row);
    }
    this.boardEl.appendChild(historyDiv);

    const currentDiv = document.createElement('div'); currentDiv.className = 'mm-current';
    for (const peg of this.currentGuess) { const p = document.createElement('div'); p.className = 'mm-peg' + (peg ? ' mm-' + peg : ''); p.style.border = peg ? '' : '2px dashed #666'; currentDiv.appendChild(p); }
    this.boardEl.appendChild(currentDiv);

    const picker = document.createElement('div'); picker.className = 'mm-picker';
    for (const color of this.colors) { const btn = document.createElement('button'); btn.className = 'mm-btn mm-' + color; btn.addEventListener('click', () => this.selectColor(color)); picker.appendChild(btn); }
    const submit = document.createElement('button'); submit.textContent = 'Guess'; submit.className = 'mm-submit'; submit.addEventListener('click', () => this.submitGuess());
    picker.appendChild(submit);
    this.boardEl.appendChild(picker);

    if (this.turnEl) {
      if (this.gameOver) {
        if (this.won) { this.turnEl.textContent = '🎉 Cracked!'; this.turnEl.style.color = '#4ade80'; }
        else { this.turnEl.textContent = 'Game Over! Secret: ' + this.secret.join(' '); this.turnEl.style.color = '#ff6b6b'; }
      } else this.turnEl.textContent = 'Guesses: ' + this.guesses.length + '/' + this.maxGuesses;
    }
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'mastermind', title: 'Mastermind', category: 'puzzle', description: 'Crack the code', icon: '🧩', wrapperId: 'mastermind-wrapper' },
  MastermindGame,
);
