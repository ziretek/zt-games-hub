import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class BowlingGame implements Game {
  readonly id = 'bowling';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: 'aim' | 'roll' | 'result' = 'aim';
  private pins: { x: number; y: number; fallen: boolean }[] = [];
  private ball = { x: 300, y: 350, vx: 0, vy: 0, r: 10 };
  private power = 0;
  private angle = 0;
  private rollInFrame = 0;
  private _powerInterval: ReturnType<typeof setInterval> | null = null;
  private _powerDir = 1;
  private _animId: number | null = null;

  constructor() {
    this.boardEl = document.getElementById('bowling-board')!;
    this.turnEl = document.getElementById('bowl-turn');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.pins = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++)
      this.pins.push({ x: 270 + c * 20 - r * 10, y: 60 + r * 22, fallen: false });
    this.ball = { x: 300, y: 350, vx: 0, vy: 0, r: 10 };
    this.power = 0; this.angle = 0; this.phase = 'aim'; this.rollInFrame = 0;
    this.state = 'playing';
    this.render();
    this.bindEvents();
  }

  startCharge(): void {
    if (this.phase !== 'aim') return;
    this.phase = 'roll';
    this._powerDir = 1;
    if (this._powerInterval) clearInterval(this._powerInterval);
    this._powerInterval = setInterval(() => {
      this.power += this._powerDir * 2;
      if (this.power >= 100 || this.power <= 0) this._powerDir *= -1;
      this.power = Math.max(0, Math.min(100, this.power));
    }, 30);
  }

  roll(): void {
    if (this._powerInterval) { clearInterval(this._powerInterval); this._powerInterval = null; }
    const a = (this.angle - 0.5) * 0.5;
    this.ball.vx = a * this.power * 0.1;
    this.ball.vy = -(this.power * 0.2 + 2);
    this.rollInFrame++;
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (document.hidden) { this._animId = requestAnimationFrame(loop); return; }
      if (this.ball.y < -10 || (Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1 && this.ball.y > 300)) {
        this._animId = null;
        for (const pin of this.pins) {
          if (pin.fallen) continue;
          const dx = this.ball.x - pin.x, dy = this.ball.y - pin.y;
          if (Math.sqrt(dx * dx + dy * dy) < 25) pin.fallen = true;
        }
        const fallen = this.pins.filter(p => p.fallen).length;
        this.phase = 'result';
        this.render();
        if (this.turnEl) {
          if (this.rollInFrame === 1 && fallen === 10) { this.turnEl.textContent = '🎳 STRIKE!'; this.turnEl.style.color = '#ffd700'; }
          else if (this.rollInFrame === 2 && fallen === 10) { this.turnEl.textContent = 'Spare!'; this.turnEl.style.color = '#4ade80'; }
          else this.turnEl.textContent = fallen + ' pins down';
        }
        return;
      }
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.vy += 0.3;
      for (const pin of this.pins) {
        if (pin.fallen) continue;
        const dx = this.ball.x - pin.x, dy = this.ball.y - pin.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.ball.r + 8) { pin.fallen = true; this.ball.vx += (this.ball.x - pin.x) * 0.05; }
      }
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  setAngle(x: number, _y: number): void {
    if (this.phase !== 'aim') return;
    this.angle = (x - 300) / 200;
    this.angle = Math.max(-1, Math.min(1, this.angle));
    this.render();
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#5c4033'; ctx.fillRect(100, 50, 400, 3);
    ctx.fillStyle = '#5c4033'; ctx.fillRect(120, 53, 360, 300);
    for (const pin of this.pins) {
      if (pin.fallen) continue;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pin.x, pin.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(pin.x, pin.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();
    if (this.phase === 'roll') {
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(150, 370, this.power * 3, 10);
      ctx.strokeStyle = '#fff'; ctx.strokeRect(150, 370, 300, 10);
    }
    if (this.turnEl && this.phase === 'aim') this.turnEl.textContent = 'Click to aim, then click to roll';

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
      else if (this.phase === 'roll') this.roll();
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
  { id: 'bowling', title: 'Bowling', category: 'sports', description: 'Knock down the pins', icon: '🎳', wrapperId: 'bowling-wrapper' },
  BowlingGame,
);
