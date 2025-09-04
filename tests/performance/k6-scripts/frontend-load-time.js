/**
 * Frontend Load Time Performance Test
 * Tests frontend application loading and rendering performance
 * Target: <3s initial page load, <2s subsequent navigation
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG, getBaseUrl } from './config.js';

// Custom metrics for frontend performance
const frontendLoadTime = new Trend('frontend_load_time', true);
const frontendFailureRate = new Rate('frontend_failure_rate');
const frontendRequests = new Counter('frontend_requests_total');
const resourceLoadTime = new Trend('resource_load_time', true);

// Test configuration
const BASE_URL = getBaseUrl(__ENV.TEST_ENV || 'production');

export let options = {
  scenarios: {
    frontend_load: {
      executor: 'constant-vus',
      vus: 3,
      duration: '2m',
      tags: { test_type: 'frontend_load' },
    },
    frontend_concurrent_users: {
      executor: 'ramping-vus',
      startTime: '2m',
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 5 },
        { duration: '30s', target: 0 },
      ],
      tags: { test_type: 'frontend_concurrent' },
    }
  },
  
  thresholds: {
    // Frontend specific thresholds
    'frontend_load_time': ['p(95)<3000', 'p(99)<5000'], // 95% under 3s, 99% under 5s
    'resource_load_time': ['p(95)<1000'], // Static resources under 1s
    'frontend_failure_rate': ['rate<0.02'], // Less than 2% failure rate
    'http_req_duration{resource_type:html}': ['p(95)<3000'],
    'http_req_duration{resource_type:static}': ['p(95)<1000'],
    'http_req_failed{group:frontend}': ['rate<0.05'],
    'checks': ['rate>0.95'],
  },

  timeout: '30s', // Frontend loads can take longer initially
  maxRedirects: 5,
};

export function setup() {
  console.log(`🌐 Starting Frontend Load Time Performance Test`);
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Test scenarios: load, concurrent users`);
  
  // Test basic connectivity first
  const response = http.get(BASE_URL, { timeout: '10s' });
  console.log(`Initial connectivity test: ${response.status} (${response.timings.duration.toFixed(2)}ms)`);
  
  return { baseUrl: BASE_URL };
}

export default function(data) {
  group('Frontend Page Load', () => {
    testMainPageLoad(data.baseUrl);
  });

  group('Frontend Static Resources', () => {
    testStaticResources(data.baseUrl);
  });

  group('Frontend Navigation', () => {
    testPageNavigation(data.baseUrl);
  });

  // Sleep between test iterations
  sleep(2);
}

function testMainPageLoad(baseUrl) {
  const params = {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0',
      'Cache-Control': 'no-cache',
    },
    tags: {
      resource_type: 'html',
      page: 'main',
      group: 'frontend'
    },
    timeout: '15s',
  };

  const startTime = Date.now();
  const response = http.get(baseUrl, params);
  const endTime = Date.now();

  // Record metrics
  const loadTime = endTime - startTime;
  frontendLoadTime.add(loadTime);
  frontendRequests.add(1);

  // Perform checks
  const checkResults = check(response, {
    'main page loads successfully': (r) => r.status === 200,
    'main page load time < 3s': (r) => r.timings.duration < 3000,
    'main page load time < 5s': (r) => r.timings.duration < 5000,
    'main page returns HTML': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/html'),
    'main page has reasonable size': (r) => r.body.length > 1000 && r.body.length < 10000000, // 1KB - 10MB
    'main page contains expected elements': (r) => {
      const body = r.body || '';
      return body.includes('<html') && 
             (body.includes('War Room') || body.includes('dashboard') || body.includes('app'));
    }
  });

  if (!checkResults || response.status !== 200) {
    frontendFailureRate.add(1);
    console.error(`❌ Main page load failed: ${response.status} (${loadTime}ms)`);
  } else {
    frontendFailureRate.add(0);
    if (loadTime > 3000) {
      console.warn(`⚠️ Main page load slow: ${loadTime}ms`);
    }
  }

  // Log performance milestones
  if (frontendRequests.count % 5 === 0) {
    console.log(`🌐 Frontend loads: ${frontendRequests.count}, Avg: ${frontendLoadTime.avg.toFixed(0)}ms`);
  }
}

function testStaticResources(baseUrl) {
  // Common static resource paths to test
  const staticPaths = [
    '/favicon.ico',
    '/robots.txt',
    '/assets/index.css', // Common Vite pattern
    '/assets/index.js',  // Common Vite pattern
    '/static/css/main.css', // Alternative pattern
    '/static/js/main.js',   // Alternative pattern
  ];

  // Test a random static resource
  const randomPath = staticPaths[Math.floor(Math.random() * staticPaths.length)];
  const url = `${baseUrl}${randomPath}`;

  const params = {
    headers: {
      'Accept': '*/*',
      'User-Agent': CONFIG.CONNECTION.userAgent,
      'Cache-Control': 'max-age=3600',
    },
    tags: {
      resource_type: 'static',
      resource: randomPath,
      group: 'frontend'
    },
    timeout: '5s',
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  resourceLoadTime.add(endTime - startTime);
  frontendRequests.add(1);

  // Static resources may not exist, so 404 is acceptable
  const checkResults = check(response, {
    'static resource responds': (r) => r.status !== 0,
    'static resource has acceptable status': (r) => 
      [200, 304, 404].includes(r.status), // 304 = Not Modified (cached)
    'static resource loads quickly': (r) => r.timings.duration < 1000,
  });

  // Only consider timeouts and 500 errors as failures for static resources
  if (response.status === 0 || response.status >= 500) {
    frontendFailureRate.add(1);
  } else {
    frontendFailureRate.add(0);
  }
}

