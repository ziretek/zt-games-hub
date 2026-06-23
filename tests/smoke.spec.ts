import { expect, test } from '@playwright/test';
import { GAMES } from '../src/core/registry-data';

type SmokePage = { __smokeErrors?: string[] };

test.beforeEach(async ({ page }) => {
  const pageErrors: string[] = [];
  (page as unknown as SmokePage).__smokeErrors = pageErrors;
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });

  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0s !important;
        transition-duration: 0.001ms !important;
        scroll-behavior: auto !important;
      }
    `,
  });
  await expect(page.locator('#game-hub')).toBeVisible();
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

  await page.locator('#hub-search-clear').click();
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
  await expect(page.locator('#pong-score')).toHaveText('Human 0 - 0 AI');

  await page.locator('#game-help-btn').click();
  await expect(page.locator('#game-help-controls')).toContainText('left paddle');
  await expect(page.locator('#game-help-controls')).toContainText('right paddle is always controlled by AI');
});

test('every registered game opens and returns to the hub', async ({ page }) => {
  test.setTimeout(300_000);

  for (const game of GAMES) {
    await test.step(game.id, async () => {
      await page.locator(`.game-card[data-game="${game.id}"]`).click();
      await expect(page.locator('#game-view-title')).toHaveText(game.name);
      await expect(page.locator('#game-start-title')).toHaveText(game.name);
      await page.locator('#game-start-btn').click();
      await expect(page.locator('#game-start-panel')).toBeHidden({ timeout: 10_000 });
      await expect(page.locator(`#${game.id}-wrapper`)).toHaveClass(/active/);
      await page.locator('#back-btn').click();
      await expect(page.locator('#game-hub')).toBeVisible();
    });
  }
});
