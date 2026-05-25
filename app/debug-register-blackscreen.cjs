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

  // Open page
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open login modal and switch to register
  await page.click('text=Log In');
  await page.waitForTimeout(800);
  await page.click('text=Sign Up');
  await page.waitForTimeout(800);

  // Fill form
  await page.fill('input[type="text"]', 'Test User');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[placeholder*="password"][type="password"]', 'Test1234');
  const inputs = await page.$$('input[type="password"]');
  if (inputs.length >= 2) await inputs[1].fill('Test1234');

  // Send code
  await page.click('text=Send Code');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'd:/video_gen/screenshot-reg-1-code-sent.png' });

  // Get the actual code from database
  const codeFromDb = await fetch('http://localhost:3001/api/auth/me').catch(() => null);
  console.log('Need to get code from DB or email...');

  // For testing, we'll use a wrong code first to see error handling
  await page.fill('input[pattern="[0-9]*"]', '000000');
  await page.click('text=Sign Up');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'd:/video_gen/screenshot-reg-2-wrong-code.png' });

  console.log('\n=== Errors captured ===');
  errors.forEach(e => console.log(e));
  if (errors.length === 0) console.log('No JS errors');

  await browser.close();
})();
