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
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Search for tab text content specifically
    const fecButtons = await page.$$eval('button', buttons => 
      buttons.filter(btn => btn.textContent?.trim() === 'FEC').map(btn => ({
        text: btn.textContent.trim(),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
        class: btn.className,
        style: btn.getAttribute('style')
      }))
    );
    
    const sentimentButtons = await page.$$eval('button', buttons => 
      buttons.filter(btn => btn.textContent?.trim() === 'SENTIMENT').map(btn => ({
        text: btn.textContent.trim(),
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
        class: btn.className,
        style: btn.getAttribute('style')
      }))
    );
    
    console.log('FEC buttons found:', fecButtons.length, fecButtons);
    console.log('SENTIMENT buttons found:', sentimentButtons.length, sentimentButtons);
    
    // Check for any text containing these words
    const allText = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).map(el => el.textContent).join(' ');
    });
    
    const hasFEC = allText.includes('FEC');
    const hasSentiment = allText.includes('SENTIMENT');
    const hasFinance = allText.includes('FINANCE');
    const hasElections = allText.includes('ELECTIONS');
    
    console.log('Text search results:');
    console.log('- Contains FEC:', hasFEC);
    console.log('- Contains SENTIMENT:', hasSentiment);
    console.log('- Contains FINANCE:', hasFinance);
    console.log('- Contains ELECTIONS:', hasElections);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  await context.close();
  await browser.close();
})();