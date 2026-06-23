import './style.css';
import type { Game } from '../../core/game.js';
import type { GameState } from '../../core/types.js';
import { registerGame } from '../../core/registry.js';
import { loadScore, saveScore } from '../../utils/storage.js';
import { enableTouchOnCanvas } from '../../utils/touch.js';
import { createMobileControls, ensureCanvasControlStage, type MobileControlsHandle } from '../../utils/mobile-controls.js';

interface SnakeSegment {
  x: number; y: number;
}

export class SnakeGame implements Game {
  readonly id = 'snake';
  state: GameState = 'idle';

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scoreEl: HTMLElement | null;
  private highScoreEl: HTMLElement | null;
  private highScore: number;
  private gridSize = 20;
  private tileCount = 20;
  private animationId: number | null = null;
  private _dpr: number;
  private snake: SnakeSegment[] = [];
  private direction = { x: 1, y: 0 };
  private nextDirection = { x: 1, y: 0 };
  private food: { x: number; y: number } | null = null;
  private score = 0;
  private gameOver = false;
  private won = false;
  private speed = 280;
  private lastUpdate = 0;
  private loop: ((now: number) => void) | null = null;
  private _touchStartHandler: ((e: TouchEvent) => void) | null = null;
  private _touchEndHandler: ((e: TouchEvent) => void) | null = null;
  private mobileControls: MobileControlsHandle | null = null;

  constructor() {
    this.canvas = document.getElementById('snake-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.scoreEl = document.getElementById('snake-score');
    this.highScoreEl = document.getElementById('snake-high-score');
    this.highScore = loadScore('snakeHighScore');
    this._dpr = window.devicePixelRatio || 1;
  }

  init(): void {
    const base = 400;
    this.canvas.width = base * this._dpr;
    this.canvas.height = base * this._dpr;
    this.gridSize = 20 * this._dpr;
    enableTouchOnCanvas(this.canvas);
    this.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.speed = 280;
    this.state = 'playing';
    this.lastUpdate = 0;
    if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
    if (this.highScoreEl) this.highScoreEl.textContent = 'Best: ' + this.highScore;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.lastUpdate = performance.now();
    this.loop = (now: number) => {
      if (document.hidden) { this.animationId = requestAnimationFrame(this.loop!); return; }
      if (now - this.lastUpdate > this.speed) {
        this.lastUpdate = now;
        this.update();
      }
      this.draw();
      if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop!);
    };
    this.animationId = requestAnimationFrame(this.loop);
    this.addTouchControls();
    this.addMobileControls();
  }

  private addMobileControls(): void {
    if (this.mobileControls) return;
    const stage = ensureCanvasControlStage(this.canvas, 'snake-mobile-stage');
    this.mobileControls = createMobileControls(stage, 'dpad', [
      { label: '↑', ariaLabel: 'Move up', className: 'mobile-game-control--up', onPress: () => this.setDirection(0, -1) },
      { label: '←', ariaLabel: 'Move left', className: 'mobile-game-control--left', onPress: () => this.setDirection(-1, 0) },
      { label: '→', ariaLabel: 'Move right', className: 'mobile-game-control--right', onPress: () => this.setDirection(1, 0) },
      { label: '↓', ariaLabel: 'Move down', className: 'mobile-game-control--down', onPress: () => this.setDirection(0, 1) },
    ], 'Swipe or tap');
  }

  private addTouchControls(): void {
    if (this._touchStartHandler) return;
    let sx = 0, sy = 0;
    this._touchStartHandler = (e: TouchEvent) => {
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY;
    };
    this._touchEndHandler = (e: TouchEvent) => {
      if (this.gameOver) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.setDirection(dx > 0 ? 1 : -1, 0);
      } else {
        this.setDirection(0, dy > 0 ? 1 : -1);
      }
    };
    this.canvas.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    this.canvas.addEventListener('touchend', this._touchEndHandler, { passive: true });
  }

  private spawnFood(): { x: number; y: number } | null {
    const maxAttempts = 1000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * this.tileCount);
      const y = Math.floor(Math.random() * this.tileCount);
      if (!this.snake.some(s => s.x === x && s.y === y))
        return { x, y };
    }
    return null;
  }

  setDirection(dx: number, dy: number): void {
    if (this.direction.x !== -dx || this.direction.y !== -dy)
      this.nextDirection = { x: dx, y: dy };
  }

  private update(): void {
    this.direction = { ...this.nextDirection };
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.endGame();
      return;
    }
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
      this.endGame();
      return;
    }
    this.snake.unshift(head);
    if (this.food && head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
      this.food = this.spawnFood();
      if (!this.food) { this.won = true; this.endGame(); return; }
      if (this.speed > 120) this.speed -= 5;
    } else {
      this.snake.pop();
    }
  }

  private endGame(): void {
    this.gameOver = true;
    this.state = this.won ? 'won' : 'lost';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      saveScore('snakeHighScore', this.highScore);
      if (this.highScoreEl) this.highScoreEl.textContent = 'Best: ' + this.highScore;
    }
    this.draw();
  }

  private draw(): void {
    const ctx = this.ctx;
    const ts = this.gridSize;
    const dpr = this._dpr;
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let x = 0; x < this.tileCount; x++) {
      for (let y = 0; y < this.tileCount; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.02)';
          ctx.fillRect(x * ts, y * ts, ts, ts);
        }
      }
    }
    if (this.food) {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(this.food.x * ts + ts / 2, this.food.y * ts + ts / 2, ts / 2 - 2 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < this.snake.length; i++) {
      const s = this.snake[i];
      const t = i / this.snake.length;
      const r = Math.round(46 + t * 80);
      const g = Math.round(204 - t * 80);
      const b = Math.round(113 - t * 40);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const pad = (i === 0 ? 1 : 2) * dpr;
      ctx.fillRect(s.x * ts + pad, s.y * ts + pad, ts - pad * 2, ts - pad * 2);
      if (i === 0) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s.x * ts + ts * 0.35, s.y * ts + ts * 0.35, 2 * dpr, 0, Math.PI * 2);
        ctx.arc(s.x * ts + ts * 0.65, s.y * ts + ts * 0.65, 2 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#ffd700';
      ctx.font = `bold ${28 * dpr}px Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.won ? 'You Win!' : 'Game Over', this.canvas.width / 2, this.canvas.height / 2 - 16 * dpr);
      ctx.fillStyle = '#fff';
      ctx.font = `${14 * dpr}px Segoe UI, sans-serif`;
      ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 16 * dpr);
    }
  }

  pause(): void { if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; } this.state = 'paused'; }
  resume(): void { this.state = 'playing'; this.animationId = requestAnimationFrame(this.loop!); }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this._touchStartHandler) {
      this.canvas.removeEventListener('touchstart', this._touchStartHandler);
      this._touchStartHandler = null;
    }
    if (this._touchEndHandler) {
      this.canvas.removeEventListener('touchend', this._touchEndHandler);
      this._touchEndHandler = null;
    }
    this.mobileControls?.destroy();
    this.mobileControls = null;
  }

  render(): void { this.draw(); }
}

registerGame(
  { id: 'snake', title: 'Snake', category: 'arcade', description: 'Grow and survive', icon: '🐍', wrapperId: 'snake-wrapper' },
  SnakeGame,
);
