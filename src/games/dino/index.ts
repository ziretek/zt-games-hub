import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class DinoGame implements Game {
  readonly id = 'dino';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dino = { x: 60, y: 250, w: 30, h: 30, vy: 0, grounded: true };
  private obstacles: { x: number; w: number; h: number }[] = [];
  private score = 0;
  private highScore = 0;
  private speed = 6;
  private gravity = 0.6;
  private jumpPower = -12;
  private _animId: number | null = null;
  private _spaceHandler: ((e: KeyboardEvent) => void) | null = null;
  private _clickHandler: (() => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('dino-board')!;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 300;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.dino.y = 250; this.dino.vy = 0; this.dino.grounded = true;
    this.obstacles = []; this.score = 0; this.speed = 6;
    this.state = 'playing';
    if (!this._spaceHandler) {
      this._spaceHandler = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); this.jump(); } };
      this._clickHandler = () => this.jump();
      document.addEventListener('keydown', this._spaceHandler);
      this.canvas.addEventListener('click', this._clickHandler);
      enableTouchOnCanvas(this.canvas);
    }
    this.startLoop();
  }

  private jump(): void {
    if (this.state !== 'playing') return;
    if (this.dino.grounded) { this.dino.vy = this.jumpPower; this.dino.grounded = false; }
  }

  private startLoop(): void {
    const loop = () => {
      if (this.state !== 'playing') { this._animId = null; return; }
      this.update();
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  private update(): void {
    this.dino.vy += this.gravity;
    this.dino.y += this.dino.vy;
    if (this.dino.y >= 250) { this.dino.y = 250; this.dino.vy = 0; this.dino.grounded = true; }
    this.score++;
    this.speed = 6 + Math.floor(this.score / 500);
    if (this.obstacles.length === 0 || this.obstacles[this.obstacles.length - 1].x < 400) {
      const w = 16 + Math.random() * 16;
      this.obstacles.push({ x: 600, w, h: 24 + Math.random() * 24 });
    }
    for (const obs of this.obstacles) obs.x -= this.speed;
    this.obstacles = this.obstacles.filter(o => o.x + o.w > -50);
    for (const obs of this.obstacles) {
      if (
        this.dino.x < obs.x + obs.w && this.dino.x + this.dino.w > obs.x &&
        this.dino.y + this.dino.h > 300 - obs.h
      ) { this.highScore = Math.max(this.highScore, this.score); this.state = 'lost'; }
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 300);
    ctx.fillStyle = '#444'; ctx.fillRect(0, 295, 600, 5);
    ctx.fillStyle = '#4ade80'; ctx.fillRect(this.dino.x, this.dino.y, this.dino.w, this.dino.h);
    ctx.fillStyle = '#ff6b6b';
    for (const obs of this.obstacles) ctx.fillRect(obs.x, 300 - obs.h, obs.w, obs.h);
    ctx.font = '16px monospace'; ctx.fillStyle = '#666';
    ctx.textAlign = 'left'; ctx.fillText('Score: ' + Math.floor(this.score / 10), 10, 20);
    if (this.highScore > 0) ctx.fillText('Best: ' + Math.floor(this.highScore / 10), 10, 40);
    if (this.state === 'lost') { ctx.fillStyle = '#ff6b6b'; ctx.font = '24px monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', 300, 140); }
  }

  pause(): void { if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; if (this._animId === null) this.startLoop(); }
  destroy(): void { this.pause(); if (this._spaceHandler) document.removeEventListener('keydown', this._spaceHandler); if (this._clickHandler) this.canvas.removeEventListener('click', this._clickHandler); }
}

registerGame(
  { id: 'dino', title: 'Dino Runner', category: 'arcade', description: 'Jump over cacti', icon: '🦖', wrapperId: 'dino-wrapper' },
  DinoGame,
);
