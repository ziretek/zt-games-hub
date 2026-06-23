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
  await page.locator('#back-btn').click();
  await expect(page.locator('#game-hub')).toBeVisible();
});

test('every registered game opens and returns to the hub', async ({ page }) => {
  test.setTimeout(150_000);

  for (const game of GAMES) {
    await test.step(game.id, async () => {
      await page.locator(`.game-card[data-game="${game.id}"]`).click();
      await expect(page.locator('#game-view-title')).toHaveText(game.name);
      await expect(page.locator(`#${game.id}-wrapper`)).toHaveClass(/active/);
      await page.locator('#back-btn').click();
      await expect(page.locator('#game-hub')).toBeVisible();
    });
  }
});