function testPageNavigation(baseUrl) {
  // Test common application routes
  const routes = [
    '/',
    '/dashboard',
    '/analytics',
    '/settings',
    '/login',
    '/health', // Backend health endpoint
  ];

  const randomRoute = routes[Math.floor(Math.random() * routes.length)];
  const url = `${baseUrl}${randomRoute}`;

  const params = {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': CONFIG.CONNECTION.userAgent,
    },
    tags: {
      resource_type: 'navigation',
      route: randomRoute,
      group: 'frontend'
    },
    timeout: '10s',
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  frontendLoadTime.add(endTime - startTime);
  frontendRequests.add(1);

  const checkResults = check(response, {
    'navigation responds': (r) => r.status !== 0,
    'navigation has acceptable status': (r) => 
      [200, 404, 401, 403].includes(r.status), // Various acceptable statuses
    'navigation load time < 2s': (r) => r.timings.duration < 2000,
    'navigation load time < 5s': (r) => r.timings.duration < 5000,
  });

  if (response.status === 0 || response.status >= 500) {
    frontendFailureRate.add(1);
  } else {
    frontendFailureRate.add(0);
  }
}

export function teardown(data) {
  console.log(`\n🌐 Frontend Load Time Test Complete`);
  console.log(`Total frontend requests: ${frontendRequests.count}`);
  console.log(`Average load time: ${frontendLoadTime.avg.toFixed(0)}ms`);
  console.log(`Average resource load time: ${resourceLoadTime.avg.toFixed(0)}ms`);
  console.log(`Failure rate: ${(frontendFailureRate.rate * 100).toFixed(2)}%`);
  
  // Performance assessment
  if (frontendLoadTime.avg < 2000) {
    console.log(`✅ Frontend performance: EXCELLENT (avg < 2s)`);
  } else if (frontendLoadTime.avg < 3000) {
    console.log(`✅ Frontend performance: GOOD (avg < 3s)`);
  } else if (frontendLoadTime.avg < 5000) {
    console.log(`⚠️ Frontend performance: ACCEPTABLE (avg < 5s)`);
  } else {
    console.log(`❌ Frontend performance: NEEDS IMPROVEMENT (avg > 5s)`);
  }

  // Specific recommendations
  if (resourceLoadTime.avg > 1000) {
    console.log(`💡 Recommendation: Optimize static resource delivery (CDN, compression, caching)`);
  }
  
  if (frontendLoadTime.avg > 3000) {
    console.log(`💡 Recommendation: Consider code splitting, lazy loading, or bundle optimization`);
  }
}