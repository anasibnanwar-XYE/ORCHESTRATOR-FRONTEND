import fs from 'node:fs/promises';
import { chromium } from 'playwright';

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

async function main() {
  const outDir = '/home/realnigga/my-video/public/captures/_debug';
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript((payload) => {
    localStorage.setItem('bbp-orchestrator-session', JSON.stringify(payload));
  }, seedOfflineSession);

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3002/portals', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);

  // App may briefly redirect to /login before session restore completes.
  await page.waitForTimeout(3500);

  console.log('URL:', page.url());

  const buttons = await page.$$eval('button', (els) =>
    els
      .map((b) => (b.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 40)
  );
  console.log('Buttons:', buttons);

  await page.screenshot({ path: `${outDir}/portals.png`, fullPage: true });
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
