/**
 * Analytics Endpoints Performance Test
 * Tests analytics dashboard, metrics, and chart endpoints
 * Target: <1s response time for analytics, <500ms for metrics
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG, getBaseUrl, getScenario, buildUrl } from './config.js';

// Custom metrics for analytics endpoints
const analyticsResponseTime = new Trend('analytics_response_time', true);
const analyticsFailureRate = new Rate('analytics_failure_rate');
const analyticsRequests = new Counter('analytics_requests_total');

// Test configuration
const BASE_URL = getBaseUrl(__ENV.TEST_ENV || 'production');

export let options = {
  scenarios: {
    analytics_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      tags: { test_type: 'analytics_load' },
    },
    analytics_stress: {
      executor: 'ramping-vus',
      startTime: '3m',
      stages: [
        { duration: '1m', target: 5 },
        { duration: '2m', target: 15 },
        { duration: '1m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'analytics_stress' },
    }
  },
  
  thresholds: {
    // Analytics specific thresholds
    'analytics_response_time': ['p(95)<1000', 'p(99)<2000'],
    'analytics_failure_rate': ['rate<0.05'], // Less than 5% failure rate
    'http_req_duration{endpoint:analytics_dashboard}': ['p(95)<1000'],
    'http_req_duration{endpoint:analytics_metrics}': ['p(95)<500'],
    'http_req_duration{endpoint:analytics_charts}': ['p(95)<800'],
    'http_req_failed{group:analytics}': ['rate<0.05'],
    'checks': ['rate>0.95'],
  },

  // Connection settings for potentially slower analytics queries
  timeout: '30s',
  maxRedirects: 4,
};

export function setup() {
  console.log(`📊 Starting Analytics Endpoints Performance Test`);
  console.log(`Target URL: ${BASE_URL}/api/v1/analytics/*`);
  console.log(`Test scenarios: load, stress`);
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const baseParams = {
    headers: {
      'Accept': 'application/json',
      'User-Agent': CONFIG.CONNECTION.userAgent,
    },
    timeout: '15s',
  };

  group('Analytics Dashboard', () => {
    testAnalyticsDashboard(data.baseUrl, baseParams);
  });

  group('Analytics Metrics', () => {
    testAnalyticsMetrics(data.baseUrl, baseParams);
  });

  group('Analytics Charts', () => {
    testAnalyticsCharts(data.baseUrl, baseParams);
  });

  group('Analytics Geographic', () => {
    testAnalyticsGeographic(data.baseUrl, baseParams);
  });

  // Longer sleep between iterations for analytics tests
  sleep(2);
}

function testAnalyticsDashboard(baseUrl, baseParams) {
  const dateRanges = CONFIG.TEST_DATA.dateRanges;
  const randomDateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)];
  
  const url = buildUrl(
    baseUrl, 
    CONFIG.TEST_DATA.endpoints.analytics.dashboard,
    { date_range: randomDateRange }
  );

  const params = {
    ...baseParams,
    tags: {
      endpoint: 'analytics_dashboard',
      date_range: randomDateRange,
      group: 'analytics'
    }
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  // Record metrics
  analyticsResponseTime.add(endTime - startTime);
  analyticsRequests.add(1);

  // Perform checks
  const checkResults = check(response, {
    'analytics dashboard responds with 200 or 401': (r) => [200, 401].includes(r.status),
    'analytics dashboard response time < 1s': (r) => r.timings.duration < 1000,
    'analytics dashboard response time < 2s': (r) => r.timings.duration < 2000,
    'analytics dashboard has correct content-type': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  // Check for valid JSON response (if not 401)
  if (response.status === 200) {
    check(response, {
      'analytics dashboard returns valid JSON': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && typeof body === 'object';
        } catch (e) {
          return false;
        }
      }
    });
  }

  if (!checkResults) {
    analyticsFailureRate.add(1);
    console.error(`❌ Analytics dashboard failed: ${response.status}`);
  } else {
    analyticsFailureRate.add(0);
  }
}

function testAnalyticsMetrics(baseUrl, baseParams) {
  const dateRanges = CONFIG.TEST_DATA.dateRanges;
  const randomDateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)];
  
  const url = buildUrl(
    baseUrl,
    CONFIG.TEST_DATA.endpoints.analytics.metrics,
    { date_range: randomDateRange }
  );

  const params = {
    ...baseParams,
    tags: {
      endpoint: 'analytics_metrics',
      date_range: randomDateRange,
      group: 'analytics'
    }
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  analyticsResponseTime.add(endTime - startTime);
  analyticsRequests.add(1);

  const checkResults = check(response, {
    'analytics metrics responds with 200 or 401': (r) => [200, 401].includes(r.status),
    'analytics metrics response time < 500ms': (r) => r.timings.duration < 500,
    'analytics metrics response time < 1s': (r) => r.timings.duration < 1000,
    'analytics metrics has correct content-type': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  if (!checkResults) {
    analyticsFailureRate.add(1);
  } else {
    analyticsFailureRate.add(0);
  }
}

function testAnalyticsCharts(baseUrl, baseParams) {
  const chartTypes = ['volunteers', 'events', 'donations'];
  const randomChart = chartTypes[Math.floor(Math.random() * chartTypes.length)];
  const dateRanges = CONFIG.TEST_DATA.dateRanges;
  const randomDateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)];

  const url = buildUrl(
    baseUrl,
    CONFIG.TEST_DATA.endpoints.analytics.charts[randomChart],
    { date_range: randomDateRange }
  );

  const params = {
    ...baseParams,
    tags: {
      endpoint: 'analytics_charts',
      chart_type: randomChart,
      group: 'analytics'
    }
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  analyticsResponseTime.add(endTime - startTime);
  analyticsRequests.add(1);

  const checkResults = check(response, {
    'analytics charts responds with 200 or 401': (r) => [200, 401].includes(r.status),
    'analytics charts response time < 800ms': (r) => r.timings.duration < 800,
    'analytics charts response time < 1.5s': (r) => r.timings.duration < 1500,
    'analytics charts has correct content-type': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  if (!checkResults) {
    analyticsFailureRate.add(1);
  } else {
    analyticsFailureRate.add(0);
  }
}

function testAnalyticsGeographic(baseUrl, baseParams) {
  const dateRanges = CONFIG.TEST_DATA.dateRanges;
  const randomDateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)];

  const url = buildUrl(
    baseUrl,
    CONFIG.TEST_DATA.endpoints.analytics.geographic,
    { date_range: randomDateRange }
  );

  const params = {
    ...baseParams,
    tags: {
      endpoint: 'analytics_geographic',
      group: 'analytics'
    }
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  analyticsResponseTime.add(endTime - startTime);
  analyticsRequests.add(1);

  const checkResults = check(response, {
    'analytics geographic responds with 200 or 401': (r) => [200, 401].includes(r.status),
    'analytics geographic response time < 800ms': (r) => r.timings.duration < 800,
    'analytics geographic has correct content-type': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  if (!checkResults) {
    analyticsFailureRate.add(1);
  } else {
    analyticsFailureRate.add(0);
  }
}

export function teardown(data) {
  console.log(`\n📊 Analytics Endpoints Test Complete`);
  console.log(`Total analytics requests: ${analyticsRequests.count}`);
  console.log(`Average response time: ${analyticsResponseTime.avg.toFixed(2)}ms`);
  console.log(`Failure rate: ${(analyticsFailureRate.rate * 100).toFixed(2)}%`);
  
  // Performance assessment
  if (analyticsResponseTime.avg < 1000) {
    console.log(`✅ Analytics performance: EXCELLENT (avg < 1s)`);
  } else if (analyticsResponseTime.avg < 2000) {
    console.log(`⚠️ Analytics performance: ACCEPTABLE (avg < 2s)`);
  } else {
    console.log(`❌ Analytics performance: NEEDS IMPROVEMENT (avg > 2s)`);
  }
}