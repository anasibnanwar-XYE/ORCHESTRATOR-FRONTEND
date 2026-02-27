import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const OUT_DIR = '/home/realnigga/my-video/public/captures';

const VIEWPORT = { width: 1920, height: 1080 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gotoWithRetry(page, url, attempts = 24) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => undefined);
      return;
    } catch (err) {
      lastErr = err;
      await sleep(300 + i * 80);
    }
  }
  throw lastErr;
}

const seedOfflineSession = {
  session: {
    tokenType: 'Bearer',
    accessToken: 'offline-access-token',
    refreshToken: 'offline-refresh-token',
    expiresIn: 3600,
    companyCode: 'BBP',
    displayName: 'Control Room Admin',
  },
  email: 'demo@bigbrightpaints.com',
};

async function recordClip(name, run) {
  const tmpDir = path.join(OUT_DIR, `_tmp_${name}_${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: tmpDir,
      size: VIEWPORT,
    },
  });

  const page = await context.newPage();
  const video = page.video();
  if (!video) {
    throw new Error('Playwright video was not initialized.');
  }

  await run(page);

  // Give the UI a moment to settle before closing.
  await sleep(400);
  await context.close();
  await browser.close();

  const videoPath = await video.path();
  const target = path.join(OUT_DIR, `${name}.webm`);
  await fs.copyFile(videoPath, target);
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.chmod(target, 0o664);

  console.log(`Wrote ${target}`);
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Clip 1: Authentic login interaction.
  await recordClip('01-login', async (page) => {
    await gotoWithRetry(page, 'http://127.0.0.1:3002/login');

    await page.locator('#email').click();
    await page.locator('#email').type('demo@bigbrightpaints.com', { delay: 45 });
    await sleep(120);

    await page.locator('#password').click();
    await page.locator('#password').type('••••••••', { delay: 70 });
    await sleep(120);

    await page.locator('#companyCode').click();
    await page.locator('#companyCode').type('BBP', { delay: 85 });
    await sleep(220);

    await page.getByRole('button', { name: 'Sign In' }).click();
    await sleep(3200);
  });

  // Clip 2: Portal selection + Sales navigation.
  await sleep(900);
  await recordClip('02-sales', async (page) => {
    await page.addInitScript((payload) => {
      localStorage.setItem('bbp-orchestrator-session', JSON.stringify(payload));
    }, seedOfflineSession);

    await gotoWithRetry(page, 'http://127.0.0.1:3002/portals');
    await page.waitForURL(/\/portals/, { timeout: 10_000 }).catch(() => undefined);
    await sleep(700);

    await page.getByRole('button', { name: /Sales/i }).click();
    await sleep(1200);

    await page.getByRole('link', { name: 'Orders' }).click();
    await sleep(1400);

    await page.mouse.wheel(0, 650);
    await sleep(900);
  });

  // Clip 3: Portal selection + Manufacturing navigation.
  await sleep(900);
  await recordClip('03-factory', async (page) => {
    await page.addInitScript((payload) => {
      localStorage.setItem('bbp-orchestrator-session', JSON.stringify(payload));
    }, seedOfflineSession);

    await gotoWithRetry(page, 'http://127.0.0.1:3002/portals');
    await page.waitForURL(/\/portals/, { timeout: 10_000 }).catch(() => undefined);
    await sleep(700);

    await page.getByRole('button', { name: /Manufacturing/i }).click();
    await sleep(1400);

    await page.getByRole('link', { name: 'Inventory', exact: true }).first().click();
    await sleep(1200);

    await page.mouse.wheel(0, 550);
    await sleep(900);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
