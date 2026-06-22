import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

const MEMORY_ICONS = ['🐶', '🐱', '🐸', '🦊', '🐻', '🐼', '🐨', '🦁'];

export class MemoryGame implements Game {
  readonly id = 'memory';
  state: GameState = 'idle';

  private boardEl: HTMLElement | null;
  private movesEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private cards: string[] = [];
  private flipped: number[] = [];
  private matchedSet = new Set<number>();
  private matched = 0;
  private moves = 0;
  private locked = false;
  private _flipTimer: ReturnType<typeof setTimeout> | null = null;
  private _boundClick: ((e: MouseEvent) => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('memory-board');
    this.movesEl = document.getElementById('mem-moves');
    this.scoreEl = document.getElementById('mem-score');
  }

  init(): void {
    if (this._flipTimer) { clearTimeout(this._flipTimer); this._flipTimer = null; }
    this.cards = [...MEMORY_ICONS, ...MEMORY_ICONS];
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.flipped = [];
    this.matchedSet = new Set();
    this.matched = 0;
    this.moves = 0;
    this.locked = false;
    this.state = 'playing';
    if (this.movesEl) this.movesEl.textContent = 'Moves: 0';
    if (this.scoreEl) this.scoreEl.textContent = 'Pairs: 0 / ' + MEMORY_ICONS.length;
    this.render();
    if (!this._boundClick) {
      this._boundClick = (e: MouseEvent) => {
        const card = (e.target as HTMLElement).closest('.mem-card') as HTMLElement | null;
        if (!card) return;
        const i = parseInt(card.dataset.i ?? '', 10);
        if (isNaN(i) || this.matchedSet.has(i)) return;
        this.flip(i);
      };
      this.boardEl?.addEventListener('click', this._boundClick);
    }
  }

  private flip(index: number): void {
    if (this.locked) return;
    if (this.flipped.includes(index)) return;
    if (this.matchedSet.has(index)) return;
    if (this.flipped.length === 2) return;
    this.flipped.push(index);
    this.render();
    if (this.flipped.length === 2) {
      this.moves++;
      if (this.movesEl) this.movesEl.textContent = 'Moves: ' + this.moves;
      const [i, j] = this.flipped;
      if (this.cards[i] === this.cards[j]) {
        this.matched++;
        this.matchedSet.add(i);
        this.matchedSet.add(j);
        if (this.scoreEl) this.scoreEl.textContent = 'Pairs: ' + this.matched + ' / ' + MEMORY_ICONS.length;
        this.flipped = [];
        this.render();
        this.checkWin();
      } else {
        this.locked = true;
        this._flipTimer = setTimeout(() => {
          this._flipTimer = null;
          this.flipped = [];
          this.locked = false;
          this.render();
        }, 700);
      }
    }
  }

  private checkWin(): void {
    if (this.matched === MEMORY_ICONS.length) {
      this._flipTimer = setTimeout(() => {
        this._flipTimer = null;
        this.showWin();
      }, 400);
    }
  }

  private showWin(): void {
    this.state = 'won';
    const overlay = document.createElement('div');
    overlay.className = 'mem-overlay';
    const text = document.createElement('div');
    text.className = 'mem-overlay-text';
    text.textContent = 'You Win!';
    overlay.appendChild(text);
    const info = document.createElement('div');
    info.className = 'mem-overlay-info';
    info.textContent = this.moves + ' moves';
    overlay.appendChild(info);
    const btn = document.createElement('button');
    btn.className = 'mem-overlay-btn';
    btn.textContent = 'Play Again';
    btn.addEventListener('click', () => { overlay.remove(); this.init(); });
    overlay.appendChild(btn);
    this.boardEl?.appendChild(overlay);
  }

  render(): void {
    if (!this.boardEl) return;
    this.boardEl.innerHTML = '';
    for (let i = 0; i < this.cards.length; i++) {
      const card = document.createElement('div');
      card.className = 'mem-card';
      const isMatched = this.matchedSet.has(i);
      const isFlipped = this.flipped.includes(i) || isMatched;
      if (isMatched) card.classList.add('matched');
      if (isFlipped) card.classList.add('flipped');
      const inner = document.createElement('div');
      inner.className = 'mem-card-inner';
      const back = document.createElement('div');
      back.className = 'mem-card-back';
      const front = document.createElement('div');
      front.className = 'mem-card-front';
      front.textContent = this.cards[i];
      inner.appendChild(back);
      inner.appendChild(front);
      card.appendChild(inner);
      card.dataset.i = String(i);
      this.boardEl.appendChild(card);
    }
  }

  pause(): void {
    if (this._flipTimer) { clearTimeout(this._flipTimer); this._flipTimer = null; }
  }

  resume(): void { this.state = 'playing'; }
  destroy(): void { this.pause(); }
}

registerGame(
  { id: 'memory', title: 'Memory', category: 'puzzle', description: 'Match the pairs', icon: '🃏', wrapperId: 'memory-wrapper' },
  MemoryGame,
);
