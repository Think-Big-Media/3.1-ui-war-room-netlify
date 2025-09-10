import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to http://localhost:5176/');
    await page.goto('http://localhost:5176/', { waitUntil: 'networkidle' });
    
    // Wait a bit for everything to load
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/current-implementation.png',
      fullPage: true
    });
    
    console.log('Screenshot saved to /tmp/current-implementation.png');
    
  } catch (error) {
    console.error('Error taking screenshot:', error);
  }
  
  await context.close();
  await browser.close();
})();