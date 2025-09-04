/**
 * TestSprite Configuration for War Room Platform
 *
 * Comprehensive test configuration including:
 * - Environment setup
 * - Test data management
 * - Performance benchmarks
 * - Coverage requirements
 */

import { type TestSpriteConfig } from '@testsprite/core';

const config: TestSpriteConfig = {
  // Project Information
  project: {
    name: 'War Room Platform',
    version: '1.0.0',
    description: 'Campaign Management Platform Test Suite',
  },

  // Environment Configuration
  environments: {
    local: {
      apiUrl: 'http://localhost:8000',
      frontendUrl: 'http://localhost:5173',
      wsUrl: 'ws://localhost:8000/ws',
      database: {
        url: 'postgresql://warroom:warroom@localhost:5432/warroom_test',
        migrations: './src/backend/alembic',
      },
    },
    staging: {
      apiUrl: 'https://staging-api.warroom.app',
      frontendUrl: 'https://staging.warroom.app',
      wsUrl: 'wss://staging-api.warroom.app/ws',
      database: {
        url: process.env.STAGING_DATABASE_URL,
        readOnly: true,
      },
    },
    production: {
      apiUrl: 'https://api.warroom.app',
      frontendUrl: 'https://warroom.app',
      wsUrl: 'wss://api.warroom.app/ws',
      database: {
        url: process.env.PROD_DATABASE_URL,
        readOnly: true,
      },
    },
  },

  // Test Categories
  suites: {
    unit: {
      pattern: '**/*.unit.test.ts',
      timeout: 10000,
      parallel: true,
    },
    integration: {
      pattern: '**/*.integration.test.ts',
      timeout: 30000,
      parallel: false,
      setup: './tests/setup/integration.ts',
    },
    e2e: {
      pattern: '**/*.e2e.test.ts',
      timeout: 60000,
      parallel: false,
      browsers: ['chrome', 'firefox', 'safari'],
    },
    performance: {
      pattern: '**/*.perf.test.ts',
      timeout: 120000,
      iterations: 3,
    },
    security: {
      pattern: '**/*.security.test.ts',
      timeout: 45000,
    },
  },

  // Test Data Management
  testData: {
    seeds: {
      users: './tests/data/users.json',
      organizations: './tests/data/organizations.json',
      events: './tests/data/events.json',
      donations: './tests/data/donations.json',
    },
    generators: {
      user: {
        faker: {
          firstName: 'name.firstName',
          lastName: 'name.lastName',
          email: 'internet.email',
          phone: 'phone.number',
        },
      },
      event: {
        faker: {
          title: 'lorem.sentence',
          description: 'lorem.paragraph',
          location: 'address.streetAddress',
        },
      },
    },
    cleanup: {
      strategy: 'transaction', // transaction | truncate | drop
      preserve: ['migrations', 'system_settings'],
    },
  },

  // Performance Benchmarks
  performance: {
    metrics: {
      apiResponseTime: {
        target: 200, // ms
        p95: 500,
        p99: 1000,
      },
      pageLoadTime: {
        target: 3000, // ms
        p95: 5000,
        p99: 8000,
      },
      websocketLatency: {
        target: 50, // ms
        p95: 100,
        p99: 200,
      },
    },
    thresholds: {
      cpu: 80, // %
      memory: 90, // %
      errorRate: 0.1, // %
    },
  },

  // Coverage Requirements
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
    exclude: [
      '**/node_modules/**',
      '**/tests/**',
      '**/migrations/**',
      '**/*.config.ts',
    ],
    reporters: ['text', 'lcov', 'html'],
    outputDir: './coverage',
  },

  // Security Testing
  security: {
    owasp: {
      enabled: true,
      rules: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'],
    },
    vulnerabilityScanning: {
      enabled: true,
      severity: 'medium', // low | medium | high | critical
    },
    penetrationTesting: {
      targets: ['authentication', 'authorization', 'input-validation', 'session-management'],
    },
  },

  // Reporting
  reporting: {
    outputs: ['console', 'junit', 'html', 'slack'],
    junit: {
      outputFile: './test-results/junit.xml',
    },
    html: {
      outputDir: './test-results/html',
      openAfterRun: true,
    },
    slack: {
      webhook: process.env.SLACK_WEBHOOK,
      channel: '#testing',
      notifyOn: ['failure', 'recovery'],
    },
  },

  // Retry Configuration
  retry: {
    maxAttempts: 2,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
  },

  // Hooks
  hooks: {
    beforeAll: async (context) => {
      console.log('Starting War Room test suite...');
      await context.database.migrate();
      await context.cache.clear();
    },
    afterAll: async (context) => {
      console.log('Cleaning up test environment...');
      await context.database.cleanup();
      await context.browser.closeAll();
    },
    beforeEach: async (context) => {
      await context.database.beginTransaction();
    },
    afterEach: async (context) => {
      await context.database.rollbackTransaction();
      await context.clearEmails();
    },
  },

  // Plugins
  plugins: [
    '@testsprite/plugin-screenshots',
    '@testsprite/plugin-video-recording',
    '@testsprite/plugin-network-stubbing',
    '@testsprite/plugin-accessibility',
    '@testsprite/plugin-visual-regression',
  ],

  // Plugin Configuration
  pluginConfig: {
    screenshots: {
      onFailure: true,
      outputDir: './test-results/screenshots',
    },
    videoRecording: {
      enabled: true,
      outputDir: './test-results/videos',
      keepOnSuccess: false,
    },
    networkStubbing: {
      recordMode: process.env.RECORD_MODE === 'true',
      cassettesDir: './tests/cassettes',
    },
    accessibility: {
      standard: 'WCAG2AA',
      ignoreRules: [],
    },
    visualRegression: {
      threshold: 0.1,
      outputDir: './test-results/visual-regression',
    },
  },

  // Parallel Execution
  parallel: {
    workers: process.env.CI ? 4 : 2,
    strategy: 'round-robin', // round-robin | least-loaded | hash
    isolation: 'process', // process | thread | none
  },

  // Timeouts
  timeouts: {
    global: 300000, // 5 minutes
    test: 30000, // 30 seconds
    hook: 60000, // 1 minute
    assertion: 5000, // 5 seconds
  },

  // Feature Flags for Testing
  features: {
    documentIntelligence: true,
    advancedAnalytics: true,
    realtimeNotifications: true,
    exportFeatures: true,
    platformAdmin: true,
  },

  // Custom Matchers
  customMatchers: {
    toBeValidEmail: (received: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        pass: emailRegex.test(received),
        message: () => `Expected ${received} to be a valid email address`,
      };
    },
    toBeWithinRange: (received: number, min: number, max: number) => {
      return {
        pass: received >= min && received <= max,
        message: () => `Expected ${received} to be between ${min} and ${max}`,
      };
    },
  },
};

export default config;
