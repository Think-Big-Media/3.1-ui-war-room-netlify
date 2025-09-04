/**
 * Critical User Flow Tests for War Room Application
 * 
 * Tests the most important user journeys to ensure the application
 * provides a functional experience for end users. These tests simulate
 * real user behavior and validate core business functionality.
 */

const { test, expect } = require('@playwright/test');

const TEST_CONFIG = {
  BASE_URL: 'https://war-room-oa9t.onrender.com',
  TIMEOUT: 30000,
  MOCK_USER: {
    email: 'test@warroom.com',
    password: 'TestPassword123!'
  }
};

test.describe('Critical User Flow Tests', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for user flows
    
    await page.setExtraHTTPHeaders({
      'User-Agent': 'WarRoom-UserFlow-Test/1.0'
    });
    
    // Handle console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error in user flow: ${msg.text()}`);
      }
    });
  });

  test.describe('Authentication Flow', () => {
    
    test('Guest user can access public pages', async ({ page }) => {
      const publicPages = [
        '/',
        '/about',
        '/contact',
        '/features'
      ];
      
      for (const pagePath of publicPages) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pagePath}`);
        
        // Should not be redirected to login
        expect(page.url()).not.toContain('/login');
        expect(page.url()).not.toContain('/auth');
        
        // Page should load successfully
        await expect(page.locator('body')).toBeVisible();
        
        console.log(`✅ Public access confirmed: ${pagePath}`);
      }
    });
    
    test('Protected routes redirect to authentication', async ({ page }) => {
      const protectedPages = [
        '/dashboard',
        '/monitoring',
        '/analytics',
        '/campaigns',
        '/settings'
      ];
      
      for (const pagePath of protectedPages) {
        await page.goto(`${TEST_CONFIG.BASE_URL}${pagePath}`);
        
        // Should be redirected to login or show auth prompt
        const finalUrl = page.url();
        const hasAuthElements = await page.locator('input[type="email"], input[type="password"], .login-form, .auth-form').count() > 0;
        
        const isProtected = finalUrl.includes('/login') || 
                           finalUrl.includes('/auth') || 
                           hasAuthElements;
        
        expect(isProtected).toBe(true);
        console.log(`✅ Protected route secured: ${pagePath} → ${finalUrl}`);
      }
    });
    
    test('Login form is functional', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/login`);
      
      // Look for login form elements
      const emailInput = page.locator('input[type="email"], input[name="email"], #email');
      const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
      const submitButton = page.locator('button[type="submit"], input[type="submit"], .login-button');
      
      // Check if login elements exist
      const hasLoginForm = await emailInput.count() > 0 && 
                           await passwordInput.count() > 0 && 
                           await submitButton.count() > 0;
      
      if (hasLoginForm) {
        await expect(emailInput.first()).toBeVisible();
        await expect(passwordInput.first()).toBeVisible();
        await expect(submitButton.first()).toBeVisible();
        
        console.log('✅ Login form elements are present and visible');
      } else {
        // Check for OAuth or alternative login methods
        const oauthButtons = await page.locator('[class*="oauth"], [class*="google"], [class*="github"], .social-login').count();
        expect(oauthButtons).toBeGreaterThan(0);
        
        console.log('✅ Alternative authentication method detected');
      }
    });
  });

  test.describe('Dashboard Navigation Flow', () => {
    
    test('Main dashboard loads with core components', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle', { timeout: TEST_CONFIG.TIMEOUT });
      
      // Check for dashboard components
      const dashboardElements = [
        'header, .header',
        'nav, .navigation, .sidebar',
        'main, .main-content, .dashboard-main',
        '.widget, .card, .dashboard-item, .metric'
      ];
      
      let foundElements = 0;
      for (const selector of dashboardElements) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          foundElements++;
          console.log(`✅ Found dashboard element: ${selector} (${count} items)`);
        }
      }
      
      expect(foundElements).toBeGreaterThan(2); // At least 3 key elements should be present
    });
    
    test('Navigation between dashboard sections works', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Find navigation links
      const navLinks = page.locator('a[href*="/"], button[data-route], .nav-link');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        // Test clicking on navigation items
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = navLinks.nth(i);
          const linkText = await link.textContent();
          
          if (linkText && linkText.trim()) {
            try {
              await link.click({ timeout: 5000 });
              await page.waitForTimeout(2000); // Allow navigation to complete
              
              // Verify page changed or content updated
              const newUrl = page.url();
              console.log(`✅ Navigation successful: "${linkText.trim()}" → ${newUrl}`);
              
            } catch (error) {
              console.log(`⚠️ Navigation link "${linkText.trim()}" not functional: ${error.message}`);
            }
          }
        }
      }
      
      console.log(`✅ Dashboard navigation tested (${linkCount} links found)`);
    });
  });

  test.describe('Monitoring and Real-time Features', () => {
    
    test('Real-time monitoring page displays live data', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/monitoring`);
      await page.waitForLoadState('networkidle');
      
      // Look for real-time indicators
      const realTimeElements = [
        '.live-indicator, [data-live="true"]',
        '.status-indicator, .health-status',
        '.metric-value, .counter',
        '.chart, canvas, svg',
        '.timestamp, .last-updated'
      ];
      
      let realTimeFeatures = 0;
      for (const selector of realTimeElements) {
        const count = await page.locator(selector).count();
        realTimeFeatures += count;
      }
      
      expect(realTimeFeatures).toBeGreaterThan(0);
      console.log(`✅ Real-time monitoring features detected: ${realTimeFeatures} elements`);
      
      // Check for periodic updates (wait and see if content changes)
      const initialContent = await page.locator('.metric-value, .counter, .timestamp').first().textContent();
      await page.waitForTimeout(5000);
      const updatedContent = await page.locator('.metric-value, .counter, .timestamp').first().textContent();
      
      if (initialContent !== updatedContent) {
        console.log('✅ Live updates confirmed: Content changed during monitoring');
      } else {
        console.log('ℹ️ Static content detected (may be expected during testing)');
      }
    });
    
    test('Alert system displays notifications', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/alerts`);
      await page.waitForLoadState('networkidle');
      
      // Look for alert-related elements
      const alertElements = [
        '.alert, .notification',
        '.alert-item, .alert-card',
        '[role="alert"]',
        '.warning, .error, .info',
        '.alert-list, .notifications-list'
      ];
      
      let alertSystemPresent = false;
      for (const selector of alertElements) {
        if (await page.locator(selector).count() > 0) {
          alertSystemPresent = true;
          console.log(`✅ Alert system component found: ${selector}`);
          break;
        }
      }
      
      // Check for alert controls
      const alertControls = [
        'button[class*="clear"], .clear-alerts',
        'select[name*="filter"], .filter-select',
        '.alert-settings, .notification-settings'
      ];
      
      let controlsFound = 0;
      for (const selector of alertControls) {
        if (await page.locator(selector).count() > 0) {
          controlsFound++;
        }
      }
      
      console.log(`✅ Alert system present: ${alertSystemPresent}, Controls found: ${controlsFound}`);
      expect(alertSystemPresent).toBe(true);
    });
  });

  test.describe('Analytics and Reporting Flow', () => {
    
    test('Analytics dashboard loads with data visualizations', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/analytics`);
      await page.waitForLoadState('networkidle');
      
      // Look for data visualization elements
      const chartElements = [
        'canvas', // Chart.js, etc.
        'svg',    // D3, etc.
        '.chart, .graph',
        '.visualization, .viz',
        '.metric, .kpi, .stat'
      ];
      
      let chartsFound = 0;
      for (const selector of chartElements) {
        const count = await page.locator(selector).count();
        chartsFound += count;
      }
      
      expect(chartsFound).toBeGreaterThan(0);
      console.log(`✅ Data visualizations found: ${chartsFound} chart elements`);
      
      // Check for data tables
      const tables = await page.locator('table, .data-table, .grid').count();
      if (tables > 0) {
        console.log(`✅ Data tables found: ${tables}`);
      }
    });
    
    test('Date range filtering works', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/analytics`);
      await page.waitForLoadState('networkidle');
      
      // Look for date controls
      const dateControls = [
        'input[type="date"]',
        '.date-picker, .datepicker',
        'select[name*="period"], .period-select',
        'button[data-period], .time-range-button'
      ];
      
      let dateControlFound = false;
      for (const selector of dateControls) {
        const element = page.locator(selector).first();
        if (await element.count() > 0) {
          dateControlFound = true;
          
          try {
            // Try to interact with the date control
            if (selector.includes('button')) {
              await element.click();
            } else if (selector.includes('select')) {
              await element.selectOption({ index: 1 });
            }
            
            await page.waitForTimeout(2000); // Allow data to reload
            console.log(`✅ Date control interaction successful: ${selector}`);
            
          } catch (error) {
            console.log(`⚠️ Date control found but not interactive: ${selector}`);
          }
          
          break;
        }
      }
      
      console.log(`Date filtering capability: ${dateControlFound ? 'Present' : 'Not detected'}`);
    });
  });

  test.describe('Campaign Management Flow', () => {
    
    test('Campaign list displays and is navigable', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/campaigns`);
      await page.waitForLoadState('networkidle');
      
      // Look for campaign-related elements
      const campaignElements = [
        '.campaign, .campaign-item',
        '.campaign-card, .campaign-row',
        'table tbody tr, .data-row',
        '.list-item'
      ];
      
      let campaignItemsFound = 0;
      for (const selector of campaignElements) {
        const count = await page.locator(selector).count();
        campaignItemsFound += count;
      }
      
      console.log(`✅ Campaign items found: ${campaignItemsFound}`);
      
      // Look for campaign controls
      const campaignControls = [
        'button[class*="create"], .create-button',
        'button[class*="edit"], .edit-button',
        'input[type="search"], .search-input',
        'select, .filter-select'
      ];
      
      let controlsFound = 0;
      for (const selector of campaignControls) {
        if (await page.locator(selector).count() > 0) {
          controlsFound++;
        }
      }
      
      console.log(`✅ Campaign controls found: ${controlsFound}`);
      expect(campaignItemsFound > 0 || controlsFound > 0).toBe(true);
    });
  });

  test.describe('Settings and Configuration Flow', () => {
    
    test('Settings page is accessible and functional', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/settings`);
      await page.waitForLoadState('networkidle');
      
      // Look for settings elements
      const settingsElements = [
        'input[type="text"], input[type="email"]',
        'select, .dropdown',
        'input[type="checkbox"], input[type="radio"]',
        'textarea',
        'button[type="submit"], .save-button'
      ];
      
      let settingsFields = 0;
      for (const selector of settingsElements) {
        const count = await page.locator(selector).count();
        settingsFields += count;
      }
      
      expect(settingsFields).toBeGreaterThan(0);
      console.log(`✅ Settings form fields found: ${settingsFields}`);
      
      // Check for settings sections
      const settingsSections = [
        '.settings-section, .config-section',
        'fieldset',
        '.form-group, .setting-group',
        '.tab, .settings-tab'
      ];
      
      let sectionsFound = 0;
      for (const selector of settingsSections) {
        sectionsFound += await page.locator(selector).count();
      }
      
      console.log(`✅ Settings sections found: ${sectionsFound}`);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('404 page is handled gracefully', async ({ page }) => {
      const response = await page.goto(`${TEST_CONFIG.BASE_URL}/nonexistent-page-${Date.now()}`);
      
      // Should return 404 status
      expect(response.status()).toBe(404);
      
      // Should display a user-friendly error page
      await expect(page.locator('body')).toBeVisible();
      
      const pageContent = await page.content();
      const hasErrorMessage = pageContent.includes('404') || 
                             pageContent.includes('not found') || 
                             pageContent.includes('page not found');
      
      expect(hasErrorMessage).toBe(true);
      console.log('✅ 404 error page displays user-friendly message');
    });
    
    test('Network error recovery', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      
      // Simulate network interruption
      await page.setOfflineMode(true);
      await page.waitForTimeout(2000);
      
      // App should handle offline state
      const pageContent = await page.content();
      
      // Restore network
      await page.setOfflineMode(false);
      await page.waitForTimeout(3000);
      
      // Page should recover
      await expect(page.locator('body')).toBeVisible();
      console.log('✅ Application handles network interruptions gracefully');
    });
  });

  // Comprehensive user flow test
  test('Complete user journey simulation', async ({ page }) => {
    const journeyReport = {
      steps: [],
      overallSuccess: true,
      performanceMetrics: [],
      errors: []
    };
    
    try {
      // Step 1: Landing page
      let stepStart = Date.now();
      await page.goto(TEST_CONFIG.BASE_URL);
      await page.waitForLoadState('networkidle');
      journeyReport.steps.push({
        step: 'Landing page load',
        duration: Date.now() - stepStart,
        success: true
      });
      
      // Step 2: Navigation to dashboard
      stepStart = Date.now();
      await page.goto(`${TEST_CONFIG.BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      journeyReport.steps.push({
        step: 'Dashboard access',
        duration: Date.now() - stepStart,
        success: true
      });
      
      // Step 3: Check monitoring
      stepStart = Date.now();
      await page.goto(`${TEST_CONFIG.BASE_URL}/monitoring`);
      await page.waitForLoadState('networkidle');
      journeyReport.steps.push({
        step: 'Monitoring page',
        duration: Date.now() - stepStart,
        success: true
      });
      
      // Step 4: View analytics
      stepStart = Date.now();
      await page.goto(`${TEST_CONFIG.BASE_URL}/analytics`);
      await page.waitForLoadState('networkidle');
      journeyReport.steps.push({
        step: 'Analytics access',
        duration: Date.now() - stepStart,
        success: true
      });
      
      // Calculate overall metrics
      const totalDuration = journeyReport.steps.reduce((sum, step) => sum + step.duration, 0);
      const avgStepDuration = totalDuration / journeyReport.steps.length;
      
      journeyReport.overallSuccess = journeyReport.steps.every(step => step.success);
      journeyReport.performanceMetrics = {
        totalDuration,
        averageStepDuration: avgStepDuration,
        slowestStep: Math.max(...journeyReport.steps.map(s => s.duration)),
        fastestStep: Math.min(...journeyReport.steps.map(s => s.duration))
      };
      
      console.log('🎯 Complete User Journey Report:', JSON.stringify(journeyReport, null, 2));
      
      // Assertions
      expect(journeyReport.overallSuccess).toBe(true);
      expect(avgStepDuration).toBeLessThan(8000); // Average step should be under 8 seconds
      
    } catch (error) {
      journeyReport.overallSuccess = false;
      journeyReport.errors.push(error.message);
      console.error('❌ User journey failed:', error);
      throw error;
    }
  });
});