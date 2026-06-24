import { expect, test, type Page } from '@playwright/test';
import { GAMES } from '../src/core/registry-data';

type SmokePage = { __smokeErrors?: string[] };

const disableAnimationsCss = `
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-delay: 0s !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
`;

async function prepareSmokePage(page: Page, options: { fastStart?: boolean } = {}) {
  const pageErrors: string[] = [];
  (page as unknown as SmokePage).__smokeErrors = pageErrors;
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });

  await page.addInitScript((fastStart: boolean) => {
    localStorage.clear();
    window.__ZT_E2E_FAST_START = fastStart;
  }, options.fastStart === true);
  await page.goto('/');
  await page.addStyleTag({ content: disableAnimationsCss });
  await expect(page.locator('body')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('#game-hub')).toBeVisible();

  return pageErrors;
}

test.beforeEach(async ({ page }) => {
  await prepareSmokePage(page);
});

test.afterEach(async ({ page }) => {
  const pageErrors = (page as unknown as SmokePage).__smokeErrors || [];
  expect(pageErrors).toEqual([]);
});

test('hub search, filters, favorites, and random entry points work', async ({ page }) => {
  await expect(page.locator('#hub-game-count')).toContainText(String(GAMES.length));

  const search = page.locator('#hub-search-input');
  await search.fill('chess');
  await expect(page.locator('.game-card[data-game="chess"]')).toBeVisible();
  await expect(page.locator('.game-card[data-game="snake"]')).toBeHidden();

  await expect(page.locator('#hub-search-clear')).toHaveClass(/visible/);
  await search.fill('');
  await expect(page.locator('#hub-search-clear')).not.toHaveClass(/visible/);
  await expect(page.locator('.game-card[data-game="snake"]')).toBeVisible();

  await page.locator('.game-card[data-game="snake"] .favorite-btn').click();
  await page.locator('.filter-btn[data-filter="favorites"]').click();
  await expect(page.locator('.game-card[data-game="snake"]')).toBeVisible();
  await expect(page.locator('.game-card[data-game="chess"]')).toBeHidden();

  await page.locator('.filter-btn[data-filter="all"]').click();
  await page.locator('#hub-random-btn').click();
  await expect(page.locator('#game-view')).toBeVisible();
  await expect(page.locator('#game-start-panel')).toBeVisible();
  await page.locator('#back-btn').click();
  await expect(page.locator('#game-hub')).toBeVisible();
});

test('game help panel shows rules, controls, tips, and play stats', async ({ page }) => {
  await page.locator('.game-card[data-game="chess"]').click();
  await expect(page.locator('#game-view-title')).toHaveText('Chess');
  await expect(page.locator('#game-start-panel')).toBeVisible();
  await expect(page.locator('#game-help-plays')).toHaveText('0');

  await page.locator('#game-start-btn').click();
  await expect(page.locator('#game-start-panel')).toHaveClass(/loading/);
  await expect(page.locator('#chess-wrapper')).not.toHaveClass(/active/);
  await expect(page.locator('#game-start-panel')).toBeHidden({ timeout: 10_000 });

  await page.locator('#game-help-btn').click();
  await expect(page.locator('#game-help-panel')).toHaveClass(/visible/);
  await expect(page.locator('#game-help-title')).toHaveText('Chess');
  await expect(page.locator('#game-help-objective')).toContainText('Checkmate');
  await expect(page.locator('#game-help-controls li')).toHaveCount(2);
  await expect(page.locator('#game-help-tips li')).toHaveCount(3);
  await expect(page.locator('#game-help-plays')).toHaveText('1');

  await page.locator('#game-help-close').click();
  await expect(page.locator('#game-help-panel')).not.toHaveClass(/visible/);
});

test('pong is always human left paddle versus AI right paddle', async ({ page }) => {
  await page.locator('.game-card[data-game="pong"]').click();
  await expect(page.locator('#game-view-title')).toHaveText('Pong');
  await expect(page.locator('#game-start-title')).toHaveText('Pong');
  await page.locator('#game-start-btn').click();
  await expect(page.locator('#game-start-panel')).toHaveClass(/loading/);
  await expect(page.locator('#pong-wrapper')).not.toHaveClass(/active/);
  await expect(page.locator('#game-start-panel')).toBeHidden({ timeout: 10_000 });
  await expect(page.locator('#pong-ai-btn')).toHaveCount(0);
  await expect(page.locator('.pong-countdown')).toHaveText('3');
  await expect(page.locator('#pong-score')).toHaveText('Get ready...');
  await expect(page.locator('.pong-countdown')).toBeHidden({ timeout: 4_000 });
  await expect(page.locator('#pong-score')).toHaveText('Human 0 - 0 AI');

  await page.locator('#game-help-btn').click();
  await expect(page.locator('#game-help-controls')).toContainText('left paddle');
  await expect(page.locator('#game-help-controls')).toContainText('right paddle is always controlled by AI');
});

test('every registered game opens from the hub', async ({ context }) => {
  test.setTimeout(300_000);

  for (const game of GAMES) {
    await test.step(game.id, async () => {
      const gamePage = await context.newPage();
      const pageErrors = await prepareSmokePage(gamePage, { fastStart: true });

      try {
        await gamePage.locator(`.game-card[data-game="${game.id}"]`).evaluate((el: Element) => {
          (el as HTMLElement).click();
        });
        await expect(gamePage.locator('#game-view-title')).toHaveText(game.name);
        await expect(gamePage.locator('#game-start-title')).toHaveText(game.name);
        await gamePage.locator('#game-start-btn').evaluate((el: Element) => {
          (el as HTMLElement).click();
        });
        await expect(gamePage.locator('#game-start-panel')).toBeHidden({ timeout: 10_000 });
        await expect(gamePage.locator(`#${game.id}-wrapper`)).toHaveClass(/active/);
        expect(pageErrors).toEqual([]);
      } finally {
        await gamePage.close();
      }
    });
  }
});
