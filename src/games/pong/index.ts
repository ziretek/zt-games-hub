import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class PongGame implements Game {
  readonly id = 'pong';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ball = { x: 0, y: 0, dx: 4, dy: 3, r: 6 };
  private paddle1 = { y: 0, h: 80, w: 10 };
  private paddle2 = { y: 0, h: 80, w: 10 };
  private score1 = 0;
  private score2 = 0;
  private _animId: number | null = null;
  private _keyState: Set<string> = new Set();
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private _keyUpHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.boardEl = document.getElementById('pong-board')!;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  private _touchHandler: ((e: MouseEvent) => void) | null = null;

  init(): void {
    this.ball.x = 300; this.ball.y = 200; this.ball.dx = 4 * (Math.random() < 0.5 ? 1 : -1); this.ball.dy = 3 * (Math.random() < 0.5 ? 1 : -1);
    this.paddle1.y = 160; this.paddle2.y = 160; this.score1 = 0; this.score2 = 0;
    this.state = 'playing';
    this._keyState.clear();
    if (!this._keyHandler) {
      this._keyHandler = (e: KeyboardEvent) => { this._keyState.add(e.key); if (['ArrowUp','ArrowDown','w','s'].includes(e.key)) e.preventDefault(); };
      this._keyUpHandler = (e: KeyboardEvent) => { this._keyState.delete(e.key); };
      document.addEventListener('keydown', this._keyHandler);
      document.addEventListener('keyup', this._keyUpHandler);
    }
    if (!this._touchHandler) {
      this._touchHandler = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        this.paddle1.y = Math.max(0, Math.min(400 - this.paddle1.h, y - this.paddle1.h / 2));
      };
      this.canvas.addEventListener('mousemove', this._touchHandler);
      enableTouchOnCanvas(this.canvas);
    }
    this.startLoop();
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
    if (this._keyState.has('w') && this.paddle1.y > 0) this.paddle1.y -= 6;
    if (this._keyState.has('s') && this.paddle1.y < 400 - this.paddle1.h) this.paddle1.y += 6;
    if (this._keyState.has('ArrowUp') && this.paddle2.y > 0) this.paddle2.y -= 6;
    if (this._keyState.has('ArrowDown') && this.paddle2.y < 400 - this.paddle2.h) this.paddle2.y += 6;
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
    if (this.ball.y - this.ball.r <= 0 || this.ball.y + this.ball.r >= 400) this.ball.dy = -this.ball.dy;
    if (this.ball.x - this.ball.r <= 10 + this.paddle1.w && this.ball.y >= this.paddle1.y && this.ball.y <= this.paddle1.y + this.paddle1.h) { this.ball.dx = Math.abs(this.ball.dx); this.ball.dx *= 1.05; this.ball.dy *= 1.05; }
    if (this.ball.x + this.ball.r >= 590 - this.paddle2.w && this.ball.y >= this.paddle2.y && this.ball.y <= this.paddle2.y + this.paddle2.h) { this.ball.dx = -Math.abs(this.ball.dx); this.ball.dx *= 1.05; this.ball.dy *= 1.05; }
    if (this.ball.x < 0) { this.score2++; this.ball.x = 300; this.ball.y = 200; this.ball.dx = 4 * (Math.random() < 0.5 ? 1 : -1); this.ball.dy = 3 * (Math.random() < 0.5 ? 1 : -1); }
    if (this.ball.x > 600) { this.score1++; this.ball.x = 300; this.ball.y = 200; this.ball.dx = 4 * (Math.random() < 0.5 ? 1 : -1); this.ball.dy = 3 * (Math.random() < 0.5 ? 1 : -1); }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    ctx.setLineDash([10, 10]); ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(300, 400); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, this.paddle1.y, this.paddle1.w, this.paddle1.h);
    ctx.fillRect(590 - this.paddle2.w, this.paddle2.y, this.paddle2.w, this.paddle2.h);
    ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.font = '24px monospace'; ctx.fillStyle = '#666';
    ctx.textAlign = 'center'; ctx.fillText(this.score1 + '  ' + this.score2, 300, 30);
  }

  pause(): void { if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; if (this._animId === null) this.startLoop(); }
  destroy(): void { this.pause(); if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler); if (this._keyUpHandler) document.removeEventListener('keyup', this._keyUpHandler); }
}

registerGame(
  { id: 'pong', title: 'Pong', category: 'arcade', description: 'Classic paddle ball', icon: '🏓', wrapperId: 'pong-wrapper' },
  PongGame,
);
