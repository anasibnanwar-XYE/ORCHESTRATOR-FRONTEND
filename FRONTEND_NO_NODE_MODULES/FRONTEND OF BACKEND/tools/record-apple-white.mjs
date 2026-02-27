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

  // Apple-style clean login capture in white mode
  await recordClip('apple-login-white', async (page) => {
    // Force light mode through localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('bbp-orchestrator-theme', 'light');
    });
    
    await gotoWithRetry(page, 'http://127.0.0.1:3002/login');
    
    // Wait for page to fully load in light mode
    await page.waitForLoadState('networkidle');
    await sleep(1500);
    
    // Verify we're in light mode by checking body class
    const isLightMode = await page.evaluate(() => {
      return document.body.classList.contains('light');
    });
    console.log('Light mode active:', isLightMode);
    
    // Clean, minimal interaction with proper timing
    await page.locator('#email').click();
    await sleep(200);
    await page.locator('#email').type('admin@bigbrightpaints.com', { delay: 60 });
    await sleep(300);
    
    await page.locator('#password').click();
    await sleep(200);
    await page.locator('#password').type('••••••••', { delay: 80 });
    await sleep(300);
    
    await page.locator('#companyCode').click();
    await sleep(200);
    await page.locator('#companyCode').type('BBP', { delay: 100 });
    await sleep(500);
    
    // Smooth click with hover effect
    await page.getByRole('button', { name: 'Sign In' }).hover();
    await sleep(200);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await sleep(2500);
  });

  // Clean portal selection in white mode
  await sleep(500);
  await recordClip('apple-portals-white', async (page) => {
    const seedOfflineSession = {
      session: {
        tokenType: 'Bearer',
        accessToken: 'offline-access-token',
        refreshToken: 'offline-refresh-token',
        expiresIn: 3600,
        companyCode: 'BBP',
        displayName: 'Control Room Admin',
      },
      email: 'admin@bigbrightpaints.com',
    };
    
    await page.addInitScript((payload) => {
      localStorage.setItem('bbp-orchestrator-session', JSON.stringify(payload));
    }, seedOfflineSession);

    await gotoWithRetry(page, 'http://127.0.0.1:3002/portals');
    
    // Ensure light mode
    try {
      await page.getByRole('button', { name: /Light Mode/i }).click();
    } catch {}
    await sleep(800);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});