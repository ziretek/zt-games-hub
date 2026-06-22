import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class HangmanGame implements Game {
  readonly id = 'hangman';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private wordEl: HTMLElement | null;
  private lettersEl: HTMLElement | null;
  private turnEl: HTMLElement | null;
  private words = ['JAVASCRIPT','PYTHON','TYPESCRIPT','ALGORITHM','FUNCTION','VARIABLE','CONSTANT','INTERFACE','CLASS','MODULE','PROMISE','ASYNC','AWAIT','ARRAY','OBJECT','STRING','NUMBER','BOOLEAN','METHOD','PROPERTY'];
  private word = '';
  private guessed: string[] = [];
  private remaining = 6;
  private won = false;
  private gameOver = false;

  constructor() {
    this.boardEl = document.getElementById('hangman-board')!;
    this.wordEl = document.getElementById('hang-word');
    this.lettersEl = document.getElementById('hang-letters');
    this.turnEl = document.getElementById('hang-turn');
  }

  init(): void {
    this.word = this.words[Math.floor(Math.random() * this.words.length)];
    this.guessed = []; this.remaining = 6; this.won = false; this.gameOver = false;
    this.state = 'playing';
    this.render();
  }

  guess(letter: string): void {
    if (this.gameOver || this.guessed.includes(letter)) return;
    this.guessed.push(letter);
    if (!this.word.includes(letter)) this.remaining--;
    if (this.word.split('').every(l => this.guessed.includes(l))) { this.won = true; this.gameOver = true; }
    if (this.remaining <= 0) this.gameOver = true;
    this.render();
  }

  render(): void {
    if (!this.boardEl) return;
    this.boardEl.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 250'); svg.setAttribute('width', '200'); svg.setAttribute('height', '250');
    const draw = svg;
    const el = (tag: string, attrs: Record<string,string>) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); draw.appendChild(e); };
    el('line', { x1: '20', y1: '230', x2: '180', y2: '230', stroke: '#666', 'stroke-width': '3' });
    el('line', { x1: '40', y1: '230', x2: '40', y2: '20', stroke: '#666', 'stroke-width': '3' });
    el('line', { x1: '40', y1: '20', x2: '140', y2: '20', stroke: '#666', 'stroke-width': '3' });
    el('line', { x1: '140', y1: '20', x2: '140', y2: '50', stroke: '#666', 'stroke-width': '3' });
    if (this.remaining < 6) el('circle', { cx: '140', cy: '70', r: '20', stroke: '#666', 'stroke-width': '3', fill: 'none' });
    if (this.remaining < 5) el('line', { x1: '140', y1: '90', x2: '140', y2: '150', stroke: '#666', 'stroke-width': '3' });
    if (this.remaining < 4) el('line', { x1: '140', y1: '105', x2: '110', y2: '130', stroke: '#666', 'stroke-width': '3' });
    if (this.remaining < 3) el('line', { x1: '140', y1: '105', x2: '170', y2: '130', stroke: '#666', 'stroke-width': '3' });
    if (this.remaining < 2) el('line', { x1: '140', y1: '150', x2: '115', y2: '190', stroke: '#666', 'stroke-width': '3' });
    if (this.remaining < 1) el('line', { x1: '140', y1: '150', x2: '165', y2: '190', stroke: '#666', 'stroke-width': '3' });
    this.boardEl.appendChild(svg);

    if (this.wordEl) {
      this.wordEl.textContent = this.word.split('').map(l => this.guessed.includes(l) ? l : '_').join(' ');
      this.wordEl.style.color = this.gameOver ? (this.won ? '#4ade80' : '#ff6b6b') : '#ffd700';
    }
    if (this.turnEl) this.turnEl.textContent = this.gameOver ? (this.won ? 'You saved him!' : 'Game Over!') : 'Remaining: ' + this.remaining;
    if (this.lettersEl) {
      this.lettersEl.innerHTML = '';
      for (let i = 65; i <= 90; i++) {
        const l = String.fromCharCode(i);
        const btn = document.createElement('button');
        btn.textContent = l;
        btn.className = 'hang-letter-btn';
        if (this.guessed.includes(l)) btn.disabled = true;
        btn.addEventListener('click', () => this.guess(l));
        this.lettersEl.appendChild(btn);
      }
    }
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'hangman', title: 'Hangman', category: 'puzzle', description: 'Save the stick figure', icon: '🪢', wrapperId: 'hangman-wrapper' },
  HangmanGame,
);
