import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class SpellingBeeGame implements Game {
  readonly id = 'spellingbee';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private words = ['NECESSARY','ACCOMMODATE','OCCASION','EMBARRASS','MILLENNIUM','PRIVILEGE','RECOMMEND','GUARANTEE','RHYTHM','WEIRD','CONSCIENCE','DEFINITELY','FEBRUARY','LIBRARY','CALENDAR','SEPARATE','INDEPENDENT','EXISTENCE','OCCURRENCE','PARALLEL'];
  private word = '';
  private hints = 3;
  private gameOver = false;
  private won = false;

  constructor() {
    this.boardEl = document.getElementById('spellingbee-board')!;
    this.turnEl = document.getElementById('spellingbee-message');
  }

  init(): void {
    this.word = this.words[Math.floor(Math.random() * this.words.length)];
    this.hints = 3; this.gameOver = false; this.won = false;
    this.state = 'playing';
    this.render();
  }

  submitGuess(guess: string): void {
    if (this.gameOver) return;
    if (guess.toUpperCase() === this.word.toUpperCase()) { this.won = true; this.gameOver = true; this.render(); return; }
    if (this.turnEl) { this.turnEl.textContent = 'Incorrect!'; this.turnEl.style.color = '#ff6b6b'; setTimeout(() => { if (this.turnEl) { this.turnEl.textContent = 'Spell the word'; this.turnEl.style.color = ''; } }, 1000); }
  }

  useHint(): void {
    if (this.hints <= 0) return;
    this.hints--;
    if (this.turnEl) this.turnEl.textContent = 'Hint: First letter is ' + this.word[0] + ', length: ' + this.word.length;
    this.render();
  }

  skip(): void { this.init(); }

  render(): void {
    this.boardEl.innerHTML = '';
    const audioNote = document.createElement('div');
    audioNote.textContent = '🔊';
    audioNote.style.cssText = 'font-size:48px;text-align:center;padding:10px;cursor:pointer;';
    audioNote.addEventListener('click', () => {
      const utterance = new SpeechSynthesisUtterance(this.word);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    });
    audioNote.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const utterance = new SpeechSynthesisUtterance(this.word);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }, { passive: false });
    this.boardEl.appendChild(audioNote);
    const prompt = document.createElement('div');
    prompt.textContent = 'Click 🔊 to hear the word';
    prompt.style.cssText = 'color:#aaa;font-size:16px;text-align:center;padding:5px;';
    this.boardEl.appendChild(prompt);
    if (this.won) {
      const msg = document.createElement('div'); msg.textContent = '🎉 Correct!'; msg.style.cssText = 'color:#4ade80;font-size:28px;font-weight:700;text-align:center;padding:20px;';
      this.boardEl.appendChild(msg);
    } else {
      const input = document.createElement('input');
      input.type = 'text'; input.className = 'spell-input';
      input.style.cssText = 'display:block;margin:15px auto;padding:10px;font-size:22px;text-align:center;text-transform:uppercase;border:2px solid var(--border);border-radius:8px;background:var(--glass);color:#fff;width:300px;letter-spacing:4px;';
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.length > 0) { this.submitGuess(input.value); input.value = ''; input.focus(); } });
      input.addEventListener('touchstart', () => { input.focus(); }, { passive: true });
      this.boardEl.appendChild(input);
      input.focus();
      const actions = document.createElement('div'); actions.style.cssText = 'display:flex;justify-content:center;gap:10px;margin:10px;';
      const hintBtn = document.createElement('button');
      hintBtn.textContent = '💡 Hint (' + this.hints + ')';
      hintBtn.className = 'spell-btn';
      hintBtn.addEventListener('click', () => this.useHint());
      hintBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.useHint(); }, { passive: false });
      if (this.hints <= 0) hintBtn.disabled = true;
      actions.appendChild(hintBtn);
      const skipBtn = document.createElement('button');
      skipBtn.textContent = 'Skip'; skipBtn.className = 'spell-btn';
      skipBtn.addEventListener('click', () => this.skip());
      skipBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.skip(); }, { passive: false });
      actions.appendChild(skipBtn);
      this.boardEl.appendChild(actions);
    }
    if (this.turnEl) {
      if (this.won) { this.turnEl.textContent = '🎉 Correct!'; this.turnEl.style.color = '#4ade80'; }
      else this.turnEl.textContent = 'Spell the word you hear (' + this.word.length + ' letters)';
    }
  }

  pause(): void {}
  resume(): void { this.state = 'playing'; }
  destroy(): void {}
}

registerGame(
  { id: 'spellingbee', title: 'Spelling Bee', category: 'puzzle', description: 'Spell the word you hear', icon: '🐝', wrapperId: 'spellingbee-wrapper' },
  SpellingBeeGame,
);
