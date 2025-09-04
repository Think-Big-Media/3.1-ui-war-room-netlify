const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

const SITE_URL = 'https://war-room-oa9t.onrender.com';
const MONITORING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PERFORMANCE_THRESHOLD = 3000; // 3 seconds
const SCREENSHOTS_DIR = path.join(__dirname, '../../monitoring-screenshots');

// Ensure screenshots directory exists
test.beforeAll(async () => {
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
});

test.describe('Enhanced Continuous Monitoring', () => {
  test('Monitor site performance and capture screenshots', async ({ page }) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Set up performance monitoring
    const performanceMetrics = [];
    
    // Navigate and measure initial load
    const startTime = Date.now();
    const response = await page.goto(SITE_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    const loadTime = Date.now() - startTime;
    
    // Check response time threshold
    if (loadTime > PERFORMANCE_THRESHOLD) {
      console.error(`⚠️  ALERT: Page load time (${loadTime}ms) exceeds ${PERFORMANCE_THRESHOLD}ms threshold`);
    }
    
    // Capture initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `initial-${timestamp}.png`),
      fullPage: true
    });
    
    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize
      };
    });
    
    console.log('Performance Metrics:', {
      ...metrics,
      responseTime: `${loadTime}ms`,
      threshold: `${PERFORMANCE_THRESHOLD}ms`,
      status: loadTime <= PERFORMANCE_THRESHOLD ? '✅ PASS' : '❌ FAIL'
    });
    
    // Monitor console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Check core UI functionality
    const coreElements = [
      { selector: '#root, #app, .app-container', name: 'App Container' },
      { selector: 'nav, .navigation, .navbar', name: 'Navigation' },
      { selector: 'main, .main-content', name: 'Main Content' }
    ];
    
    for (const element of coreElements) {
      try {
        const el = page.locator(element.selector).first();
        await expect(el).toBeVisible({ timeout: 5000 });
        console.log(`✅ ${element.name} is visible`);
      } catch (error) {
        console.error(`❌ ${element.name} not found or not visible`);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `error-${element.name.replace(/\s+/g, '-')}-${timestamp}.png`),
          fullPage: true
        });
      }
    }
    
    // Resource timing analysis
    const resourceTimings = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.duration > 1000) // Resources taking > 1s
        .map(entry => ({
          name: entry.name,
          duration: Math.round(entry.duration),
          size: entry.transferSize
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10); // Top 10 slowest resources
    });
    
    if (resourceTimings.length > 0) {
      console.log('\n⚠️  Slow Resources (>1s):');
      resourceTimings.forEach(resource => {
        console.log(`  - ${resource.name.split('/').pop()}: ${resource.duration}ms`);
      });
    }
    
    // Save monitoring results
    const results = {
      timestamp: new Date().toISOString(),
      url: SITE_URL,
      loadTime,
      performanceThresholdMet: loadTime <= PERFORMANCE_THRESHOLD,
      metrics,
      errors,
      slowResources: resourceTimings,
      screenshot: `initial-${timestamp}.png`
    };
    
    await fs.writeFile(
      path.join(SCREENSHOTS_DIR, `monitoring-results-${timestamp}.json`),
      JSON.stringify(results, null, 2)
    );
    
    // Alert summary
    if (errors.length > 0 || loadTime > PERFORMANCE_THRESHOLD) {
      console.log('\n🚨 MONITORING ALERT:');
      if (loadTime > PERFORMANCE_THRESHOLD) {
        console.log(`  - Performance degradation: ${loadTime}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)`);
      }
      if (errors.length > 0) {
        console.log(`  - Console errors detected: ${errors.length}`);
      }
    } else {
      console.log('\n✅ All monitoring checks passed');
    }
  });
  
  test('Continuous monitoring loop', async ({ browser }) => {
    // This test runs continuously until stopped
    console.log(`Starting continuous monitoring every ${MONITORING_INTERVAL / 60000} minutes...`);
    console.log('Press Ctrl+C to stop\n');
    
    const runMonitoring = async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const startTime = Date.now();
        
        // Navigate to site
        await page.goto(SITE_URL, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        const loadTime = Date.now() - startTime;
        
        // Take screenshot
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, `monitor-${timestamp}.png`),
          fullPage: true
        });
        
        // Log results
        console.log(`[${new Date().toLocaleTimeString()}] Monitoring check:`);
        console.log(`  Load time: ${loadTime}ms ${loadTime <= PERFORMANCE_THRESHOLD ? '✅' : '❌'}`);
        console.log(`  Screenshot: monitor-${timestamp}.png`);
        
        // Check for visual regression by comparing screenshots
        // This would integrate with your visual regression testing tool
        
      } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Monitoring failed:`, error.message);
        
        // Take error screenshot
        try {
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, `error-${new Date().toISOString().replace(/[:.]/g, '-')}.png`),
            fullPage: true
          });
        } catch (e) {
          // Ignore screenshot errors
        }
      } finally {
        await context.close();
      }
    };
    
    // Run initial check
    await runMonitoring();
    
    // Set up interval
    const interval = setInterval(runMonitoring, MONITORING_INTERVAL);
    
    // Keep test running
    await new Promise((resolve) => {
      process.on('SIGINT', () => {
        clearInterval(interval);
        resolve();
      });
    });
  });
});

test.describe('API Integration Monitoring', () => {
  test('Monitor API integration changes', async ({ page, request }) => {
    // This will monitor the API endpoints as you integrate Meta API
    
    const apiEndpoints = [
      '/api/meta/campaigns',
      '/api/meta/insights',
      '/api/meta/auth/status'
    ];
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Take screenshot before API integration
    await page.goto(SITE_URL);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `pre-api-integration-${timestamp}.png`),
      fullPage: true
    });
    
    // Check each API endpoint
    for (const endpoint of apiEndpoints) {
      try {
        const response = await request.get(`${SITE_URL}${endpoint}`, {
          timeout: 10000
        });
        
        console.log(`API ${endpoint}: ${response.status()} ${response.ok() ? '✅' : '❌'}`);
        
        // Log response time from headers if available
        const responseTime = response.headers()['x-response-time'];
        if (responseTime) {
          console.log(`  Response time: ${responseTime}`);
        }
      } catch (error) {
        console.log(`API ${endpoint}: Failed ❌ - ${error.message}`);
      }
    }
    
    // Visual regression test placeholder
    console.log('\n📸 Screenshot saved for visual regression testing');
    console.log(`Compare with previous screenshots to detect UI changes`);
  });
});