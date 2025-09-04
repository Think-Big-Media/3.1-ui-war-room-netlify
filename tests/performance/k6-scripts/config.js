/**
 * Performance test configuration for War Room application
 * Contains shared settings, thresholds, and test scenarios
 */

export const CONFIG = {
  // Base URLs for different environments
  BASE_URLS: {
    production: 'https://war-room-oa9t.onrender.com',
    staging: 'https://staging-war-room.onrender.com', // If available
    local: 'http://localhost:8000'
  },

  // Test scenarios configuration
  SCENARIOS: {
    // Smoke test: Basic functionality with minimal load
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },

    // Load test: Normal expected traffic
    load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { test_type: 'load' },
    },

    // Stress test: Above normal capacity
    stress: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 10 }, // Ramp up to 10 users
        { duration: '5m', target: 20 }, // Stay at 20 users
        { duration: '2m', target: 30 }, // Ramp up to 30 users
        { duration: '3m', target: 30 }, // Stay at 30 users
        { duration: '2m', target: 0 },  // Ramp down
      ],
      tags: { test_type: 'stress' },
    },

    // Spike test: Sudden traffic increase
    spike: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 10 },  // Normal load
        { duration: '10s', target: 50 }, // Spike!
        { duration: '3m', target: 50 },  // Stay at spike
        { duration: '1m', target: 10 },  // Back to normal
        { duration: '1m', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'spike' },
    },

    // Soak test: Extended duration at normal load
    soak: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30m',
      tags: { test_type: 'soak' },
    }
  },

  // Performance thresholds based on requirements
  THRESHOLDS: {
    // HTTP request duration thresholds
    'http_req_duration': [
      'p(50)<500',   // 50% of requests under 500ms
      'p(90)<1000',  // 90% of requests under 1s
      'p(95)<2000',  // 95% of requests under 2s
      'p(99)<3000',  // 99% of requests under 3s (max target)
    ],

    // Specific endpoint thresholds
    'http_req_duration{endpoint:health}': ['p(95)<100'],     // Health check < 100ms
    'http_req_duration{endpoint:campaigns}': ['p(95)<500'],  // Campaigns < 500ms
    'http_req_duration{endpoint:analytics}': ['p(95)<1000'], // Analytics < 1s

    // HTTP request failure rate
    'http_req_failed': ['rate<0.05'], // Less than 5% failure rate

    // System availability
    'checks': ['rate>0.95'], // 95% of checks should pass
  },

  // Rate limiting and connection settings
  CONNECTION: {
    maxRedirects: 4,
    timeout: '30s',
    userAgent: 'War-Room-k6-Performance-Test/1.0',
  },

  // Test data and authentication
  TEST_DATA: {
    // Mock user credentials (for auth testing)
    testUsers: [
      { username: 'test_user_1', password: 'test_pass_1' },
      { username: 'test_user_2', password: 'test_pass_2' }
    ],
    
    // API endpoints to test
    endpoints: {
      health: '/health',
      root: '/',
      analytics: {
        dashboard: '/api/v1/analytics/dashboard',
        metrics: '/api/v1/analytics/metrics/overview',
        charts: {
          volunteers: '/api/v1/analytics/charts/volunteers',
          events: '/api/v1/analytics/charts/events',
          donations: '/api/v1/analytics/charts/donations'
        },
        geographic: '/api/v1/analytics/geographic',
        export: '/api/v1/analytics/export'
      },
      admin: {
        auth: '/api/v1/admin/auth',
        dashboard: '/api/v1/admin/dashboard'
      },
      googleAds: {
        customers: '/api/v1/google-ads/customers',
        campaigns: '/api/v1/google-ads/campaigns'
      }
    },

    // Date ranges for analytics testing
    dateRanges: ['LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS'],
    
    // Query parameters for different test scenarios
    queryParams: {
      analytics: [
        { date_range: 'LAST_7_DAYS' },
        { date_range: 'LAST_30_DAYS' },
        { date_range: 'LAST_90_DAYS' }
      ]
    }
  }
};

// Utility functions for test configuration
export function getBaseUrl(environment = 'production') {
  return CONFIG.BASE_URLS[environment] || CONFIG.BASE_URLS.production;
}

export function getScenario(type = 'load') {
  return CONFIG.SCENARIOS[type] || CONFIG.SCENARIOS.load;
}

export function buildUrl(baseUrl, endpoint, params = {}) {
  const url = new URL(endpoint, baseUrl);
  Object.keys(params).forEach(key => {
    url.searchParams.append(key, params[key]);
  });
  return url.toString();
}

// Export for use in test scripts
export default CONFIG;