import { chromium } from 'playwright';

const BASE = 'http://localhost:8080';
const DIR = 'screenshots';

function generateMockStations(count = 100, page = 0) {
  const genres = ['Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 'Electronic', 'Blues', 'Country', 'Reggae', 'Metal'];
  const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Russia', 'Japan', 'Brazil', 'Canada', 'Australia', 'Italy'];
  const names = ['Sunrise FM', 'Midnight Blues', 'Crystal Clear', 'Thunder Rock', 'Ocean Waves', 'Urban Beats', 'Golden Oldies', 'Neon Nights', 'Pure Jazz', 'Electric Dreams', 'Velvet Voice', 'Storm Metal', 'Tropical Heat', 'Arctic Chill', 'Desert Wind', 'Pulse Radio', 'Echo Station', 'Nova Wave', 'Zen Radio', 'Fusion FM'];
  const tags = ['rock', 'pop', 'jazz', 'classical', 'hip-hop', 'electronic', 'blues', 'country', 'reggae', 'metal', 'indie', 'alternative', 'dance', 'soul', 'funk'];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-station-${page * count + i}`,
    name: `${names[i % names.length]}${page > 0 ? ` ${page}` : ''}`,
    url: `https://example.com/stream/${i}`,
    url_resolved: `https://example.com/stream/${i}`,
    homepage: `https://example.com`,
    favicon: '',
    tags: [genres[i % genres.length], tags[i % tags.length], tags[(i + 3) % tags.length]].join(','),
    country: countries[i % countries.length],
    language: 'english',
    codec: 'MP3',
    bitrate: [128, 192, 256, 320][i % 4],
    votes: Math.floor(Math.random() * 1000),
    clickcount: Math.floor(Math.random() * 10000),
    clicktrend: Math.floor(Math.random() * 100),
    geo_lat: null,
    geo_long: null,
    state: '',
    lastcheckok: 1,
    lastchecktime: new Date().toISOString(),
    clicktimestamp: new Date().toISOString(),
    lastchangetime: new Date().toISOString(),
  }));
}

async function interceptApi(page) {
  await page.route('**/api.radio-browser.info/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/countries')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          ['United States', 'United Kingdom', 'Germany', 'France', 'Russia', 'Japan', 'Brazil', 'Canada', 'Australia', 'Italy']
            .map((c, i) => ({ name: c, stationcount: 1000 - i * 50 }))
        ),
      });
    } else if (url.includes('/tags')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          ['rock', 'pop', 'jazz', 'classical', 'hip-hop', 'electronic', 'blues', 'country', 'reggae', 'metal']
            .map((t, i) => ({ name: t, stationcount: 500 - i * 30 }))
        ),
      });
    } else {
      // stations or anything else
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generateMockStations(100, 0)),
      });
    }
  });
}

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

console.log('Taking screenshots (with mock API data)…\n');

// ── Desktop 1440p ──
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await interceptApi(page);

// 1. Main grid
await goto(page, '/', 5000);
await snap(page, '01-main-grid');

// 2. Genre modal
await clickBtn(page, 'Genres', 2000);
await snap(page, '02-genre-modal');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// 3. Country modal
await clickBtn(page, 'Country', 2000);
await snap(page, '03-country-modal');
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// 4. Click Play to show player
await page.evaluate(() => {
  const btns = document.querySelectorAll('button');
  for (const btn of btns) {
    if (btn.textContent?.trim() === 'Play') {
      btn.click();
      break;
    }
  }
});
await page.waitForTimeout(4000);
await snap(page, '04-player-upper');

// 5. Bottom bar
await page.waitForTimeout(1000);
const br = await page.evaluate(() => {
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
if (br) await snapClip(page, '06-player-bottom', br);

// 6. Search overlay
await goto(page, '/', 2000);
await interceptApi(page);  // re-apply mock
await clickBtn(page, 'Search', 1500);
await snap(page, '07-search');

// 7. AI Chat
await goto(page, '/', 2000);
await interceptApi(page);
await clickBtn(page, 'AI Chat', 2000);
await snap(page, '08-chat');

// 8. Settings
await goto(page, '/', 2000);
await interceptApi(page);
await clickBtn(page, 'Settings', 2000);
await snap(page, '09-settings');

// 9. 404
await goto(page, '/nonexistent');
await snap(page, '10-404');

await page.close();

// ── Mobile 768px ──
console.log('\n  Mobile…');
const mobileCtx = await browser.newContext({ viewport: { width: 767, height: 1024 }, deviceScaleFactor: 2 });
const mobile = await mobileCtx.newPage();
await interceptApi(mobile);
await goto(mobile, '/', 5000);
await snap(mobile, '11-mobile');
await mobile.close();

console.log('\nDone!');
await browser.close();
