import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Try to find and click buttons by text content
    console.log('Looking for FEC tab...');
    const fecElement = await page.locator('text=FEC').first();
    if (await fecElement.isVisible()) {
      console.log('FEC tab found and visible, clicking...');
      await fecElement.click();
      await page.waitForTimeout(1000);
    }
    
    const sentimentElement = await page.locator('text=SENTIMENT').first(); 
    if (await sentimentElement.isVisible()) {
      console.log('SENTIMENT tab found and visible, clicking...');
      await sentimentElement.click();
      await page.waitForTimeout(1000);
    }
    
    console.log('\nConsole logs captured:');
    logs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('Error testing tabs:', error);
  }
  
  await context.close();
  await browser.close();
})();