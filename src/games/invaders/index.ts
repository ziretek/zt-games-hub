import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class InvadersGame implements Game {
  readonly id = 'invaders';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player = { x: 270, y: 370, w: 40, h: 20 };
  private invaders: { x: number; y: number; alive: boolean; w: number; h: number }[] = [];
  private bullets: { x: number; y: number; w: number; h: number }[] = [];
  private enemyBullets: { x: number; y: number; w: number; h: number }[] = [];
  private score = 0;
  private lives = 3;
  private invaderDir = 1;
  private invaderSpeed = 0.5;
  private _animId: number | null = null;
  private _keys = new Set<string>();
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _keyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private shootCooldown = 0;

  constructor() {
    this.boardEl = document.getElementById('invaders-board')!;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  private _touchHandler: ((e: MouseEvent) => void) | null = null;
  private _shootHandler: (() => void) | null = null;

  init(): void {
    this.player.x = 270;
    this.invaders = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++)
      this.invaders.push({ x: 50 + c * 65, y: 30 + r * 40, alive: true, w: 35, h: 25 });
    this.bullets = []; this.enemyBullets = []; this.score = 0; this.lives = 3;
    this.invaderDir = 1; this.invaderSpeed = 0.5; this.shootCooldown = 0;
    this.state = 'playing';
    if (!this._keyHandler) {
      this._keyHandler = (e: KeyboardEvent) => { this._keys.add(e.key); if (['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); };
      this._keyUpHandler = (e: KeyboardEvent) => { this._keys.delete(e.key); };
      document.addEventListener('keydown', this._keyHandler);
      document.addEventListener('keyup', this._keyUpHandler);
    }
    if (!this._touchHandler) {
      this._touchHandler = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        this.player.x = Math.max(0, Math.min(600 - this.player.w, e.clientX - rect.left - this.player.w / 2));
      };
      this._shootHandler = () => { if (!this._keys.has(' ')) { this._keys.add(' '); setTimeout(() => this._keys.delete(' '), 100); } };
      this.canvas.addEventListener('mousemove', this._touchHandler);
      this.canvas.addEventListener('click', this._shootHandler);
      enableTouchOnCanvas(this.canvas);
    }
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (document.hidden) { this._animId = requestAnimationFrame(loop); return; }
      if (this.state !== 'playing') { this._animId = null; return; }
      this.update();
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  private update(): void {
    if (this._keys.has('ArrowLeft') && this.player.x > 0) this.player.x -= 5;
    if (this._keys.has('ArrowRight') && this.player.x < 600 - this.player.w) this.player.x += 5;
    if (this._keys.has(' ') && this.shootCooldown <= 0) {
      this.bullets.push({ x: this.player.x + this.player.w / 2 - 2, y: this.player.y - 10, w: 4, h: 10 });
      this.shootCooldown = 15;
    }
    if (this.shootCooldown > 0) this.shootCooldown--;
    for (const b of this.bullets) b.y -= 8;
    this.bullets = this.bullets.filter(b => b.y > 0);
    for (const b of this.enemyBullets) b.y += 4;
    this.enemyBullets = this.enemyBullets.filter(b => b.y < 400);

    let edgeHit = false;
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      if (inv.x + inv.w >= 600 || inv.x <= 0) { edgeHit = true; break; }
    }
    if (edgeHit) { this.invaderDir *= -1; this.invaderSpeed += 0.1; for (const inv of this.invaders) inv.y += 10; }
    for (const inv of this.invaders) if (inv.alive) inv.x += this.invaderDir * this.invaderSpeed;

    for (const b of this.bullets) for (const inv of this.invaders) {
      if (!inv.alive) continue;
      if (b.x < inv.x + inv.w && b.x + b.w > inv.x && b.y < inv.y + inv.h && b.y + b.h > inv.y) {
        inv.alive = false; b.y = -100; this.score += 10;
      }
    }

    if (Math.random() < 0.02) {
      const alive = this.invaders.filter(i => i.alive);
      if (alive.length > 0) {
        const src = alive[Math.floor(Math.random() * alive.length)];
        this.enemyBullets.push({ x: src.x + src.w / 2 - 2, y: src.y + src.h, w: 4, h: 8 });
      }
    }

    for (const b of this.enemyBullets) {
      if (b.x < this.player.x + this.player.w && b.x + b.w > this.player.x && b.y < this.player.y + this.player.h && b.y + b.h > this.player.y) {
        this.lives--; b.y = 400; this.player.x = 270;
        if (this.lives <= 0) this.state = 'lost';
      }
    }

    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      if (inv.y + inv.h >= this.player.y) this.state = 'lost';
    }

    if (this.invaders.every(i => !i.alive)) this.state = 'won';
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#4ade80'; ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    for (const inv of this.invaders) {
      if (!inv.alive) continue;
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
    }
    ctx.fillStyle = '#fbbf24'; for (const b of this.bullets) ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#f472b6'; for (const b of this.enemyBullets) ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.font = '16px monospace'; ctx.fillStyle = '#666';
    ctx.textAlign = 'left'; ctx.fillText('Score: ' + this.score + '  Lives: ' + this.lives, 10, 20);
  }

  pause(): void { if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; if (this._animId === null) this.startLoop(); }
  destroy(): void { this.pause(); if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler); if (this._keyUpHandler) document.removeEventListener('keyup', this._keyUpHandler); }
}

registerGame(
  { id: 'invaders', title: 'Invaders', category: 'arcade', description: 'Space invaders shooter', icon: '👾', wrapperId: 'invaders-wrapper' },
  InvadersGame,
);
