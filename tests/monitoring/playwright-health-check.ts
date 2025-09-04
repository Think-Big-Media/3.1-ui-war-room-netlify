import { chromium, expect, type Page, type Browser } from '@playwright/test';

interface HealthCheckConfig {
  baseUrl: string;
  timeout: number;
  maxResponseTime: number;
  endpoints: {
    path: string;
    name: string;
    expectedStatus?: number;
    checkContent?: string[];
  }[];
}

interface CheckResult {
  endpoint: string;
  status: 'pass' | 'fail';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

class WarRoomHealthMonitor {
  private config: HealthCheckConfig;
  private browser: Browser | null = null;
  private results: CheckResult[] = [];

  constructor() {
    this.config = {
      baseUrl: 'https://war-room-oa9t.onrender.com',
      timeout: 30000,
      maxResponseTime: 3000, // 3 seconds as per requirement
      endpoints: [
        {
          path: '/',
          name: 'Homepage',
          expectedStatus: 200,
          checkContent: ['War Room', 'Command Center'],
        },
        {
          path: '/api/v1/health',
          name: 'API Health',
          expectedStatus: 200,
        },
        {
          path: '/command-center',
          name: 'Command Center',
          expectedStatus: 200,
          checkContent: ['Campaign Status', 'Analytics'],
        },
        {
          path: '/real-time-monitoring',
          name: 'Real-Time Monitoring',
          expectedStatus: 200,
          checkContent: ['Live Data', 'Monitoring'],
        },
        {
          path: '/campaign-control',
          name: 'Campaign Control',
          expectedStatus: 200,
          checkContent: ['Projects', 'Assets'],
        },
        {
          path: '/intelligence-hub',
          name: 'Intelligence Hub',
          expectedStatus: 200,
          checkContent: ['Documents', 'Intelligence'],
        },
        {
          path: '/alert-center',
          name: 'Alert Center',
          expectedStatus: 200,
          checkContent: ['Alerts', 'Information Streams'],
        },
      ],
    };
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async checkEndpoint(page: Page, endpoint: typeof this.config.endpoints[0]): Promise<CheckResult> {
    const startTime = Date.now();
    const result: CheckResult = {
      endpoint: endpoint.name,
      status: 'fail',
      responseTime: 0,
      timestamp: new Date(),
    };

    try {
      // Navigate with response monitoring
      const response = await page.goto(
        `${this.config.baseUrl}${endpoint.path}`,
        {
          waitUntil: 'networkidle',
          timeout: this.config.timeout,
        },
      );

      result.responseTime = Date.now() - startTime;
      result.statusCode = response?.status();

      // Check status code
      if (endpoint.expectedStatus && result.statusCode !== endpoint.expectedStatus) {
        result.error = `Expected status ${endpoint.expectedStatus}, got ${result.statusCode}`;
        return result;
      }

      // Check response time
      if (result.responseTime > this.config.maxResponseTime) {
        result.error = `Response time ${result.responseTime}ms exceeds maximum ${this.config.maxResponseTime}ms`;
        return result;
      }

      // Check content if specified
      if (endpoint.checkContent) {
        for (const content of endpoint.checkContent) {
          try {
            await page.waitForSelector(`text=${content}`, { timeout: 5000 });
          } catch {
            result.error = `Expected content "${content}" not found`;
            return result;
          }
        }
      }

      // Check for JavaScript errors
      const jsErrors: string[] = [];
      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });

      // Wait a bit to catch any async errors
      await page.waitForTimeout(1000);

      if (jsErrors.length > 0) {
        result.error = `JavaScript errors detected: ${jsErrors.join(', ')}`;
        return result;
      }

      result.status = 'pass';
    } catch (error) {
      result.error = `Navigation error: ${error instanceof Error ? error.message : String(error)}`;
    }

    return result;
  }

  async runHealthChecks(): Promise<void> {
    if (!this.browser) {
      await this.initialize();
    }

    const context = await this.browser!.newContext({
      userAgent: 'WarRoom-HealthCheck-Bot/1.0',
    });

    console.log(`🏥 Starting health checks for ${this.config.baseUrl}`);
    console.log(`⏱️  Max response time: ${this.config.maxResponseTime}ms\n`);

    for (const endpoint of this.config.endpoints) {
      const page = await context.newPage();

      try {
        const result = await this.checkEndpoint(page, endpoint);
        this.results.push(result);

        const statusIcon = result.status === 'pass' ? '✅' : '❌';
        const responseTimeIcon = result.responseTime <= this.config.maxResponseTime ? '⚡' : '🐌';

        console.log(`${statusIcon} ${endpoint.name} (${endpoint.path})`);
        console.log(`   ${responseTimeIcon} Response time: ${result.responseTime}ms`);
        if (result.statusCode) {
          console.log(`   📊 Status code: ${result.statusCode}`);
        }
        if (result.error) {
          console.log(`   ⚠️  Error: ${result.error}`);
        }
        console.log('');
      } finally {
        await page.close();
      }
    }

    await context.close();
  }

  async generateReport(): Promise<string> {
    const totalChecks = this.results.length;
    const passedChecks = this.results.filter(r => r.status === 'pass').length;
    const failedChecks = totalChecks - passedChecks;
    const avgResponseTime = Math.round(
      this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalChecks,
    );

    const report = `
# War Room Health Check Report
Generated: ${new Date().toISOString()}
URL: ${this.config.baseUrl}

## Summary
- Total Checks: ${totalChecks}
- ✅ Passed: ${passedChecks}
- ❌ Failed: ${failedChecks}
- ⏱️  Average Response Time: ${avgResponseTime}ms
- 🎯 Target Response Time: ${this.config.maxResponseTime}ms

## Detailed Results
${this.results.map(r => `
### ${r.endpoint}
- Status: ${r.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
- Response Time: ${r.responseTime}ms ${r.responseTime <= this.config.maxResponseTime ? '⚡' : '🐌'}
- Status Code: ${r.statusCode || 'N/A'}
${r.error ? `- Error: ${r.error}` : ''}
`).join('\n')}

## Performance Analysis
- Fastest Endpoint: ${this.results.reduce((a, b) => a.responseTime < b.responseTime ? a : b).endpoint} (${Math.min(...this.results.map(r => r.responseTime))}ms)
- Slowest Endpoint: ${this.results.reduce((a, b) => a.responseTime > b.responseTime ? a : b).endpoint} (${Math.max(...this.results.map(r => r.responseTime))}ms)
${failedChecks > 0 ? '\n⚠️  **ACTION REQUIRED**: Some health checks failed. Please investigate immediately.' : '\n✅ **All systems operational**'}
`;

    return report;
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getResults(): CheckResult[] {
    return this.results;
  }

  hasFailures(): boolean {
    return this.results.some(r => r.status === 'fail');
  }
}

// Main execution
async function main() {
  const monitor = new WarRoomHealthMonitor();

  try {
    await monitor.runHealthChecks();
    const report = await monitor.generateReport();

    console.log(`\n${  '='.repeat(60)}`);
    console.log(report);

    // Save report
    const fs = await import('fs/promises');
    const reportPath = `tests/monitoring/health-report-${Date.now()}.md`;
    await fs.writeFile(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(monitor.hasFailures() ? 1 : 0);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  } finally {
    await monitor.cleanup();
  }
}

// Export for use in other scripts
export { WarRoomHealthMonitor, CheckResult, HealthCheckConfig };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
