import { GAMES, GAME_MAP, CATEGORIES } from './registry-data.js';
import { loadJson, saveJson } from '../utils/storage.js';
import { getGameConstructor } from './registry.js';
import { gameChunks } from './lazy-load.js';
import { GAME_HELP } from './help-data.js';
import { getGameStat, recordGameLaunch } from '../utils/game-stats.js';

let _activeFilter = 'all';
let _pendingGameId: string | null = null;
let _startingGame = false;
let _startToken = 0;
const FAVORITES_KEY = 'favoriteGames';
const START_DELAY_MS = 3000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function getSearchQuery(): string {
  const input = document.getElementById('hub-search-input');
  if (input instanceof HTMLInputElement) return input.value.toLowerCase().trim();
  return input?.textContent?.toLowerCase().trim() || '';
}

function setSearchQuery(value: string): void {
  const input = document.getElementById('hub-search-input');
  if (input instanceof HTMLInputElement) input.value = value;
  else if (input) input.textContent = value;
}

function getFavoriteGames(): string[] {
  return loadJson<string[]>(FAVORITES_KEY, []);
}

function toggleFavoriteGame(id: string): void {
  const favorites = getFavoriteGames();
  const next = favorites.includes(id) ? favorites.filter(g => g !== id) : [id, ...favorites];
  saveJson(FAVORITES_KEY, next);
  updateFavoriteButtons();
  applySearch();
}

function updateFavoriteButtons(): void {
  const favorites = new Set(getFavoriteGames());
  document.querySelectorAll<HTMLElement>('.game-card').forEach(card => {
    const id = card.dataset.game || '';
    const isFavorite = favorites.has(id);
    card.classList.toggle('is-favorite', isFavorite);
    const btn = card.querySelector<HTMLButtonElement>('.favorite-btn');
    if (btn) {
      btn.textContent = isFavorite ? '★' : '☆';
      btn.setAttribute('aria-label', isFavorite ? `Remove ${GAME_MAP.get(id)?.name || id} from favorites` : `Add ${GAME_MAP.get(id)?.name || id} to favorites`);
      btn.setAttribute('aria-pressed', String(isFavorite));
    }
  });
}

