const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  page.on('console', msg => console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open login modal
  await page.click('text=Log In');
  await page.waitForTimeout(800);

  // Switch to register mode
  await page.click('text=Sign Up');
  await page.waitForTimeout(800);

  // Fill registration form
  await page.fill('input[type="text"]', 'Test User');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[placeholder*="password"][type="password"]', 'Test1234');
  
  const inputs = await page.$$('input[type="password"]');
  if (inputs.length >= 2) await inputs[1].fill('Test1234');

  // Click send code
  await page.click('text=Send Code');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'd:/video_gen/screenshot-register-flow.png' });
  
  // Extract visible text from page
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== Page body text (relevant) ===');
  const lines = bodyText.split('\n').filter(l => l.trim() && !l.includes('Welcome Aboard') && !l.includes('One Line') && !l.includes('SceneGenie'));
  lines.slice(0, 30).forEach(l => console.log(l.trim()));

  await browser.close();
})();
