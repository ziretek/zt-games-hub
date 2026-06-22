import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';
import { enableDPR } from '../../utils/dpr.js';

export class BaseballGame implements Game {
  readonly id = 'baseball';
  state: GameState = 'idle';
  private boardEl: HTMLElement;
  private turnEl: HTMLElement | null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: 'pitch' | 'swing' | 'result' = 'pitch';
  private ball = { x: 300, y: 300, vx: 0, vy: 0, r: 6 };
  private batAngle = 0;
  private batSwinging = false;
  private pitchSpeed = 0;
  private pitchType = 'fastball';
  private hits = 0;
  private atBats = 0;
  private _animId: number | null = null;
  private _batDir = 1;

  constructor() {
    this.boardEl = document.getElementById('baseball-board')!;
    this.turnEl = document.getElementById('baseb-turn');
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600; this.canvas.height = 400;
    enableDPR(this.canvas, 600, 400);
    this.boardEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  init(): void {
    this.ball = { x: 300, y: 80, vx: 0, vy: 0, r: 6 };
    this.batAngle = 0; this.batSwinging = false; this.pitchSpeed = 0;
    this.hits = 0; this.atBats = 0;
    this.state = 'playing';
    this.bindEvents();
    this.pitchLoop();
  }

  private pitchLoop(): void {
    this.phase = 'pitch';
    this.pitchType = ['fastball', 'curveball', 'changeup'][Math.floor(Math.random() * 3)];
    this.pitchSpeed = this.pitchType === 'fastball' ? 8 : this.pitchType === 'curveball' ? 6 : 4;
    this.ball = { x: 150 + Math.random() * 100, y: 80, vx: (Math.random() - 0.5) * 3, vy: 0, r: 6 };
    this.batAngle = 0; this.batSwinging = false;
    this.startPitch();
  }

  private startPitch(): void {
    const targetX = 260 + Math.random() * 80;
    const targetY = 230 + Math.random() * 60;
    const dx = targetX - this.ball.x, dy = targetY - this.ball.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.ball.vx = (dx / dist) * this.pitchSpeed + (Math.random() - 0.5) * 1.5;
    this.ball.vy = (dy / dist) * this.pitchSpeed;
    this.atBats++;
    if (this.turnEl) this.turnEl.textContent = this.pitchType.toUpperCase() + ' - Click to swing!';
    this.startLoop();
  }

  private startLoop(): void {
    const loop = () => {
      if (this.ball.y > 400 || this.ball.y < -10 || this.ball.x < -10 || this.ball.x > 610) {
        this._animId = null;
        if (this.ball.y > 400) {
          const distFromCenter = Math.abs(this.ball.x - 300);
          const batAtContact = this.batAngle;
          if (this.batSwinging && Math.abs(batAtContact) > 0.5 && distFromCenter < 80) {
            this.hits++;
            if (this.turnEl) { this.turnEl.textContent = '🏏 HIT!'; this.turnEl.style.color = '#4ade80'; }
          } else {
            if (this.turnEl) { this.turnEl.textContent = 'Strike!'; this.turnEl.style.color = '#ff6b6b'; }
          }
        }
        setTimeout(() => this.pitchLoop(), 1500);
        return;
      }
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.vy += 0.2;
      if (this.ball.y > 200) this.ball.x += (Math.random() - 0.5) * 1.5;
      if (this.batSwinging) {
        this.batAngle += this._batDir * 0.08;
        if (Math.abs(this.batAngle) > 1.2) { this._batDir *= -1; this.batSwinging = false; }
      }
      this.render();
      this._animId = requestAnimationFrame(loop);
    };
    this._animId = requestAnimationFrame(loop);
  }

  swing(): void {
    if (this.phase !== 'pitch') return;
    this.batSwinging = true;
    this._batDir = 1;
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#228b22'; ctx.fillRect(0, 320, 600, 80);

    ctx.fillStyle = '#8b4513'; ctx.fillRect(250, 320, 20, 20);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(100, 320, 8, 8);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(490, 320, 8, 8);

    const cx = 300, cy = 300;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(cx - 20, cy - 2, 40, 4);

    if (this.batSwinging) {
      ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      const endX = cx + Math.cos(this.batAngle + Math.PI * 0.3) * 80;
      const endY = cy + Math.sin(this.batAngle + Math.PI * 0.3) * 80;
      ctx.lineTo(endX, endY); ctx.stroke();
    } else {
      ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx - 80, cy + 20); ctx.stroke();
    }

    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();
    if (this.ball.y < 200) {
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
      ctx.fillText('⚾', this.ball.x, this.ball.y - 10);
    }

    ctx.fillStyle = '#fff'; ctx.font = '16px monospace'; ctx.textAlign = 'left';
    ctx.fillText('Hits: ' + this.hits + '/' + this.atBats, 10, 20);
  }

  private _boundHandlers: (() => void) | null = null;

  pause(): void { if (this._animId !== null) { cancelAnimationFrame(this._animId); this._animId = null; } }
  resume(): void { this.state = 'playing'; }

  private bindEvents(): void {
    if (this._boundHandlers) return;
    const onClick = () => {
      if (this.state !== 'playing') return;
      if (this.phase === 'pitch') this.swing();
    };
    this.canvas.addEventListener('click', onClick);
    enableTouchOnCanvas(this.canvas);
    this._boundHandlers = () => {
      this.canvas.removeEventListener('click', onClick);
    };
  }

  destroy(): void { this.pause(); if (this._boundHandlers) { this._boundHandlers(); this._boundHandlers = null; } }
}

registerGame(
  { id: 'baseball', title: 'Baseball', category: 'sports', description: 'Swing for the fences', icon: '⚾', wrapperId: 'baseball-wrapper' },
  BaseballGame,
);
