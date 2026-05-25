const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const errors = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(`[ERROR] ${text}`);
      console.log(`[ERROR] ${text}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[PAGE ERROR] ${err.message}`);
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open login modal and switch to register
  await page.click('text=Log In');
  await page.waitForTimeout(800);
  await page.click('text=Sign Up');
  await page.waitForTimeout(800);

  // Fill form with fresh data
  await page.fill('input[type="text"]', 'Test User');
  await page.fill('input[type="email"]', 'test2@example.com');
  await page.fill('input[placeholder*="password"][type="password"]', 'Test1234');
  const inputs = await page.$$('input[type="password"]');
  if (inputs.length >= 2) await inputs[1].fill('Test1234');
  await page.fill('input[pattern="[0-9]*"]', '598124');
  await page.waitForTimeout(500);

  // Screenshot before clicking register
  await page.screenshot({ path: 'd:/video_gen/screenshot-reg-before-submit.png' });

  // Click register
  console.log('Clicking Sign Up button...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: 'd:/video_gen/screenshot-reg-after-submit.png' });

  const url = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log(`URL: ${url}`);
  console.log(`Body: ${bodyText}`);

  console.log('\n=== Errors ===');
  errors.forEach(e => console.log(e));
  if (errors.length === 0) console.log('No JS errors');

  await browser.close();
})();
