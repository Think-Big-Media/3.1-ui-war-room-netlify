/**
 * Backend Connection Testing Utilities
 * Tests connection to Leap.new backend when ready
 */

interface ConnectionTest {
  endpoint: string;
  method: 'GET' | 'POST';
  expectedStatus: number;
  timeout: number;
}

interface ConnectionResult {
  success: boolean;
  status?: number;
  latency?: number;
  error?: string;
  timestamp: string;
}

export class BackendConnectionTester {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeout = 5000) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000';
    this.timeout = timeout;
  }

  /**
   * Test basic health endpoint
   */
  async testHealth(): Promise<ConnectionResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      const latency = Math.round(performance.now() - startTime);

      return {
        success: response.ok,
        status: response.status,
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);

      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test Mentionlytics API endpoint when implemented
   */
  async testMentionlyticsEndpoint(): Promise<ConnectionResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/mentionlytics/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      const latency = Math.round(performance.now() - startTime);

      return {
        success: response.ok,
        status: response.status,
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);

      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Test authentication endpoint
   */
  async testAuth(): Promise<ConnectionResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      const latency = Math.round(performance.now() - startTime);

      return {
        success: response.ok,
        status: response.status,
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);

      return {
        success: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Run comprehensive connection test
   */
  async runFullTest(): Promise<{
    overall: 'healthy' | 'degraded' | 'failed';
    results: {
      health: ConnectionResult;
      mentionlytics: ConnectionResult;
      auth: ConnectionResult;
    };
    summary: {
      successRate: number;
      averageLatency: number;
      totalTests: number;
    };
  }> {
    const results = {
      health: await this.testHealth(),
      mentionlytics: await this.testMentionlyticsEndpoint(),
      auth: await this.testAuth(),
    };

    const successCount = Object.values(results).filter((r) => r.success).length;
    const totalTests = Object.keys(results).length;
    const successRate = (successCount / totalTests) * 100;

    const latencies = Object.values(results)
      .filter((r) => r.latency !== undefined)
      .map((r) => r.latency!);

    const averageLatency =
      latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    let overall: 'healthy' | 'degraded' | 'failed';
    if (successRate >= 80) {
      overall = 'healthy';
    } else if (successRate >= 40) {
      overall = 'degraded';
    } else {
      overall = 'failed';
    }

    return {
      overall,
      results,
      summary: {
        successRate: Math.round(successRate),
        averageLatency: Math.round(averageLatency),
        totalTests,
      },
    };
  }

  /**
   * Get backend readiness status for War Room dashboard
   */
  async getReadinessStatus(): Promise<{
    ready: boolean;
    message: string;
    details: string[];
  }> {
    const testResult = await this.runFullTest();

    if (testResult.overall === 'healthy') {
      return {
        ready: true,
        message: '✅ Backend is ready for War Room connection',
        details: [
          `Success rate: ${testResult.summary.successRate}%`,
          `Average latency: ${testResult.summary.averageLatency}ms`,
          `All critical endpoints responding`,
        ],
      };
    }

    if (testResult.overall === 'degraded') {
      return {
        ready: false,
        message: '⚠️ Backend partially ready - some issues detected',
        details: [
          `Success rate: ${testResult.summary.successRate}%`,
          `Average latency: ${testResult.summary.averageLatency}ms`,
          ...Object.entries(testResult.results)
            .filter(([_, result]) => !result.success)
            .map(([endpoint, result]) => `${endpoint}: ${result.error || 'Failed'}`),
        ],
      };
    }

    return {
      ready: false,
      message: '❌ Backend not ready - connection failed',
      details: [
        `Success rate: ${testResult.summary.successRate}%`,
        `Base URL: ${this.baseUrl}`,
        ...Object.entries(testResult.results)
          .filter(([_, result]) => !result.success)
          .map(([endpoint, result]) => `${endpoint}: ${result.error || 'Failed'}`),
      ],
    };
  }
}

// Export default instance
export const backendTester = new BackendConnectionTester();

// Quick test function for debug panel
export const quickBackendTest = async () => {
  const tester = new BackendConnectionTester();
  return await tester.getReadinessStatus();
};
