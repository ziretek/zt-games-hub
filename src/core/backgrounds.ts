interface BgParticle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
}

interface ColoredParticle extends BgParticle {
  color: string;
  opacity: number;
  phase?: number;
}

abstract class Background {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected animationId: number | null = null;
  protected _paused = false;
  protected _dpr: number;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas #${canvasId} not found`);
    this.ctx = this.canvas.getContext('2d')!;
    this._dpr = window.devicePixelRatio || 1;
    this.resizeCanvas();
    this._onResize = () => this.resizeCanvas();
    window.addEventListener('resize', this._onResize);
    this.createParticles();
    this.animate();
  }

  protected _w = 0;
  protected _h = 0;

  pause() { this._paused = true; }
  resume() { this._paused = false; }

  protected _onResize: () => void;

  resizeCanvas() {
    this._w = window.innerWidth;
    this._h = window.innerHeight;
    this.canvas.width = this._w * this._dpr;
    this.canvas.height = this._h * this._dpr;
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    if (this.onResize) this.onResize();
  }

  draw() {}
  createParticles() {}
  updateParticle(_p: ColoredParticle) {}
  onResize?: () => void;

  animate = () => {
    if (!this._paused) this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  };

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this._onResize);
  }
}

class GradientBackground extends Background {
  declare particles: ColoredParticle[];

  createParticles() {
    this.particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * this._w, y: Math.random() * this._h,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 4 + 1,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }

  updateParticle(p: ColoredParticle) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = this._w;
    if (p.x > this._w) p.x = 0;
    if (p.y < 0) p.y = this._h;
    if (p.y > this._h) p.y = 0;
  }

  draw() {
    const g = this.ctx.createLinearGradient(0, 0, this._w, this._h);
    g.addColorStop(0, '#1a0033'); g.addColorStop(0.5, '#330066'); g.addColorStop(1, '#1a0033');
    this.ctx.fillStyle = g; this.ctx.fillRect(0, 0, this._w, this._h);
    for (const p of this.particles) {
      this.updateParticle(p);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }
}

class NeuralNetworkBackground extends Background {
  declare nodes: ColoredParticle[];

  createParticles() {
    this.nodes = Array.from({ length: 50 }, () => ({
      x: Math.random() * this._w, y: Math.random() * this._h,
      vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 3 + 2,
    })) as unknown as ColoredParticle[];
  }

  updateParticle(n: ColoredParticle) {
    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > this._w) n.vx = -n.vx;
    if (n.y < 0 || n.y > this._h) n.vy = -n.vy;
  }

  draw() {
    this.ctx.fillStyle = '#0a0e27'; this.ctx.fillRect(0, 0, this._w, this._h);
    const cd = 150;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x, dy = this.nodes[i].y - this.nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < cd) {
          this.ctx.strokeStyle = `rgba(102, 126, 234, ${1 - d / cd})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
          this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
          this.ctx.stroke();
        }
      }
    }
    for (const n of this.nodes) {
      this.updateParticle(n);
      this.ctx.fillStyle = '#667eea';
      this.ctx.beginPath();
      this.ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

class MarvelBackground extends Background {
  private lw = 0;
  private lh = 0;
  private actionLines: ActionLine[] = [];
  private comicParticles: ColoredParticle[] = [];
  private halftone: HalftoneDot[] = [];

  createParticles() {
    this.lw = window.innerWidth;
    this.lh = window.innerHeight;
    this.actionLines = Array.from({ length: 25 }, () => ({
      x: Math.random() * this.lw, y: Math.random() * this.lh,
      len: Math.random() * 120 + 40, speed: Math.random() * 2 + 0.5,
      thick: Math.random() * 1.5 + 0.3, alpha: Math.random() * 0.06 + 0.02,
    }));
    this.comicParticles = Array.from({ length: 30 }, () => ({
      x: Math.random() * this.lw, y: Math.random() * this.lh,
      vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 6 + 3,
      color: ['#EC1C24','#F39200','#FFD700','#1A472A','#003478','#8B0000','#4169E1','#FF4500'][Math.floor(Math.random() * 8)],
      opacity: Math.random() * 0.35 + 0.15, phase: Math.random() * Math.PI * 2,
    }));
    this.createHalftone();
  }

  onResize = () => {
    this.lw = window.innerWidth;
    this.lh = window.innerHeight;
    this.createHalftone();
  };

  private createHalftone() {
    if (!this.lw) return;
    this.halftone = [];
    const spacing = 20;
    for (let x = 0; x < this.lw; x += spacing) {
      for (let y = 0; y < this.lh; y += spacing) {
        this.halftone.push({
          x: x + Math.random() * 4, y: y + Math.random() * 4,
          r: Math.random() * 1.2 + 0.4, a: Math.random() * 0.06 + 0.02,
        });
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.lw || this._w, h = this.lh || this._h;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
    glow.addColorStop(0, 'rgba(124, 58, 237, 0.12)');
    glow.addColorStop(0.4, 'rgba(60, 20, 120, 0.06)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    for (const d of this.halftone) {
      ctx.fillStyle = `rgba(255, 255, 255, ${d.a})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const l of this.actionLines) {
      l.x += l.speed;
      if (l.x - l.len > w) { l.x = -l.len; l.y = Math.random() * h; }
      ctx.strokeStyle = `rgba(255, 255, 255, ${l.alpha})`;
      ctx.lineWidth = l.thick;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x + l.len, l.y);
      ctx.stroke();
    }
    for (const p of this.comicParticles) {
      p.x += p.vx; p.y += p.vy;
      p.phase = (p.phase ?? 0) + 0.02;
      if (p.x < -30) p.x = w + 30; if (p.x > w + 30) p.x = -30;
      if (p.y < -30) p.y = h + 30; if (p.y > h + 30) p.y = -30;
      const pulse = 0.7 + 0.3 * Math.sin(p.phase ?? 0);
      ctx.globalAlpha = (p.opacity ?? 0.2) * 0.2 * pulse;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (p.opacity ?? 0.2) * 0.4 * pulse;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (p.opacity ?? 0.2) * pulse;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.25, w * 0.5, h * 0.5, h * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, h - 2, w, 2);
  }
}

interface ActionLine {
  x: number; y: number; len: number; speed: number;
  thick: number; alpha: number;
}

interface HalftoneDot {
  x: number; y: number; r: number; a: number;
}

export type Theme = 'marvel' | 'neural' | 'gradient';

let currentBackground: Background | null = null;

export function switchTheme(theme: Theme): void {
  if (currentBackground) currentBackground.destroy();
  switch (theme) {
    case 'marvel': currentBackground = new MarvelBackground('aiBackground'); break;
    case 'neural': currentBackground = new NeuralNetworkBackground('aiBackground'); break;
    case 'gradient': currentBackground = new GradientBackground('aiBackground'); break;
  }
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', (b as HTMLElement).dataset.theme === theme);
  });
}

export function initBackground(): void {
  currentBackground = new MarvelBackground('aiBackground');
}

export function destroyBackground(): void {
  if (currentBackground) { currentBackground.destroy(); currentBackground = null; }
}
