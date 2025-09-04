/**
 * Simple Baseline Performance Test
 * Quick baseline test for all critical endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const responseTime = new Trend('custom_response_time', true);
const errorRate = new Rate('custom_error_rate');
const totalRequests = new Counter('custom_total_requests');

// Configuration
const BASE_URL = __ENV.TEST_ENV === 'local' ? 'http://localhost:8000' : 'https://war-room-oa9t.onrender.com';

export let options = {
  vus: 3,
  duration: '1m',
  thresholds: {
    'custom_response_time': ['p(95)<2000'],
    'custom_error_rate': ['rate<0.05'],
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],
  },
};

const endpoints = [
  '/health',
  '/',
  '/api/v1/analytics/dashboard',
  '/api/v1/analytics/metrics/overview',
  '/api/v1/google-ads/customers',
];

export default function() {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const url = `${BASE_URL}${endpoint}`;
  
  const params = {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-baseline-test/1.0',
    },
    tags: { endpoint: endpoint.replace('/', '_') },
  };

  const response = http.get(url, params);
  
  // Record metrics
  responseTime.add(response.timings.duration);
  totalRequests.add(1);
  
  // Basic checks - accept 200, 401, 404 as non-errors
  const success = [200, 401, 404].includes(response.status);
  const checkResult = check(response, {
    'status is acceptable': (r) => [200, 401, 404].includes(r.status),
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(success ? 0 : 1);
  
  if (!success) {
    console.log(`⚠️ ${endpoint}: ${response.status}`);
  }
  
  sleep(1);
}