/**
 * Campaigns Endpoints Performance Test
 * Tests Google Ads campaigns and related endpoints
 * Target: <500ms response time for campaigns
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG, getBaseUrl, getScenario } from './config.js';

// Custom metrics for campaigns endpoints
const campaignResponseTime = new Trend('campaign_response_time', true);
const campaignFailureRate = new Rate('campaign_failure_rate');
const campaignRequests = new Counter('campaign_requests_total');

// Test configuration
const BASE_URL = getBaseUrl(__ENV.TEST_ENV || 'production');

export let options = {
  scenarios: {
    campaigns_smoke: {
      executor: 'constant-vus',
      vus: 2,
      duration: '2m',
      tags: { test_type: 'campaigns_smoke' },
    },
    campaigns_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      startTime: '2m',
      tags: { test_type: 'campaigns_load' },
    }
  },
  
  thresholds: {
    // Campaigns specific thresholds
    'campaign_response_time': ['p(95)<500', 'p(99)<1000'],
    'campaign_failure_rate': ['rate<0.05'],
    'http_req_duration{endpoint:campaigns}': ['p(95)<500'],
    'http_req_duration{endpoint:google_ads_customers}': ['p(95)<800'],
    'http_req_failed{group:campaigns}': ['rate<0.05'],
    'checks': ['rate>0.90'], // Allow for auth failures
  },

  timeout: '20s',
  maxRedirects: 4,
};

export function setup() {
  console.log(`🎯 Starting Campaigns Endpoints Performance Test`);
  console.log(`Target URL: ${BASE_URL}/api/v1/google-ads/*`);
  console.log(`Test scenarios: smoke, load`);
  
  // Test basic connectivity first
  const healthUrl = `${BASE_URL}/health`;
  const healthResponse = http.get(healthUrl);
  
  if (healthResponse.status !== 200) {
    console.error(`❌ Health check failed: ${healthResponse.status}`);
    console.log('Service may be cold starting or unavailable');
  } else {
    console.log('✅ Service is responsive');
  }
  
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const baseParams = {
    headers: {
      'Accept': 'application/json',
      'User-Agent': CONFIG.CONNECTION.userAgent,
    },
    timeout: '10s',
  };

  group('Google Ads Campaigns', () => {
    testGoogleAdsCustomers(data.baseUrl, baseParams);
    testGoogleAdsCampaigns(data.baseUrl, baseParams);
  });

  // Moderate sleep to prevent overwhelming the service
  sleep(1.5);
}

function testGoogleAdsCustomers(baseUrl, baseParams) {
  const url = `${baseUrl}${CONFIG.TEST_DATA.endpoints.googleAds.customers}`;

  const params = {
    ...baseParams,
    tags: {
      endpoint: 'google_ads_customers',
      group: 'campaigns'
    }
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  // Record metrics
  campaignResponseTime.add(endTime - startTime);
  campaignRequests.add(1);

  // Perform checks - expect 401 for unauthenticated requests
  const checkResults = check(response, {
    'google ads customers endpoint responds': (r) => r.status !== 0,
    'google ads customers responds with expected status': (r) => 
      [200, 401, 403, 404].includes(r.status),
    'google ads customers response time < 800ms': (r) => r.timings.duration < 800,
    'google ads customers response time < 1500ms': (r) => r.timings.duration < 1500,
    'google ads customers has correct content-type': (r) => 
      r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  // Additional checks for successful responses
  if (response.status === 200) {
    check(response, {
      'google ads customers returns valid JSON': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && typeof body === 'object';
        } catch (e) {
          return false;
        }
      }
    });
  }

  // Only consider timeouts and 500 errors as failures
  if (response.status === 0 || response.status >= 500) {
    campaignFailureRate.add(1);
    console.error(`❌ Google Ads customers critical failure: ${response.status}`);
  } else {
    campaignFailureRate.add(0);
  }

  // Log authentication info
  if (response.status === 401) {
    console.log(`🔐 Google Ads customers requires authentication (expected)`);
  }
}

function testGoogleAdsCampaigns(baseUrl, baseParams) {
  // Note: This endpoint may not exist yet, testing for 404 is acceptable
  const url = `${baseUrl}${CONFIG.TEST_DATA.endpoints.googleAds.campaigns}`;

  const params = {
    ...baseParams,
    tags: {
      endpoint: 'campaigns',
      group: 'campaigns'
    }
  };

  const startTime = Date.now();
  const response = http.get(url, params);
  const endTime = Date.now();

  campaignResponseTime.add(endTime - startTime);
  campaignRequests.add(1);

  const checkResults = check(response, {
    'campaigns endpoint responds': (r) => r.status !== 0,
    'campaigns responds with expected status': (r) => 
      [200, 401, 403, 404, 501].includes(r.status), // 501 = Not Implemented
    'campaigns response time < 500ms': (r) => r.timings.duration < 500,
    'campaigns response time < 1s': (r) => r.timings.duration < 1000,
  });

  // Only consider timeouts and 500 errors as failures (404 is acceptable)
  if (response.status === 0 || response.status === 500) {
    campaignFailureRate.add(1);
    console.error(`❌ Campaigns critical failure: ${response.status}`);
  } else {
    campaignFailureRate.add(0);
  }

  // Log endpoint status
  if (response.status === 404) {
    console.log(`📝 Campaigns endpoint not found (may not be implemented yet)`);
  } else if (response.status === 401) {
    console.log(`🔐 Campaigns requires authentication (expected)`);
  }
}

export function teardown(data) {
  console.log(`\n🎯 Campaigns Endpoints Test Complete`);
  console.log(`Total campaign requests: ${campaignRequests.count}`);
  console.log(`Average response time: ${campaignResponseTime.avg.toFixed(2)}ms`);
  console.log(`Failure rate: ${(campaignFailureRate.rate * 100).toFixed(2)}%`);
  
  // Performance assessment
  if (campaignResponseTime.avg < 500) {
    console.log(`✅ Campaigns performance: EXCELLENT (avg < 500ms)`);
  } else if (campaignResponseTime.avg < 1000) {
    console.log(`⚠️ Campaigns performance: ACCEPTABLE (avg < 1s)`);
  } else {
    console.log(`❌ Campaigns performance: NEEDS IMPROVEMENT (avg > 1s)`);
  }

  // Service availability assessment
  if (campaignFailureRate.rate < 0.01) {
    console.log(`✅ Campaigns availability: EXCELLENT (<1% failures)`);
  } else if (campaignFailureRate.rate < 0.05) {
    console.log(`⚠️ Campaigns availability: ACCEPTABLE (<5% failures)`);
  } else {
    console.log(`❌ Campaigns availability: NEEDS IMPROVEMENT (>${(campaignFailureRate.rate * 100).toFixed(1)}% failures)`);
  }
}