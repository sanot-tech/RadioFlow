import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
const DIR = 'screenshots';

const browser = await chromium.launch({ headless: true });

async function goto(page, url, waitMs = 3000) {
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(waitMs);
}

async function clickBtn(page, text, waitMs = 1500) {
  const btn = page.locator('button').filter({ hasText: text });
  if (await btn.count() > 0) {
    await btn.first().click();
    await page.waitForTimeout(waitMs);
    return true;
  }
  return false;
}

async function snap(page, name) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
}

async function snapClip(page, name, clip) {
  await page.screenshot({ path: `${DIR}/${name}.png`, clip });
}

console.log('Taking screenshots…\n');

// ── Desktop 1440p ──
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// 1. Main grid
await goto(page, '/');
await snap(page, '01-main-grid');

// 2. Genre selection dialog
await clickBtn(page, 'Genres', 2000);
await snap(page, '02-genre-modal');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// 3. Country selection dialog
await clickBtn(page, 'Country', 2000);
await snap(page, '03-country-modal');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// 4. Force-show upper player + bottom bar by injecting player state
// This avoids audio loading failures
await page.evaluate(() => {
  // Dispatch a custom event or directly manipulate the player context
  // The RadioPlayerContext stores state in React. We can try clicking
  // a station's play button programmatically.
  const playBtns = document.querySelectorAll('button');
  for (const btn of playBtns) {
    if (btn.textContent?.trim() === 'Play') {
      btn.click();
      break;
    }
  }
});
await page.waitForTimeout(4000);

// 5. Upper player (NowPlayingCard) with equalizer worm + bottom bar
await snap(page, '04-player-upper');

// 6. Bottom player bar — crop to just the fixed bottom element
await page.waitForTimeout(1000);
let br = await page.evaluate(() => {
  for (const el of document.querySelectorAll('div')) {
    const s = window.getComputedStyle(el);
    if (s.position === 'fixed' && s.bottom === '0px' && s.zIndex === '80') {
      const t = el.textContent.trim();
      if (t.length > 20) {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }
    }
  }
  return null;
});
if (br) {
  await snapClip(page, '06-player-bottom', br);
}

// 7. Search overlay
await goto(page, '/');
await clickBtn(page, 'Search');
await page.waitForTimeout(1500);
await snap(page, '07-search');

// 8. AI Chat panel
await goto(page, '/');
await clickBtn(page, 'AI Chat');
await page.waitForTimeout(2000);
await snap(page, '08-chat');

// 9. Settings dialog
await goto(page, '/');
await clickBtn(page, 'Settings');
await page.waitForTimeout(2000);
await snap(page, '09-settings');

// 10. 404 page
await goto(page, '/nonexistent');
await snap(page, '10-404');

await page.close();

// ── Mobile 640px (wider to fit bottom buttons) ──
console.log('\n  Mobile…');
const mobileCtx = await browser.newContext({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 });
const mobile = await mobileCtx.newPage();
await goto(mobile, '/');
await snap(mobile, '11-mobile');

console.log('\nDone!');
await browser.close();
