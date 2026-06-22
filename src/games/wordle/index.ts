import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class WordleGame implements Game {
  readonly id = 'wordle';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private words = ['REACT','BUILD','CLICK','STATE','HOOK','STYLE','CACHE','QUERY','ROUTE','STACK','QUEUE','SCOPE','TRACE','FLUSH','LOGIC','BYTES','CLASS','FIELD','MODEL','VIEWS'];
  private secret = '';
  private guesses: string[] = [];
  private maxGuesses = 6;
  private gameOver = false;
  private won = false;
  private _input = '';
  private static KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  constructor() {
    this.boardEl = document.getElementById('wordle-board')!;
    this.turnEl = document.getElementById('wordle-message');
  }

  init(): void {
    this.secret = this.words[Math.floor(Math.random() * this.words.length)];
    this.guesses = []; this.gameOver = false; this.won = false; this._input = '';
    this.state = 'playing';
    this.render();
  }

  submitGuess(word: string): void {
    if (this.gameOver || word.length !== 5) return;
    this.guesses.push(word.toUpperCase());
    if (word.toUpperCase() === this.secret) { this.won = true; this.gameOver = true; }
    else if (this.guesses.length >= this.maxGuesses) this.gameOver = true;
    this.render();
  }

  render(): void {
    this.boardEl.innerHTML = '';
    for (let i = 0; i < this.maxGuesses; i++) {
      const row = document.createElement('div'); row.className = 'wordle-row';
      for (let j = 0; j < 5; j++) {
        const cell = document.createElement('div'); cell.className = 'wordle-cell';
        if (i < this.guesses.length) {
          cell.textContent = this.guesses[i][j];
          if (this.guesses[i][j] === this.secret[j]) cell.classList.add('wordle-correct');
          else if (this.secret.includes(this.guesses[i][j])) cell.classList.add('wordle-present');
          else cell.classList.add('wordle-absent');
        }
        row.appendChild(cell);
      }
      this.boardEl.appendChild(row);
    }
    const input = document.createElement('input');
    input.type = 'text'; input.maxLength = 5;
    input.className = 'wordle-input';
    input.style.cssText = 'display:block;margin:10px auto;padding:8px 16px;font-size:20px;text-align:center;text-transform:uppercase;border:2px solid var(--border);border-radius:8px;background:var(--glass);color:#fff;width:150px;letter-spacing:8px;';
    if (!this.gameOver) {
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.length === 5) { this.submitGuess(input.value); input.value = ''; this._input = ''; input.focus(); } });
      this.boardEl.appendChild(input);
      input.focus();

      const kb = document.createElement('div');
      kb.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;margin-top:12px;';
      kb.style.touchAction = 'manipulation';
      for (const row of WordleGame.KEYBOARD_ROWS) {
        const r = document.createElement('div');
        r.style.cssText = 'display:flex;gap:3px;';
        for (const letter of row) {
          const k = document.createElement('div');
          k.textContent = letter;
          k.style.cssText = 'padding:8px 6px;min-width:24px;text-align:center;font-size:14px;font-weight:700;border-radius:4px;background:var(--glass);color:#fff;cursor:pointer;user-select:none;';
          k.addEventListener('click', () => {
            if (this._input.length < 5) { this._input += letter; input.value = this._input; }
          });
          k.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this._input.length < 5) { this._input += letter; input.value = this._input; }
          }, { passive: false });
          r.appendChild(k);
        }
        kb.appendChild(r);
      }
      const actionRow = document.createElement('div');
      actionRow.style.cssText = 'display:flex;gap:6px;margin-top:4px;';
      const enterBtn = document.createElement('div');
      enterBtn.textContent = 'Enter';
      enterBtn.style.cssText = 'padding:8px 16px;font-size:14px;font-weight:700;border-radius:4px;background:var(--glass);color:#4ade80;cursor:pointer;user-select:none;';
      enterBtn.addEventListener('click', () => {
        if (this._input.length === 5) { this.submitGuess(this._input); this._input = ''; input.value = ''; }
      });
      enterBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this._input.length === 5) { this.submitGuess(this._input); this._input = ''; input.value = ''; }
      }, { passive: false });
      const backBtn = document.createElement('div');
      backBtn.textContent = '⌫';
      backBtn.style.cssText = 'padding:8px 16px;font-size:14px;font-weight:700;border-radius:4px;background:var(--glass);color:#ff6b6b;cursor:pointer;user-select:none;';
      backBtn.addEventListener('click', () => {
        if (this._input.length > 0) { this._input = this._input.slice(0, -1); input.value = this._input; }
      });
      backBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this._input.length > 0) { this._input = this._input.slice(0, -1); input.value = this._input; }
      }, { passive: false });
      actionRow.appendChild(backBtn);
      actionRow.appendChild(enterBtn);
      kb.appendChild(actionRow);
      this.boardEl.appendChild(kb);
    }
    if (this.turnEl) {
      if (this.won) { this.turnEl.textContent = '🎉 Got it!'; this.turnEl.style.color = '#4ade80'; }
      else if (this.gameOver) { this.turnEl.textContent = 'Word was: ' + this.secret; this.turnEl.style.color = '#ff6b6b'; }
      else { this.turnEl.textContent = 'Guess ' + (this.guesses.length + 1) + '/' + this.maxGuesses; this.turnEl.style.color = ''; }
    }
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'wordle', title: 'Wordle', category: 'puzzle', description: 'Guess the 5-letter word', icon: '🟩🟨⬛', wrapperId: 'wordle-wrapper' },
  WordleGame,
);