export function buildHub(): void {
  const hub = document.getElementById('game-hub');
  if (!hub) return;
  const footer = document.getElementById('hub-footer');
  const appendBeforeFooter = (el: HTMLElement): void => {
    if (footer?.parentElement === hub) hub.insertBefore(el, footer);
    else hub.appendChild(el);
  };

  const bg = document.createElement('div');
  bg.className = 'hub-bg';
  appendBeforeFooter(bg);

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
      card.dataset.difficulty = g.difficulty.toLowerCase();
      card.dataset.ai = String(Boolean(g.needsAiBtn));
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${g.icon} ${g.name}: ${g.desc}`);
      card.style.setProperty('--card-accent', g.accent);
      card.style.animationDelay = `${0.04 * (idx + 1)}s`;
      card.innerHTML = `
        <div class="game-card-accent"></div>
        <div class="game-card-bg"></div>
        <button class="favorite-btn" type="button" aria-pressed="false">☆</button>
        <div class="game-card-content">
          <div class="game-card-icon" aria-hidden="true">${g.icon}</div>
          <div class="game-card-title">${g.name}</div>
          <div class="game-card-desc">${g.desc}</div>
          <div class="game-card-meta">
            <span>${g.difficulty}</span>
            ${g.needsAiBtn ? '<span>AI</span>' : ''}
          </div>
        </div>
      `;
      const favoriteBtn = card.querySelector<HTMLButtonElement>('.favorite-btn');
      favoriteBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteGame(g.id);
      });
      card.addEventListener('click', () => showGame(g.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showGame(g.id); }
      });
      cards.appendChild(card);
    });

    inner.appendChild(cards);
    section.appendChild(inner);
    appendBeforeFooter(section);
  }

  const empty = document.createElement('div');
  empty.id = 'hub-empty-state';
  empty.className = 'hub-empty-state';
  empty.innerHTML = `
    <div class="hub-empty-title">No games found</div>
    <button id="hub-empty-clear" type="button">Clear search</button>
  `;
  empty.querySelector('button')?.addEventListener('click', () => {
    const input = document.getElementById('hub-search-input');
    if (input) {
      setSearchQuery('');
      input.focus();
    }
    document.getElementById('hub-search-clear')?.classList.remove('visible');
    applySearch();
  });
  appendBeforeFooter(empty);
  updateFavoriteButtons();
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

function updateRecentDisplay(): void {
  const el = document.getElementById('hub-recent');
  if (!el) return;
  const recent = getRecentGames();
  el.replaceChildren();
  const label = document.createElement('span');
  label.className = 'hub-recent-label';
  label.textContent = 'Recent';
  el.appendChild(label);
  if (!recent.length) {
    const empty = document.createElement('span');
    empty.className = 'hub-recent-empty';
    empty.textContent = '—';
    el.appendChild(empty);
    return;
  }
  for (const id of recent) {
    const entry = GAME_MAP.get(id);
    if (!entry) continue;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'hub-recent-chip';
    chip.textContent = entry.name;
    chip.addEventListener('click', () => showGame(id));
    el.appendChild(chip);
  }
}

function formatLastPlayed(value?: string): string {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderList(el: HTMLElement | null, items: string[]): void {
  if (!el) return;
  el.replaceChildren();
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  }
}

function updateGameHelp(id: string): void {
  const entry = GAME_MAP.get(id);
  const help = GAME_HELP[id];
  if (!entry || !help) return;

  const stat = getGameStat(id);
  const title = document.getElementById('game-help-title');
  const subtitle = document.getElementById('game-help-subtitle');
  const objective = document.getElementById('game-help-objective');
  const statPlays = document.getElementById('game-help-plays');
  const statLast = document.getElementById('game-help-last');
  const controls = document.getElementById('game-help-controls');
  const tips = document.getElementById('game-help-tips');

  if (title) title.textContent = entry.name;
  if (subtitle) subtitle.textContent = `${entry.category} - ${entry.difficulty}${entry.needsAiBtn ? ' - AI mode' : ''}`;
  if (objective) objective.textContent = help.objective;
  if (statPlays) statPlays.textContent = String(stat.plays);
  if (statLast) statLast.textContent = formatLastPlayed(stat.lastPlayedAt);
  renderList(controls, help.controls);
  renderList(tips, help.tips);
}

function updateStartPanel(id: string): void {
  const entry = GAME_MAP.get(id);
  if (!entry) return;

  const panel = document.getElementById('game-start-panel');
  const icon = document.getElementById('game-start-icon');
  const title = document.getElementById('game-start-title');
  const desc = document.getElementById('game-start-desc');
  const meta = document.getElementById('game-start-meta');
  const btn = document.getElementById('game-start-btn') as HTMLButtonElement | null;

  if (icon) icon.textContent = entry.icon;
  if (title) title.textContent = entry.name;
  if (desc) desc.textContent = entry.desc;
  if (meta) {
    meta.replaceChildren();
    for (const label of [entry.category, entry.difficulty, entry.needsAiBtn ? 'AI mode' : 'Solo play']) {
      const chip = document.createElement('span');
      chip.textContent = label;
      meta.appendChild(chip);
    }
  }
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Start Game';
  }
  panel?.classList.remove('loading');
  const progress = document.getElementById('game-start-progress') as HTMLElement | null;
  if (progress) {
    progress.style.transitionDuration = '';
    progress.style.width = '0%';
  }
  panel?.classList.remove('hidden');
}

function hideStartPanel(): void {
  const panel = document.getElementById('game-start-panel');
  panel?.classList.add('hidden');
  panel?.classList.remove('loading');
}

export function openGameHelp(): void {
  const panel = document.getElementById('game-help-panel');
  if (!panel) return;
  panel.classList.add('visible');
  panel.setAttribute('aria-hidden', 'false');
  document.getElementById('game-help-close')?.focus();
}

export function closeGameHelp(): void {
  const panel = document.getElementById('game-help-panel');
  if (!panel) return;
  panel.classList.remove('visible');
  panel.setAttribute('aria-hidden', 'true');
  document.getElementById('game-help-btn')?.focus();
}

export function showHub(): void {
  _pendingGameId = null;
  _startingGame = false;
  _startToken++;
  const helpPanel = document.getElementById('game-help-panel');
  helpPanel?.classList.remove('visible');
  helpPanel?.setAttribute('aria-hidden', 'true');
  hideStartPanel();
  pauseAll();
  for (const g of GAMES) {
    const key = g.id + 'Game';
    const inst = window[key] as { destroy?: () => void } | undefined;
    if (inst?.destroy) inst.destroy();
    delete window[key];
  }
  const hub = document.getElementById('game-hub');
  const view = document.getElementById('game-view');
  const wrapper = document.querySelector('.gw.active') as HTMLElement | null;
  if (view) {
    view.classList.remove('view-enter');
    view.classList.add('view-exit');
  }
  if (wrapper) wrapper.classList.remove('active');
  setTimeout(() => {
    if (hub) {
      hub.style.display = 'flex';
      hub.classList.remove('hub-exit');
      void hub.offsetHeight;
    }
    if (view) {
      view.style.display = 'none';
      view.classList.remove('view-exit');
    }
    updateRecentDisplay();
    const searchInput = document.getElementById('hub-search-input');
    if (searchInput) { setSearchQuery(''); searchInput.focus(); }
    document.getElementById('hub-search-clear')?.classList.remove('visible');
    document.querySelectorAll('.game-card').forEach(c => (c as HTMLElement).style.display = '');
    document.querySelectorAll('.category').forEach(c => {
      (c as HTMLElement).style.display = '';
      c.classList.remove('hidden');
    });
    setFilter(_activeFilter);
  }, 250);
}

function bindNewGameButton(id: string): void {
  const btn = document.getElementById(id + '-new-btn') || document.getElementById('newGameBtn');
  if (!btn || btn.dataset.listenerAttached) return;
  btn.dataset.listenerAttached = 'true';
  btn.addEventListener('click', () => {
    const inst = window[id + 'Game'] as { newGame?: () => void; init?: () => void } | undefined;
    if (inst?.newGame) inst.newGame();
    else inst?.init?.();
  });
}

export async function startSelectedGame(): Promise<void> {
  if (!_pendingGameId || _startingGame) return;
  await startGame(_pendingGameId);
}

async function startGame(id: string): Promise<void> {
  const entry = GAME_MAP.get(id);
  if (!entry) return;

  _startingGame = true;
  const token = ++_startToken;
  const panel = document.getElementById('game-start-panel');
  const startBtn = document.getElementById('game-start-btn') as HTMLButtonElement | null;
  const desc = document.getElementById('game-start-desc');
  const progress = document.getElementById('game-start-progress') as HTMLElement | null;
  panel?.classList.add('loading');
  if (desc) desc.textContent = 'Loading game...';
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = 'Loading...';
  }
  if (progress) {
    progress.style.transitionDuration = '0ms';
    progress.style.width = '0%';
    void progress.offsetWidth;
    progress.style.transitionDuration = `${START_DELAY_MS}ms`;
    progress.style.width = '100%';
  }

  try {
    await delay(START_DELAY_MS);
    if (token !== _startToken || _pendingGameId !== id) return;

    document.querySelectorAll('.gw').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(id + '-wrapper');
    if (target) {
      target.classList.remove('active');
      void target.offsetHeight;
      target.classList.add('active');
    }

    const key = id + 'Game';
    const loader = gameChunks[id];
    if (!window[key] && loader) await loader();
    if (token !== _startToken || _pendingGameId !== id) return;

    const Ctor = getGameConstructor(id);
    if (Ctor && !window[key]) {
      window[key] = new Ctor();
    }

    const inst = window[key] as { init?: () => void } | undefined;
    inst?.init?.();
    bindNewGameButton(id);
    recordGameLaunch(id);
    updateGameHelp(id);
    hideStartPanel();
    _pendingGameId = null;
  } catch (e: unknown) {
    console.error(`Failed to load game ${id}:`, e);
    const titleEl = document.getElementById('game-view-title');
    if (titleEl) titleEl.textContent = 'Failed to load game';
    if (desc) desc.textContent = `Could not load "${entry.name}". Please try again.`;
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.textContent = 'Try Again';
    }
    panel?.classList.remove('loading');
  } finally {
    if (token === _startToken) _startingGame = false;
  }
}

export function showGame(id: string): void {
  const entry = GAME_MAP.get(id);
  if (!entry) return;

  _startToken++;
  _startingGame = false;
  pauseAll();
  for (const g of GAMES) {
    const key = g.id + 'Game';
    const inst = window[key] as { destroy?: () => void } | undefined;
    if (inst?.destroy) inst.destroy();
    delete window[key];
  }
  const hub = document.getElementById('game-hub');
  const view = document.getElementById('game-view');
  if (hub) hub.classList.add('hub-exit');
  setTimeout(() => {
    if (hub) hub.style.display = 'none';
    if (view) {
      view.style.display = 'flex';
      void view.offsetHeight;
      view.classList.add('view-enter');
    }
    document.querySelectorAll('.gw').forEach(el => el.classList.remove('active'));
    const title = document.getElementById('game-view-title');
    if (title) title.textContent = entry.name;

    _pendingGameId = id;
    addRecentGame(id);
    updateGameHelp(id);
    updateStartPanel(id);
    setTimeout(() => document.getElementById('game-start-btn')?.focus(), 50);
  }, 250);
}

export function setFilter(filter: string): void {
  _activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => {
    const el = b as HTMLElement;
    const isActive = el.dataset.filter === filter;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-selected', String(isActive));
  });
  document.querySelectorAll('.category').forEach(section => {
    const sec = section as HTMLElement;
    if (filter === 'all' || filter === 'favorites' || sec.dataset.category === filter) {
      sec.classList.remove('hidden');
    } else {
      sec.classList.add('hidden');
    }
  });
  applySearch();
}

export function applySearch(): void {
  const q = getSearchQuery();
  const favorites = new Set(getFavoriteGames());
  document.querySelectorAll('.game-card').forEach(card => {
    const c = card as HTMLElement;
    const id = c.dataset.game || '';
    const title = c.querySelector('.game-card-title')?.textContent?.toLowerCase() || '';
    const desc = c.querySelector('.game-card-desc')?.textContent?.toLowerCase() || '';
    const difficulty = c.dataset.difficulty || '';
    const ai = c.dataset.ai === 'true' ? 'ai computer opponent' : '';
    const favoriteMatch = _activeFilter !== 'favorites' || favorites.has(id);
    const searchMatch = !q || title.includes(q) || desc.includes(q) || difficulty.includes(q) || ai.includes(q);
    const match = favoriteMatch && searchMatch;
    c.style.display = match ? '' : 'none';
  });
  let visibleCount = 0;
  document.querySelectorAll('.category').forEach(section => {
    const sec = section as HTMLElement;
    const filterMatch = _activeFilter === 'all' || _activeFilter === 'favorites' || sec.dataset.category === _activeFilter;
    const visible = filterMatch && [...sec.querySelectorAll('.game-card')].some(c => (c as HTMLElement).style.display !== 'none');
    sec.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });
  const empty = document.getElementById('hub-empty-state');
  if (empty) empty.classList.toggle('visible', visibleCount === 0);
}
