import { WarRoomHealthMonitor, type CheckResult } from './playwright-health-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MonitoringConfig {
  intervalMinutes: number;
  maxFailuresBeforeAlert: number;
  retryDelaySeconds: number;
  logRetentionDays: number;
}

interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  responseTime: number;
  status: 'pass' | 'fail';
}

class ContinuousMonitor {
  private config: MonitoringConfig;
  private failureCount: Map<string, number> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];
  private monitor: WarRoomHealthMonitor;
  private logDir: string;

  constructor() {
    this.config = {
      intervalMinutes: 5,
      maxFailuresBeforeAlert: 3,
      retryDelaySeconds: 30,
      logRetentionDays: 7,
    };
    this.monitor = new WarRoomHealthMonitor();
    this.logDir = path.join(__dirname, 'logs');
  }

  async initialize(): Promise<void> {
    // Create logs directory
    await fs.mkdir(this.logDir, { recursive: true });

    // Clean old logs
    await this.cleanOldLogs();
  }

  async runContinuousMonitoring(): Promise<void> {
    console.log('🔄 Starting continuous monitoring...');
    console.log(`📊 Interval: ${this.config.intervalMinutes} minutes`);
    console.log(`🚨 Alert threshold: ${this.config.maxFailuresBeforeAlert} consecutive failures\n`);

    while (true) {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Monitoring cycle error:', error);
      }

      // Wait for next cycle
      await this.sleep(this.config.intervalMinutes * 60 * 1000);
    }
  }

  private async performHealthCheck(): Promise<void> {
    console.log(`\n🏥 Health check started at ${new Date().toISOString()}`);

    await this.monitor.initialize();
    await this.monitor.runHealthChecks();

    const results = this.monitor.getResults();
    await this.processResults(results);

    // Save performance metrics
    await this.savePerformanceMetrics(results);

    // Generate and save report
    const report = await this.monitor.generateReport();
    await this.saveReport(report);

    // Check for alerts
    await this.checkAlertConditions(results);

    await this.monitor.cleanup();
  }

  private async processResults(results: CheckResult[]): Promise<void> {
    for (const result of results) {
      // Track performance metrics
      this.performanceHistory.push({
        timestamp: result.timestamp,
        endpoint: result.endpoint,
        responseTime: result.responseTime,
        status: result.status,
      });

      // Track failures
      if (result.status === 'fail') {
        const currentFailures = this.failureCount.get(result.endpoint) || 0;
        this.failureCount.set(result.endpoint, currentFailures + 1);
      } else {
        // Reset failure count on success
        this.failureCount.set(result.endpoint, 0);
      }
    }

    // Keep only recent history (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.performanceHistory = this.performanceHistory.filter(
      m => m.timestamp > oneDayAgo,
    );
  }

  private async checkAlertConditions(results: CheckResult[]): Promise<void> {
    const criticalFailures: string[] = [];

    for (const [endpoint, failures] of this.failureCount.entries()) {
      if (failures >= this.config.maxFailuresBeforeAlert) {
        criticalFailures.push(endpoint);
      }
    }

    // Check for performance degradation
    const slowEndpoints = results.filter(
      r => r.responseTime > 3000, // 3-second threshold
    );

    if (criticalFailures.length > 0 || slowEndpoints.length > 0) {
      await this.sendAlert(criticalFailures, slowEndpoints);
    }
  }

  private async sendAlert(criticalFailures: string[], slowEndpoints: CheckResult[]): Promise<void> {
    let alertMessage = '🚨 WAR ROOM MONITORING ALERT\n\n';

    if (criticalFailures.length > 0) {
      alertMessage += `❌ CRITICAL FAILURES (${criticalFailures.length}):\n`;
      criticalFailures.forEach(endpoint => {
        const failures = this.failureCount.get(endpoint) || 0;
        alertMessage += `- ${endpoint}: ${failures} consecutive failures\n`;
      });
      alertMessage += '\n';
    }

    if (slowEndpoints.length > 0) {
      alertMessage += `🐌 SLOW ENDPOINTS (${slowEndpoints.length}):\n`;
      slowEndpoints.forEach(endpoint => {
        alertMessage += `- ${endpoint.endpoint}: ${endpoint.responseTime}ms\n`;
      });
    }

    console.error(`\n${  alertMessage}`);

    // Send notification
    const scriptPath = '/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh';
    try {
      await execAsync(`${scriptPath} error "War Room Alert" "${alertMessage.replace(/\n/g, '\\n')}"`);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    // Log alert
    await this.logAlert(alertMessage);
  }

  private async savePerformanceMetrics(results: CheckResult[]): Promise<void> {
    const metricsPath = path.join(this.logDir, 'performance-metrics.json');

    // Calculate aggregated metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        averageResponseTime: Math.round(
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
        ),
        maxResponseTime: Math.max(...results.map(r => r.responseTime)),
        minResponseTime: Math.min(...results.map(r => r.responseTime)),
      },
      endpoints: results.map(r => ({
        name: r.endpoint,
        status: r.status,
        responseTime: r.responseTime,
        statusCode: r.statusCode,
        error: r.error,
      })),
      performanceTrend: this.calculatePerformanceTrend(),
    };

    // Append to metrics file
    try {
      const existingData = await fs.readFile(metricsPath, 'utf-8').catch(() => '[]');
      const metricsArray = JSON.parse(existingData);
      metricsArray.push(metrics);

      // Keep only last 1000 entries
      if (metricsArray.length > 1000) {
        metricsArray.splice(0, metricsArray.length - 1000);
      }

      await fs.writeFile(metricsPath, JSON.stringify(metricsArray, null, 2));
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  private calculatePerformanceTrend(): { [endpoint: string]: number } {
    const trends: { [endpoint: string]: number } = {};

    // Group by endpoint
    const endpointGroups = new Map<string, PerformanceMetrics[]>();
    for (const metric of this.performanceHistory) {
      const group = endpointGroups.get(metric.endpoint) || [];
      group.push(metric);
      endpointGroups.set(metric.endpoint, group);
    }

    // Calculate trend for each endpoint
    for (const [endpoint, metrics] of endpointGroups.entries()) {
      if (metrics.length < 2) {continue;}

      // Calculate average response time trend (positive = getting slower)
      const recentMetrics = metrics.slice(-10); // Last 10 measurements
      const olderMetrics = metrics.slice(-20, -10); // Previous 10

      if (olderMetrics.length > 0) {
        const recentAvg = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
        const olderAvg = olderMetrics.reduce((sum, m) => sum + m.responseTime, 0) / olderMetrics.length;
        trends[endpoint] = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
      }
    }

    return trends;
  }

  private async saveReport(report: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = path.join(this.logDir, `health-report-${timestamp}.md`);
    await fs.writeFile(reportPath, report);
  }

  private async logAlert(message: string): Promise<void> {
    const alertPath = path.join(this.logDir, 'alerts.log');
    const logEntry = `${new Date().toISOString()} ${message}\n${'='.repeat(80)}\n\n`;
    await fs.appendFile(alertPath, logEntry);
  }

  private async cleanOldLogs(): Promise<void> {
    const files = await fs.readdir(this.logDir);
    const cutoffDate = new Date(Date.now() - this.config.logRetentionDays * 24 * 60 * 60 * 1000);

    for (const file of files) {
      if (file.startsWith('health-report-')) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`🗑️  Cleaned old log: ${file}`);
        }
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generatePerformanceReport(): Promise<string> {
    const metricsPath = path.join(this.logDir, 'performance-metrics.json');

    try {
      const data = await fs.readFile(metricsPath, 'utf-8');
      const metrics = JSON.parse(data);

      // Get last 24 hours of data
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentMetrics = metrics.filter((m: any) =>
        new Date(m.timestamp) > oneDayAgo,
      );

      return `
# War Room Performance Report
Generated: ${new Date().toISOString()}

## 24-Hour Summary
- Total Checks: ${recentMetrics.length}
- Average Response Time: ${Math.round(
    recentMetrics.reduce((sum: number, m: any) => sum + m.summary.averageResponseTime, 0) / recentMetrics.length,
  )}ms
- Success Rate: ${(
    (recentMetrics.reduce((sum: number, m: any) => sum + m.summary.passed, 0) /
   recentMetrics.reduce((sum: number, m: any) => sum + m.summary.totalChecks, 0)) * 100
  ).toFixed(2)}%

## Performance Trends
${Object.entries(metrics[metrics.length - 1]?.performanceTrend || {})
    .map(([endpoint, trend]) => `- ${endpoint}: ${trend > 0 ? '📈' : '📉'} ${Math.abs(trend)}%`)
    .join('\n')}
`;
    } catch (error) {
      return 'No performance data available yet.';
    }
  }
}

// Export for use
export { ContinuousMonitor, MonitoringConfig, PerformanceMetrics };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new ContinuousMonitor();
  monitor.initialize().then(() => {
    monitor.runContinuousMonitoring();
  });
}
