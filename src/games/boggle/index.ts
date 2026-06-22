import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';

export class BoggleGame implements Game {
  readonly id = 'boggle';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private size = 4;
  private dice = ['AAEEGN','ABBJOO','ACHOPS','AFFKPS','AOOTTW','CIMOTU','DEILRX','DELRVY','DISTTY','EEGHNW','EEINSU','EHRTVW','EIOSST','ELRTTY','HIMNQU','HLNNRZ'];
  private board: string[][] = [];
  private found: Set<string> = new Set();
  private score = 0;
  private timeLeft = 120;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private dict: Set<string> = new Set();
  private gameOver = false;
  private _buffer = '';

  constructor() {
    this.boardEl = document.getElementById('boggle-board')!;
    this.turnEl = document.getElementById('boggle-timer');
    this.scoreEl = document.getElementById('boggle-score');
    const wordList = ['THE','AND','ARE','FOR','NOT','YOU','ALL','ANY','CAN','HAD','HER','WAS','ONE','OUR','OUT','DAY','GET','HAS','HIM','HIS','HOW','ITS','MAY','NOW','OLD','SEE','WAY','WHO','BOY','DID','FAR','FIX','GOT','HOT','LET','MAN','MEN','PUT','RAN','SAT','SAY','SHE','TOO','TRY','USE','AGE','BAG','BIG','CAR','CAT','CUP','DOG','EGG','END','EYE','FAT','FIG','FLY','FUN','GUN','HAT','ICE','JOB','KEY','LAP','LEG','LID','LIP','MAP','MIX','NET','PEN','PIG','POT','RED','RUG','RUN','SKY','SUN','TIE','TOY','VAN','WAR','WET','WIN','ACE','ACT','ADD','AID','AIM','ANT','ARC','ARM','ART','ASK','ATE','BAD','BAG','BAN','BAR','BAT','BED','BET','BID','BIT','BOW','BOX','BUD','BUG','BUN','BUS','BUT','BUY','CAP','CAR','CAT','COP','COT','COW','CRY','CUB','CUP','CUT','DAM','DEW','DID','DIG','DIM','DIP','DOC','DOG','DOT','DRY','DUB','DUE','DUG','DUH','DUN','DUO','DYE','EAR','EAT','EEL','EGG','EGO','ELM','EMU','END','ERA','EVE','EWE','EYE','FAN','FAR','FAT','FAX','FED','FEE','FEW','FIG','FIN','FIR','FIT','FLU','FLY','FOB','FOE','FOG','FOR','FOX','FRY','FUN','FUR','GAG','GAP','GAS','GEL','GEM','GET','GIG','GIN','GNU','GOB','GOD','GOT','GUM','GUN','GUT','GUY','GYM','HAD','HAG','HAM','HAS','HAT','HAY','HEM','HEN','HER','HEW','HID','HIM','HIP','HIS','HIT','HOG','HOP','HOT','HOW','HUB','HUE','HUG','HUM','HUT','ICE','ICY','ILL','IMP','INK','INN','ION','IRE','IRK','ITS','IVY','JAB','JAG','JAM','JAR','JAW','JAY','JET','JEW','JOB','JOG','JOT','JOY','JUG','JUT','KEG','KEN','KEY','KID','KIN','KIT','LAB','LAD','LAG','LAP','LAW','LAY','LEA','LEG','LET','LID','LIE','LIP','LIT','LOG','LOT','LOW','LUG','MAD','MAN','MAP','MAR','MAT','MAW','MAX','MAY','MED','MEL','MEN','MET','MID','MIL','MIX','MOB','MOD','MOP','MOW','MUD','MUG','NAG','NAP','NAY','NET','NEW','NIL','NIT','NOD','NOR','NOT','NOW','NUB','NUN','NUT','OAK','OAR','OAT','ODD','ODE','OFF','OFT','OIL','OLD','ONE','OPT','ORB','ORE','OUR','OUT','OWE','OWL','OWN','PAD','PAL','PAN','PAP','PAR','PAT','PAW','PAY','PEA','PEG','PEN','PEP','PER','PET','PIE','PIG','PIN','PIT','PLY','POD','POP','POT','POW','PRO','PUB','PUG','PUN','PUP','PUT','RAG','RAM','RAN','RAP','RAT','RAW','RAY','RED','REF','RIB','RID','RIG','RIM','RIP','ROB','ROD','ROT','ROW','RUB','RUG','RUN','RUT','SAC','SAD','SAG','SAP','SAT','SAW','SAY','SEA','SET','SEW','SHE','SHY','SIN','SIP','SIS','SIT','SIX','SKI','SKY','SLY','SOB','SOD','SON','SOP','SOT','SOW','SOY','SPA','SPY','STY','SUB','SUM','SUN','SUP','TAB','TAG','TAN','TAP','TAR','TAT','TAX','TEA','TEN','THE','TIE','TIN','TIP','TOE','TON','TOO','TOP','TOW','TOY','TRY','TUB','TUG','TWO','URN','USE','VAN','VAT','VET','VEX','VIA','VIE','VOW','WAD','WAR','WAS','WAT','WAX','WAY','WEB','WED','WET','WHO','WHY','WIG','WIN','WIT','WOE','WOK','WON','WOO','WOW','YAK','YAM','YAP','YAW','YEN','YES','YET','YEW','YOU','ZAG','ZAP','ZEN','ZIP','ZIT','ZOO'];
    for (const w of wordList) if (w.length >= 3) this.dict.add(w.toUpperCase());
  }

