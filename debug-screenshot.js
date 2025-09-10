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
    console.log('Navigating to http://localhost:5176/ with cache cleared');
    
    // Clear cache and force refresh
    await page.goto('http://localhost:5176/', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait longer for React to render
    await page.waitForTimeout(5000);
    
    // Look for the specific tabs
    const tabs = await page.$$eval('[class*="font-jetbrains"]', elements => 
      elements.map(el => el.textContent?.trim()).filter(text => 
        text === 'FEC' || text === 'SENTIMENT' || text === 'FINANCE' || text === 'ELECTIONS'
      )
    );
    
    console.log('Found tabs:', tabs);
    
    // Check for political map container
    const politicalMapExists = await page.$('.political-map') !== null;
    console.log('Political map container exists:', politicalMapExists);
    
    // Take screenshot
    await page.screenshot({ 
      path: '/tmp/debug-screenshot.png',
      fullPage: true
    });
    
    console.log('Debug screenshot saved to /tmp/debug-screenshot.png');
    console.log('Tabs found:', tabs.length, tabs);
    
  } catch (error) {
    console.error('Error in debug screenshot:', error);
  }
  
  await context.close();
  await browser.close();
})();