// @ts-check
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROJECT_DIR = '/Users/zire/Documents/Projects/Web Calculator';
const HUB_URL = 'file://' + path.join(PROJECT_DIR, 'index.html');

const GAME_IDS = [
  'checkers', 'connect4', 'minesweeper', 'memory', 'snake', 'tictactoe',
  'hangman', 'game2048', 'pong', 'breakout', 'othello', 'battleship',
  'gomoku', 'simon', 'mastermind', 'invaders', 'flappy', 'dino',
  'countmaster', 'wordle', 'boggle', 'anagrams', 'wordsearch',
  'typingtest', 'spellingbee', 'penaltykicker', 'basketball', 'sprint',
  'bowling', 'archery', 'baseball'
];

let passed = 0;
let failed = 0;
const failures = [];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  });

  // ============================================================
  // Phase 1: Standalone page tests
  // ============================================================
  console.log('\n=== PHASE 1: Standalone Game Pages ===\n');

  for (const id of GAME_IDS) {
    const htmlPath = path.join(PROJECT_DIR, `${id}.html`);
    if (!fs.existsSync(htmlPath)) {
      console.log(`  FAIL  ${id} — HTML file missing`);
      failed++;
      failures.push({ game: id, phase: 'standalone', error: 'HTML file not found' });
      continue;
    }

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    try {
      await page.goto('file://' + htmlPath, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000); // Let animations initialize

      const wrapperId = `${id}-wrapper`;
      const active = await page.$(`#${wrapperId}.active`);
      if (!active) {
        // Some games might not use .active class in standalone mode
        const wrapper = await page.$(`#${wrapperId}`);
        if (!wrapper) {
          errors.push(`Wrapper #${wrapperId} not found`);
        }
      }

      if (errors.length > 0) {
        console.log(`  FAIL  ${id} — ${errors.join('; ')}`);
        failed++;
        failures.push({ game: id, phase: 'standalone', error: errors.join('; ') });
      } else {
        console.log(`  PASS  ${id}`);
        passed++;
      }
    } catch (err) {
      console.log(`  FAIL  ${id} — ${err.message}`);
      failed++;
      failures.push({ game: id, phase: 'standalone', error: err.message });
    } finally {
      await page.close();
    }
  }

  // ============================================================
  // Phase 2: Hub mode — open each game via the hub
  // ============================================================
  console.log('\n=== PHASE 2: Hub Mode (index.html) ===\n');

  const hubPage = await context.newPage();
  const hubErrors = [];
  hubPage.on('pageerror', err => hubErrors.push(err.message));
  hubPage.on('console', msg => {
    if (msg.type() === 'error') hubErrors.push(msg.text());
  });

  try {
    await hubPage.goto(HUB_URL, { waitUntil: 'networkidle', timeout: 10000 });
    await hubPage.waitForTimeout(1000);

    if (hubErrors.length > 0) {
      console.log(`  FAIL  hub-load — ${hubErrors.join('; ')}`);
      failed++;
      failures.push({ game: 'hub', phase: 'hub-load', error: hubErrors.join('; ') });
    } else {
      console.log('  PASS  hub-load (no console errors)');
      passed++;
    }

    // Test switching to each game via hub
    for (const id of GAME_IDS) {
      try {
        // Click game card
        const card = await hubPage.$(`[data-game="${id}"]`);
        if (!card) {
          console.log(`  FAIL  hub-${id} — card not found`);
          failed++;
          failures.push({ game: id, phase: 'hub-switch', error: 'Card not found in hub' });
          continue;
        }

        await card.click();
        await hubPage.waitForTimeout(1500);

        // Check if wrapper is active
        const active = await hubPage.$(`#${id}-wrapper.active`);
        if (!active) {
          console.log(`  FAIL  hub-${id} — wrapper not active`);
          failed++;
          failures.push({ game: id, phase: 'hub-switch', error: 'Wrapper not activated' });
          continue;
        }

        // Go back to hub
        const backBtn = await hubPage.$('#hub-back-btn');
        if (backBtn) await backBtn.click();
        await hubPage.waitForTimeout(500);

        console.log(`  PASS  hub-${id}`);
        passed++;
      } catch (err) {
        console.log(`  FAIL  hub-${id} — ${err.message}`);
        failed++;
        failures.push({ game: id, phase: 'hub-switch', error: err.message });
      }
    }
  } catch (err) {
    console.log(`  FAIL  hub-load — ${err.message}`);
    failed++;
    failures.push({ game: 'hub', phase: 'hub-load', error: err.message });
  } finally {
    await hubPage.close();
  }

  await browser.close();

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n========================================');
  console.log(`  TOTAL: ${passed + failed} tests`);
  console.log(`  PASS:  ${passed}`);
  console.log(`  FAIL:  ${failed}`);
  console.log('========================================\n');

  if (failures.length > 0) {
    console.log('Failed tests:');
    for (const f of failures) {
      console.log(`  - ${f.game} (${f.phase}): ${f.error}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
