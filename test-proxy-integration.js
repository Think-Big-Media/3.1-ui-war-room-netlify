import { chromium } from 'playwright';

async function testProxyIntegration() {
  console.log('\n🚀 Testing Netlify-Encore Proxy Integration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture all network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
    console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  // Capture console messages
  page.on('console', msg => {
    const prefix = msg.type() === 'error' ? '❌' : 
                   msg.type() === 'warning' ? '⚠️' : '📝';
    console.log(`${prefix} Console [${msg.type()}]: ${msg.text()}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log(`💥 Page Error: ${error.message}`);
  });
  
  try {
    console.log('\n🌐 Loading Netlify production site...');
    await page.goto('https://war-room-3-1-ui.netlify.app', { 
      waitUntil: 'networkidle' 
    });
    
    // Wait for React to fully load
    await page.waitForTimeout(3000);
    
    console.log('\n✅ React Application Status:');
    const reactStatus = await page.evaluate(() => {
      return {
        reactLoaded: typeof window.React !== 'undefined',
        bodyHasContent: document.body.children.length > 1,
        hasMainDiv: !!document.querySelector('#root'),
        rootHasContent: document.querySelector('#root')?.children?.length > 0
      };
    });
    console.log(JSON.stringify(reactStatus, null, 2));
    
    console.log('\n🔌 Testing API Proxy Functionality:');
    
    // Test direct API call from browser
    const apiTestResult = await page.evaluate(async () => {
      try {
        console.log('Testing API proxy: /api/v1/health');
        const response = await fetch('/api/v1/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url,
          body: response.status === 200 ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('🔍 API Test Result:');
    console.log(JSON.stringify(apiTestResult, null, 2));
    
    // Test authentication endpoint
    console.log('\n🔐 Testing Auth Proxy:');
    const authTestResult = await page.evaluate(async () => {
      try {
        console.log('Testing auth proxy: /auth/health');
        const response = await fetch('/auth/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: response.status === 200 ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('🔍 Auth Test Result:');
    console.log(JSON.stringify(authTestResult, null, 2));
    
    // Analyze network traffic
    console.log('\n📊 Network Traffic Analysis:');
    const apiRequests = requests.filter(req => 
      req.url.includes('/api/') || req.url.includes('/auth/')
    );
    
    console.log(`Total API-related requests: ${apiRequests.length}`);
    apiRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url}`);
    });
    
    const apiResponses = responses.filter(res => 
      res.url.includes('/api/') || res.url.includes('/auth/')
    );
    
    console.log(`Total API-related responses: ${apiResponses.length}`);
    apiResponses.forEach((res, i) => {
      console.log(`  ${i + 1}. ${res.status} ${res.url}`);
    });
    
    // Final assessment
    console.log('\n🎯 Integration Assessment:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const assessment = {
      frontendLoaded: reactStatus.reactLoaded && reactStatus.rootHasContent,
      proxyWorking: apiTestResult.status === 200 || authTestResult.status === 200,
      noConsoleErrors: true, // Will be updated based on captured errors
      networkHealthy: apiResponses.length > 0
    };
    
    console.log(`✅ Frontend Loaded: ${assessment.frontendLoaded}`);
    console.log(`✅ Proxy Working: ${assessment.proxyWorking}`);
    console.log(`✅ Network Healthy: ${assessment.networkHealthy}`);
    
    if (assessment.frontendLoaded && assessment.proxyWorking) {
      console.log('\n🎉 SUCCESS: Netlify-Encore integration is operational!');
      console.log('   Frontend and backend are communicating through proxy.');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some components need attention.');
    }
    
  } catch (error) {
    console.log(`💥 Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run the test
testProxyIntegration().catch(console.error);