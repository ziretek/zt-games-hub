import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAllGameInfos, clearRegistry } from '../../core/registry.js';
import { GAMES } from '../../core/registry-data.js';

// Build a static import map so Vite can resolve all paths
const gameModules: Record<string, any> = {};
async function loadAllGames() {
  const modules = await Promise.all([
    import('../checkers/index.js'),
    import('../connect4/index.js'),
    import('../memory/index.js'),
    import('../snake/index.js'),
    import('../tictactoe/index.js'),
    import('../othello/index.js'),
    import('../battleship/index.js'),
    import('../gomoku/index.js'),
    import('../minesweeper/index.js'),
    import('../hangman/index.js'),
    import('../game2048/index.js'),
    import('../simon/index.js'),
    import('../mastermind/index.js'),
    import('../pong/index.js'),
    import('../breakout/index.js'),
    import('../invaders/index.js'),
    import('../flappy/index.js'),
    import('../dino/index.js'),
    import('../countmaster/index.js'),
    import('../wordle/index.js'),
    import('../boggle/index.js'),
    import('../anagrams/index.js'),
    import('../wordsearch/index.js'),
    import('../typingtest/index.js'),
    import('../spellingbee/index.js'),
    import('../chess/index.js'),
    import('../sudoku/index.js'),
  ]);
  const ids = ['checkers', 'connect4', 'memory', 'snake', 'tictactoe', 'othello', 'battleship', 'gomoku',
    'minesweeper', 'hangman', 'game2048', 'simon', 'mastermind', 'pong', 'breakout', 'invaders',
    'flappy', 'dino', 'countmaster', 'wordle', 'boggle', 'anagrams', 'wordsearch', 'typingtest',
    'spellingbee',
    'chess', 'sudoku'];
  for (let i = 0; i < ids.length; i++) {
    const mod = modules[i];
    const exportKeys = Object.keys(mod);
    const classKey = exportKeys.find(k => k.endsWith('Game') || k === 'Game2048') || exportKeys[0];
    gameModules[ids[i]] = (mod as Record<string, unknown>)[classKey];
  }
}

const allIds = ['game-hub', 'hub-game-count', 'hub-search-input', 'hub-random-btn', 'aiBackground',
  'game-view', 'game-view-title', 'hub-recent',
  'checkerGame', 'turnIndicator', 'scoreDisplay', 'gameOverOverlay',
  'c4-turn', 'ms-status', 'ms-flag-btn', 'mem-moves', 'mem-score',
  'snake-canvas', 'snake-score', 'snake-high-score',
  'ttt-turn', 'ttt-ai-btn',   'hang-word', 'hang-letters', 'hang-status',
  'g2048-turn', 'g2048-score', 'pong-canvas', 'breakout-canvas',
  'oth-turn', 'oth-score', 'bs-turn', 'gom-turn', 'gom-ai-btn',
  'sim-status', 'mm-status', 'invaders-canvas', 'flappy-canvas', 'dino-canvas',
  'cm-turn', 'cm-score', 'wordle-turn', 'bog-turn', 'bog-score',
  'ana-turn', 'ws-turn', 'anagrams-game-area', 'wordsearch-game-area', 'ttest-turn', 'ttest-score', 'spell-turn',
  ...GAMES.flatMap(g => [g.id + '-wrapper', g.id + '-board', g.id + '-canvas', g.id + '-turn', g.id + '-score']),
  'chess-status', 'chess-captured', 'chess-new-btn',
  'sudoku-timer', 'sudoku-diff', 'sudoku-mistakes', 'sudoku-new-btn',
];

function createMockElement(id: string): HTMLElement {
  const isCanvas = id.endsWith('-canvas');
  const el = isCanvas ? document.createElement('canvas') : document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  return el;
}

function createMockCanvasContext(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    canvas: {} as HTMLCanvasElement,
    fillRect: () => {},
    clearRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 0 }),
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    restore: () => {},
    save: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    setTransform: () => {},
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(), width: 0, height: 0 }),
    putImageData: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} } as unknown as CanvasGradient),
    createRadialGradient: () => ({ addColorStop: () => {} } as unknown as CanvasGradient),
    setLineDash: () => {},
    getLineDash: () => [],
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: 'transparent',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    clip: () => {},
    isPointInPath: () => false,
    isPointInStroke: () => false,
    arcTo: () => {},
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
    rect: () => {},
    ellipse: () => {},
    createPattern: () => null,
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    resetTransform: () => {},
    transform: () => {},
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    filter: '',
    direction: 'ltr',
  } as unknown as CanvasRenderingContext2D;
}

beforeAll(async () => {
  HTMLCanvasElement.prototype.getContext = function() {
    return createMockCanvasContext();
  } as any;
  for (const id of allIds) {
    if (!document.getElementById(id)) createMockElement(id);
  }
  await loadAllGames();
});

afterAll(() => {
  document.body.innerHTML = '';
  clearRegistry();
});

describe('game interface compliance', () => {
  it(`all ${GAMES.length} games are defined in hub data`, () => {
    expect(GAMES.length).toBe(27);
  });

  for (const game of GAMES) {
    describe(game.name, () => {
      let instance: any;

      it('has valid GameEntry metadata', () => {
        expect(game.id).toBeTruthy();
        expect(game.name).toBeTruthy();
        expect(game.category).toMatch(/^(board|puzzle|arcade|word|sports)$/);
        expect(game.icon).toBeTruthy();
        expect(game.desc).toBeTruthy();
      });

      it('has a registered GameInfo in the registry', () => {
        // Games self-register on import; the registry is populated by loadAllGames
        const infos = getAllGameInfos();
        const info = infos.find(i => i.id === game.id);
        expect(info).toBeDefined();
        expect(info!.title).toBeTruthy();
        expect(info!.wrapperId).toBe(game.id + '-wrapper');
      });

      it('has a Game class that can be instantiated', () => {
        const GameClass = gameModules[game.id];
        expect(GameClass).toBeDefined();
        instance = new GameClass();
        expect(instance).toBeDefined();
      });

      it('has readonly id matching game entry', () => {
        expect(instance.id).toBe(game.id);
      });

      it('has state initialized to idle', () => {
        expect(instance.state).toBe('idle');
      });

      it('implements all required Game interface methods', () => {
        expect(typeof instance.init).toBe('function');
        expect(typeof instance.pause).toBe('function');
        expect(typeof instance.resume).toBe('function');
        expect(typeof instance.destroy).toBe('function');
        expect(typeof instance.render).toBe('function');
      });

      it('init() transitions state to playing', () => {
        instance.init();
        expect(instance.state).toBe('playing');
      });

      it('pause() can be called without error', () => {
        instance.pause();
      });

      it('resume() can be called after init', () => {
        instance.init();
        instance.resume();
      });

      it('destroy() can be called without error', () => {
        instance.destroy();
      });

      it('render() can be called without error', () => {
        instance.render();
      });
    });
  }
});
