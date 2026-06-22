import { GAMES, GAME_MAP, CATEGORIES } from './registry-data.js';
import { loadJson, saveJson } from '../utils/storage.js';
import { getGameConstructor } from './registry.js';

let _activeFilter = 'all';

export function buildHub(): void {
  const hub = document.getElementById('game-hub');
  if (!hub) return;

  const bg = document.createElement('div');
  bg.className = 'hub-bg';
  hub.appendChild(bg);

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const section = document.createElement('div');
    section.className = 'category';
    section.dataset.category = key;
    section.style.setProperty('--category-accent', cat.accent);

    const label = document.createElement('div');
    label.className = 'category-label';
    label.innerHTML = `<span class="category-accent-dot"></span><span class="category-icon">${cat.icon}</span><span>${cat.name}</span>`;
    section.appendChild(label);

    const inner = document.createElement('div');
    inner.className = 'category-inner';

    const cards = document.createElement('div');
    cards.className = 'game-cards';

    const filtered = GAMES.filter(g => g.category === key);
    filtered.forEach((g, idx) => {
      const card = document.createElement('div');
      card.className = 'game-card';
      card.dataset.game = g.id;
      card.style.setProperty('--card-accent', g.accent);
      card.style.animationDelay = `${0.04 * (idx + 1)}s`;
      card.innerHTML = `
        <div class="game-card-accent"></div>
        <div class="game-card-bg"></div>
        <div class="game-card-content">
          <div class="game-card-icon">${g.icon}</div>
          <div class="game-card-title">${g.name}</div>
          <div class="game-card-desc">${g.desc}</div>
        </div>

      `;
      card.addEventListener('click', () => showGame(g.id));
      cards.appendChild(card);
    });

    inner.appendChild(cards);
    section.appendChild(inner);
    hub.appendChild(section);
  }
}

// Active game instances stored on window
declare global {
  interface Window {
    [key: string]: unknown;
  }
}

function pauseAll(): void {
  for (const g of GAMES) {
    const inst = window[g.id + 'Game'] as { pause?: () => void } | undefined;
    if (inst?.pause) inst.pause();
  }
}

function addRecentGame(id: string): void {
  let recent = getRecentGames().filter(g => g !== id);
  recent.unshift(id);
  if (recent.length > 3) recent = recent.slice(0, 3);
  saveJson('recentGames', recent);
}

function getRecentGames(): string[] {
  return loadJson<string[]>('recentGames', []);
}

export function updateRecentDisplay(): void {
  const el = document.getElementById('hub-recent');
  if (!el) return;
  const recent = getRecentGames();
  el.textContent = recent.length
    ? 'Recent: ' + recent.map(id => GAME_MAP.get(id)?.name || id).join(', ')
    : 'Recent: —';
}

export function showHub(): void {
  pauseAll();
  if (typeof window.snakeGame !== 'undefined') {
    const sg = window.snakeGame as { destroy?: () => void };
    if (sg?.destroy) sg.destroy();
  }
  const hub = document.getElementById('game-hub');
  const view = document.getElementById('game-view');
  if (hub) hub.style.display = 'flex';
  if (view) view.style.display = 'none';
  document.querySelectorAll('.gw').forEach(el => el.classList.remove('active'));
  updateRecentDisplay();
  const searchInput = document.getElementById('hub-search-input') as HTMLInputElement | null;
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.game-card').forEach(c => (c as HTMLElement).style.display = '');
  document.querySelectorAll('.category').forEach(c => {
    (c as HTMLElement).style.display = '';
    c.classList.remove('hidden');
  });
  setFilter(_activeFilter);
}

export function showGame(id: string): void {
  const entry = GAME_MAP.get(id);
  if (!entry) return;

  pauseAll();
  const hub = document.getElementById('game-hub');
  const view = document.getElementById('game-view');
  if (hub) hub.style.display = 'none';
  if (view) view.style.display = 'flex';
  document.querySelectorAll('.gw').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id + '-wrapper');
  if (target) target.classList.add('active');
  const title = document.getElementById('game-view-title');
  if (title) title.textContent = entry.name;

  addRecentGame(id);

  const key = id + 'Game';
  if (!window[key]) {
    const Ctor = getGameConstructor(id);
    if (Ctor) {
      const inst = new Ctor() as { init?: () => void };
      window[key] = inst;
      inst.init?.();
    }
  } else {
    const inst = window[key] as { init?: () => void } | undefined;
    if (inst?.init) inst.init();
  }
}

export function setFilter(filter: string): void {
  _activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', (b as HTMLElement).dataset.filter === filter);
  });
  document.querySelectorAll('.category').forEach(section => {
    const sec = section as HTMLElement;
    if (filter === 'all' || sec.dataset.category === filter) {
      sec.classList.remove('hidden');
    } else {
      sec.classList.add('hidden');
    }
  });
  applySearch();
}

export function getActiveFilter(): string { return _activeFilter; }

export function applySearch(): void {
  const input = document.getElementById('hub-search-input') as HTMLInputElement | null;
  const q = input?.value?.toLowerCase().trim() || '';
  document.querySelectorAll('.game-card').forEach(card => {
    const c = card as HTMLElement;
    const title = c.querySelector('.game-card-title')?.textContent?.toLowerCase() || '';
    const desc = c.querySelector('.game-card-desc')?.textContent?.toLowerCase() || '';
    const match = !q || title.includes(q) || desc.includes(q);
    c.style.display = match ? '' : 'none';
  });
  document.querySelectorAll('.category:not(.hidden)').forEach(section => {
    const sec = section as HTMLElement;
    const visible = [...sec.querySelectorAll('.game-card')].some(c => (c as HTMLElement).style.display !== 'none');
    if (!visible && q) sec.style.display = 'none';
    else sec.style.display = '';
  });
}
