import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const errors = [];
  const logs = [];
  
  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  try {
    console.log('Loading page and capturing console logs...');
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    console.log('\n=== CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));
    
    console.log('\n=== ERRORS FOUND ===');
    errors.forEach(error => console.log('❌', error));
    
    if (errors.length === 0) {
      console.log('✅ No errors found in console');
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
  
  await context.close();
  await browser.close();
})();