import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class BasketballGame implements Game {
  readonly id = 'basketball';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ball = { x: 80, y: 300, vx: 0, vy: 0, r: 10, launched: false };
  private power = 0;
  private angle = 0.5;
  private score = 0;
  private attempts = 0;
  private _powerInterval: ReturnType<typeof setInterval> | null = null;
  private _powerDir = 1;
  private _animId: number | null = null;
  private phase: 'aim' | 'charge' | 'fly' = 'aim';
  private hoopX = 450;
  private hoopY = 150;

  constructor() {
    this.boardEl = document.getElementById('basketball-board')!;
    this.turnEl = document.getElementById('bball-turn');
    this.scoreEl = document.getElementById('bball-score');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.ball = { x: 80, y: 300, vx: 0, vy: 0, r: 10, launched: false };
    this.power = 0; this.angle = 0.5; this.score = 0; this.attempts = 0; this.phase = 'aim';
    this.state = 'playing';
    this.render();
    this.bindEvents();
  }

  startCharge(): void {
    if (this.phase !== 'aim') return;
    this.phase = 'charge';
    this._powerDir = 1;
    if (this._powerInterval) clearInterval(this._powerInterval);
    this._powerInterval = setInterval(() => {
      this.power += this._powerDir * 2;
      if (this.power >= 100 || this.power <= 0) this._powerDir *= -1;
      this.power = Math.max(0, Math.min(100, this.power));
    }, 30);
  }

  shoot(): void {
    if (this._powerInterval) { clearInterval(this._powerInterval); this._powerInterval = null; }
    this.phase = 'fly';
    this.ball.launched = true;
    const a = (this.angle - 0.3) * Math.PI * 0.8 + Math.PI * 0.3;
    const speed = this.power * 0.3 + 3;
    this.ball.vx = Math.cos(a) * speed;
    this.ball.vy = -Math.sin(a) * speed;
    this.attempts++;
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (this.ball.y > 400 || this.ball.x > 620 || this.ball.x < -20) {
        this._animId = null;
        const dx = this.ball.x - this.hoopX, dy = this.ball.y - this.hoopY;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          this.score++;
          if (this.turnEl) { this.turnEl.textContent = '🏀 Swish!'; this.turnEl.style.color = '#4ade80'; }
        } else {
          if (this.turnEl) { this.turnEl.textContent = 'Miss!'; this.turnEl.style.color = '#ff6b6b'; }
        }
        setTimeout(() => { this.ball = { x: 80, y: 300, vx: 0, vy: 0, r: 10, launched: false }; this.phase = 'aim'; this.render(); }, 1000);
        return;
      }
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.vy += 0.4;
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  setAngle(x: number, y: number): void {
    if (this.phase !== 'aim') return;
    this.angle = Math.atan2(300 - y, x - 80) / (Math.PI * 0.8) + 0.3;
    this.angle = Math.max(0.1, Math.min(0.9, this.angle));
    this.render();
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(this.hoopX, this.hoopY, 18, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.hoopX - 20, this.hoopY); ctx.lineTo(this.hoopX - 20, this.hoopY + 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.hoopX + 20, this.hoopY); ctx.lineTo(this.hoopX + 20, this.hoopY + 80); ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();
    if (this.phase === 'aim') {
      ctx.strokeStyle = '#ffd700'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(80, 300);
      const a = (this.angle - 0.3) * Math.PI * 0.8 + Math.PI * 0.3;
      ctx.lineTo(80 + Math.cos(a) * 120, 300 + Math.sin(a) * 120); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (this.phase === 'charge') {
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(100, 340, this.power * 3, 12);
      ctx.strokeStyle = '#fff'; ctx.strokeRect(100, 340, 300, 12);
      ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
      ctx.fillText('Click to shoot!', 300, 330);
    }
    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + '/' + this.attempts;
  }

  private _boundHandlers: (() => void) | null = null;

  pause(): void { if (this._powerInterval) { clearInterval(this._powerInterval); this._powerInterval = null; } if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; }

  private bindEvents(): void {
    if (this._boundHandlers) return;
    const onMove = (e: MouseEvent) => {
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      this.setAngle(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onClick = () => {
      if (this.state !== 'playing') return;
      if (this.phase === 'aim') this.startCharge();
      else if (this.phase === 'charge') this.shoot();
    };
    this.canvas.addEventListener('mousemove', onMove);
    this.canvas.addEventListener('click', onClick);
    enableTouchOnCanvas(this.canvas);
    this._boundHandlers = () => {
      this.canvas.removeEventListener('mousemove', onMove);
      this.canvas.removeEventListener('click', onClick);
    };
  }

  destroy(): void { this.pause(); if (this._boundHandlers) { this._boundHandlers(); this._boundHandlers = null; } }
}

registerGame(
  { id: 'basketball', title: 'Basketball', category: 'sports', description: 'Shoot hoops', icon: '🏀', wrapperId: 'basketball-wrapper' },
  BasketballGame,
);
