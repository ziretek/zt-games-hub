import { buildHub, showHub, showGame, setFilter, applySearch, openGameHelp, closeGameHelp, startSelectedGame } from './core/hub.js';
import { initBackground, switchTheme, pauseBackground, resumeBackground } from './core/backgrounds.js';
import { GAMES } from './core/registry-data.js';
import './core/lazy-load.js';
import { registerSW } from 'virtual:pwa-register';

// Global error handler — catches uncaught exceptions and promise rejections
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error || e.message);
  const container = document.getElementById('game-view');
  if (container) {
    let errEl = document.getElementById('global-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'global-error';
      errEl.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#ef4444;color:#fff;padding:8px 16px;font-size:14px;z-index:9999;text-align:center';
      document.body.appendChild(errEl);
    }
    errEl.textContent = 'Something went wrong. Try reloading the page.';
    errEl.style.display = 'block';
    setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 8000);
  }
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Rejection]', e.reason);
});

// PWA install prompt
let deferredInstallPrompt: Event | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.classList.add('visible');
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.classList.remove('visible');
});
const installBtn = document.getElementById('install-app-btn');
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      (deferredInstallPrompt as Event & { prompt: () => Promise<void> }).prompt();
      const result = await (deferredInstallPrompt as Event & { userChoice: Promise<{ outcome: string }> }).userChoice;
      if (result.outcome === 'accepted') deferredInstallPrompt = null;
    }
  });
}

const pwaUpdate = document.getElementById('pwa-update');
let applyPwaUpdate: (() => Promise<void>) | null = null;
if (pwaUpdate) {
  pwaUpdate.addEventListener('click', () => {
    pwaUpdate.style.display = 'none';
    void (applyPwaUpdate?.() || Promise.resolve().then(() => location.reload()));
  });
  const dismissBtn = document.createElement('button');
  dismissBtn.textContent = '✕';
  dismissBtn.setAttribute('aria-label', 'Dismiss');
  Object.assign(dismissBtn.style, {
    position: 'absolute', top: '6px', right: '8px',
    background: 'none', border: 'none', color: '#fff', fontSize: '16px',
    cursor: 'pointer', padding: '0', lineHeight: '1', opacity: '0.6',
  });
  dismissBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pwaUpdate.style.display = 'none';
    const cooldown = new Date();
    cooldown.setMinutes(cooldown.getMinutes() + 15);
    localStorage.setItem('pwa-update-cooldown', cooldown.toISOString());
  });
  pwaUpdate.style.position = 'relative';
  pwaUpdate.appendChild(dismissBtn);
}

const updateSW = registerSW({
  onNeedRefresh() {
    if (!pwaUpdate) return;
    const cooldown = localStorage.getItem('pwa-update-cooldown');
    if (cooldown && new Date(cooldown) > new Date()) return;
    pwaUpdate.style.display = 'block';
  },
  onOfflineReady() {
    console.log('App ready for offline use');
  },
  onRegistered(registration) {
    registration?.update();
    if (registration) window.setInterval(() => { void registration.update(); }, 5 * 60 * 1000);
  },
});
applyPwaUpdate = () => updateSW(true);

// Keyboard shortcuts for snake
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const snakeWrapper = document.getElementById('snake-wrapper');
  if (snakeWrapper?.classList.contains('active')) {
    const snakeGame = window.snakeGame as { gameOver?: boolean; setDirection?: (dx: number, dy: number) => void } | undefined;
    if (snakeGame && !snakeGame.gameOver) {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); snakeGame.setDirection?.(0, -1); break;
        case 'ArrowDown': e.preventDefault(); snakeGame.setDirection?.(0, 1); break;
        case 'ArrowLeft': e.preventDefault(); snakeGame.setDirection?.(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); snakeGame.setDirection?.(1, 0); break;
      }
    }
  }
});

// Pause backgrounds when tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseBackground();
  } else {
    resumeBackground();
  }
});

window.addEventListener('load', () => {
  const hub = document.getElementById('game-hub');
  if (!hub) return; // standalone mode

  const countEl = document.getElementById('hub-game-count');
  if (countEl) countEl.textContent = GAMES.length + ' games';

  buildHub();
  initBackground();
  showHub();

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = (btn as HTMLElement).dataset.theme;
      if (theme === 'marvel' || theme === 'neural' || theme === 'gradient') {
        switchTheme(theme);
      }
    });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = (btn as HTMLElement).dataset.filter || 'all';
      setFilter(filter);
    });
  });

  const searchInput = document.getElementById('hub-search-input');
  const searchClear = document.getElementById('hub-search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applySearch();
      if (searchClear) searchClear.classList.toggle('visible', searchInput.textContent.length > 0);
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.textContent = '';
      searchClear.classList.remove('visible');
      applySearch();
      searchInput.focus();
    });
  }

  const randomBtn = document.getElementById('hub-random-btn');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const visibleCards = [...document.querySelectorAll<HTMLElement>('.game-card')]
        .filter(card => card.style.display !== 'none' && card.closest<HTMLElement>('.category')?.style.display !== 'none');
      const pick = visibleCards[Math.floor(Math.random() * visibleCards.length)];
      const id = pick?.dataset.game;
      if (id) showGame(id);
    });
  }

  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', showHub);

  const helpBtn = document.getElementById('game-help-btn');
  if (helpBtn) helpBtn.addEventListener('click', openGameHelp);

  const startBtn = document.getElementById('game-start-btn');
  if (startBtn) startBtn.addEventListener('click', () => { void startSelectedGame(); });

  const helpClose = document.getElementById('game-help-close');
  if (helpClose) helpClose.addEventListener('click', closeGameHelp);

  const helpPanel = document.getElementById('game-help-panel');
  if (helpPanel) {
    helpPanel.addEventListener('click', (e) => {
      if (e.target === helpPanel) closeGameHelp();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeGameHelp();
  });

  const hubTitle = document.querySelector('.hub-header h1');
  if (hubTitle) hubTitle.addEventListener('click', () => location.reload());

  const playAgainBtn = document.getElementById('checkers-play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      const game = window.checkersGame as { newGame?: () => void } | undefined;
      if (game?.newGame) game.newGame();
    });
  }

  const chessPlayAgain = document.getElementById('chess-play-again');
  if (chessPlayAgain) {
    chessPlayAgain.addEventListener('click', () => {
      const game = window.chessGame as { newGame?: () => void } | undefined;
      if (game?.newGame) game.newGame();
    });
  }
});
