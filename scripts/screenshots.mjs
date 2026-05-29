import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
const DIR = 'screenshots';

const browser = await chromium.launch({ headless: true });

async function goto(page, url, waitMs = 3000) {
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(waitMs);
}

async function clickButton(page, text, waitMs = 1500) {
  const btn = page.locator('button').filter({ hasText: text });
  if (await btn.count() > 0) {
    await btn.first().click();
    await page.waitForTimeout(waitMs);
    return true;
  }
  console.log(`  ✗ button "${text}" not found`);
  return false;
}

async function snap(page, name) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
}

console.log('Taking screenshots…\n');

// ── Desktop 1440p ──
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// 1. Main page (stations grid)
await goto(page, '/');
await snap(page, '01-main');

// 2. Favorites page
await goto(page, '/favorites');
await snap(page, '02-favorites');

// 3. Genre page
await goto(page, '/genre/rock');
await snap(page, '03-genre-rock');

// 4. Country page
await goto(page, '/country/Russia');
await snap(page, '04-country-russia');

// 5. Top-vote
await goto(page, '/genre/top-vote');
await snap(page, '05-top-vote');

// 6. Trending
await goto(page, '/genre/trending');
await snap(page, '06-trending');

// 7. Search overlay
await goto(page, '/');
await clickButton(page, 'Search');
await snap(page, '07-search-overlay');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// 8. AI Chat panel
await clickButton(page, 'AI Chat');
await snap(page, '08-chat-panel');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// 9. Now Playing / Player (fresh page, click first Play button)
await goto(page, '/', 1000);
await clickButton(page, 'Play', 4000);
await snap(page, '09-now-playing');
await page.waitForTimeout(2000);
await snap(page, '10-player-active');

// 10. 404 page
await goto(page, '/nonexistent');
await snap(page, '11-404');

// 11. Settings dialog
await goto(page, '/');
await clickButton(page, 'Settings');
await snap(page, '12-settings-dialog');

await page.close();

// ── Mobile 375px ──
console.log('\n  Mobile…');
const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
const mobile = await mobileCtx.newPage();
await goto(mobile, '/');
await snap(mobile, '13-mobile-main');
await mobile.close();

console.log('\nDone!');
await browser.close();
