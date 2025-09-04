#!/usr/bin/env node

// Advanced continuous monitoring service for War Room
// Provides real-time monitoring with screenshots and performance tracking

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const { MonitoringService } = require('../src/services/monitoring-service');

// Configuration
const CONFIG = {
  siteUrl: 'https://war-room-oa9t.onrender.com',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  screenshotInterval: 30 * 60 * 1000, // 30 minutes for full screenshots
  performanceThreshold: 3000, // 3 seconds
  screenshotDir: path.join(__dirname, '../monitoring-screenshots'),
  metricsFile: path.join(__dirname, '../monitoring-metrics.json')
};

// Monitoring statistics
const stats = {
  startTime: new Date(),
  checksPerformed: 0,
  failures: 0,
  slowResponses: 0,
  screenshots: 0,
  lastCheck: null,
  metrics: []
};

// Initialize monitoring service
const monitor = new MonitoringService();

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(CONFIG.screenshotDir, { recursive: true });
  await fs.mkdir(path.dirname(CONFIG.metricsFile), { recursive: true });
}

// Take screenshot with Playwright
async function takeScreenshot(page, type = 'regular') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${type}-${timestamp}.png`;
  const filepath = path.join(CONFIG.screenshotDir, filename);
  
  try {
    await page.screenshot({
      path: filepath,
      fullPage: true
    });
    
    stats.screenshots++;
    console.log(`📸 Screenshot saved: ${filename}`);
    
    return filename;
  } catch (error) {
    console.error('Failed to take screenshot:', error.message);
    return null;
  }
}

// Perform visual comparison
async function compareScreenshots(before, after) {
  // This would integrate with a visual regression tool
  // For now, just log the comparison
  console.log(`🔍 Visual comparison: ${before} vs ${after}`);
  
  // Placeholder for visual regression
  return {
    different: false,
    confidence: 100,
    differences: []
  };
}

// Advanced monitoring check with Playwright
async function performAdvancedCheck() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await context.newPage();
    const startTime = Date.now();
    
    // Set up console error monitoring
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Set up request monitoring
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });
    
    // Navigate to site
    const response = await page.goto(CONFIG.siteUrl, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    const loadTime = Date.now() - startTime;
    
    // Collect metrics
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Check performance threshold
    const isSlowResponse = loadTime > CONFIG.performanceThreshold;
    if (isSlowResponse) {
      stats.slowResponses++;
      console.warn(`⚠️  Slow response: ${loadTime}ms`);
      
      // Take screenshot for slow responses
      await takeScreenshot(page, 'slow-response');
    }
    
    // Regular screenshot interval
    const timeSinceLastScreenshot = Date.now() - (stats.lastScreenshotTime || 0);
    if (timeSinceLastScreenshot > CONFIG.screenshotInterval) {
      await takeScreenshot(page, 'regular');
      stats.lastScreenshotTime = Date.now();
    }
    
    // Store metrics
    const checkResult = {
      timestamp: new Date().toISOString(),
      success: response.ok(),
      statusCode: response.status(),
      loadTime,
      metrics,
      consoleErrors: consoleErrors.length,
      failedRequests: failedRequests.length,
      isSlowResponse
    };
    
    stats.metrics.push(checkResult);
    
    // Keep only last 1000 metrics
    if (stats.metrics.length > 1000) {
      stats.metrics = stats.metrics.slice(-1000);
    }
    
    // Save metrics to file
    await saveMetrics();
    
    // Log results
    console.log(`✅ Check #${stats.checksPerformed + 1} completed`);
    console.log(`   Load time: ${loadTime}ms ${isSlowResponse ? '⚠️' : '✓'}`);
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Failed requests: ${failedRequests.length}`);
    
    stats.checksPerformed++;
    stats.lastCheck = new Date();
    
    return checkResult;
    
  } catch (error) {
    console.error('❌ Monitoring check failed:', error.message);
    stats.failures++;
    
    // Take error screenshot
    try {
      const page = context.pages()[0];
      if (page) {
        await takeScreenshot(page, 'error');
      }
    } catch (e) {
      // Ignore screenshot errors
    }
    
    return {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
    
  } finally {
    await browser.close();
  }
}

// Save metrics to file
async function saveMetrics() {
  try {
    await fs.writeFile(
      CONFIG.metricsFile,
      JSON.stringify({
        stats,
        recentMetrics: stats.metrics.slice(-100)
      }, null, 2)
    );
  } catch (error) {
    console.error('Failed to save metrics:', error.message);
  }
}

// Display monitoring dashboard
function displayDashboard() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║        War Room Continuous Monitoring             ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log(`\n📍 Site: ${CONFIG.siteUrl}`);
  console.log(`⏱️  Check interval: ${CONFIG.checkInterval / 60000} minutes`);
  console.log(`📸 Screenshot interval: ${CONFIG.screenshotInterval / 60000} minutes`);
  console.log(`⚡ Performance threshold: ${CONFIG.performanceThreshold}ms`);
  console.log('\n📊 Statistics:');
  console.log(`   Running since: ${stats.startTime.toLocaleString()}`);
  console.log(`   Checks performed: ${stats.checksPerformed}`);
  console.log(`   Failures: ${stats.failures}`);
  console.log(`   Slow responses: ${stats.slowResponses}`);
  console.log(`   Screenshots taken: ${stats.screenshots}`);
  
  if (stats.lastCheck) {
    console.log(`   Last check: ${stats.lastCheck.toLocaleString()}`);
  }
  
  // Recent metrics summary
  if (stats.metrics.length > 0) {
    const recent = stats.metrics.slice(-10);
    const avgLoadTime = recent.reduce((sum, m) => sum + (m.loadTime || 0), 0) / recent.length;
    const successRate = (recent.filter(m => m.success).length / recent.length) * 100;
    
    console.log('\n📈 Recent Performance:');
    console.log(`   Average load time: ${Math.round(avgLoadTime)}ms`);
    console.log(`   Success rate: ${successRate.toFixed(1)}%`);
  }
  
  console.log('\n🔄 Monitoring active... Press Ctrl+C to stop');
}

// Main monitoring loop
async function startMonitoring() {
  await ensureDirectories();
  
  console.log('🚀 Starting War Room continuous monitoring...\n');
  
  // Initial check
  await performAdvancedCheck();
  displayDashboard();
  
  // Set up monitoring interval
  const interval = setInterval(async () => {
    await performAdvancedCheck();
    displayDashboard();
  }, CONFIG.checkInterval);
  
  // Also use the basic monitoring service for redundancy
  monitor.startMonitoring();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Stopping monitoring...');
    clearInterval(interval);
    monitor.stopMonitoring();
    
    // Final summary
    console.log('\n📊 Final Summary:');
    console.log(`Total checks: ${stats.checksPerformed}`);
    console.log(`Total failures: ${stats.failures}`);
    console.log(`Uptime: ${((stats.checksPerformed - stats.failures) / stats.checksPerformed * 100).toFixed(2)}%`);
    console.log(`Screenshots saved: ${stats.screenshots}`);
    
    await saveMetrics();
    process.exit(0);
  });
}

// Start the monitoring service
startMonitoring().catch(error => {
  console.error('Failed to start monitoring:', error);
  process.exit(1);
});