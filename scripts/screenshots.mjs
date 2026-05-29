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

// 1. Main grid — full stations listing
await goto(page, '/');
await snap(page, '01-main-grid');

// 2. Genre selection modal
await clickBtn(page, 'Genres');
await page.waitForTimeout(2000);
await snap(page, '02-genre-modal');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// 3. Country selection modal
await clickBtn(page, 'Country');
await page.waitForTimeout(2000);
await snap(page, '03-country-modal');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// 4. USA stations — capture everything quickly before audio fails
await goto(page, '/country/United%20States', 4000);
const playBtn = page.locator('button').filter({ hasText: /^Play$/ });
if (await playBtn.count() > 0) {
  await playBtn.first().click();
  await page.waitForTimeout(2000);
  // Snapshot bottom bar clip
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
  // Full page + upper player captures (NOW — before audio fails)
  await snap(page, '04-usa-player');
  await snap(page, '05-player-upper');
} else {
  // If play btn not found, still capture page
  await snap(page, '04-usa-player');
  await snap(page, '05-player-upper');
}

// 7. Search overlay
await goto(page, '/');
await clickBtn(page, 'Search');
await page.waitForTimeout(1500);
await snap(page, '07-search');

// 8. AI Chat panel — fresh page to clear search overlay
await goto(page, '/');
await clickBtn(page, 'AI Chat');
await page.waitForTimeout(2000);
await snap(page, '08-chat');

// 9. Settings dialog — fresh page to avoid modal backdrop
await goto(page, '/');
await clickBtn(page, 'Settings');
await page.waitForTimeout(2000);
await snap(page, '09-settings');

// 10. 404 page (goto = fresh navigation, clears all modals)
await goto(page, '/nonexistent');
await snap(page, '10-404');

await page.close();

// ── Mobile (wider: 480px) ──
console.log('\n  Mobile…');
const mobileCtx = await browser.newContext({ viewport: { width: 540, height: 812 }, deviceScaleFactor: 2 });
const mobile = await mobileCtx.newPage();
await goto(mobile, '/');
await snap(mobile, '11-mobile');

console.log('\nDone!');
await browser.close();
