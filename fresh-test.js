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
    console.log('Testing fresh server at http://localhost:5173/');
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Look for our red test component
    const redBox = await page.$('[style*="backgroundColor: red"]') !== null;
    console.log('Red test component found:', redBox);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/fresh-test.png',
      fullPage: true
    });
    
    console.log('Fresh test screenshot saved to /tmp/fresh-test.png');
    
  } catch (error) {
    console.error('Error in fresh test:', error);
  }
  
  await context.close();
  await browser.close();
})();