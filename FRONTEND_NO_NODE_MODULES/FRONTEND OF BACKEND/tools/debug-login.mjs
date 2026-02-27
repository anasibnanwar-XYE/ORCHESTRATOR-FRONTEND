import { chromium } from 'playwright';

async function debugLoginPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('http://127.0.0.1:3002/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot to see what's there
  await page.screenshot({ path: '/home/realnigga/my-video/debug-login.png', fullPage: true });
  
  // Check for theme buttons
  const buttons = await page.$$('button');
  console.log('Found buttons:');
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    console.log(`Button ${i}: "${text}"`);
  }
  
  await browser.close();
}

debugLoginPage();