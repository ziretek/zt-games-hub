import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class AnagramsGame implements Game {
  readonly id = 'anagrams';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private words = ['JAVASCRIPT','PYTHON','TYPESCRIPT','ALGORITHM','FUNCTION','VARIABLE','CONSTANT','INTERFACE','CLASS','MODULE','PROMISE','ASYNC','AWAIT','ARRAY','OBJECT','STRING','NUMBER','BOOLEAN','METHOD','PROPERTY','ELEMENT','WINDOW','DOCUMENT','CALLBACK','PACKAGE','IMPORT','EXPORT','DEFAULT','BROWSER','SERVER','CLIENT','RENDER','UPDATE','FILTER','REDUCE','SPLICE','SLICE','FETCH','ROUTES','STYLES'];
  private word = '';
  private shuffled = '';
  private solved = false;
  private gameOver = false;

  constructor() {
    this.boardEl = document.getElementById('anagrams-game-area')!;
    this.turnEl = document.getElementById('ana-turn');
  }

  init(): void {
    this.word = this.words[Math.floor(Math.random() * this.words.length)];
    this.shuffled = this.word.split('').sort(() => Math.random() - 0.5).join('');
    if (this.shuffled === this.word) { const a = this.shuffled.split(''); [a[0], a[1]] = [a[1], a[0]]; this.shuffled = a.join(''); }
    this.solved = false; this.gameOver = false;
    this.state = 'playing';
    this.render();
  }

  submitGuess(guess: string): void {
    if (this.gameOver) return;
    if (guess.toUpperCase() === this.word) { this.solved = true; this.gameOver = true; }
    else {
      if (this.turnEl) { this.turnEl.textContent = 'Not correct!'; this.turnEl.style.color = '#ff6b6b'; setTimeout(() => { if (this.turnEl) { this.turnEl.textContent = 'Unscramble the word'; this.turnEl.style.color = ''; } }, 1000); }
    }
    this.render();
  }

  skip(): void { this.init(); }

  render(): void {
    this.boardEl.innerHTML = '';
    const scrambled = document.createElement('div');
    scrambled.className = 'ana-scrambled';
    scrambled.textContent = this.gameOver ? this.word : this.shuffled;
    scrambled.style.cssText = 'color:#ffd700;font-size:36px;font-weight:700;text-align:center;padding:20px;letter-spacing:12px;text-transform:uppercase;';
    this.boardEl.appendChild(scrambled);
    if (!this.solved) {
      const input = document.createElement('input');
      input.type = 'text'; input.className = 'ana-input';
      input.style.cssText = 'display:block;margin:10px auto;padding:8px 16px;font-size:20px;text-align:center;text-transform:uppercase;border:2px solid var(--border);border-radius:8px;background:var(--glass);color:#fff;width:250px;';
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.length > 0) { this.submitGuess(input.value); input.value = ''; input.focus(); } });
      this.boardEl.appendChild(input);
      input.focus();
      const skip = document.createElement('button');
      skip.textContent = 'Skip';
      skip.style.cssText = 'display:block;margin:10px auto;padding:8px 16px;border:1px solid var(--border);border-radius:8px;background:var(--glass);color:var(--text);font-size:14px;cursor:pointer;';
      skip.addEventListener('click', () => this.skip());
      this.boardEl.appendChild(skip);
    }
    if (this.turnEl) {
      if (this.solved) { this.turnEl.textContent = '🎉 Correct!'; this.turnEl.style.color = '#4ade80'; }
      else if (this.gameOver) { this.turnEl.textContent = 'The word was: ' + this.word; this.turnEl.style.color = '#ffd700'; }
      else this.turnEl.textContent = 'Unscramble the word';
    }
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'anagrams', title: 'Anagrams', category: 'puzzle', description: 'Unscramble the word', icon: '🔀', wrapperId: 'anagrams-wrapper' },
  AnagramsGame,
);
