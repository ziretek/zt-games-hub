import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';

export class PenaltyKickerGame implements Game {
  readonly id = 'penaltykicker';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private scoreEl: HTMLElement | null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: 'aim' | 'shoot' | 'result' = 'aim';
  private power = 0;
  private aimAngle = 0;
  private ball = { x: 300, y: 350, vx: 0, vy: 0, r: 8 };
  private keeperX = 200;
  private keeperDir = 1;
  private diveX = 0;
  private diving = false;
  private score = 0;
  private total = 0;
  private _animId: number | null = null;
  private _powerInterval: ReturnType<typeof setInterval> | null = null;
  private _powerDir = 1;

  constructor() {
    this.boardEl = document.getElementById('penaltykicker-board')!;
    this.turnEl = document.getElementById('pk-turn');
    this.scoreEl = document.getElementById('pk-score');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.phase = 'aim'; this.power = 0; this.aimAngle = 0;
    this.ball = { x: 300, y: 350, vx: 0, vy: 0, r: 8 };
    this.keeperX = 200; this.keeperDir = 1; this.diveX = 0; this.diving = false;
    this.score = 0; this.total = 0;
    this.state = 'playing';
    this.render();
    this.bindEvents();
  }

  startPower(): void {
    if (this.phase !== 'aim') return;
    this.phase = 'shoot';
    this._powerDir = 1;
    if (this._powerInterval) clearInterval(this._powerInterval);
    this._powerInterval = setInterval(() => {
      this.power += this._powerDir * 2;
      if (this.power >= 100 || this.power <= 0) this._powerDir *= -1;
      this.power = Math.max(0, Math.min(100, this.power));
    }, 30);
  }

  kick(): void {
    if (this._powerInterval) { clearInterval(this._powerInterval); this._powerInterval = null; }
    const angle = (this.aimAngle - 0.5) * Math.PI * 0.6 + Math.PI * 0.5;
    const speed = this.power * 0.25 + 2;
    this.ball.vx = Math.cos(angle) * speed;
    this.ball.vy = -Math.sin(angle) * speed;
    this.diving = true;
    this.diveX = (this.ball.vx > 0 ? 1 : -1) * (50 + Math.random() * 80);
    this.total++;
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (document.hidden) { this._animId = requestAnimationFrame(loop); return; }
      if (this.ball.y > 400 || this.ball.x < -20 || this.ball.x > 620) {
        this._animId = null;
        if (this.ball.y > 400) {
          const goalX = this.ball.x;
          if (goalX > this.keeperX + this.diveX - 50 && goalX < this.keeperX + this.diveX + 50 && this.ball.vy > 0) { if (this.turnEl) this.turnEl.textContent = 'Saved!'; } else { this.score++; if (this.turnEl) this.turnEl.textContent = 'GOAL! 🎉'; }
        }
        this.phase = 'result'; this.render();
        return;
      }
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.vy += 0.5;
      if (this.diving) {
        this.keeperX += (this.diveX - this.keeperX) * 0.05;
        if (Math.abs(this.keeperX - this.diveX) < 2) this.diving = false;
      } else this.keeperX += this.keeperDir * 2;
      if (this.keeperX > 350 || this.keeperX < 50) this.keeperDir *= -1;
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  setAim(x: number, y: number): void {
    if (this.phase !== 'aim') return;
    this.aimAngle = Math.atan2(350 - y, x - 300) / (Math.PI * 0.6) + 0.5;
    this.aimAngle = Math.max(0.1, Math.min(0.9, this.aimAngle));
    this.render();
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#2d4a2d'; ctx.fillRect(0, 350, 600, 50);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.strokeRect(150, 200, 300, 150);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(300, 350, 50, 0, Math.PI, true); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();
    if (this.phase === 'aim') {
      ctx.strokeStyle = '#ffd700'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(300, 350);
      const angle = (this.aimAngle - 0.5) * Math.PI * 0.6 + Math.PI * 0.5;
      ctx.lineTo(300 + Math.cos(angle) * 100, 350 + Math.sin(angle) * 100); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffd700'; ctx.font = '14px monospace';
      ctx.textAlign = 'center'; ctx.fillText('Click to set aim, click again to kick', 300, 180);
    }
    if (this.phase === 'shoot') {
      ctx.fillStyle = '#ff6b6b'; ctx.fillRect(150, 160, this.power * 3, 10);
      ctx.strokeStyle = '#fff'; ctx.strokeRect(150, 160, 300, 10);
    }
    ctx.fillStyle = '#ff6b6b'; ctx.fillRect(this.keeperX, 190, 80, 10);
    ctx.fillStyle = '#ff6b6b'; ctx.fillRect(this.keeperX + 30, 185, 20, 15);
    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + '/' + this.total;
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
      if (this.phase === 'aim') this.startPower();
      else if (this.phase === 'shoot') this.kick();
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
  { id: 'penaltykicker', title: 'Penalty Kicker', category: 'sports', description: 'Score from the spot', icon: '⚽', wrapperId: 'penaltykicker-wrapper' },
  PenaltyKickerGame,
);
