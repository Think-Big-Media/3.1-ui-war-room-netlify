// Site Monitoring Service
const MONITORING_CONFIG = {
  siteUrl: 'https://war-room-oa9t.onrender.com',
  checkInterval: 5 * 60 * 1000, // 5 minutes
  timeout: 30000,
  endpoints: {
    health: '/api/health',
    status: '/api/v1/status',
    docs: '/docs',
  },
  alertThresholds: {
    responseTime: 5000, // 5 seconds
    errorRate: 0.1, // 10%
    uptime: 0.99, // 99%
  },
};

class MonitoringService {
  constructor() {
    this.metrics = {
      checks: 0,
      failures: 0,
      totalResponseTime: 0,
      lastCheck: null,
      status: 'unknown',
      errors: [],
    };
  }

  async checkSiteHealth() {
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      success: true,
      responseTime: 0,
      checks: {},
    };

    try {
      // Check main site
      const siteResponse = await fetch(MONITORING_CONFIG.siteUrl, {
        signal: AbortSignal.timeout(MONITORING_CONFIG.timeout),
      });

      results.checks.frontend = {
        status: siteResponse.status,
        ok: siteResponse.ok,
        responseTime: Date.now() - startTime,
      };

      // Check API endpoints
      for (const [name, endpoint] of Object.entries(MONITORING_CONFIG.endpoints)) {
        try {
          const endpointStart = Date.now();
          const response = await fetch(`${MONITORING_CONFIG.siteUrl}${endpoint}`, {
            signal: AbortSignal.timeout(10000),
          });

          results.checks[name] = {
            status: response.status,
            ok: response.ok,
            responseTime: Date.now() - endpointStart,
          };
        } catch (error) {
          results.checks[name] = {
            status: 0,
            ok: false,
            error: error.message,
          };
          results.success = false;
        }
      }

      results.responseTime = Date.now() - startTime;
      this.updateMetrics(results);

      return results;
    } catch (error) {
      results.success = false;
      results.error = error.message;
      this.updateMetrics(results);
      return results;
    }
  }

  updateMetrics(results) {
    this.metrics.checks++;
    this.metrics.lastCheck = results.timestamp;

    if (!results.success) {
      this.metrics.failures++;
      this.metrics.status = 'down';
      this.metrics.errors.push({
        timestamp: results.timestamp,
        error: results.error || 'Unknown error',
      });
    } else {
      this.metrics.status = 'up';
      this.metrics.totalResponseTime += results.responseTime;
    }

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }
  }

  getMetrics() {
    const uptime =
      this.metrics.checks > 0
        ? ((this.metrics.checks - this.metrics.failures) / this.metrics.checks) * 100
        : 0;

    const avgResponseTime =
      this.metrics.checks > this.metrics.failures
        ? this.metrics.totalResponseTime / (this.metrics.checks - this.metrics.failures)
        : 0;

    return {
      ...this.metrics,
      uptime: uptime.toFixed(2) + '%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
      errorRate: ((this.metrics.failures / this.metrics.checks) * 100).toFixed(2) + '%',
    };
  }

  startMonitoring() {
    console.log('Starting War Room site monitoring...');
    this.checkSiteHealth(); // Initial check

    this.intervalId = setInterval(() => {
      this.checkSiteHealth();
    }, MONITORING_CONFIG.checkInterval);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Monitoring stopped');
    }
  }
}

module.exports = { MonitoringService, MONITORING_CONFIG };
