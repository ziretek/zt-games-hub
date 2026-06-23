import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';
import { enableDPR } from '../../utils/dpr.js';
import { createMobileControls, type MobileControlsHandle } from '../../utils/mobile-controls.js';

export class BreakoutGame implements Game {
  readonly id = 'breakout';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ball = { x: 0, y: 0, dx: 4, dy: -4, r: 6 };
  private paddle = { x: 250, y: 370, w: 100, h: 12 };
  private bricks: { x: number; y: number; w: number; h: number; alive: boolean; color: string }[] = [];
  private score = 0;
  private lives = 3;
  private _animId: number | null = null;
  private _mouseX = 0;
  private _mobileDirection = 0;
  private _mouseHandler: ((e: MouseEvent) => void) | null = null;
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private mobileControls: MobileControlsHandle | null = null;

  constructor() {
    this.boardEl = document.getElementById('breakout-board')!;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    enableDPR(this.canvas, 600, 400);
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.ball.x = 300; this.ball.y = 350; this.ball.dx = 4; this.ball.dy = -4;
    this.paddle.x = 250;
    this._mouseX = 300;
    this._mobileDirection = 0;
    this.bricks = []; this.score = 0; this.lives = 3;
    const colors = ['#ff6b6b','#f472b6','#a78bfa','#60a5fa','#4ade80','#fbbf24','#fb923c'];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 8; c++)
      this.bricks.push({ x: c * 75 + 5, y: r * 20 + 30, w: 70, h: 16, alive: true, color: colors[r] });
    this.state = 'playing';
    if (!this._mouseHandler) {
      this._mouseHandler = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        this._mouseX = e.clientX - rect.left;
        this._mobileDirection = 0;
      };
      this.canvas.addEventListener('mousemove', this._mouseHandler);
    }
    if (!this._keyHandler) {
      this._keyHandler = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault(); };
      document.addEventListener('keydown', this._keyHandler);
    }
    enableTouchOnCanvas(this.canvas);
    this.addMobileControls();
    this.startLoop();
  }

  private addMobileControls(): void {
    if (this.mobileControls) return;
    this.mobileControls = createMobileControls(this.boardEl, 'horizontal', [
      {
        label: '←',
        ariaLabel: 'Move paddle left',
        className: 'mobile-game-control--left',
        onPress: () => { this._mobileDirection = -1; },
        onRelease: () => { this._mobileDirection = 0; },
      },
      {
        label: '→',
        ariaLabel: 'Move paddle right',
        className: 'mobile-game-control--right',
        onPress: () => { this._mobileDirection = 1; },
        onRelease: () => { this._mobileDirection = 0; },
      },
    ], 'Drag or hold');
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
    if (this._mobileDirection !== 0) {
      this._mouseX = Math.max(0, Math.min(600, (this._mouseX || this.paddle.x + this.paddle.w / 2) + this._mobileDirection * 14));
    }
    const targetX = this._mouseX - this.paddle.w / 2;
    this.paddle.x += (targetX - this.paddle.x) * 0.2;
    this.paddle.x = Math.max(0, Math.min(600 - this.paddle.w, this.paddle.x));
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
    if (this.ball.x - this.ball.r <= 0 || this.ball.x + this.ball.r >= 600) this.ball.dx = -this.ball.dx;
    if (this.ball.y - this.ball.r <= 0) this.ball.dy = -this.ball.dy;
    if (this.ball.y + this.ball.r >= this.paddle.y && this.ball.y + this.ball.r <= this.paddle.y + this.paddle.h && this.ball.x >= this.paddle.x && this.ball.x <= this.paddle.x + this.paddle.w) {
      this.ball.dy = -Math.abs(this.ball.dy);
      const hit = (this.ball.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
      this.ball.dx = hit * 5;
    }
    if (this.ball.y + this.ball.r >= 400) { this.lives--; if (this.lives <= 0) this.state = 'lost'; else { this.ball.x = 300; this.ball.y = 350; this.ball.dx = 4; this.ball.dy = -4; } }
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (this.ball.x >= brick.x && this.ball.x <= brick.x + brick.w && this.ball.y - this.ball.r <= brick.y + brick.h && this.ball.y + this.ball.r >= brick.y) {
        brick.alive = false; this.ball.dy = -this.ball.dy; this.score += 10;
      }
    }
    if (this.bricks.every(b => !b.alive)) { this.state = 'won'; }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color; ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.font = '16px monospace'; ctx.fillStyle = '#666';
    ctx.textAlign = 'left'; ctx.fillText('Score: ' + this.score + '  Lives: ' + this.lives, 10, 20);
    if (this.state === 'won') { ctx.fillStyle = '#ffd700'; ctx.font = '36px monospace'; ctx.textAlign = 'center'; ctx.fillText('🎉 WINNER!', 300, 200); }
    if (this.state === 'lost') { ctx.fillStyle = '#ff6b6b'; ctx.font = '36px monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', 300, 200); }
  }

  pause(): void { if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; if (this._animId === null) this.startLoop(); }
  destroy(): void {
    this.pause();
    if (this._mouseHandler) this.canvas.removeEventListener('mousemove', this._mouseHandler);
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    this.mobileControls?.destroy();
    this.mobileControls = null;
  }
}

registerGame(
  { id: 'breakout', title: 'Breakout', category: 'arcade', description: 'Break all the bricks', icon: '🧱', wrapperId: 'breakout-wrapper' },
  BreakoutGame,
);