  init(): void {
    this.board = [];
    this._buffer = '';
    this.dice.sort(() => Math.random() - 0.5);
    for (let r = 0; r < this.size; r++) {
      this.board[r] = [];
      for (let c = 0; c < this.size; c++) {
        const die = this.dice[r * this.size + c];
        this.board[r][c] = die[Math.floor(Math.random() * die.length)];
      }
    }
    this.found = new Set(); this.score = 0; this.timeLeft = 120;
    this.state = 'playing';
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) { this.endGame(); }
      if (this.turnEl) this.turnEl.textContent = 'Time: ' + this.timeLeft + 's';
    }, 1000);
    this.render();
  }

  submitWord(word: string): void {
    if (word.length < 3 || this.gameOver) return;
    const w = word.toUpperCase();
    if (this.found.has(w)) return;
    if (!this.dict.has(w)) { if (this.turnEl) { this.turnEl.textContent = 'Not in dictionary!'; this.turnEl.style.color = '#ff6b6b'; setTimeout(() => { if (this.turnEl) this.turnEl.textContent = 'Time: ' + this.timeLeft + 's'; }, 1000); } return; }
    if (!this.canFind(w)) { if (this.turnEl) { this.turnEl.textContent = 'Not on board!'; this.turnEl.style.color = '#ff6b6b'; setTimeout(() => { if (this.turnEl) this.turnEl.textContent = 'Time: ' + this.timeLeft + 's'; }, 1000); } return; }
    this.found.add(w);
    this.score += w.length;
    this.render();
  }

  private canFind(word: string): boolean {
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++)
      if (this.board[r][c] === word[0] && this.dfs(r, c, word, 0, new Set<string>())) return true;
    return false;
  }

  private dfs(r: number, c: number, word: string, idx: number, visited: Set<string>): boolean {
    if (idx >= word.length) return true;
    const key = r + ',' + c;
    if (r < 0 || r >= this.size || c < 0 || c >= this.size || visited.has(key) || this.board[r][c] !== word[idx]) return false;
    visited.add(key);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (this.dfs(r + dr, c + dc, word, idx + 1, visited)) { visited.delete(key); return true; }
    }
    visited.delete(key);
    return false;
  }

  private endGame(): void { if (this._timer) { clearInterval(this._timer); this._timer = null; } if (this.turnEl) { this.turnEl.textContent = 'Time\'s up!'; this.turnEl.style.color = '#ffd700'; } this.gameOver = true; this.render(); }

  render(): void {
    this.boardEl.innerHTML = '';
    for (let r = 0; r < this.size; r++) {
      const row = document.createElement('div'); row.className = 'bog-row';
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div'); cell.className = 'bog-cell';
        cell.textContent = this.board[r][c];
        cell.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;margin:3px;font-size:20px;font-weight:700;border:2px solid var(--border);border-radius:8px;background:var(--glass);color:#fff;cursor:pointer;user-select:none;text-transform:uppercase;';
        cell.addEventListener('click', () => {
          if (this.timeLeft > 0) { this._buffer += this.board[r][c]; this.render(); }
        });
        cell.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (this.timeLeft > 0) { this._buffer += this.board[r][c]; this.render(); }
        }, { passive: false });
        row.appendChild(cell);
      }
      this.boardEl.appendChild(row);
    }
    const buf = document.createElement('div');
    buf.textContent = this._buffer || 'Tap letters to spell';
    buf.style.cssText = 'color:#ffd700;font-size:20px;font-weight:700;text-align:center;padding:8px;margin:8px 0;letter-spacing:4px;min-height:32px;';
    this.boardEl.appendChild(buf);

    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'display:flex;gap:8px;justify-content:center;margin:8px 0;';
    const submitBtn = document.createElement('div');
    submitBtn.textContent = '✓ Submit';
    submitBtn.style.cssText = 'padding:8px 20px;font-size:16px;font-weight:700;border-radius:8px;border:2px solid #4ade80;color:#4ade80;background:var(--glass);cursor:pointer;user-select:none;';
    submitBtn.addEventListener('click', () => { if (this._buffer.length >= 3) { this.submitWord(this._buffer); this._buffer = ''; this.render(); } });
    submitBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (this._buffer.length >= 3) { this.submitWord(this._buffer); this._buffer = ''; this.render(); } }, { passive: false });
    const clearBtn = document.createElement('div');
    clearBtn.textContent = '⌫ Clear';
    clearBtn.style.cssText = 'padding:8px 20px;font-size:16px;font-weight:700;border-radius:8px;border:2px solid #ff6b6b;color:#ff6b6b;background:var(--glass);cursor:pointer;user-select:none;';
    clearBtn.addEventListener('click', () => { this._buffer = ''; this.render(); });
    clearBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this._buffer = ''; this.render(); }, { passive: false });
    actionRow.appendChild(clearBtn);
    actionRow.appendChild(submitBtn);
    this.boardEl.appendChild(actionRow);

    const input = document.createElement('input');
    input.type = 'text'; input.className = 'bog-input';
    input.style.cssText = 'display:block;margin:10px auto;padding:8px;font-size:18px;text-align:center;text-transform:uppercase;border:2px solid var(--border);border-radius:8px;background:var(--glass);color:#fff;width:200px;';
    if (this.timeLeft > 0) {
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.length >= 3) { this.submitWord(input.value); input.value = ''; input.focus(); } });
      this.boardEl.appendChild(input);
      input.focus();
    }
    const foundDiv = document.createElement('div'); foundDiv.className = 'bog-found';
    foundDiv.textContent = Array.from(this.found).join(' ');
    this.boardEl.appendChild(foundDiv);
    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + ' | Words: ' + this.found.size;
  }

  pause(): void { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
  resume(): void { this.state = 'playing'; if (this.timeLeft > 0 && !this._timer) { this._timer = setInterval(() => { this.timeLeft--; if (this.timeLeft <= 0) { this.endGame(); } if (this.turnEl) this.turnEl.textContent = 'Time: ' + this.timeLeft + 's'; }, 1000); } }
  destroy(): void { if (this._timer) { clearInterval(this._timer); this._timer = null; } }
}

registerGame(
  { id: 'boggle', title: 'Boggle', category: 'puzzle', description: 'Find words on the grid', icon: '🔤', wrapperId: 'boggle-wrapper' },
  BoggleGame,
);
