import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class FlappyGame implements Game {
  readonly id = 'flappy';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bird = { x: 80, y: 200, vy: 0, r: 12 };
  private pipes: { x: number; h: number; scored: boolean }[] = [];
  private score = 0;
  private pipeSpeed = 3;
  private pipeGap = 150;
  private pipeW = 50;
  private _animId: number | null = null;
  private _spaceHandler: ((e: KeyboardEvent) => void) | null = null;
  private _clickHandler: (() => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('flappy-board')!;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400; this.canvas.height = 500;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.bird.y = 200; this.bird.vy = 0;
    this.pipes = []; this.score = 0;
    this.state = 'playing';
    if (!this._spaceHandler) {
      this._spaceHandler = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); this.flap(); } };
      this._clickHandler = () => this.flap();
      document.addEventListener('keydown', this._spaceHandler);
      this.canvas.addEventListener('click', this._clickHandler);
      enableTouchOnCanvas(this.canvas);
    }
    this.startLoop();
  }

  private flap(): void { if (this.state === 'playing') this.bird.vy = -7; }

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
    this.bird.vy += 0.4;
    this.bird.y += this.bird.vy;
    if (this.bird.y < 0 || this.bird.y > 500) { this.state = 'lost'; return; }
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < 300) {
      const h = 80 + Math.random() * 200;
      this.pipes.push({ x: 400, h, scored: false });
    }
    for (const p of this.pipes) {
      p.x -= this.pipeSpeed;
      if (!p.scored && p.x + this.pipeW < this.bird.x) { this.score++; p.scored = true; }
      if (
        this.bird.x + this.bird.r > p.x && this.bird.x - this.bird.r < p.x + this.pipeW &&
        (this.bird.y - this.bird.r < p.h || this.bird.y + this.bird.r > p.h + this.pipeGap)
      ) { this.state = 'lost'; }
    }
    this.pipes = this.pipes.filter(p => p.x + this.pipeW > -50);
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 400, 500);
    ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.arc(this.bird.x, this.bird.y, this.bird.r, 0, Math.PI * 2); ctx.fill();
    for (const p of this.pipes) {
      ctx.fillStyle = '#60a5fa'; ctx.fillRect(p.x, 0, this.pipeW, p.h);
      ctx.fillRect(p.x, p.h + this.pipeGap, this.pipeW, 500 - p.h - this.pipeGap);
    }
    ctx.font = '24px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(String(this.score), 200, 40);
  }

  pause(): void { if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; if (this._animId === null) this.startLoop(); }
  destroy(): void { this.pause(); if (this._spaceHandler) document.removeEventListener('keydown', this._spaceHandler); if (this._clickHandler) this.canvas.removeEventListener('click', this._clickHandler); }
}

registerGame(
  { id: 'flappy', title: 'Flappy Bird', category: 'arcade', description: 'Flap through pipes', icon: '🐦', wrapperId: 'flappy-wrapper' },
  FlappyGame,
);
