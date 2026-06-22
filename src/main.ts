import { buildHub, showHub, showGame, setFilter, applySearch } from './core/hub.js';
import { initBackground, switchTheme } from './core/backgrounds.js';
import { GAMES } from './core/registry-data.js';
import './games/memory/index.js';
import './games/snake/index.js';
import './games/checkers/index.js';
import './games/connect4/index.js';
import './games/tictactoe/index.js';
import './games/othello/index.js';
import './games/battleship/index.js';
import './games/gomoku/index.js';
import './games/minesweeper/index.js';
import './games/hangman/index.js';
import './games/game2048/index.js';
import './games/simon/index.js';
import './games/mastermind/index.js';
import './games/pong/index.js';
import './games/breakout/index.js';
import './games/invaders/index.js';
import './games/flappy/index.js';
import './games/dino/index.js';
import './games/countmaster/index.js';
import './games/wordle/index.js';
import './games/boggle/index.js';
import './games/anagrams/index.js';
import './games/wordsearch/index.js';
import './games/typingtest/index.js';
import './games/spellingbee/index.js';
import './games/penaltykicker/index.js';
import './games/basketball/index.js';
import './games/sprint/index.js';
import './games/bowling/index.js';
import './games/archery/index.js';
import './games/baseball/index.js';

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
    // background pause is handled internally via requestAnimationFrame pause
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

  const searchInput = document.getElementById('hub-search-input') as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener('input', applySearch);
  }

  const randomBtn = document.getElementById('hub-random-btn');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const filter = document.querySelector('.filter-btn.active') as HTMLElement | null;
      const cat = filter?.dataset.filter || 'all';
      const filtered = cat === 'all' ? GAMES : GAMES.filter(g => g.category === cat);
      const pick = filtered[Math.floor(Math.random() * filtered.length)];
      if (pick) showGame(pick.id);
    });
  }

  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', showHub);

  const playAgainBtn = document.getElementById('checkers-play-again');
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      const game = window.checkersGame as { newGame?: () => void } | undefined;
      if (game?.newGame) game.newGame();
    });
  }
});
