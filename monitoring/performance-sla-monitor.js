#!/usr/bin/env node

/**
 * Performance SLA Monitor
 * 
 * Enforces 3-second response time SLA for the War Room application
 * Provides real-time performance tracking, alerting, and historical analysis
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class PerformanceSLAMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      TARGET_URL: config.TARGET_URL || 'https://war-room-oa9t.onrender.com',
      SLA_THRESHOLD: config.SLA_THRESHOLD || 3000, // 3 seconds
      WARNING_THRESHOLD: config.WARNING_THRESHOLD || 2400, // 2.4 seconds (80% of SLA)
      MONITORING_INTERVAL: config.MONITORING_INTERVAL || 300000, // 5 minutes
      PERFORMANCE_WINDOW: config.PERFORMANCE_WINDOW || 3600000, // 1 hour
      MAX_RETRIES: config.MAX_RETRIES || 3,
      TIMEOUT: config.TIMEOUT || 15000,
      REPORTS_PATH: config.REPORTS_PATH || path.join(__dirname, 'reports', 'performance'),
      LOGS_PATH: config.LOGS_PATH || path.join(__dirname, 'logs'),
      
      // SLA enforcement thresholds
      SLA_VIOLATION_TOLERANCE: config.SLA_VIOLATION_TOLERANCE || 0.1, // 10% violations allowed
      CRITICAL_VIOLATION_THRESHOLD: config.CRITICAL_VIOLATION_THRESHOLD || 0.2, // 20% = critical
      
      // Performance test endpoints
      ENDPOINTS: config.ENDPOINTS || [
        '/',
        '/dashboard',
        '/monitoring',
        '/analytics',
        '/api/health',
        '/api/v1/status'
      ]
    };
    
    this.state = {
      isRunning: false,
      performanceHistory: [],
      currentWindow: [],
      slaViolations: [],
      performanceMetrics: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slaCompliance: 100,
        availability: 100,
        totalRequests: 0,
        violationCount: 0
      },
      alerts: {
        slaViolation: false,
        criticalPerformance: false,
        degradedService: false
      }
    };
    
    this.monitoringInterval = null;
    this.initializeDirectories();
  }
  
  async initializeDirectories() {
    const dirs = [this.config.REPORTS_PATH, this.config.LOGS_PATH];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error.message);
      }
    }
  }
  
  start() {
    if (this.state.isRunning) {
      this.log('Performance SLA monitor is already running');
      return;
    }
    
    this.log('Starting Performance SLA Monitor...');
    this.state.isRunning = true;
    
    // Perform initial check
    this.performPerformanceCheck();
    
    // Schedule regular monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.performPerformanceCheck();
    }, this.config.MONITORING_INTERVAL);
    
    this.log(`Performance monitoring started - checking every ${this.config.MONITORING_INTERVAL / 1000} seconds`);
    this.log(`SLA Threshold: ${this.config.SLA_THRESHOLD}ms`);
    this.emit('started');
  }
  
  stop() {
    if (!this.state.isRunning) {
      this.log('Performance SLA monitor is not running');
      return;
    }
    
    this.log('Stopping Performance SLA Monitor...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.state.isRunning = false;
    this.log('Performance SLA monitor stopped');
    this.emit('stopped');
  }
  
  async performPerformanceCheck() {
    const checkId = `perf-${Date.now()}`;
    this.log(`Starting performance check: ${checkId}`);
    
    const results = {
      checkId,
      timestamp: new Date().toISOString(),
      endpoints: {},
      summary: {},
      slaStatus: 'compliant',
      violations: [],
      recommendations: []
    };
    
    try {
      // Test all configured endpoints
      for (const endpoint of this.config.ENDPOINTS) {
        const endpointResult = await this.testEndpointPerformance(endpoint);
        results.endpoints[endpoint] = endpointResult;
        
        // Check for SLA violations
        if (endpointResult.responseTime > this.config.SLA_THRESHOLD) {
          const violation = {
            endpoint,
            responseTime: endpointResult.responseTime,
            threshold: this.config.SLA_THRESHOLD,
            severity: this.calculateViolationSeverity(endpointResult.responseTime),
            timestamp: new Date().toISOString()
          };
          
          results.violations.push(violation);
          this.state.slaViolations.push(violation);
        }
      }
      
      // Calculate overall performance metrics
      results.summary = this.calculatePerformanceMetrics(results.endpoints);
      
      // Determine SLA status
      results.slaStatus = this.determineSLAStatus(results.summary);
      
      // Update state
      this.updatePerformanceState(results);
      
      // Generate recommendations
      results.recommendations = this.generatePerformanceRecommendations(results);
      
      // Handle alerts
      await this.handlePerformanceAlerts(results);
      
      // Save results
      await this.savePerformanceReport(results);
      
      this.log(`Performance check completed: ${results.slaStatus} (Avg: ${results.summary.averageResponseTime}ms)`);
      this.emit('performanceCheckComplete', results);
      
    } catch (error) {
      this.log(`Performance check failed: ${error.message}`, 'error');
      this.emit('performanceCheckError', error);
    }
    
    return results;
  }
  
  async testEndpointPerformance(endpoint) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.TARGET_URL}${endpoint}`;
    const results = {
      endpoint,
      url,
      measurements: [],
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      successRate: 0,
      errors: []
    };
    
    // Perform multiple measurements for accuracy
    const measurementCount = 3;
    const measurements = [];
    
    for (let i = 0; i < measurementCount; i++) {
      const measurement = await this.measureSingleRequest(url);
      measurements.push(measurement);
      results.measurements.push(measurement);
      
      if (!measurement.success) {
        results.errors.push(measurement.error);
      }
      
      // Small delay between measurements
      if (i < measurementCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Calculate statistics
    const successfulMeasurements = measurements.filter(m => m.success);
    const responseTimes = successfulMeasurements.map(m => m.responseTime);
    
    if (responseTimes.length > 0) {
      results.averageResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
      results.minResponseTime = Math.min(...responseTimes);
      results.maxResponseTime = Math.max(...responseTimes);
      results.responseTime = results.averageResponseTime; // For compatibility
    } else {
      results.responseTime = this.config.TIMEOUT; // Treat failures as timeout
    }
    
    results.successRate = (successfulMeasurements.length / measurementCount) * 100;
    
    return results;
  }
  
  async measureSingleRequest(url) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        timeout: this.config.TIMEOUT,
        headers: {
          'User-Agent': 'WarRoom-Performance-Monitor/1.0',
          'Cache-Control': 'no-cache'
        },
        validateStatus: (status) => status < 500 // Accept 4xx as successful for performance measurement
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        statusCode: response.status,
        contentLength: response.data?.length || 0,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error.message,
        statusCode: error.response?.status || 0,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  calculatePerformanceMetrics(endpointResults) {
    const allMeasurements = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let violationCount = 0;
    
    // Collect all measurements
    for (const [endpoint, result] of Object.entries(endpointResults)) {
      result.measurements.forEach(measurement => {
        allMeasurements.push(measurement);
        totalRequests++;
        
        if (measurement.success) {
          successfulRequests++;
        }
        
        if (measurement.responseTime > this.config.SLA_THRESHOLD) {
          violationCount++;
        }
      });
    }
    
    // Calculate response time statistics
    const successfulMeasurements = allMeasurements.filter(m => m.success);
    const responseTimes = successfulMeasurements.map(m => m.responseTime).sort((a, b) => a - b);
    
    const metrics = {
      totalRequests,
      successfulRequests,
      violationCount,
      availability: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      slaCompliance: totalRequests > 0 ? ((totalRequests - violationCount) / totalRequests) * 100 : 0,
      averageResponseTime: 0,
      medianResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0
    };
    
    if (responseTimes.length > 0) {
      metrics.averageResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
      metrics.medianResponseTime = this.calculatePercentile(responseTimes, 50);
      metrics.p95ResponseTime = this.calculatePercentile(responseTimes, 95);
      metrics.p99ResponseTime = this.calculatePercentile(responseTimes, 99);
      metrics.minResponseTime = responseTimes[0];
      metrics.maxResponseTime = responseTimes[responseTimes.length - 1];
    }
    
    return metrics;
  }
  
  calculatePercentile(sortedArray, percentile) {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
  
  calculateViolationSeverity(responseTime) {
    const multiplier = responseTime / this.config.SLA_THRESHOLD;
    
    if (multiplier >= 3) return 'critical';
    if (multiplier >= 2) return 'major';
    if (multiplier >= 1.5) return 'minor';
    return 'warning';
  }
  
  determineSLAStatus(metrics) {
    if (metrics.slaCompliance >= 100 - this.config.SLA_VIOLATION_TOLERANCE * 100) {
      return 'compliant';
    } else if (metrics.slaCompliance >= 100 - this.config.CRITICAL_VIOLATION_THRESHOLD * 100) {
      return 'degraded';
    } else {
      return 'violated';
    }
  }
  
  updatePerformanceState(results) {
    // Add to performance history
    this.state.performanceHistory.push({
      timestamp: results.timestamp,
      metrics: results.summary,
      slaStatus: results.slaStatus
    });
    
    // Maintain history size (keep last 100 checks)
    if (this.state.performanceHistory.length > 100) {
      this.state.performanceHistory = this.state.performanceHistory.slice(-100);
    }
    
    // Update current performance window
    const windowStart = Date.now() - this.config.PERFORMANCE_WINDOW;
    this.state.currentWindow = this.state.performanceHistory.filter(
      entry => new Date(entry.timestamp).getTime() > windowStart
    );
    
    // Update current metrics
    this.state.performanceMetrics = results.summary;
    
    // Clean old violations (keep only last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.state.slaViolations = this.state.slaViolations.filter(
      violation => new Date(violation.timestamp).getTime() > dayAgo
    );
  }
  
  generatePerformanceRecommendations(results) {
    const recommendations = [];
    const metrics = results.summary;
    
    // SLA compliance recommendations
    if (metrics.slaCompliance < 95) {
      recommendations.push({
        type: 'sla-compliance',
        priority: 'high',
        message: `SLA compliance is ${metrics.slaCompliance.toFixed(1)}% - investigate performance bottlenecks`,
        action: 'Optimize slow endpoints and consider infrastructure scaling'
      });
    }
    
    // Response time recommendations
    if (metrics.averageResponseTime > this.config.WARNING_THRESHOLD) {
      recommendations.push({
        type: 'response-time',
        priority: 'medium',
        message: `Average response time (${metrics.averageResponseTime}ms) approaching SLA threshold`,
        action: 'Review application performance and optimize critical paths'
      });
    }
    
    // P95/P99 recommendations
    if (metrics.p95ResponseTime > this.config.SLA_THRESHOLD * 1.2) {
      recommendations.push({
        type: 'tail-latency',
        priority: 'medium',
        message: `95th percentile response time (${metrics.p95ResponseTime}ms) is high`,
        action: 'Investigate and optimize slowest requests'
      });
    }
    
    // Availability recommendations
    if (metrics.availability < 99) {
      recommendations.push({
        type: 'availability',
        priority: 'critical',
        message: `Service availability is ${metrics.availability.toFixed(1)}%`,
        action: 'Investigate service reliability and error rates'
      });
    }
    
    // Endpoint-specific recommendations
    for (const [endpoint, result] of Object.entries(results.endpoints)) {
      if (result.successRate < 95) {
        recommendations.push({
          type: 'endpoint-reliability',
          priority: 'high',
          message: `Endpoint ${endpoint} has ${result.successRate.toFixed(1)}% success rate`,
          action: `Investigate errors on ${endpoint} endpoint`
        });
      }
    }
    
    return recommendations;
  }
  
  async handlePerformanceAlerts(results) {
    const previousAlerts = { ...this.state.alerts };
    
    // SLA violation alert
    if (results.slaStatus === 'violated' && !this.state.alerts.slaViolation) {
      await this.sendAlert({
        type: 'sla-violation',
        severity: 'CRITICAL',
        message: `SLA VIOLATION: Service performance is below acceptable levels (${results.summary.slaCompliance.toFixed(1)}% compliance)`,
        metrics: results.summary
      });
      this.state.alerts.slaViolation = true;
    }
    
    // Critical performance alert
    if (results.summary.averageResponseTime > this.config.SLA_THRESHOLD * 1.5 && !this.state.alerts.criticalPerformance) {
      await this.sendAlert({
        type: 'critical-performance',
        severity: 'CRITICAL',
        message: `CRITICAL PERFORMANCE: Average response time is ${results.summary.averageResponseTime}ms (${this.config.SLA_THRESHOLD}ms threshold)`,
        metrics: results.summary
      });
      this.state.alerts.criticalPerformance = true;
    }
    
    // Degraded service alert
    if (results.slaStatus === 'degraded' && !this.state.alerts.degradedService) {
      await this.sendAlert({
        type: 'degraded-service',
        severity: 'WARNING',
        message: `DEGRADED SERVICE: Performance is below optimal levels (${results.summary.slaCompliance.toFixed(1)}% SLA compliance)`,
        metrics: results.summary
      });
      this.state.alerts.degradedService = true;
    }
    
    // Clear alerts when performance improves
    if (results.slaStatus === 'compliant') {
      if (previousAlerts.slaViolation || previousAlerts.criticalPerformance || previousAlerts.degradedService) {
        await this.sendAlert({
          type: 'performance-recovered',
          severity: 'INFO',
          message: `PERFORMANCE RECOVERED: Service is now meeting SLA requirements (${results.summary.slaCompliance.toFixed(1)}% compliance)`,
          metrics: results.summary
        });
      }
      
      this.state.alerts = {
        slaViolation: false,
        criticalPerformance: false,
        degradedService: false
      };
    }
  }
  
  async sendAlert(alert) {
    try {
      const message = `🚨 PERFORMANCE ALERT 🚨\n\n` +
                     `Type: ${alert.type}\n` +
                     `Severity: ${alert.severity}\n` +
                     `Message: ${alert.message}\n` +
                     `Timestamp: ${new Date().toLocaleString()}\n\n` +
                     `Current Metrics:\n` +
                     `- Average Response: ${alert.metrics.averageResponseTime}ms\n` +
                     `- SLA Compliance: ${alert.metrics.slaCompliance.toFixed(1)}%\n` +
                     `- Availability: ${alert.metrics.availability.toFixed(1)}%\n` +
                     `- P95 Response: ${alert.metrics.p95ResponseTime}ms`;
      
      // Use existing notification system
      const notifyScript = path.join(__dirname, '..', 'scripts', 'claude-notify-unified.sh');
      const { spawn } = require('child_process');
      
      spawn('bash', [notifyScript, message], {
        detached: true,
        stdio: 'ignore'
      });
      
      this.log(`Performance alert sent: ${alert.type} (${alert.severity})`);
      
    } catch (error) {
      this.log(`Failed to send performance alert: ${error.message}`, 'error');
    }
  }
  
  async savePerformanceReport(results) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(this.config.REPORTS_PATH, `performance-report-${timestamp}.json`);
      
      await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
      
      // Also save as latest report
      const latestPath = path.join(this.config.REPORTS_PATH, 'latest-performance-report.json');
      await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
      
      // Create daily summary
      await this.updateDailySummary(results);
      
    } catch (error) {
      this.log(`Failed to save performance report: ${error.message}`, 'error');
    }
  }
  
  async updateDailySummary(results) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const summaryPath = path.join(this.config.REPORTS_PATH, `daily-summary-${today}.json`);
      
      let dailySummary;
      try {
        const data = await fs.readFile(summaryPath, 'utf8');
        dailySummary = JSON.parse(data);
      } catch (error) {
        dailySummary = {
          date: today,
          checks: [],
          totalChecks: 0,
          slaViolations: 0,
          averageResponseTime: 0,
          bestResponseTime: Infinity,
          worstResponseTime: 0,
          slaComplianceHistory: []
        };
      }
      
      // Add current check to daily summary
      dailySummary.checks.push({
        timestamp: results.timestamp,
        slaStatus: results.slaStatus,
        metrics: results.summary
      });
      
      dailySummary.totalChecks++;
      if (results.slaStatus !== 'compliant') {
        dailySummary.slaViolations++;
      }
      
      // Update aggregated metrics
      dailySummary.averageResponseTime = Math.round(
        dailySummary.checks.reduce((sum, check) => sum + check.metrics.averageResponseTime, 0) / dailySummary.checks.length
      );
      
      dailySummary.bestResponseTime = Math.min(dailySummary.bestResponseTime, results.summary.averageResponseTime);
      dailySummary.worstResponseTime = Math.max(dailySummary.worstResponseTime, results.summary.averageResponseTime);
      
      dailySummary.slaComplianceHistory.push(results.summary.slaCompliance);
      
      await fs.writeFile(summaryPath, JSON.stringify(dailySummary, null, 2));
      
    } catch (error) {
      this.log(`Failed to update daily summary: ${error.message}`, 'error');
    }
  }
  
  // Public API methods
  getStatus() {
    return {
      isRunning: this.state.isRunning,
      currentMetrics: this.state.performanceMetrics,
      slaStatus: this.determineSLAStatus(this.state.performanceMetrics),
      alerts: this.state.alerts,
      historySize: this.state.performanceHistory.length,
      recentViolations: this.state.slaViolations.length
    };
  }
  
  getPerformanceHistory(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.state.performanceHistory.filter(
      entry => new Date(entry.timestamp).getTime() > cutoff
    );
  }
  
  async forcePerformanceCheck() {
    this.log('Forcing immediate performance check...');
    return await this.performPerformanceCheck();
  }
  
  generateSLAReport(periodHours = 24) {
    const history = this.getPerformanceHistory(periodHours);
    
    if (history.length === 0) {
      return { error: 'No performance data available for the specified period' };
    }
    
    const totalChecks = history.length;
    const violatedChecks = history.filter(h => h.slaStatus === 'violated').length;
    const degradedChecks = history.filter(h => h.slaStatus === 'degraded').length;
    const compliantChecks = totalChecks - violatedChecks - degradedChecks;
    
    const avgResponseTimes = history.map(h => h.metrics.averageResponseTime);
    const avgResponseTime = avgResponseTimes.reduce((sum, time) => sum + time, 0) / avgResponseTimes.length;
    
    return {
      period: `${periodHours} hours`,
      totalChecks,
      slaCompliance: {
        compliant: compliantChecks,
        degraded: degradedChecks,
        violated: violatedChecks,
        compliancePercentage: (compliantChecks / totalChecks) * 100
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        bestResponseTime: Math.min(...avgResponseTimes),
        worstResponseTime: Math.max(...avgResponseTimes)
      },
      timestamp: new Date().toISOString()
    };
  }
  
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [PerformanceSLA] ${message}`;
    
    console.log(logMessage);
    
    // Also write to log file
    if (this.config.LOGS_PATH) {
      const logFile = path.join(this.config.LOGS_PATH, 'performance-sla-monitor.log');
      fs.appendFile(logFile, logMessage + '\n').catch(() => {});
    }
  }
}

module.exports = PerformanceSLAMonitor;

// CLI interface
if (require.main === module) {
  const monitor = new PerformanceSLAMonitor();
  
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
      monitor.forcePerformanceCheck().then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.slaStatus === 'violated' ? 1 : 0);
      });
      break;
      
    case 'report':
      const hours = parseInt(process.argv[3]) || 24;
      console.log(JSON.stringify(monitor.generateSLAReport(hours), null, 2));
      break;
      
    default:
      console.log('Usage: node performance-sla-monitor.js [start|stop|status|check|report <hours>]');
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down performance monitor...');
    monitor.stop();
    process.exit(0);
  });
}