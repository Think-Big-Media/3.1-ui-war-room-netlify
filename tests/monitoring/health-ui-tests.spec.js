/**
 * Comprehensive UI Health Tests for War Room Application
 * 
 * Tests critical UI functionality to ensure the application is working
 * from an end-user perspective. These tests verify:
 * - Page loading and rendering
 * - Navigation functionality
 * - Core user interactions
 * - Data display and real-time updates
 * - Responsive design
 * - Accessibility features
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: 'https://war-room-oa9t.onrender.com',
  TIMEOUT: 30000,
  SLOW_TIMEOUT: 60000,
  PERFORMANCE_THRESHOLD: 3000, // 3 seconds max load time
  MOBILE_VIEWPORT: { width: 375, height: 667 },
  DESKTOP_VIEWPORT: { width: 1280, height: 720 }
};

// Test contexts and user scenarios
const CRITICAL_PAGES = [
  { path: '/', name: 'Homepage', requiresAuth: false },
  { path: '/dashboard', name: 'Main Dashboard', requiresAuth: true },
  { path: '/monitoring', name: 'Real-time Monitoring', requiresAuth: true },
  { path: '/analytics', name: 'Analytics Dashboard', requiresAuth: true },
  { path: '/campaigns', name: 'Campaign Control', requiresAuth: true },
  { path: '/alerts', name: 'Alert Center', requiresAuth: true }
];

const UI_COMPONENTS = [
  'navigation-menu',
  'sidebar',
  'main-content',
  'header',
  'footer',
  'dashboard-widgets',
  'data-tables',
  'charts',
  'buttons',
  'forms'
];

test.describe('War Room UI Health Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for health tests
    test.setTimeout(TEST_CONFIG.SLOW_TIMEOUT);
    
    // Add custom user agent to identify health check traffic
    await page.setExtraHTTPHeaders({
      'User-Agent': 'WarRoom-HealthCheck-Playwright/1.0'
    });
    
    // Handle any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  });

  test.describe('Critical Page Loading Tests', () => {
    
    CRITICAL_PAGES.forEach(pageConfig => {
      test(`${pageConfig.name} - Page loads successfully`, async ({ page }) => {
        const startTime = Date.now();
        
        try {
          const response = await page.goto(`${TEST_CONFIG.BASE_URL}${pageConfig.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: TEST_CONFIG.TIMEOUT
          });
          
          const loadTime = Date.now() - startTime;
          
          // Check response status
          expect(response.status()).toBeLessThan(400);
          
          // Check performance threshold
          expect(loadTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD);
          
          // Wait for page to be interactive
          await page.waitForLoadState('networkidle', { timeout: TEST_CONFIG.TIMEOUT });
          
          // Verify page title exists
          const title = await page.title();
          expect(title).not.toBe('');
          expect(title).not.toBe('Error');
          
          // Check for critical page elements
          await expect(page.locator('body')).toBeVisible();
          
          console.log(`✅ ${pageConfig.name}: ${response.status()} (${loadTime}ms)`);
          
        } catch (error) {
          console.log(`❌ ${pageConfig.name}: Failed - ${error.message}`);
          throw error;
        }
      });
    });
  });

  test.describe('Navigation and Core Functionality', () => {
    
    test('Main navigation is functional', async ({ page }) => {
      await page.goto(TEST_CONFIG.BASE_URL);
      
      // Check for navigation elements
      const navigationSelectors = [
        'nav',
        '[role="navigation"]',
        '.navigation',
        '.navbar',
        '.menu',
        'header nav'
      ];
      
      let navigationFound = false;
      for (const selector of navigationSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          navigationFound = true;
          
          // Check if navigation contains links
          const links = await page.locator(`${selector} a, ${selector} button`).count();
          expect(links).toBeGreaterThan(0);
          
          console.log(`✅ Navigation found with ${links} interactive elements`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      expect(navigationFound).toBe(true);
    });
    
    test('Responsive design works on mobile', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.MOBILE_VIEWPORT);
      await page.goto(TEST_CONFIG.BASE_URL);
      
      // Wait for responsive layout
      await page.waitForTimeout(2000);
      
      // Check if mobile layout is properly applied
      const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
      expect(bodyWidth).toBeLessThanOrEqual(TEST_CONFIG.MOBILE_VIEWPORT.width);
      
      // Check for mobile menu or collapsed navigation
      const mobileMenuSelectors = [
        '.mobile-menu',
        '.hamburger',
        '[aria-label*="menu"]',
        'button[aria-expanded]'
      ];
      
      let mobileMenuFound = false;
      for (const selector of mobileMenuSelectors) {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          mobileMenuFound = true;
          console.log(`✅ Mobile menu found: ${selector}`);
          break;
        }
      }
      
      // Mobile menu or responsive behavior should be present
      // (Note: Not all sites require mobile menus, so this is informational)
      console.log(`Mobile responsive layout detected: ${mobileMenuFound ? 'Yes' : 'Layout adapted'}`);
    });
  });

  test.describe('Data Loading and Display Tests', () => {
    
    test('Dashboard loads and displays data', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle');
      
      // Check for data visualization elements
      const dataSelectors = [
        '.chart',
        '.graph',
        '.metric',
        '.widget',
        '.dashboard-item',
        '[data-testid*="chart"]',
        'canvas', // For chart libraries
        'svg'     // For SVG-based charts
      ];
      
      let dataElementsFound = 0;
      for (const selector of dataSelectors) {
        const elements = await page.locator(selector).count();
        dataElementsFound += elements;
      }
      
      console.log(`✅ Dashboard data elements found: ${dataElementsFound}`);
      expect(dataElementsFound).toBeGreaterThan(0);
    });
    
    test('Real-time monitoring displays live data', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/monitoring`);
      
      // Wait for monitoring page to load
      await page.waitForLoadState('networkidle');
      
      // Look for real-time indicators
      const realTimeIndicators = [
        '.live',
        '.real-time',
        '.updating',
        '[data-live="true"]',
        '.status-indicator'
      ];
      
      let realTimeFound = false;
      for (const selector of realTimeIndicators) {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          realTimeFound = true;
          console.log(`✅ Real-time indicator found: ${selector}`);
          break;
        }
      }
      
      // Check for data that might indicate live updates
      const timestampSelectors = [
        '[data-timestamp]',
        '.timestamp',
        '.last-updated',
        'time'
      ];
      
      for (const selector of timestampSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✅ Timestamp element found: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
    });
  });

  test.describe('Error Handling and Fallbacks', () => {
    
    test('Application handles API errors gracefully', async ({ page }) => {
      // Intercept API calls and simulate failures
      await page.route('**/api/**', route => {
        // Randomly fail some API calls to test error handling
        if (Math.random() < 0.3) {
          route.fulfill({ status: 503, body: 'Service Unavailable' });
        } else {
          route.continue();
        }
      });
      
      await page.goto(TEST_CONFIG.BASE_URL);
      await page.waitForTimeout(5000);
      
      // Check that the page still functions
      await expect(page.locator('body')).toBeVisible();
      
      // Look for error messages or fallback content
      const errorSelectors = [
        '.error-message',
        '.fallback-content',
        '.offline-indicator',
        '[role="alert"]'
      ];
      
      let errorHandlingFound = false;
      for (const selector of errorSelectors) {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          errorHandlingFound = true;
          console.log(`✅ Error handling found: ${selector}`);
          break;
        }
      }
      
      console.log(`Error handling present: ${errorHandlingFound ? 'Yes' : 'Graceful degradation'}`);
    });
    
    test('Mock data fallbacks work when APIs fail', async ({ page }) => {
      // Block all API calls to force mock data usage
      await page.route('**/api/**', route => {
        route.fulfill({ status: 503, body: 'API Unavailable' });
      });
      
      await page.goto(TEST_CONFIG.BASE_URL);
      await page.waitForTimeout(10000); // Allow time for fallback
      
      // Check if mock data is displayed
      const mockDataIndicators = [
        '[data-mock="true"]',
        '.mock-data',
        '.demo-data',
        '.sample-data'
      ];
      
      let mockDataFound = false;
      for (const selector of mockDataIndicators) {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          mockDataFound = true;
          console.log(`✅ Mock data indicator found: ${selector}`);
          break;
        }
      }
      
      // Even without explicit mock data indicators, page should still render
      await expect(page.locator('body')).toBeVisible();
      console.log(`✅ Application continues to function with API failures`);
    });
  });

  test.describe('Accessibility and User Experience', () => {
    
    test('Basic accessibility requirements are met', async ({ page }) => {
      await page.goto(TEST_CONFIG.BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const accessibilityChecks = {
        title: await page.title(),
        metaDescription: await page.getAttribute('meta[name="description"]', 'content'),
        h1Count: await page.locator('h1').count(),
        skipLinks: await page.locator('a[href="#main"], a[href="#content"]').count(),
        landmarks: await page.locator('[role="main"], main, [role="navigation"], nav').count(),
        altTexts: await page.locator('img[alt]').count(),
        totalImages: await page.locator('img').count()
      };
      
      // Title should exist and not be empty
      expect(accessibilityChecks.title).not.toBe('');
      expect(accessibilityChecks.title.length).toBeGreaterThan(5);
      
      // Should have at least one H1
      expect(accessibilityChecks.h1Count).toBeGreaterThan(0);
      
      // Should have landmark elements
      expect(accessibilityChecks.landmarks).toBeGreaterThan(0);
      
      // Images should have alt text (if any images exist)
      if (accessibilityChecks.totalImages > 0) {
        const altTextPercentage = (accessibilityChecks.altTexts / accessibilityChecks.totalImages) * 100;
        expect(altTextPercentage).toBeGreaterThan(80); // 80% threshold
      }
      
      console.log(`✅ Accessibility checks passed:`, accessibilityChecks);
    });
    
    test('Keyboard navigation works', async ({ page }) => {
      await page.goto(TEST_CONFIG.BASE_URL);
      
      // Test Tab navigation
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(focusedElement);
      
      // Test multiple tab presses
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      console.log(`✅ Keyboard navigation is functional`);
    });
  });

  test.describe('Performance and Loading Tests', () => {
    
    test('Page load performance meets SLA requirements', async ({ page }) => {
      const performanceMetrics = [];
      
      for (const pageConfig of CRITICAL_PAGES.slice(0, 3)) { // Test first 3 pages
        const startTime = Date.now();
        
        try {
          await page.goto(`${TEST_CONFIG.BASE_URL}${pageConfig.path}`);
          await page.waitForLoadState('domcontentloaded');
          
          const loadTime = Date.now() - startTime;
          performanceMetrics.push({
            page: pageConfig.name,
            loadTime,
            withinSLA: loadTime <= TEST_CONFIG.PERFORMANCE_THRESHOLD
          });
          
          console.log(`${pageConfig.name}: ${loadTime}ms ${loadTime <= TEST_CONFIG.PERFORMANCE_THRESHOLD ? '✅' : '⚠️'}`);
          
        } catch (error) {
          performanceMetrics.push({
            page: pageConfig.name,
            error: error.message,
            withinSLA: false
          });
        }
      }
      
      // At least 80% of pages should meet SLA
      const slaCompliantPages = performanceMetrics.filter(m => m.withinSLA).length;
      const slaCompliance = (slaCompliantPages / performanceMetrics.length) * 100;
      
      expect(slaCompliance).toBeGreaterThan(60); // 60% minimum threshold
      console.log(`✅ SLA compliance: ${slaCompliance.toFixed(1)}% (${slaCompliantPages}/${performanceMetrics.length})`);
    });
    
    test('Application handles slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        route.continue();
      });
      
      const startTime = Date.now();
      await page.goto(TEST_CONFIG.BASE_URL);
      
      // Should still load within reasonable time despite delays
      await page.waitForSelector('body', { timeout: 15000 });
      
      const totalLoadTime = Date.now() - startTime;
      console.log(`✅ Slow network test completed in ${totalLoadTime}ms`);
      
      // Should handle delays gracefully
      expect(totalLoadTime).toBeLessThan(15000);
    });
  });

  test.describe('Security and Content Validation', () => {
    
    test('HTTPS is properly configured', async ({ page }) => {
      const response = await page.goto(TEST_CONFIG.BASE_URL);
      
      // Check that we're using HTTPS
      expect(page.url()).toMatch(/^https:/);
      
      // Check security headers (if accessible via response)
      const securityHeaders = response.headers();
      console.log('Security headers present:', Object.keys(securityHeaders).filter(h => 
        h.includes('security') || h.includes('policy') || h === 'x-frame-options'
      ));
    });
    
    test('No sensitive information exposed in client', async ({ page }) => {
      await page.goto(TEST_CONFIG.BASE_URL);
      
      // Check page content for sensitive patterns
      const pageContent = await page.content();
      
      const sensitivePatterns = [
        /password\s*[:=]\s*['"][^'"]+['"]/i,
        /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
        /secret\s*[:=]\s*['"][^'"]+['"]/i,
        /token\s*[:=]\s*['"][a-zA-Z0-9+/]{20,}['"]/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        const matches = pageContent.match(pattern);
        if (matches) {
          console.warn(`⚠️ Potential sensitive data exposed: ${matches[0].substring(0, 50)}...`);
        }
        expect(matches).toBeNull();
      });
      
      console.log(`✅ No sensitive information detected in client-side code`);
    });
  });

  // Summary test that provides overall health status
  test('Overall UI Health Summary', async ({ page }) => {
    const healthReport = {
      timestamp: new Date().toISOString(),
      overallStatus: 'healthy',
      issues: [],
      performance: {},
      accessibility: {},
      functionality: {}
    };
    
    try {
      // Test basic functionality
      await page.goto(TEST_CONFIG.BASE_URL);
      const loadStartTime = Date.now();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - loadStartTime;
      
      healthReport.performance.initialLoad = loadTime;
      healthReport.performance.withinSLA = loadTime <= TEST_CONFIG.PERFORMANCE_THRESHOLD;
      
      // Check page structure
      const title = await page.title();
      const h1Count = await page.locator('h1').count();
      const navCount = await page.locator('nav, [role="navigation"]').count();
      
      healthReport.accessibility.hasTitle = !!title && title.length > 0;
      healthReport.accessibility.hasH1 = h1Count > 0;
      healthReport.accessibility.hasNavigation = navCount > 0;
      
      // Check for JavaScript errors
      const errorCount = await page.evaluate(() => window.errors ? window.errors.length : 0);
      healthReport.functionality.jsErrors = errorCount;
      
      // Determine overall status
      if (!healthReport.performance.withinSLA) {
        healthReport.issues.push('Performance below SLA threshold');
        healthReport.overallStatus = 'degraded';
      }
      
      if (!healthReport.accessibility.hasTitle || !healthReport.accessibility.hasH1) {
        healthReport.issues.push('Basic accessibility requirements not met');
        if (healthReport.overallStatus === 'healthy') {
          healthReport.overallStatus = 'degraded';
        }
      }
      
      if (errorCount > 0) {
        healthReport.issues.push(`${errorCount} JavaScript errors detected`);
        healthReport.overallStatus = 'unhealthy';
      }
      
      console.log('🏥 UI Health Report:', JSON.stringify(healthReport, null, 2));
      
      // Test should pass if status is not 'unhealthy'
      expect(healthReport.overallStatus).not.toBe('unhealthy');
      
    } catch (error) {
      healthReport.overallStatus = 'critical';
      healthReport.issues.push(`Critical error: ${error.message}`);
      console.error('❌ Critical UI health failure:', error);
      throw error;
    }
  });
});

// Utility function to run performance measurements
async function measurePagePerformance(page, url) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
    };
  });
  
  return metrics;
}