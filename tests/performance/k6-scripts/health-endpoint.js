/**
 * Health Endpoint Performance Test
 * Tests the critical /health endpoint with various load patterns
 * Target: <100ms response time, >99% availability
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG, getBaseUrl, getScenario } from './config.js';

// Custom metrics for health endpoint
const healthResponseTime = new Trend('health_response_time', true);
const healthFailureRate = new Rate('health_failure_rate');
const healthChecks = new Counter('health_checks_total');

// Test configuration
const BASE_URL = getBaseUrl(__ENV.TEST_ENV || 'production');

export let options = {
  scenarios: {
    health_smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },
    health_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { test_type: 'load' },
    },
  },
  
  thresholds: {
    // Health endpoint specific thresholds
    'health_response_time': ['p(95)<100', 'p(99)<200'],
    'health_failure_rate': ['rate<0.01'], // Less than 1% failure rate
    'http_req_duration{endpoint:health}': ['p(95)<100'],
    'http_req_failed{endpoint:health}': ['rate<0.01'],
    'checks': ['rate>0.99'], // 99% of checks should pass
  },
};

export function setup() {
  console.log(`🏥 Starting Health Endpoint Performance Test`);
  console.log(`Target URL: ${BASE_URL}/health`);
  console.log(`Test scenarios: smoke, load`);
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const url = `${data.baseUrl}/health`;
  
  // Add request tags for better metrics categorization
  const params = {
    headers: {
      'Accept': 'application/json',
      'User-Agent': CONFIG.CONNECTION.userAgent,
    },
    tags: {
      endpoint: 'health',
      test_type: __ENV.TEST_TYPE || 'load'
    },
    timeout: '5s', // Health endpoint should be very fast
  };

  // Make the request
  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();
  
  // Record custom metrics
  healthResponseTime.add(endTime - startTime);
  healthChecks.add(1);
  
  // Perform checks
  const checkResults = check(response, {
    'health endpoint responds with 200': (r) => r.status === 200,
    'health endpoint response time < 100ms': (r) => r.timings.duration < 100,
    'health endpoint response time < 200ms': (r) => r.timings.duration < 200,
    'health endpoint has correct content-type': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    'health endpoint returns valid JSON': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && typeof body === 'object';
      } catch (e) {
        return false;
      }
    },
    'health endpoint contains status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch (e) {
        return false;
      }
    },
    'health endpoint reports healthy status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'healthy' || body.status === 'degraded';
      } catch (e) {
        return false;
      }
    }
  });

  // Record failure only if status is not 200 or checks fail
  if (response.status !== 200 || !checkResults['health endpoint responds with 200']) {
    healthFailureRate.add(1);
    console.error(`❌ Health check failed for ${url}: Status ${response.status}`);
  } else {
    healthFailureRate.add(0);
    // Only log successful checks occasionally to reduce noise
    if (healthChecks.count % 20 === 0) {
      console.log(`✅ Health check ${healthChecks.count}: ${response.status} (${response.timings.duration.toFixed(0)}ms)`);
    }
  }

  // Log performance metrics every 10 requests
  if (healthChecks.count % 10 === 0) {
    console.log(`🏥 Health checks: ${healthChecks.count}, Avg response time: ${healthResponseTime.avg.toFixed(2)}ms`);
  }

  // Brief pause between requests to avoid overwhelming
  sleep(1);
}

export function teardown(data) {
  console.log(`\n🏥 Health Endpoint Test Complete`);
  console.log(`Total health checks performed: ${healthChecks.count}`);
  console.log(`Average response time: ${healthResponseTime.avg.toFixed(2)}ms`);
  console.log(`Failure rate: ${(healthFailureRate.rate * 100).toFixed(2)}%`);
}