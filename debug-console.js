import { chromium } from 'playwright';

async function checkConsole() {
  console.log('🔍 Starting browser console check...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console messages
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type().toUpperCase()}] ${text}`);
    console.log(`📝 Console [${msg.type()}]: ${text}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Navigate to the site
  console.log('🌐 Navigating to https://war-room-3-1-ui.netlify.app (PRODUCTION)...');
  
  try {
    await page.goto('https://war-room-3-1-ui.netlify.app', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏱️  Waiting 5 seconds for any delayed logs...');
    await page.waitForTimeout(5000);
    
    // Check if React root exists
    const rootExists = await page.$('#root');
    const rootContent = await page.$eval('#root', el => el.innerHTML).catch(() => '');
    
    console.log('\n📊 FINAL REPORT:');
    console.log('================');
    console.log(`🎯 Root element exists: ${rootExists ? 'YES' : 'NO'}`);
    console.log(`📝 Root content length: ${rootContent.length} characters`);
    console.log(`🔢 Console messages: ${consoleMessages.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (consoleMessages.length > 0) {
      console.log('\n📋 ALL CONSOLE MESSAGES:');
      consoleMessages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n🚨 ALL ERRORS:');
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.log(`💥 Navigation failed: ${error.message}`);
  }
  
  await browser.close();
}

checkConsole().catch(console.error);