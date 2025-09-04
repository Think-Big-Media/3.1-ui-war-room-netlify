#!/usr/bin/env node

/**
 * SUB-AGENT 1: Health Check Monitor
 * 
 * MISSION: Monitor War Room application health and auto-fix issues
 * TARGET: https://war-room-oa9t.onrender.com/
 * 
 * CORE RESPONSIBILITIES:
 * 1. Monitor all /api/health endpoints every 30 minutes
 * 2. Run Playwright tests to verify UI functionality 
 * 3. Check for performance degradation (>3 second response times)
 * 4. Verify mock data fallback mechanisms are working
 * 5. Auto-fix simple endpoint errors when possible
 * 6. Report critical issues that require human intervention
 * 7. Save all successful fix patterns to knowledge base with tag "health-check-fixes"
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const cron = require('node-cron');
const { spawn } = require('child_process');
const EventEmitter = require('events');

class HealthMonitorSubAgent extends EventEmitter {
  constructor() {
    super();
    this.config = {
      TARGET_URL: 'https://war-room-oa9t.onrender.com',
      MONITORING_INTERVAL: '*/30 * * * *', // Every 30 minutes
      PERFORMANCE_SLA: 3000, // 3 seconds max response time
      MAX_RETRIES: 3,
      TIMEOUT: 15000,
      HEALTH_ENDPOINTS: [
        '/api/health',
        '/api/v1/status',
        '/api/v1/analytics/status',
        '/api/v1/auth/status',
        '/api/v1/monitoring/health',
        '/docs'
      ],
      AUTO_FIX_ENABLED: true,
      KNOWLEDGE_BASE_PATH: path.join(__dirname, 'knowledge-base'),
      REPORTS_PATH: path.join(__dirname, 'reports'),
      LOGS_PATH: path.join(__dirname, 'logs')
    };

    this.state = {
      isRunning: false,
      lastCheck: null,
      consecutiveFailures: 0,
      knownFixes: new Map(),
      activeAlerts: new Set(),
      performanceHistory: []
    };

    this.cronJob = null;
    this.initializeDirectories();
    this.loadKnownFixes();
  }

  async initializeDirectories() {
    const dirs = [
      this.config.KNOWLEDGE_BASE_PATH,
      this.config.REPORTS_PATH,
      this.config.LOGS_PATH,
      path.join(this.config.LOGS_PATH, 'auto-fixes'),
      path.join(this.config.REPORTS_PATH, 'daily'),
      path.join(this.config.KNOWLEDGE_BASE_PATH, 'health-check-fixes')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error.message);
      }
    }
  }

  async loadKnownFixes() {
    try {
      const fixesPath = path.join(this.config.KNOWLEDGE_BASE_PATH, 'health-check-fixes', 'known-fixes.json');
      const data = await fs.readFile(fixesPath, 'utf8');
      const fixes = JSON.parse(data);
      
      fixes.forEach(fix => {
        this.state.knownFixes.set(fix.pattern, fix);
      });
      
      this.log(`Loaded ${this.state.knownFixes.size} known fixes from knowledge base`);
    } catch (error) {
      this.log('No existing known fixes found, starting with empty knowledge base');
    }
  }

  async saveKnownFix(pattern, fix, success = true) {
    const fixRecord = {
      pattern,
      fix: fix.action || fix,
      success,
      timestamp: new Date().toISOString(),
      appliedCount: 1,
      successRate: success ? 1 : 0,
      tags: ['health-check-fixes', 'auto-generated'],
      metadata: {
        endpoint: fix.endpoint || null,
        errorType: fix.errorType || null,
        responseTime: fix.responseTime || null
      }
    };

    // Update existing or create new
    if (this.state.knownFixes.has(pattern)) {
      const existing = this.state.knownFixes.get(pattern);
      existing.appliedCount++;
      existing.successRate = ((existing.successRate * (existing.appliedCount - 1)) + (success ? 1 : 0)) / existing.appliedCount;
      existing.lastApplied = new Date().toISOString();
      this.state.knownFixes.set(pattern, existing);
    } else {
      this.state.knownFixes.set(pattern, fixRecord);
    }

    // Save to knowledge base
    await this.persistKnowledgeBase();
    this.log(`Saved fix pattern "${pattern}" to knowledge base (success: ${success})`);
  }

  async persistKnowledgeBase() {
    try {
      const fixesArray = Array.from(this.state.knownFixes.values());
      const fixesPath = path.join(this.config.KNOWLEDGE_BASE_PATH, 'health-check-fixes', 'known-fixes.json');
      await fs.writeFile(fixesPath, JSON.stringify(fixesArray, null, 2));
    } catch (error) {
      this.log(`Failed to persist knowledge base: ${error.message}`, 'error');
    }
  }

  start() {
    if (this.state.isRunning) {
      this.log('Health monitor is already running');
      return;
    }

    this.log('Starting Health Check Monitor Sub-Agent...');
    this.state.isRunning = true;

    // Schedule the cron job for every 30 minutes
    this.cronJob = cron.schedule(this.config.MONITORING_INTERVAL, async () => {
      await this.performHealthCheck();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    // Perform initial health check
    this.performHealthCheck();

    this.log(`Health monitor started - checking every 30 minutes`);
    this.log(`Target URL: ${this.config.TARGET_URL}`);
  }

  stop() {
    if (!this.state.isRunning) {
      this.log('Health monitor is not running');
      return;
    }

    this.log('Stopping Health Check Monitor Sub-Agent...');
    
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }

    this.state.isRunning = false;
    this.log('Health monitor stopped');
  }

  async performHealthCheck() {
    const startTime = Date.now();
    this.log('Starting comprehensive health check...');
    
    const results = {
      timestamp: new Date().toISOString(),
      checkId: `health-${startTime}`,
      overall: 'unknown',
      site: {},
      endpoints: {},
      ui: {},
      performance: {},
      mockData: {},
      autoFixes: [],
      criticalIssues: [],
      recommendations: []
    };

    try {
      // 1. Monitor all /api/health endpoints
      results.endpoints = await this.checkHealthEndpoints();
      
      // 2. Run UI functionality tests
      results.ui = await this.runUITests();
      
      // 3. Performance monitoring with 3-second SLA
      results.performance = await this.checkPerformanceMetrics();
      
      // 4. Verify mock data fallback mechanisms
      results.mockData = await this.verifyMockDataFallbacks();
      
      // 5. Auto-fix simple endpoint errors
      if (this.config.AUTO_FIX_ENABLED) {
        results.autoFixes = await this.attemptAutoFixes(results);
      }
      
      // 6. Identify critical issues
      results.criticalIssues = this.identifyCriticalIssues(results);
      
      // 7. Generate recommendations
      results.recommendations = this.generateRecommendations(results);
      
      // Determine overall health status
      results.overall = this.calculateOverallHealth(results);
      
      // Update state
      this.state.lastCheck = results;
      this.updateConsecutiveFailures(results.overall);
      
      // Save results
      await this.saveHealthReport(results);
      
      // Handle alerts and notifications
      await this.handleAlertsAndNotifications(results);
      
      const duration = Date.now() - startTime;
      this.log(`Health check completed in ${duration}ms - Status: ${results.overall.toUpperCase()}`);
      
      this.emit('healthCheckComplete', results);
      
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      results.overall = 'error';
      results.error = error.message;
      this.emit('healthCheckError', error);
    }
    
    return results;
  }

  async checkHealthEndpoints() {
    this.log('Checking health endpoints...');
    const results = {};
    let healthyCount = 0;

    for (const endpoint of this.config.HEALTH_ENDPOINTS) {
      const url = `${this.config.TARGET_URL}${endpoint}`;
      const startTime = Date.now();
      
      try {
        const response = await axios.get(url, {
          timeout: this.config.TIMEOUT,
          headers: {
            'User-Agent': 'WarRoom-HealthMonitor-SubAgent/1.0',
            'Accept': 'application/json, text/html, */*'
          },
          validateStatus: (status) => status < 500 // Accept 4xx as potentially valid
        });
        
        const responseTime = Date.now() - startTime;
        const isHealthy = response.status >= 200 && response.status < 400;
        
        results[endpoint] = {
          healthy: isHealthy,
          status: response.status,
          responseTime,
          contentType: response.headers['content-type'],
          contentLength: response.data?.length || 0,
          data: typeof response.data === 'object' ? response.data : null
        };
        
        if (isHealthy) {
          healthyCount++;
        }
        
        this.log(`${endpoint}: ${response.status} (${responseTime}ms) ${isHealthy ? '✅' : '⚠️'}`);
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results[endpoint] = {
          healthy: false,
          error: error.message,
          status: error.response?.status || 0,
          responseTime,
          requiresFix: this.isFixableError(error)
        };
        
        this.log(`${endpoint}: ERROR - ${error.message} (${responseTime}ms) ❌`);
      }
    }

    const healthPercentage = (healthyCount / this.config.HEALTH_ENDPOINTS.length * 100).toFixed(1);
    this.log(`Endpoint health: ${healthyCount}/${this.config.HEALTH_ENDPOINTS.length} (${healthPercentage}%)`);

    return {
      healthy: healthyCount,
      total: this.config.HEALTH_ENDPOINTS.length,
      percentage: parseFloat(healthPercentage),
      endpoints: results
    };
  }

  async runUITests() {
    this.log('Running UI functionality tests...');
    
    try {
      // Run Playwright tests for UI validation
      const playwrightResult = await this.runPlaywrightTests();
      
      // Basic UI accessibility tests
      const accessibilityResult = await this.checkUIAccessibility();
      
      return {
        playwright: playwrightResult,
        accessibility: accessibilityResult,
        overall: playwrightResult.success && accessibilityResult.success ? 'passed' : 'failed'
      };
      
    } catch (error) {
      this.log(`UI tests failed: ${error.message}`, 'error');
      return {
        overall: 'error',
        error: error.message
      };
    }
  }

  async runPlaywrightTests() {
    return new Promise((resolve) => {
      const testCommand = spawn('npx', ['playwright', 'test', '--project=monitoring'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      testCommand.stdout.on('data', (data) => {
        output += data.toString();
      });

      testCommand.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testCommand.on('close', (code) => {
        const success = code === 0;
        this.log(`Playwright tests ${success ? 'passed' : 'failed'} (exit code: ${code})`);
        
        resolve({
          success,
          exitCode: code,
          output: output.slice(-500), // Last 500 chars
          error: errorOutput.slice(-500),
          timestamp: new Date().toISOString()
        });
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        testCommand.kill('SIGKILL');
        resolve({
          success: false,
          error: 'Playwright tests timed out after 5 minutes',
          timeout: true
        });
      }, 300000);
    });
  }

  async checkUIAccessibility() {
    try {
      const response = await axios.get(this.config.TARGET_URL, {
        timeout: this.config.TIMEOUT
      });

      const html = response.data;
      const checks = {
        hasTitle: html.includes('<title>') && !html.includes('<title></title>'),
        hasMetaDescription: html.includes('<meta name="description"'),
        hasH1: html.includes('<h1'),
        hasNavigation: html.includes('<nav') || html.includes('navigation'),
        hasMainContent: html.includes('<main') || html.includes('id="main"')
      };

      const passedChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;

      return {
        success: passedChecks >= totalChecks * 0.8, // 80% threshold
        checks,
        score: passedChecks / totalChecks,
        message: `Accessibility: ${passedChecks}/${totalChecks} checks passed`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkPerformanceMetrics() {
    this.log('Checking performance metrics (3-second SLA)...');
    
    const metrics = {
      requests: [],
      slaViolations: 0,
      averageResponseTime: 0,
      availability: 0,
      performanceGrade: 'F'
    };

    // Test multiple requests to get consistent metrics
    const testRequests = 5;
    const successfulRequests = [];

    for (let i = 0; i < testRequests; i++) {
      const startTime = Date.now();
      
      try {
        await axios.get(this.config.TARGET_URL, {
          timeout: this.config.TIMEOUT,
          headers: { 'User-Agent': 'WarRoom-PerformanceTest/1.0' }
        });
        
        const responseTime = Date.now() - startTime;
        const isWithinSLA = responseTime <= this.config.PERFORMANCE_SLA;
        
        const request = { 
          success: true, 
          responseTime, 
          withinSLA: isWithinSLA,
          timestamp: new Date().toISOString()
        };
        
        metrics.requests.push(request);
        successfulRequests.push(responseTime);
        
        if (!isWithinSLA) {
          metrics.slaViolations++;
        }
        
      } catch (error) {
        metrics.requests.push({
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        });
      }
      
      // Small delay between requests
      if (i < testRequests - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate metrics
    metrics.availability = (successfulRequests.length / testRequests * 100).toFixed(1);
    metrics.averageResponseTime = successfulRequests.length > 0 ? 
      Math.round(successfulRequests.reduce((a, b) => a + b, 0) / successfulRequests.length) : 0;
    
    // Performance grading
    if (metrics.slaViolations === 0 && successfulRequests.length === testRequests) {
      metrics.performanceGrade = 'A';
    } else if (metrics.slaViolations <= 1 && parseFloat(metrics.availability) >= 80) {
      metrics.performanceGrade = 'B';
    } else if (parseFloat(metrics.availability) >= 60) {
      metrics.performanceGrade = 'C';
    } else {
      metrics.performanceGrade = 'F';
    }

    // Update performance history
    this.state.performanceHistory.push({
      timestamp: new Date().toISOString(),
      averageResponseTime: metrics.averageResponseTime,
      slaViolations: metrics.slaViolations,
      availability: parseFloat(metrics.availability)
    });

    // Keep only last 100 records
    if (this.state.performanceHistory.length > 100) {
      this.state.performanceHistory = this.state.performanceHistory.slice(-100);
    }

    this.log(`Performance: ${metrics.averageResponseTime}ms avg, ${metrics.slaViolations} SLA violations, ${metrics.availability}% availability (Grade: ${metrics.performanceGrade})`);
    
    return metrics;
  }

  async verifyMockDataFallbacks() {
    this.log('Verifying mock data fallback mechanisms...');
    
    const mockDataEndpoints = [
      '/api/v1/analytics/mock',
      '/api/v1/campaigns/mock',
      '/api/v1/monitoring/mock'
    ];

    const results = {
      working: 0,
      total: mockDataEndpoints.length,
      endpoints: {}
    };

    for (const endpoint of mockDataEndpoints) {
      try {
        const response = await axios.get(`${this.config.TARGET_URL}${endpoint}`, {
          timeout: this.config.TIMEOUT,
          headers: { 'X-Mock-Mode': 'true' }
        });

        const isValidMockData = response.data && 
          (Array.isArray(response.data) || typeof response.data === 'object') &&
          JSON.stringify(response.data).length > 10;

        results.endpoints[endpoint] = {
          working: isValidMockData,
          status: response.status,
          dataLength: JSON.stringify(response.data).length,
          hasData: !!response.data
        };

        if (isValidMockData) {
          results.working++;
        }

      } catch (error) {
        results.endpoints[endpoint] = {
          working: false,
          error: error.message
        };
      }
    }

    const workingPercentage = (results.working / results.total * 100).toFixed(1);
    this.log(`Mock data: ${results.working}/${results.total} endpoints working (${workingPercentage}%)`);

    return {
      ...results,
      percentage: parseFloat(workingPercentage),
      allWorking: results.working === results.total
    };
  }

  async attemptAutoFixes(healthResults) {
    if (!this.config.AUTO_FIX_ENABLED) {
      return [];
    }

    this.log('Attempting auto-fixes for detected issues...');
    const fixes = [];

    // Check for fixable endpoint issues
    for (const [endpoint, result] of Object.entries(healthResults.endpoints.endpoints)) {
      if (!result.healthy && result.requiresFix) {
        const fix = await this.tryAutoFix(endpoint, result);
        if (fix) {
          fixes.push(fix);
        }
      }
    }

    // Check for performance issues
    if (healthResults.performance.slaViolations > 2) {
      const fix = await this.tryPerformanceFix(healthResults.performance);
      if (fix) {
        fixes.push(fix);
      }
    }

    this.log(`Applied ${fixes.length} auto-fixes`);
    return fixes;
  }

  async tryAutoFix(endpoint, errorResult) {
    const errorPattern = this.identifyErrorPattern(errorResult);
    const knownFix = this.state.knownFixes.get(errorPattern);

    if (knownFix && knownFix.successRate > 0.7) {
      this.log(`Applying known fix for pattern: ${errorPattern}`);
      
      try {
        const fixResult = await this.applyFix(knownFix, endpoint);
        await this.saveKnownFix(errorPattern, knownFix, fixResult.success);
        
        return {
          endpoint,
          pattern: errorPattern,
          action: knownFix.fix,
          success: fixResult.success,
          message: fixResult.message
        };
      } catch (error) {
        await this.saveKnownFix(errorPattern, knownFix, false);
        return {
          endpoint,
          pattern: errorPattern,
          success: false,
          error: error.message
        };
      }
    }

    // Try common fixes for unknown issues
    return await this.tryCommonFixes(endpoint, errorResult);
  }

  identifyErrorPattern(errorResult) {
    if (errorResult.status === 503) return 'service-unavailable';
    if (errorResult.status === 502) return 'bad-gateway';
    if (errorResult.status === 500) return 'internal-server-error';
    if (errorResult.error?.includes('timeout')) return 'timeout-error';
    if (errorResult.error?.includes('ECONNREFUSED')) return 'connection-refused';
    if (errorResult.responseTime > 10000) return 'slow-response';
    return 'unknown-error';
  }

  async applyFix(fix, endpoint) {
    // Simulate applying fixes based on the fix action
    switch (fix.fix) {
      case 'restart-service':
        return { success: false, message: 'Cannot restart remote service automatically' };
      
      case 'clear-cache':
        try {
          // Try to call a cache clear endpoint if available
          await axios.post(`${this.config.TARGET_URL}/api/v1/admin/clear-cache`, {}, {
            timeout: 5000,
            headers: { 'X-Auto-Fix': 'true' }
          });
          return { success: true, message: 'Cache cleared successfully' };
        } catch (error) {
          return { success: false, message: 'Failed to clear cache' };
        }
      
      case 'force-health-check':
        try {
          await axios.get(`${this.config.TARGET_URL}${endpoint}?force=true`, {
            timeout: 10000
          });
          return { success: true, message: 'Forced health check completed' };
        } catch (error) {
          return { success: false, message: 'Force health check failed' };
        }
      
      default:
        return { success: false, message: 'Unknown fix action' };
    }
  }

  async tryCommonFixes(endpoint, errorResult) {
    const commonFixes = [
      'force-health-check',
      'clear-cache'
    ];

    for (const fixAction of commonFixes) {
      try {
        const fix = { fix: fixAction };
        const result = await this.applyFix(fix, endpoint);
        
        if (result.success) {
          // Save this as a new known fix
          const pattern = this.identifyErrorPattern(errorResult);
          await this.saveKnownFix(pattern, fix, true);
          
          return {
            endpoint,
            pattern,
            action: fixAction,
            success: true,
            message: result.message,
            isNewPattern: true
          };
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  async tryPerformanceFix(performanceResult) {
    if (performanceResult.averageResponseTime > this.config.PERFORMANCE_SLA) {
      // Try to warm up the application
      try {
        const warmupRequests = 3;
        for (let i = 0; i < warmupRequests; i++) {
          await axios.get(this.config.TARGET_URL, { timeout: 5000 });
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        return {
          type: 'performance',
          action: 'application-warmup',
          success: true,
          message: `Executed ${warmupRequests} warmup requests`
        };
      } catch (error) {
        return {
          type: 'performance',
          action: 'application-warmup',
          success: false,
          error: error.message
        };
      }
    }

    return null;
  }

  isFixableError(error) {
    const fixablePatterns = [
      'timeout',
      'ECONNREFUSED',
      'Service Unavailable',
      'Bad Gateway'
    ];

    return fixablePatterns.some(pattern => 
      error.message?.includes(pattern) || 
      error.response?.statusText?.includes(pattern)
    );
  }

  identifyCriticalIssues(results) {
    const criticalIssues = [];

    // Site completely down
    if (results.endpoints.percentage < 50) {
      criticalIssues.push({
        type: 'site-down',
        severity: 'critical',
        message: 'Multiple endpoints are failing - site may be down',
        requiresHumanIntervention: true
      });
    }

    // All UI tests failing
    if (results.ui.overall === 'failed' || results.ui.overall === 'error') {
      criticalIssues.push({
        type: 'ui-failure',
        severity: 'critical',
        message: 'UI functionality tests are failing',
        requiresHumanIntervention: true
      });
    }

    // Severe performance degradation
    if (results.performance.slaViolations > 3 || parseFloat(results.performance.availability) < 60) {
      criticalIssues.push({
        type: 'performance-critical',
        severity: 'critical',
        message: 'Severe performance degradation detected',
        requiresHumanIntervention: true
      });
    }

    // Mock data completely failing
    if (!results.mockData.allWorking && results.mockData.percentage < 50) {
      criticalIssues.push({
        type: 'mock-data-failure',
        severity: 'warning',
        message: 'Mock data fallback mechanisms are failing',
        requiresHumanIntervention: false
      });
    }

    return criticalIssues;
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Endpoint recommendations
    if (results.endpoints.percentage < 100) {
      recommendations.push({
        type: 'endpoints',
        priority: 'high',
        message: `${results.endpoints.total - results.endpoints.healthy} endpoints are unhealthy - investigate server logs`
      });
    }

    // Performance recommendations
    if (results.performance.averageResponseTime > this.config.PERFORMANCE_SLA * 0.8) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `Response times approaching SLA limit (${results.performance.averageResponseTime}ms avg) - consider optimization`
      });
    }

    // UI recommendations
    if (results.ui.accessibility && results.ui.accessibility.score < 0.8) {
      recommendations.push({
        type: 'accessibility',
        priority: 'low',
        message: 'UI accessibility could be improved for better user experience'
      });
    }

    return recommendations;
  }

  calculateOverallHealth(results) {
    let score = 100;

    // Endpoints (40 points)
    score -= (100 - results.endpoints.percentage) * 0.4;

    // UI (20 points)
    if (results.ui.overall !== 'passed') {
      score -= 20;
    }

    // Performance (30 points)
    const perfScore = Math.max(0, 100 - (results.performance.slaViolations * 10));
    score -= (100 - perfScore) * 0.3;

    // Mock data (10 points)
    score -= (100 - results.mockData.percentage) * 0.1;

    score = Math.max(0, score);

    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'critical';
  }

  updateConsecutiveFailures(overallHealth) {
    if (overallHealth === 'critical' || overallHealth === 'poor') {
      this.state.consecutiveFailures++;
    } else {
      this.state.consecutiveFailures = 0;
    }
  }

  async saveHealthReport(results) {
    try {
      const reportPath = path.join(this.config.REPORTS_PATH, `health-report-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(results, null, 2));

      // Also save as latest report
      const latestPath = path.join(this.config.REPORTS_PATH, 'latest-health-report.json');
      await fs.writeFile(latestPath, JSON.stringify(results, null, 2));

      this.log(`Health report saved: ${reportPath}`);
    } catch (error) {
      this.log(`Failed to save health report: ${error.message}`, 'error');
    }
  }

  async handleAlertsAndNotifications(results) {
    const alertsToSend = [];

    // Critical issues always trigger alerts
    results.criticalIssues.forEach(issue => {
      if (issue.severity === 'critical' && !this.state.activeAlerts.has(issue.type)) {
        alertsToSend.push({
          type: issue.type,
          severity: 'CRITICAL',
          message: issue.message,
          timestamp: new Date().toISOString(),
          requiresHumanIntervention: issue.requiresHumanIntervention
        });
        this.state.activeAlerts.add(issue.type);
      }
    });

    // Consecutive failures
    if (this.state.consecutiveFailures >= 3) {
      alertsToSend.push({
        type: 'consecutive-failures',
        severity: 'WARNING',
        message: `${this.state.consecutiveFailures} consecutive health check failures detected`,
        timestamp: new Date().toISOString()
      });
    }

    // Send alerts
    for (const alert of alertsToSend) {
      await this.sendAlert(alert);
    }

    // Clear alerts for resolved issues
    if (results.overall === 'excellent' || results.overall === 'good') {
      this.state.activeAlerts.clear();
    }
  }

  async sendAlert(alert) {
    try {
      // Use existing notification script
      const notifyScript = path.join(__dirname, '..', 'scripts', 'claude-notify-unified.sh');
      
      const message = `🚨 WAR ROOM HEALTH ALERT 🚨\n\n` +
                     `Severity: ${alert.severity}\n` +
                     `Type: ${alert.type}\n` +
                     `Message: ${alert.message}\n` +
                     `Time: ${new Date(alert.timestamp).toLocaleString()}\n` +
                     `Requires Human Intervention: ${alert.requiresHumanIntervention ? 'YES' : 'NO'}`;

      // Execute notification script
      spawn('bash', [notifyScript, message], {
        detached: true,
        stdio: 'ignore'
      });

      this.log(`Alert sent: ${alert.type} (${alert.severity})`);

    } catch (error) {
      this.log(`Failed to send alert: ${error.message}`, 'error');
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [HealthMonitor] ${message}`;
    
    console.log(logMessage);
    
    // Also write to log file
    if (this.config.LOGS_PATH) {
      const logFile = path.join(this.config.LOGS_PATH, 'health-monitor-sub-agent.log');
      fs.appendFile(logFile, logMessage + '\n').catch(() => {});
    }
  }

  // Public API methods
  getStatus() {
    return {
      isRunning: this.state.isRunning,
      lastCheck: this.state.lastCheck?.timestamp || null,
      consecutiveFailures: this.state.consecutiveFailures,
      knownFixesCount: this.state.knownFixes.size,
      activeAlertsCount: this.state.activeAlerts.size,
      performanceHistorySize: this.state.performanceHistory.length
    };
  }

  async getLatestReport() {
    try {
      const reportPath = path.join(this.config.REPORTS_PATH, 'latest-health-report.json');
      const data = await fs.readFile(reportPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async forceHealthCheck() {
    this.log('Forcing immediate health check...');
    return await this.performHealthCheck();
  }
}

// Export the class
module.exports = HealthMonitorSubAgent;

// CLI interface
if (require.main === module) {
  const monitor = new HealthMonitorSubAgent();
  
  const command = process.argv[2] || 'start';
  
  switch (command) {
    case 'start':
      monitor.start();
      break;
      
    case 'stop':
      monitor.stop();
      break;
      
    case 'status':
      console.log(JSON.stringify(monitor.getStatus(), null, 2));
      break;
      
    case 'check':
      monitor.forceHealthCheck().then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.overall === 'critical' ? 1 : 0);
      });
      break;
      
    default:
      console.log('Usage: node health-monitor-sub-agent.js [start|stop|status|check]');
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down health monitor...');
    monitor.stop();
    process.exit(0);
  });
}