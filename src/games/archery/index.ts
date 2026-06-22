import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class ArcheryGame implements Game {
  readonly id = 'archery';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: 'aim' | 'charge' | 'fly' = 'aim';
  private power = 0;
  private aimX = 300;
  private aimY = 150;
  private arrow = { x: 80, y: 300, vx: 0, vy: 0 };
  private score = 0;
  private rounds = 0;
  private targetX = 0;
  private targetY = 0;
  private wind = 0;
  private _animId: number | null = null;
  private _powerInterval: ReturnType<typeof setInterval> | null = null;
  private _powerDir = 1;

  constructor() {
    this.boardEl = document.getElementById('archery-board')!;
    this.turnEl = document.getElementById('arch-turn');
    this.scoreEl = document.getElementById('arch-score');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.aimX = 300 + (Math.random() - 0.5) * 100;
    this.aimY = 150 + (Math.random() - 0.5) * 60;
    this.targetX = this.aimX; this.targetY = this.aimY;
    this.arrow = { x: 80, y: 300, vx: 0, vy: 0 }; this.power = 0; this.phase = 'aim'; this.wind = (Math.random() - 0.5) * 2;
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
    const dx = this.aimX - 80, dy = this.aimY - 300;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.arrow.vx = (dx / dist) * (this.power * 0.25 + 3);
    this.arrow.vy = (dy / dist) * (this.power * 0.25 + 3);
    this.rounds++;
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (document.hidden) { this._animId = requestAnimationFrame(loop); return; }
      if (this.arrow.x > 620 || this.arrow.y > 420 || this.arrow.x < -20 || this.arrow.y < -20) {
        this._animId = null;
        const dx = this.arrow.x - this.targetX, dy = this.arrow.y - this.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let points = 0;
        if (dist < 10) points = 10;
        else if (dist < 25) points = 8;
        else if (dist < 50) points = 5;
        else if (dist < 80) points = 3;
        else points = 1;
        this.score += points;
        if (this.turnEl) { this.turnEl.textContent = points + ' points!'; this.turnEl.style.color = '#ffd700'; }
        this.render();
        return;
      }
      this.arrow.x += this.arrow.vx;
      this.arrow.y += this.arrow.vy;
      this.arrow.vy += 0.15;
      this.arrow.x += this.wind;
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  setAim(x: number, y: number): void {
    if (this.phase !== 'aim') return;
    this.aimX = x; this.aimY = y;
    this.render();
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#87ceeb'; ctx.fillRect(400, 0, 200, 400);
    ctx.fillStyle = '#228b22'; ctx.fillRect(0, 320, 600, 80);
    ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 80, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.targetX, this.targetY, 25, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#8b4513'; ctx.fillRect(70, 290, 12, 50);
    ctx.strokeStyle = '#ffd700'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
    if (this.phase === 'aim') {
      ctx.beginPath(); ctx.moveTo(80, 300); ctx.lineTo(this.aimX, this.aimY); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillText('Wind: ' + this.wind.toFixed(1), 300, 20);
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(this.arrow.x, this.arrow.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(this.arrow.x, this.arrow.y); ctx.lineTo(this.arrow.x - 15, this.arrow.y + 3); ctx.lineTo(this.arrow.x, this.arrow.y + 6); ctx.fill();
    if (this.phase === 'charge') {
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(150, 380, this.power * 3, 10);
      ctx.strokeStyle = '#fff'; ctx.strokeRect(150, 380, 300, 10);
    }
    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + ' | Round: ' + this.rounds;
  }

  private _boundHandlers: (() => void) | null = null;

  pause(): void { if (this._powerInterval) { clearInterval(this._powerInterval); this._powerInterval = null; } if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; }

  private bindEvents(): void {
    if (this._boundHandlers) return;
    const onMove = (e: MouseEvent) => {
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      this.setAim(e.clientX - rect.left, e.clientY - rect.top);
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
  { id: 'archery', title: 'Archery', category: 'sports', description: 'Hit the bullseye', icon: '🏹', wrapperId: 'archery-wrapper' },
  ArcheryGame,
);
