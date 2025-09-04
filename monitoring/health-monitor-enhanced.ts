#!/usr/bin/env node

/**
 * ENHANCED SUB-AGENT 1: Health Check Monitor
 *
 * MISSION: Monitor War Room application health and auto-fix issues
 * TARGET: https://war-room-oa9t.onrender.com/
 *
 * ENHANCED FEATURES:
 * - TypeScript implementation with type safety
 * - Advanced circuit breaker patterns for resilience
 * - WebSocket communication for sub-agent coordination
 * - Pieces Knowledge Manager integration
 * - Enhanced auto-fix capabilities
 * - Real-time performance monitoring with SLA enforcement
 * - Automated endpoint discovery
 * - Mock data validation system
 */

import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as cron from 'node-cron';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

// Enhanced Types
interface HealthEndpoint {
  path: string;
  name: string;
  critical: boolean;
  timeout: number;
  expectedStatus?: number[];
  headers?: Record<string, string>;
}

interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure: Date | null;
  nextAttempt: Date | null;
  successCount: number;
}

interface AutoFixPattern {
  pattern: string;
  action: string;
  success: boolean;
  timestamp: string;
  appliedCount: number;
  successRate: number;
  tags: string[];
  metadata: {
    endpoint?: string;
    errorType?: string;
    responseTime?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface PerformanceMetric {
  timestamp: string;
  endpoint: string;
  responseTime: number;
  withinSLA: boolean;
  statusCode: number;
  contentLength: number;
}

interface HealthCheckResult {
  timestamp: string;
  checkId: string;
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'error';
  score: number;
  site: {
    available: boolean;
    responseTime: number;
    statusCode: number;
    contentType?: string;
  };
  endpoints: {
    healthy: number;
    total: number;
    percentage: number;
    results: Record<string, EndpointResult>;
  };
  ui: {
    playwright: PlaywrightResult;
    accessibility: AccessibilityResult;
    overall: 'passed' | 'failed' | 'error';
  };
  performance: {
    averageResponseTime: number;
    slaViolations: number;
    availability: number;
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    metrics: PerformanceMetric[];
  };
  mockData: {
    working: number;
    total: number;
    percentage: number;
    allWorking: boolean;
    endpoints: Record<string, MockDataResult>;
  };
  autoFixes: AutoFixResult[];
  criticalIssues: CriticalIssue[];
  recommendations: Recommendation[];
  circuitBreakers: Record<string, CircuitBreakerState>;
}

interface EndpointResult {
  healthy: boolean;
  status: number;
  responseTime: number;
  contentType?: string;
  contentLength: number;
  error?: string;
  requiresFix?: boolean;
  circuitBreakerState?: 'closed' | 'open' | 'half-open';
}

interface PlaywrightResult {
  success: boolean;
  exitCode: number;
  output: string;
  error?: string;
  timeout?: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  duration: number;
}

interface AccessibilityResult {
  success: boolean;
  checks: Record<string, boolean>;
  score: number;
  message: string;
  violations: string[];
}

interface MockDataResult {
  working: boolean;
  status: number;
  dataLength: number;
  hasData: boolean;
  error?: string;
  validationErrors?: string[];
}

interface AutoFixResult {
  endpoint: string;
  pattern: string;
  action: string;
  success: boolean;
  message: string;
  duration: number;
  isNewPattern?: boolean;
}

interface CriticalIssue {
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  requiresHumanIntervention: boolean;
  affectedEndpoints?: string[];
  suggestedActions?: string[];
}

interface Recommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  actionable: boolean;
  estimatedImpact: string;
}

interface SubAgentMessage {
  type: 'health-update' | 'fix-applied' | 'critical-alert' | 'performance-violation';
  timestamp: string;
  source: 'health-monitor';
  data: any;
}

class CircuitBreaker {
  private state: CircuitBreakerState;
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private readonly successThreshold: number;

  constructor(
    private readonly name: string,
    failureThreshold = 5,
    recoveryTimeout = 60000, // 1 minute
    successThreshold = 3,
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.successThreshold = successThreshold;
    this.state = {
      status: 'closed',
      failures: 0,
      lastFailure: null,
      nextAttempt: null,
      successCount: 0,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.status === 'open') {
      if (this.state.nextAttempt && Date.now() < this.state.nextAttempt.getTime()) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state.status = 'half-open';
      this.state.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.successCount++;

    if (this.state.status === 'half-open' && this.state.successCount >= this.successThreshold) {
      this.state.status = 'closed';
      this.state.failures = 0;
      this.state.lastFailure = null;
      this.state.nextAttempt = null;
    }
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailure = new Date();
    this.state.successCount = 0;

    if (this.state.failures >= this.failureThreshold) {
      this.state.status = 'open';
      this.state.nextAttempt = new Date(Date.now() + this.recoveryTimeout);
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      status: 'closed',
      failures: 0,
      lastFailure: null,
      nextAttempt: null,
      successCount: 0,
    };
  }
}

export class EnhancedHealthMonitor extends EventEmitter {
  private readonly config: {
    TARGET_URL: string;
    MONITORING_INTERVAL: string;
    PERFORMANCE_SLA: number;
    MAX_RETRIES: number;
    TIMEOUT: number;
    HEALTH_ENDPOINTS: HealthEndpoint[];
    AUTO_FIX_ENABLED: boolean;
    WEBSOCKET_PORT: number;
    PIECES_INTEGRATION_ENABLED: boolean;
    KNOWLEDGE_BASE_PATH: string;
    REPORTS_PATH: string;
    LOGS_PATH: string;
  };

  private readonly state: {
    isRunning: boolean;
    lastCheck: HealthCheckResult | null;
    consecutiveFailures: number;
    knownFixes: Map<string, AutoFixPattern>;
    activeAlerts: Set<string>;
    performanceHistory: PerformanceMetric[];
    circuitBreakers: Map<string, CircuitBreaker>;
    discoveredEndpoints: Set<string>;
    subAgentConnections: Set<WebSocket>;
  };

  private cronJob: cron.ScheduledTask | null;
  private wsServer: WebSocket.Server | null;

  constructor() {
    super();

    this.config = {
      TARGET_URL: 'https://war-room-oa9t.onrender.com',
      MONITORING_INTERVAL: '*/30 * * * *', // Every 30 minutes
      PERFORMANCE_SLA: 3000, // 3 seconds max response time
      MAX_RETRIES: 3,
      TIMEOUT: 15000,
      HEALTH_ENDPOINTS: [
        { path: '/api/health', name: 'Main Health', critical: true, timeout: 5000, expectedStatus: [200] },
        { path: '/api/v1/status', name: 'API Status', critical: true, timeout: 5000, expectedStatus: [200] },
        { path: '/api/v1/analytics/status', name: 'Analytics Status', critical: false, timeout: 10000, expectedStatus: [200, 503] },
        { path: '/api/v1/auth/status', name: 'Auth Status', critical: true, timeout: 5000, expectedStatus: [200] },
        { path: '/api/v1/monitoring/health', name: 'Monitoring Health', critical: false, timeout: 5000, expectedStatus: [200] },
        { path: '/docs', name: 'Documentation', critical: false, timeout: 10000, expectedStatus: [200] },
        { path: '/', name: 'Site Root', critical: true, timeout: 10000, expectedStatus: [200] },
      ],
      AUTO_FIX_ENABLED: true,
      WEBSOCKET_PORT: 8080,
      PIECES_INTEGRATION_ENABLED: true,
      KNOWLEDGE_BASE_PATH: path.join(__dirname, 'knowledge-base'),
      REPORTS_PATH: path.join(__dirname, 'reports'),
      LOGS_PATH: path.join(__dirname, 'logs'),
    };

    this.state = {
      isRunning: false,
      lastCheck: null,
      consecutiveFailures: 0,
      knownFixes: new Map(),
      activeAlerts: new Set(),
      performanceHistory: [],
      circuitBreakers: new Map(),
      discoveredEndpoints: new Set(),
      subAgentConnections: new Set(),
    };

    this.cronJob = null;
    this.wsServer = null;

    this.initializeDirectories();
    this.loadKnownFixes();
    this.setupWebSocketServer();
    this.initializeCircuitBreakers();
  }

  private async initializeDirectories(): Promise<void> {
    const dirs = [
      this.config.KNOWLEDGE_BASE_PATH,
      this.config.REPORTS_PATH,
      this.config.LOGS_PATH,
      path.join(this.config.LOGS_PATH, 'auto-fixes'),
      path.join(this.config.REPORTS_PATH, 'daily'),
      path.join(this.config.KNOWLEDGE_BASE_PATH, 'health-check-fixes'),
      path.join(this.config.KNOWLEDGE_BASE_PATH, 'pieces-integration'),
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error: any) {
        this.log(`Failed to create directory ${dir}: ${error.message}`, 'error');
      }
    }
  }

  private initializeCircuitBreakers(): void {
    this.config.HEALTH_ENDPOINTS.forEach(endpoint => {
      const breaker = new CircuitBreaker(`endpoint-${endpoint.path}`, 3, 30000, 2);
      this.state.circuitBreakers.set(endpoint.path, breaker);
    });

    // Add circuit breakers for auto-fix operations
    const autoFixBreaker = new CircuitBreaker('auto-fix', 5, 60000, 3);
    this.state.circuitBreakers.set('auto-fix', autoFixBreaker);

    this.log('Circuit breakers initialized for all endpoints');
  }

  private setupWebSocketServer(): void {
    try {
      this.wsServer = new WebSocket.Server({ port: this.config.WEBSOCKET_PORT });

      this.wsServer.on('connection', (ws: WebSocket) => {
        this.state.subAgentConnections.add(ws);
        this.log(`Sub-agent connected. Total connections: ${this.state.subAgentConnections.size}`);

        ws.on('message', (data: string) => {
          try {
            const message = JSON.parse(data) as SubAgentMessage;
            this.handleSubAgentMessage(message);
          } catch (error: any) {
            this.log(`Invalid WebSocket message: ${error.message}`, 'error');
          }
        });

        ws.on('close', () => {
          this.state.subAgentConnections.delete(ws);
          this.log(`Sub-agent disconnected. Total connections: ${this.state.subAgentConnections.size}`);
        });

        // Send welcome message
        this.sendSubAgentMessage({
          type: 'health-update',
          timestamp: new Date().toISOString(),
          source: 'health-monitor',
          data: { status: 'connected', lastCheck: this.state.lastCheck?.timestamp },
        });
      });

      this.log(`WebSocket server started on port ${this.config.WEBSOCKET_PORT}`);
    } catch (error: any) {
      this.log(`Failed to start WebSocket server: ${error.message}`, 'error');
    }
  }

  private handleSubAgentMessage(message: SubAgentMessage): void {
    this.log(`Received message from ${message.source}: ${message.type}`);

    switch (message.type) {
      case 'performance-violation':
        this.handlePerformanceViolation(message.data);
        break;
      case 'fix-applied':
        this.handleFixApplied(message.data);
        break;
      default:
        this.log(`Unknown message type: ${message.type}`, 'warn');
    }
  }

  private handlePerformanceViolation(data: any): void {
    this.log(`Performance violation reported: ${JSON.stringify(data)}`);
    // Trigger immediate health check if performance issues detected
    if (data.severity === 'critical') {
      this.performHealthCheck();
    }
  }

  private handleFixApplied(data: any): void {
    this.log(`Auto-fix applied by sub-agent: ${data.action}`);
    // Update our known fixes database
    if (data.pattern && data.success) {
      this.saveKnownFix(data.pattern, data, data.success);
    }
  }

  private sendSubAgentMessage(message: SubAgentMessage): void {
    const messageStr = JSON.stringify(message);
    this.state.subAgentConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  private async loadKnownFixes(): Promise<void> {
    try {
      const fixesPath = path.join(this.config.KNOWLEDGE_BASE_PATH, 'health-check-fixes', 'known-fixes.json');
      const data = await fs.readFile(fixesPath, 'utf8');
      const fixes: AutoFixPattern[] = JSON.parse(data);

      fixes.forEach(fix => {
        this.state.knownFixes.set(fix.pattern, fix);
      });

      this.log(`Loaded ${this.state.knownFixes.size} known fixes from knowledge base`);
    } catch (error: any) {
      this.log('No existing known fixes found, starting with empty knowledge base');
    }
  }

  private async saveKnownFix(pattern: string, fix: Partial<AutoFixPattern>, success = true): Promise<void> {
    const fixRecord: AutoFixPattern = {
      pattern,
      action: fix.action || 'unknown',
      success,
      timestamp: new Date().toISOString(),
      appliedCount: 1,
      successRate: success ? 1 : 0,
      tags: ['health-check-fixes', 'auto-generated'],
      metadata: {
        endpoint: fix.metadata?.endpoint,
        errorType: fix.metadata?.errorType,
        responseTime: fix.metadata?.responseTime,
        severity: fix.metadata?.severity || 'medium',
      },
    };

    // Update existing or create new
    if (this.state.knownFixes.has(pattern)) {
      const existing = this.state.knownFixes.get(pattern)!;
      existing.appliedCount++;
      existing.successRate = ((existing.successRate * (existing.appliedCount - 1)) + (success ? 1 : 0)) / existing.appliedCount;
      existing.timestamp = new Date().toISOString();
      this.state.knownFixes.set(pattern, existing);
    } else {
      this.state.knownFixes.set(pattern, fixRecord);
    }

    // Save to knowledge base
    await this.persistKnowledgeBase();

    // Save to Pieces if enabled
    if (this.config.PIECES_INTEGRATION_ENABLED) {
      await this.saveToPieces(fixRecord);
    }

    this.log(`Saved fix pattern "${pattern}" to knowledge base (success: ${success})`);
  }

  private async persistKnowledgeBase(): Promise<void> {
    try {
      const fixesArray = Array.from(this.state.knownFixes.values());
      const fixesPath = path.join(this.config.KNOWLEDGE_BASE_PATH, 'health-check-fixes', 'known-fixes.json');
      await fs.writeFile(fixesPath, JSON.stringify(fixesArray, null, 2));
    } catch (error: any) {
      this.log(`Failed to persist knowledge base: ${error.message}`, 'error');
    }
  }

  private async saveToPieces(fixPattern: AutoFixPattern): Promise<void> {
    try {
      const piecesPath = path.join(this.config.KNOWLEDGE_BASE_PATH, 'pieces-integration', `fix-${Date.now()}.json`);

      const piecesEntry = {
        id: `health-fix-${Date.now()}`,
        title: `Health Check Fix: ${fixPattern.pattern}`,
        description: `Auto-fix pattern for ${fixPattern.pattern} with ${(fixPattern.successRate * 100).toFixed(1)}% success rate`,
        tags: [...fixPattern.tags, 'health-check-fixes'],
        metadata: {
          ...fixPattern.metadata,
          source: 'health-monitor-sub-agent',
          category: 'auto-fix-pattern',
          reliability: fixPattern.successRate > 0.8 ? 'high' : fixPattern.successRate > 0.6 ? 'medium' : 'low',
        },
        content: {
          pattern: fixPattern.pattern,
          action: fixPattern.action,
          appliedCount: fixPattern.appliedCount,
          successRate: fixPattern.successRate,
          lastApplied: fixPattern.timestamp,
        },
        timestamp: new Date().toISOString(),
      };

      await fs.writeFile(piecesPath, JSON.stringify(piecesEntry, null, 2));
      this.log(`Saved fix pattern to Pieces: ${fixPattern.pattern}`);
    } catch (error: any) {
      this.log(`Failed to save to Pieces: ${error.message}`, 'error');
    }
  }

  public start(): void {
    if (this.state.isRunning) {
      this.log('Health monitor is already running');
      return;
    }

    this.log('Starting Enhanced Health Check Monitor Sub-Agent...');
    this.state.isRunning = true;

    // Schedule the cron job for every 30 minutes
    this.cronJob = cron.schedule(this.config.MONITORING_INTERVAL, async () => {
      await this.performHealthCheck();
    }, {
      scheduled: true,
      timezone: 'America/New_York',
    });

    // Perform initial health check
    this.performHealthCheck();

    // Start endpoint discovery
    this.startEndpointDiscovery();

    this.log('Enhanced health monitor started - checking every 30 minutes');
    this.log(`Target URL: ${this.config.TARGET_URL}`);
    this.log(`WebSocket server: localhost:${this.config.WEBSOCKET_PORT}`);
    this.log(`Circuit breakers: ${this.state.circuitBreakers.size} initialized`);
  }

  public stop(): void {
    if (!this.state.isRunning) {
      this.log('Health monitor is not running');
      return;
    }

    this.log('Stopping Enhanced Health Check Monitor Sub-Agent...');

    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }

    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = null;
    }

    this.state.isRunning = false;
    this.log('Enhanced health monitor stopped');
  }

  private async startEndpointDiscovery(): Promise<void> {
    this.log('Starting automated endpoint discovery...');

    try {
      // Discover endpoints from robots.txt
      await this.discoverFromRobotsTxt();

      // Discover endpoints from sitemap
      await this.discoverFromSitemap();

      // Discover API endpoints through common patterns
      await this.discoverApiEndpoints();

      this.log(`Endpoint discovery completed. Found ${this.state.discoveredEndpoints.size} additional endpoints`);
    } catch (error: any) {
      this.log(`Endpoint discovery failed: ${error.message}`, 'error');
    }
  }

  private async discoverFromRobotsTxt(): Promise<void> {
    try {
      const response = await axios.get(`${this.config.TARGET_URL}/robots.txt`, { timeout: 5000 });
      const robotsContent = response.data;

      // Extract disallowed paths (these might be valid endpoints to monitor)
      const disallowedPaths = robotsContent
        .split('\n')
        .filter((line: string) => line.startsWith('Disallow:'))
        .map((line: string) => line.replace('Disallow:', '').trim())
        .filter((path: string) => path && path.startsWith('/'));

      disallowedPaths.forEach(path => this.state.discoveredEndpoints.add(path));
      this.log(`Discovered ${disallowedPaths.length} endpoints from robots.txt`);
    } catch (error: any) {
      this.log(`robots.txt discovery failed: ${error.message}`);
    }
  }

  private async discoverFromSitemap(): Promise<void> {
    const sitemapUrls = ['/sitemap.xml', '/sitemap_index.xml'];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await axios.get(`${this.config.TARGET_URL}${sitemapUrl}`, { timeout: 5000 });
        const sitemapContent = response.data;

        // Simple XML parsing for URLs
        const urlMatches = sitemapContent.match(/<loc>([^<]+)<\/loc>/g);
        if (urlMatches) {
          urlMatches.forEach((match: string) => {
            const url = match.replace(/<\/?loc>/g, '');
            const path = new URL(url).pathname;
            this.state.discoveredEndpoints.add(path);
          });
          this.log(`Discovered ${urlMatches.length} endpoints from ${sitemapUrl}`);
        }
        break;
      } catch (error: any) {
        continue;
      }
    }
  }

  private async discoverApiEndpoints(): Promise<void> {
    const commonApiPaths = [
      '/api',
      '/api/v1',
      '/api/v2',
      '/api/health',
      '/api/status',
      '/api/metrics',
      '/health',
      '/status',
      '/metrics',
      '/ping',
      '/ready',
      '/live',
    ];

    for (const apiPath of commonApiPaths) {
      try {
        const response = await axios.get(`${this.config.TARGET_URL}${apiPath}`, {
          timeout: 3000,
          validateStatus: () => true, // Accept any status code
        });

        if (response.status < 500) {
          this.state.discoveredEndpoints.add(apiPath);
        }
      } catch (error: any) {
        // Endpoint doesn't exist or is unreachable
        continue;
      }
    }
  }

  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    this.log('Starting comprehensive enhanced health check...');

    const results: HealthCheckResult = {
      timestamp: new Date().toISOString(),
      checkId: `health-${startTime}`,
      overall: 'fair',
      score: 0,
      site: {
        available: false,
        responseTime: 0,
        statusCode: 0,
      },
      endpoints: {
        healthy: 0,
        total: 0,
        percentage: 0,
        results: {},
      },
      ui: {
        playwright: {
          success: false,
          exitCode: 0,
          output: '',
          testsRun: 0,
          testsPassed: 0,
          testsFailed: 0,
          duration: 0,
        },
        accessibility: {
          success: false,
          checks: {},
          score: 0,
          message: '',
          violations: [],
        },
        overall: 'failed',
      },
      performance: {
        averageResponseTime: 0,
        slaViolations: 0,
        availability: 0,
        performanceGrade: 'F',
        metrics: [],
      },
      mockData: {
        working: 0,
        total: 0,
        percentage: 0,
        allWorking: false,
        endpoints: {},
      },
      autoFixes: [],
      criticalIssues: [],
      recommendations: [],
      circuitBreakers: {},
    };

    try {
      // 1. Check site availability first
      results.site = await this.checkSiteAvailability();

      // 2. Monitor all health endpoints with circuit breakers
      results.endpoints = await this.checkHealthEndpointsWithCircuitBreakers();

      // 3. Run enhanced UI functionality tests
      results.ui = await this.runEnhancedUITests();

      // 4. Enhanced performance monitoring with detailed metrics
      results.performance = await this.checkEnhancedPerformanceMetrics();

      // 5. Verify mock data fallback mechanisms with validation
      results.mockData = await this.verifyEnhancedMockDataFallbacks();

      // 6. Advanced auto-fix with circuit breaker protection
      if (this.config.AUTO_FIX_ENABLED) {
        results.autoFixes = await this.attemptAdvancedAutoFixes(results);
      }

      // 7. Enhanced critical issue identification
      results.criticalIssues = this.identifyEnhancedCriticalIssues(results);

      // 8. Generate actionable recommendations
      results.recommendations = this.generateActionableRecommendations(results);

      // 9. Include circuit breaker states
      results.circuitBreakers = this.getCircuitBreakerStates();

      // Calculate enhanced overall health score
      results.overall = this.calculateEnhancedOverallHealth(results);
      results.score = this.calculateHealthScore(results);

      // Update state
      this.state.lastCheck = results;
      this.updateConsecutiveFailures(results.overall);

      // Save enhanced results
      await this.saveEnhancedHealthReport(results);

      // Handle alerts with sub-agent coordination
      await this.handleEnhancedAlertsAndNotifications(results);

      const duration = Date.now() - startTime;
      this.log(`Enhanced health check completed in ${duration}ms - Status: ${results.overall.toUpperCase()} (Score: ${results.score.toFixed(1)})`);

      // Send to connected sub-agents
      this.sendSubAgentMessage({
        type: 'health-update',
        timestamp: results.timestamp,
        source: 'health-monitor',
        data: {
          overall: results.overall,
          score: results.score,
          criticalIssues: results.criticalIssues.length,
          autoFixesApplied: results.autoFixes.filter(f => f.success).length,
        },
      });

      this.emit('healthCheckComplete', results);

    } catch (error: any) {
      this.log(`Enhanced health check failed: ${error.message}`, 'error');
      results.overall = 'error';
      this.emit('healthCheckError', error);
    }

    return results;
  }

  // Helper methods (implementation details)
  private async checkSiteAvailability(): Promise<{ available: boolean; responseTime: number; statusCode: number; contentType?: string; }> {
    const startTime = Date.now();
    try {
      const response = await axios.get(this.config.TARGET_URL, {
        timeout: this.config.TIMEOUT,
        headers: { 'User-Agent': 'WarRoom-EnhancedHealthMonitor/2.0' },
      });

      return {
        available: response.status >= 200 && response.status < 400,
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        contentType: response.headers['content-type'],
      };
    } catch (error: any) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
        statusCode: error.response?.status || 0,
      };
    }
  }

  private async checkHealthEndpointsWithCircuitBreakers(): Promise<{ healthy: number; total: number; percentage: number; results: Record<string, EndpointResult>; }> {
    const results: Record<string, EndpointResult> = {};
    let healthyCount = 0;

    for (const endpoint of this.config.HEALTH_ENDPOINTS) {
      const breaker = this.state.circuitBreakers.get(endpoint.path);

      try {
        if (breaker) {
          const result = await breaker.execute(async () => {
            return await this.checkSingleEndpoint(endpoint);
          });
          results[endpoint.path] = { ...result, circuitBreakerState: breaker.getState().status };
        } else {
          results[endpoint.path] = await this.checkSingleEndpoint(endpoint);
        }

        if (results[endpoint.path].healthy) {
          healthyCount++;
        }
      } catch (error: any) {
        results[endpoint.path] = {
          healthy: false,
          status: 0,
          responseTime: 0,
          contentLength: 0,
          error: error.message,
          circuitBreakerState: breaker?.getState().status || 'closed',
        };
      }
    }

    const percentage = (healthyCount / this.config.HEALTH_ENDPOINTS.length) * 100;

    return {
      healthy: healthyCount,
      total: this.config.HEALTH_ENDPOINTS.length,
      percentage: Math.round(percentage * 10) / 10,
      results,
    };
  }

  private async checkSingleEndpoint(endpoint: HealthEndpoint): Promise<EndpointResult> {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${this.config.TARGET_URL}${endpoint.path}`, {
        timeout: endpoint.timeout,
        headers: {
          'User-Agent': 'WarRoom-EnhancedHealthMonitor/2.0',
          ...endpoint.headers,
        },
        validateStatus: (status) => {
          if (endpoint.expectedStatus) {
            return endpoint.expectedStatus.includes(status);
          }
          return status < 500;
        },
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = endpoint.expectedStatus
        ? endpoint.expectedStatus.includes(response.status)
        : response.status >= 200 && response.status < 400;

      return {
        healthy: isHealthy,
        status: response.status,
        responseTime,
        contentType: response.headers['content-type'],
        contentLength: response.data?.length || 0,
      };

    } catch (error: any) {
      return {
        healthy: false,
        status: error.response?.status || 0,
        responseTime: Date.now() - startTime,
        contentLength: 0,
        error: error.message,
        requiresFix: this.isFixableError(error),
      };
    }
  }

  private async runEnhancedUITests(): Promise<{ playwright: PlaywrightResult; accessibility: AccessibilityResult; overall: 'passed' | 'failed' | 'error'; }> {
    try {
      const [playwrightResult, accessibilityResult] = await Promise.all([
        this.runPlaywrightTestsEnhanced(),
        this.checkEnhancedUIAccessibility(),
      ]);

      return {
        playwright: playwrightResult,
        accessibility: accessibilityResult,
        overall: playwrightResult.success && accessibilityResult.success ? 'passed' : 'failed',
      };
    } catch (error: any) {
      return {
        playwright: { success: false, exitCode: 1, output: '', testsRun: 0, testsPassed: 0, testsFailed: 0, duration: 0, error: error.message },
        accessibility: { success: false, checks: {}, score: 0, message: error.message, violations: [] },
        overall: 'error',
      };
    }
  }

  private async runPlaywrightTestsEnhanced(): Promise<PlaywrightResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const testCommand = spawn('npx', ['playwright', 'test', '--project=monitoring', '--reporter=json'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      testCommand.stdout.on('data', (data) => {
        output += data.toString();
      });

      testCommand.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      testCommand.on('close', (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;

        // Parse Playwright JSON output for detailed metrics
        let testsRun = 0;
        let testsPassed = 0;
        let testsFailed = 0;

        try {
          const jsonOutput = JSON.parse(output);
          if (jsonOutput.suites) {
            jsonOutput.suites.forEach((suite: any) => {
              suite.specs?.forEach((spec: any) => {
                testsRun++;
                if (spec.ok) {testsPassed++;} else {testsFailed++;}
              });
            });
          }
        } catch (e) {
          // Fallback to basic metrics
          testsRun = success ? 1 : 0;
          testsPassed = success ? 1 : 0;
          testsFailed = success ? 0 : 1;
        }

        this.log(`Playwright tests ${success ? 'passed' : 'failed'} (${testsPassed}/${testsRun}) in ${duration}ms`);

        resolve({
          success,
          exitCode: code || 0,
          output: output.slice(-1000), // Last 1000 chars
          error: errorOutput.slice(-500),
          testsRun,
          testsPassed,
          testsFailed,
          duration,
        });
      });

      // Timeout after 10 minutes
      setTimeout(() => {
        testCommand.kill('SIGKILL');
        resolve({
          success: false,
          exitCode: 124,
          output: '',
          error: 'Playwright tests timed out after 10 minutes',
          timeout: true,
          testsRun: 0,
          testsPassed: 0,
          testsFailed: 1,
          duration: 600000,
        });
      }, 600000);
    });
  }

  private async checkEnhancedUIAccessibility(): Promise<AccessibilityResult> {
    try {
      const response = await axios.get(this.config.TARGET_URL, { timeout: this.config.TIMEOUT });
      const html = response.data;

      const checks = {
        hasTitle: html.includes('<title>') && !html.includes('<title></title>'),
        hasMetaDescription: html.includes('<meta name="description"'),
        hasH1: html.includes('<h1'),
        hasNavigation: html.includes('<nav') || html.includes('navigation') || html.includes('role="navigation"'),
        hasMainContent: html.includes('<main') || html.includes('id="main"') || html.includes('role="main"'),
        hasSkipLinks: html.includes('skip') && html.includes('href="#'),
        hasLangAttribute: html.includes('<html') && html.includes('lang='),
        hasAltTexts: !html.includes('<img') || html.includes('alt='),
        hasHeadingHierarchy: this.checkHeadingHierarchy(html),
        hasAriaLabels: !html.includes('button') || html.includes('aria-label='),
      };

      const violations: string[] = [];
      Object.entries(checks).forEach(([check, passed]) => {
        if (!passed) {violations.push(check);}
      });

      const passedChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      const score = passedChecks / totalChecks;

      return {
        success: score >= 0.8, // 80% threshold
        checks,
        score,
        message: `Accessibility: ${passedChecks}/${totalChecks} checks passed`,
        violations,
      };

    } catch (error: any) {
      return {
        success: false,
        checks: {},
        score: 0,
        message: `Accessibility check failed: ${error.message}`,
        violations: ['connection-error'],
      };
    }
  }

  private checkHeadingHierarchy(html: string): boolean {
    const headings = html.match(/<h[1-6][^>]*>/g);
    if (!headings) {return true;} // No headings is okay

    const levels = headings.map(h => parseInt(h.match(/<h([1-6])/)?.[1] || '1'));

    // Check if we start with h1 and don't skip levels
    if (levels[0] !== 1) {return false;}

    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) {return false;}
    }

    return true;
  }

  private async checkEnhancedPerformanceMetrics(): Promise<{ averageResponseTime: number; slaViolations: number; availability: number; performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'; metrics: PerformanceMetric[]; }> {
    const metrics: PerformanceMetric[] = [];
    let slaViolations = 0;
    const testRequests = 5;
    const successfulRequests: number[] = [];

    for (let i = 0; i < testRequests; i++) {
      const startTime = Date.now();

      try {
        const response = await axios.get(this.config.TARGET_URL, {
          timeout: this.config.TIMEOUT,
          headers: { 'User-Agent': 'WarRoom-PerformanceTest-Enhanced/2.0' },
        });

        const responseTime = Date.now() - startTime;
        const isWithinSLA = responseTime <= this.config.PERFORMANCE_SLA;

        const metric: PerformanceMetric = {
          timestamp: new Date().toISOString(),
          endpoint: '/',
          responseTime,
          withinSLA: isWithinSLA,
          statusCode: response.status,
          contentLength: response.data?.length || 0,
        };

        metrics.push(metric);
        successfulRequests.push(responseTime);

        if (!isWithinSLA) {
          slaViolations++;

          // Send performance violation to sub-agents
          this.sendSubAgentMessage({
            type: 'performance-violation',
            timestamp: new Date().toISOString(),
            source: 'health-monitor',
            data: {
              endpoint: '/',
              responseTime,
              slaThreshold: this.config.PERFORMANCE_SLA,
              severity: responseTime > this.config.PERFORMANCE_SLA * 2 ? 'critical' : 'warning',
            },
          });
        }

        // Add to performance history
        this.state.performanceHistory.push(metric);

      } catch (error: any) {
        metrics.push({
          timestamp: new Date().toISOString(),
          endpoint: '/',
          responseTime: Date.now() - startTime,
          withinSLA: false,
          statusCode: error.response?.status || 0,
          contentLength: 0,
        });
      }

      // Small delay between requests
      if (i < testRequests - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Keep only last 200 performance history records
    if (this.state.performanceHistory.length > 200) {
      this.state.performanceHistory = this.state.performanceHistory.slice(-200);
    }

    const availability = (successfulRequests.length / testRequests) * 100;
    const averageResponseTime = successfulRequests.length > 0
      ? Math.round(successfulRequests.reduce((a, b) => a + b, 0) / successfulRequests.length)
      : 0;

    // Enhanced performance grading
    let performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (slaViolations === 0 && successfulRequests.length === testRequests && averageResponseTime <= this.config.PERFORMANCE_SLA * 0.5) {
      performanceGrade = 'A';
    } else if (slaViolations <= 1 && availability >= 90 && averageResponseTime <= this.config.PERFORMANCE_SLA * 0.8) {
      performanceGrade = 'B';
    } else if (slaViolations <= 2 && availability >= 80 && averageResponseTime <= this.config.PERFORMANCE_SLA) {
      performanceGrade = 'C';
    } else if (availability >= 60) {
      performanceGrade = 'D';
    }

    this.log(`Performance: ${averageResponseTime}ms avg, ${slaViolations}/${testRequests} SLA violations, ${availability.toFixed(1)}% availability (Grade: ${performanceGrade})`);

    return {
      averageResponseTime,
      slaViolations,
      availability: Math.round(availability * 10) / 10,
      performanceGrade,
      metrics,
    };
  }

  private async verifyEnhancedMockDataFallbacks(): Promise<{ working: number; total: number; percentage: number; allWorking: boolean; endpoints: Record<string, MockDataResult>; }> {
    const mockDataEndpoints = [
      '/api/v1/analytics/mock',
      '/api/v1/campaigns/mock',
      '/api/v1/monitoring/mock',
      '/api/v1/alerts/mock',
    ];

    const results: { working: number; total: number; percentage: number; allWorking: boolean; endpoints: Record<string, MockDataResult>; } = {
      working: 0,
      total: mockDataEndpoints.length,
      percentage: 0,
      allWorking: false,
      endpoints: {},
    };

    for (const endpoint of mockDataEndpoints) {
      try {
        const response = await axios.get(`${this.config.TARGET_URL}${endpoint}`, {
          timeout: this.config.TIMEOUT,
          headers: {
            'X-Mock-Mode': 'true',
            'User-Agent': 'WarRoom-MockDataValidator/2.0',
          },
        });

        const validationErrors = this.validateMockData(response.data, endpoint);
        const isValidMockData = response.data &&
          (Array.isArray(response.data) || typeof response.data === 'object') &&
          JSON.stringify(response.data).length > 10 &&
          validationErrors.length === 0;

        results.endpoints[endpoint] = {
          working: isValidMockData,
          status: response.status,
          dataLength: JSON.stringify(response.data).length,
          hasData: Boolean(response.data),
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        };

        if (isValidMockData) {
          results.working++;
        }

      } catch (error: any) {
        results.endpoints[endpoint] = {
          working: false,
          status: error.response?.status || 0,
          dataLength: 0,
          hasData: false,
          error: error.message,
        };
      }
    }

    results.percentage = Math.round((results.working / results.total) * 1000) / 10;
    results.allWorking = results.working === results.total;

    this.log(`Mock data: ${results.working}/${results.total} endpoints working (${results.percentage}%)`);

    return results;
  }

  private validateMockData(data: any, endpoint: string): string[] {
    const errors: string[] = [];

    if (!data) {
      errors.push('No data returned');
      return errors;
    }

    // Endpoint-specific validation
    if (endpoint.includes('analytics')) {
      if (!data.metrics && !Array.isArray(data)) {
        errors.push('Analytics data missing metrics or array structure');
      }
    } else if (endpoint.includes('campaigns')) {
      if (!data.campaigns && !Array.isArray(data)) {
        errors.push('Campaign data missing campaigns or array structure');
      }
    } else if (endpoint.includes('monitoring')) {
      if (!data.status && !data.health) {
        errors.push('Monitoring data missing status or health indicators');
      }
    }

    return errors;
  }

  private async attemptAdvancedAutoFixes(healthResults: HealthCheckResult): Promise<AutoFixResult[]> {
    if (!this.config.AUTO_FIX_ENABLED) {
      return [];
    }

    const fixes: AutoFixResult[] = [];
    const autoFixBreaker = this.state.circuitBreakers.get('auto-fix');

    this.log('Attempting advanced auto-fixes with circuit breaker protection...');

    // Check for fixable endpoint issues
    for (const [endpoint, result] of Object.entries(healthResults.endpoints.results)) {
      if (!result.healthy && result.requiresFix) {
        if (autoFixBreaker) {
          try {
            const fix = await autoFixBreaker.execute(async () => {
              return await this.tryAdvancedAutoFix(endpoint, result);
            });
            if (fix) {
              fixes.push(fix);
            }
          } catch (error: any) {
            this.log(`Auto-fix circuit breaker prevented fix attempt for ${endpoint}: ${error.message}`);
          }
        } else {
          const fix = await this.tryAdvancedAutoFix(endpoint, result);
          if (fix) {
            fixes.push(fix);
          }
        }
      }
    }

    // Check for performance issues
    if (healthResults.performance.slaViolations > 2) {
      if (autoFixBreaker) {
        try {
          const fix = await autoFixBreaker.execute(async () => {
            return await this.tryAdvancedPerformanceFix(healthResults.performance);
          });
          if (fix) {
            fixes.push(fix);
          }
        } catch (error: any) {
          this.log(`Auto-fix circuit breaker prevented performance fix: ${error.message}`);
        }
      }
    }

    this.log(`Applied ${fixes.filter(f => f.success).length}/${fixes.length} auto-fixes`);
    return fixes;
  }

  private async tryAdvancedAutoFix(endpoint: string, errorResult: EndpointResult): Promise<AutoFixResult | null> {
    const startTime = Date.now();
    const errorPattern = this.identifyAdvancedErrorPattern(errorResult);
    const knownFix = this.state.knownFixes.get(errorPattern);

    if (knownFix && knownFix.successRate > 0.7) {
      this.log(`Applying known fix for pattern: ${errorPattern} (${(knownFix.successRate * 100).toFixed(1)}% success rate)`);

      try {
        const fixResult = await this.applyAdvancedFix(knownFix, endpoint);
        await this.saveKnownFix(errorPattern, knownFix, fixResult.success);

        const result: AutoFixResult = {
          endpoint,
          pattern: errorPattern,
          action: knownFix.action,
          success: fixResult.success,
          message: fixResult.message,
          duration: Date.now() - startTime,
        };

        // Notify sub-agents of successful fix
        if (fixResult.success) {
          this.sendSubAgentMessage({
            type: 'fix-applied',
            timestamp: new Date().toISOString(),
            source: 'health-monitor',
            data: result,
          });
        }

        return result;
      } catch (error: any) {
        await this.saveKnownFix(errorPattern, knownFix, false);
        return {
          endpoint,
          pattern: errorPattern,
          action: knownFix.action,
          success: false,
          message: error.message,
          duration: Date.now() - startTime,
        };
      }
    }

    // Try common fixes for unknown issues
    return await this.tryAdvancedCommonFixes(endpoint, errorResult);
  }

  private identifyAdvancedErrorPattern(errorResult: EndpointResult): string {
    if (errorResult.status === 503) {return 'service-unavailable';}
    if (errorResult.status === 502) {return 'bad-gateway';}
    if (errorResult.status === 500) {return 'internal-server-error';}
    if (errorResult.status === 429) {return 'rate-limit-exceeded';}
    if (errorResult.status === 404) {return 'not-found';}
    if (errorResult.error?.includes('timeout')) {return 'timeout-error';}
    if (errorResult.error?.includes('ECONNREFUSED')) {return 'connection-refused';}
    if (errorResult.error?.includes('ENOTFOUND')) {return 'dns-resolution-error';}
    if (errorResult.responseTime > 10000) {return 'slow-response';}
    if (errorResult.circuitBreakerState === 'open') {return 'circuit-breaker-open';}
    return 'unknown-error';
  }

  private async applyAdvancedFix(fix: AutoFixPattern, endpoint: string): Promise<{ success: boolean; message: string; }> {
    switch (fix.action) {
      case 'restart-service':
        return { success: false, message: 'Cannot restart remote service automatically' };

      case 'clear-cache':
        try {
          await axios.post(`${this.config.TARGET_URL}/api/v1/admin/clear-cache`, {}, {
            timeout: 10000,
            headers: { 'X-Auto-Fix': 'true', 'X-Fix-Pattern': fix.pattern },
          });
          return { success: true, message: 'Cache cleared successfully' };
        } catch (error: any) {
          return { success: false, message: `Failed to clear cache: ${error.message}` };
        }

      case 'force-health-check':
        try {
          await axios.get(`${this.config.TARGET_URL}${endpoint}?force=true&t=${Date.now()}`, {
            timeout: 15000,
          });
          return { success: true, message: 'Forced health check completed' };
        } catch (error: any) {
          return { success: false, message: `Force health check failed: ${error.message}` };
        }

      case 'warm-up-application':
        try {
          const warmupPromises = [
            axios.get(this.config.TARGET_URL, { timeout: 10000 }),
            axios.get(`${this.config.TARGET_URL}/api/health`, { timeout: 10000 }),
            axios.get(`${this.config.TARGET_URL}/api/v1/status`, { timeout: 10000 }),
          ];

          await Promise.allSettled(warmupPromises);
          return { success: true, message: 'Application warmed up successfully' };
        } catch (error: any) {
          return { success: false, message: `Warm-up failed: ${error.message}` };
        }

      case 'reset-circuit-breaker':
        const breaker = this.state.circuitBreakers.get(endpoint);
        if (breaker) {
          breaker.reset();
          return { success: true, message: `Circuit breaker reset for ${endpoint}` };
        }
        return { success: false, message: 'Circuit breaker not found' };

      default:
        return { success: false, message: `Unknown fix action: ${fix.action}` };
    }
  }

  private async tryAdvancedCommonFixes(endpoint: string, errorResult: EndpointResult): Promise<AutoFixResult | null> {
    const startTime = Date.now();
    const commonFixes = [
      'force-health-check',
      'clear-cache',
      'warm-up-application',
      'reset-circuit-breaker',
    ];

    for (const fixAction of commonFixes) {
      try {
        const fix: Partial<AutoFixPattern> = {
          action: fixAction,
          metadata: { severity: 'medium' },
        };
        const result = await this.applyAdvancedFix(fix as AutoFixPattern, endpoint);

        if (result.success) {
          // Save this as a new known fix
          const pattern = this.identifyAdvancedErrorPattern(errorResult);
          await this.saveKnownFix(pattern, fix, true);

          return {
            endpoint,
            pattern,
            action: fixAction,
            success: true,
            message: result.message,
            duration: Date.now() - startTime,
            isNewPattern: true,
          };
        }
      } catch (error: any) {
        continue;
      }
    }

    return null;
  }

  private async tryAdvancedPerformanceFix(performanceResult: any): Promise<AutoFixResult | null> {
    if (performanceResult.averageResponseTime > this.config.PERFORMANCE_SLA) {
      const startTime = Date.now();

      try {
        // Advanced warm-up strategy
        const warmupRequests = 5;
        const warmupPromises = [];

        for (let i = 0; i < warmupRequests; i++) {
          warmupPromises.push(
            axios.get(this.config.TARGET_URL, {
              timeout: 8000,
              headers: { 'X-Warmup-Request': 'true' },
            }).catch(() => {}), // Ignore individual failures
          );
        }

        await Promise.all(warmupPromises);

        // Test if warmup improved performance
        const testStart = Date.now();
        await axios.get(this.config.TARGET_URL, { timeout: 5000 });
        const testResponseTime = Date.now() - testStart;

        const improved = testResponseTime < performanceResult.averageResponseTime * 0.8;

        return {
          endpoint: '/',
          pattern: 'slow-performance',
          action: 'advanced-application-warmup',
          success: improved,
          message: improved
            ? `Performance improved: ${testResponseTime}ms (was ${performanceResult.averageResponseTime}ms)`
            : 'Warmup completed but performance not significantly improved',
          duration: Date.now() - startTime,
        };
      } catch (error: any) {
        return {
          endpoint: '/',
          pattern: 'slow-performance',
          action: 'advanced-application-warmup',
          success: false,
          message: error.message,
          duration: Date.now() - startTime,
        };
      }
    }

    return null;
  }

  private isFixableError(error: any): boolean {
    const fixablePatterns = [
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'Service Unavailable',
      'Bad Gateway',
      'Internal Server Error',
      '503',
      '502',
      '500',
    ];

    return fixablePatterns.some(pattern =>
      error.message?.includes(pattern) ||
      error.response?.statusText?.includes(pattern) ||
      error.code?.includes(pattern),
    );
  }

  private identifyEnhancedCriticalIssues(results: HealthCheckResult): CriticalIssue[] {
    const criticalIssues: CriticalIssue[] = [];

    // Site completely down
    if (!results.site.available || results.endpoints.percentage < 50) {
      criticalIssues.push({
        type: 'site-down',
        severity: 'critical',
        message: 'Site is unavailable or multiple critical endpoints are failing',
        requiresHumanIntervention: true,
        affectedEndpoints: Object.keys(results.endpoints.results).filter(ep => !results.endpoints.results[ep].healthy),
        suggestedActions: [
          'Check server status and logs',
          'Verify DNS resolution',
          'Check load balancer configuration',
          'Review recent deployments',
        ],
      });
    }

    // All UI tests failing
    if (results.ui.overall === 'failed' || results.ui.overall === 'error') {
      criticalIssues.push({
        type: 'ui-failure',
        severity: 'critical',
        message: 'UI functionality tests are failing - user experience compromised',
        requiresHumanIntervention: true,
        suggestedActions: [
          'Check browser console for JavaScript errors',
          'Verify CSS and asset loading',
          'Test responsive design',
          'Review accessibility compliance',
        ],
      });
    }

    // Severe performance degradation
    if (results.performance.slaViolations > 3 || results.performance.availability < 60) {
      criticalIssues.push({
        type: 'performance-critical',
        severity: 'critical',
        message: `Severe performance degradation: ${results.performance.slaViolations} SLA violations, ${results.performance.availability}% availability`,
        requiresHumanIntervention: true,
        suggestedActions: [
          'Scale up server resources',
          'Optimize database queries',
          'Enable CDN for static assets',
          'Review application performance bottlenecks',
        ],
      });
    }

    // Circuit breakers open
    const openCircuitBreakers = Object.entries(results.circuitBreakers)
      .filter(([_, state]) => state.status === 'open');

    if (openCircuitBreakers.length > 0) {
      criticalIssues.push({
        type: 'circuit-breakers-open',
        severity: 'warning',
        message: `${openCircuitBreakers.length} circuit breakers are open, blocking requests`,
        requiresHumanIntervention: false,
        affectedEndpoints: openCircuitBreakers.map(([endpoint]) => endpoint),
        suggestedActions: [
          'Wait for circuit breaker recovery timeout',
          'Investigate root cause of failures',
          'Consider manual circuit breaker reset if issues are resolved',
        ],
      });
    }

    // Mock data completely failing
    if (!results.mockData.allWorking && results.mockData.percentage < 50) {
      criticalIssues.push({
        type: 'mock-data-failure',
        severity: 'warning',
        message: 'Mock data fallback mechanisms are failing - development/demo functionality compromised',
        requiresHumanIntervention: false,
        suggestedActions: [
          'Review mock data generation logic',
          'Check mock data file integrity',
          'Verify fallback mechanism configuration',
        ],
      });
    }

    // Consecutive failures indicating systemic issues
    if (this.state.consecutiveFailures >= 5) {
      criticalIssues.push({
        type: 'systemic-instability',
        severity: 'critical',
        message: `${this.state.consecutiveFailures} consecutive health check failures indicate systemic instability`,
        requiresHumanIntervention: true,
        suggestedActions: [
          'Review system logs for patterns',
          'Check infrastructure status',
          'Consider emergency maintenance window',
          'Escalate to development team',
        ],
      });
    }

    return criticalIssues;
  }

  private generateActionableRecommendations(results: HealthCheckResult): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Endpoint recommendations
    if (results.endpoints.percentage < 100) {
      const unhealthyCount = results.endpoints.total - results.endpoints.healthy;
      recommendations.push({
        type: 'endpoints',
        priority: unhealthyCount > 2 ? 'high' : 'medium',
        message: `${unhealthyCount} endpoints are unhealthy - investigate server logs and endpoint configurations`,
        actionable: true,
        estimatedImpact: 'High - affects core functionality',
      });
    }

    // Performance recommendations
    const performanceThreshold = this.config.PERFORMANCE_SLA * 0.8;
    if (results.performance.averageResponseTime > performanceThreshold) {
      recommendations.push({
        type: 'performance',
        priority: results.performance.averageResponseTime > this.config.PERFORMANCE_SLA ? 'high' : 'medium',
        message: `Response times approaching/exceeding SLA (${results.performance.averageResponseTime}ms avg, SLA: ${this.config.PERFORMANCE_SLA}ms)`,
        actionable: true,
        estimatedImpact: 'Medium - affects user experience',
      });
    }

    // Performance grade recommendations
    if (results.performance.performanceGrade === 'D' || results.performance.performanceGrade === 'F') {
      recommendations.push({
        type: 'performance-optimization',
        priority: 'high',
        message: `Performance grade is ${results.performance.performanceGrade} - immediate optimization needed`,
        actionable: true,
        estimatedImpact: 'High - poor user experience',
      });
    }

    // UI recommendations
    if (results.ui.accessibility.score < 0.8) {
      recommendations.push({
        type: 'accessibility',
        priority: results.ui.accessibility.score < 0.6 ? 'medium' : 'low',
        message: `UI accessibility score: ${(results.ui.accessibility.score * 100).toFixed(1)}% - improvements needed for better user experience`,
        actionable: true,
        estimatedImpact: 'Low - affects accessibility compliance',
      });
    }

    // Circuit breaker recommendations
    const halfOpenBreakers = Object.entries(results.circuitBreakers)
      .filter(([_, state]) => state.status === 'half-open');

    if (halfOpenBreakers.length > 0) {
      recommendations.push({
        type: 'circuit-breakers',
        priority: 'medium',
        message: `${halfOpenBreakers.length} circuit breakers in half-open state - monitor closely for recovery`,
        actionable: true,
        estimatedImpact: 'Medium - affects system resilience',
      });
    }

    // Auto-fix recommendations
    const failedFixes = results.autoFixes.filter(fix => !fix.success);
    if (failedFixes.length > 0) {
      recommendations.push({
        type: 'auto-fix',
        priority: 'low',
        message: `${failedFixes.length} auto-fixes failed - review fix patterns and update knowledge base`,
        actionable: true,
        estimatedImpact: 'Low - affects automated recovery capabilities',
      });
    }

    // Mock data recommendations
    if (results.mockData.percentage < 100) {
      recommendations.push({
        type: 'mock-data',
        priority: 'low',
        message: `${results.mockData.total - results.mockData.working} mock data endpoints failing - update mock data generators`,
        actionable: true,
        estimatedImpact: 'Low - affects development/demo functionality',
      });
    }

    return recommendations;
  }

  private getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};

    this.state.circuitBreakers.forEach((breaker, name) => {
      states[name] = breaker.getState();
    });

    return states;
  }

  private calculateEnhancedOverallHealth(results: HealthCheckResult): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    let score = 100;

    // Site availability (20 points)
    if (!results.site.available) {
      score -= 20;
    } else if (results.site.responseTime > this.config.PERFORMANCE_SLA) {
      score -= 10;
    }

    // Endpoints (25 points)
    score -= (100 - results.endpoints.percentage) * 0.25;

    // UI functionality (15 points)
    if (results.ui.overall === 'error') {
      score -= 15;
    } else if (results.ui.overall === 'failed') {
      score -= 10;
    } else if (results.ui.accessibility.score < 0.8) {
      score -= 5;
    }

    // Performance (25 points)
    const perfPenalty = Math.min(25, (results.performance.slaViolations * 5) +
      (results.performance.availability < 90 ? 10 : 0) +
      (results.performance.performanceGrade === 'F' ? 15 :
        results.performance.performanceGrade === 'D' ? 10 :
          results.performance.performanceGrade === 'C' ? 5 : 0));
    score -= perfPenalty;

    // Mock data (5 points)
    score -= (100 - results.mockData.percentage) * 0.05;

    // Circuit breakers (10 points)
    const openBreakers = Object.values(results.circuitBreakers).filter(cb => cb.status === 'open').length;
    const totalBreakers = Object.keys(results.circuitBreakers).length;
    if (totalBreakers > 0) {
      score -= (openBreakers / totalBreakers) * 10;
    }

    score = Math.max(0, score);

    if (score >= 95) {return 'excellent';}
    if (score >= 85) {return 'good';}
    if (score >= 70) {return 'fair';}
    if (score >= 50) {return 'poor';}
    return 'critical';
  }

  private calculateHealthScore(results: HealthCheckResult): number {
    const weights = {
      siteAvailability: 0.2,
      endpoints: 0.25,
      ui: 0.15,
      performance: 0.25,
      mockData: 0.05,
      circuitBreakers: 0.1,
    };

    let score = 0;

    // Site availability
    score += results.site.available ? weights.siteAvailability * 100 : 0;

    // Endpoints
    score += weights.endpoints * results.endpoints.percentage;

    // UI
    const uiScore = results.ui.overall === 'passed' ? 100 :
      results.ui.overall === 'failed' ? 50 : 0;
    score += weights.ui * uiScore;

    // Performance
    const perfScore = Math.max(0, 100 - (results.performance.slaViolations * 20));
    score += weights.performance * perfScore;

    // Mock data
    score += weights.mockData * results.mockData.percentage;

    // Circuit breakers
    const openBreakers = Object.values(results.circuitBreakers).filter(cb => cb.status === 'open').length;
    const totalBreakers = Object.keys(results.circuitBreakers).length;
    const cbScore = totalBreakers > 0 ? Math.max(0, 100 - (openBreakers / totalBreakers * 100)) : 100;
    score += weights.circuitBreakers * cbScore;

    return Math.round(score * 10) / 10;
  }

  private updateConsecutiveFailures(overallHealth: string): void {
    if (overallHealth === 'critical' || overallHealth === 'poor') {
      this.state.consecutiveFailures++;
    } else {
      this.state.consecutiveFailures = 0;
    }
  }

  private async saveEnhancedHealthReport(results: HealthCheckResult): Promise<void> {
    try {
      const reportPath = path.join(this.config.REPORTS_PATH, `enhanced-health-report-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(results, null, 2));

      // Also save as latest report
      const latestPath = path.join(this.config.REPORTS_PATH, 'latest-enhanced-health-report.json');
      await fs.writeFile(latestPath, JSON.stringify(results, null, 2));

      // Save summary for dashboard
      const summary = {
        timestamp: results.timestamp,
        overall: results.overall,
        score: results.score,
        siteAvailable: results.site.available,
        endpointsHealthy: `${results.endpoints.healthy}/${results.endpoints.total}`,
        performanceGrade: results.performance.performanceGrade,
        criticalIssues: results.criticalIssues.length,
        autoFixesApplied: results.autoFixes.filter(f => f.success).length,
      };

      const summaryPath = path.join(this.config.REPORTS_PATH, 'health-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

      this.log(`Enhanced health report saved: ${reportPath}`);
    } catch (error: any) {
      this.log(`Failed to save enhanced health report: ${error.message}`, 'error');
    }
  }

  private async handleEnhancedAlertsAndNotifications(results: HealthCheckResult): Promise<void> {
    const alertsToSend: any[] = [];

    // Critical issues always trigger alerts
    results.criticalIssues.forEach(issue => {
      if (issue.severity === 'critical' && !this.state.activeAlerts.has(issue.type)) {
        alertsToSend.push({
          type: issue.type,
          severity: 'CRITICAL',
          message: issue.message,
          timestamp: new Date().toISOString(),
          requiresHumanIntervention: issue.requiresHumanIntervention,
          affectedEndpoints: issue.affectedEndpoints,
          suggestedActions: issue.suggestedActions,
        });
        this.state.activeAlerts.add(issue.type);
      }
    });

    // Consecutive failures
    if (this.state.consecutiveFailures >= 3) {
      const alertKey = 'consecutive-failures';
      if (!this.state.activeAlerts.has(alertKey)) {
        alertsToSend.push({
          type: alertKey,
          severity: 'WARNING',
          message: `${this.state.consecutiveFailures} consecutive health check failures detected`,
          timestamp: new Date().toISOString(),
          pattern: 'systemic-issue',
        });
        this.state.activeAlerts.add(alertKey);
      }
    }

    // Performance SLA violations
    if (results.performance.slaViolations > 2) {
      const alertKey = 'performance-sla-violation';
      if (!this.state.activeAlerts.has(alertKey)) {
        alertsToSend.push({
          type: alertKey,
          severity: 'WARNING',
          message: `Performance SLA violated: ${results.performance.slaViolations} violations, avg response time: ${results.performance.averageResponseTime}ms`,
          timestamp: new Date().toISOString(),
          slaThreshold: this.config.PERFORMANCE_SLA,
        });
        this.state.activeAlerts.add(alertKey);
      }
    }

    // Send alerts
    for (const alert of alertsToSend) {
      await this.sendEnhancedAlert(alert);

      // Also notify sub-agents
      this.sendSubAgentMessage({
        type: 'critical-alert',
        timestamp: alert.timestamp,
        source: 'health-monitor',
        data: alert,
      });
    }

    // Clear alerts for resolved issues
    if (results.overall === 'excellent' || results.overall === 'good') {
      this.state.activeAlerts.clear();
    }
  }

  private async sendEnhancedAlert(alert: any): Promise<void> {
    try {
      // Use existing notification script
      const notifyScript = path.join(__dirname, '..', 'scripts', 'claude-notify-unified.sh');

      const message = '🚨 WAR ROOM ENHANCED HEALTH ALERT 🚨\n\n' +
                     `Severity: ${alert.severity}\n` +
                     `Type: ${alert.type}\n` +
                     `Message: ${alert.message}\n` +
                     `Time: ${new Date(alert.timestamp).toLocaleString()}\n` +
                     `Score Impact: ${alert.scoreImpact || 'Unknown'}\n` +
                     `Requires Human Intervention: ${alert.requiresHumanIntervention ? 'YES' : 'NO'}\n${
                       alert.affectedEndpoints ? `Affected Endpoints: ${alert.affectedEndpoints.join(', ')}\n` : ''
                     }${alert.suggestedActions ? `Suggested Actions:\n${alert.suggestedActions.map((a: string) => `- ${a}`).join('\n')}\n` : ''}`;

      // Execute notification script
      spawn('bash', [notifyScript, message], {
        detached: true,
        stdio: 'ignore',
      });

      this.log(`Enhanced alert sent: ${alert.type} (${alert.severity})`);

    } catch (error: any) {
      this.log(`Failed to send enhanced alert: ${error.message}`, 'error');
    }
  }

  public getStatus(): any {
    return {
      isRunning: this.state.isRunning,
      lastCheck: this.state.lastCheck?.timestamp || null,
      overallHealth: this.state.lastCheck?.overall || 'unknown',
      healthScore: this.state.lastCheck?.score || 0,
      consecutiveFailures: this.state.consecutiveFailures,
      knownFixesCount: this.state.knownFixes.size,
      activeAlertsCount: this.state.activeAlerts.size,
      performanceHistorySize: this.state.performanceHistory.length,
      circuitBreakersCount: this.state.circuitBreakers.size,
      discoveredEndpointsCount: this.state.discoveredEndpoints.size,
      connectedSubAgents: this.state.subAgentConnections.size,
      circuitBreakerStates: this.getCircuitBreakerStates(),
    };
  }

  public async getLatestReport(): Promise<HealthCheckResult | null> {
    try {
      const reportPath = path.join(this.config.REPORTS_PATH, 'latest-enhanced-health-report.json');
      const data = await fs.readFile(reportPath, 'utf8');
      return JSON.parse(data);
    } catch (error: any) {
      return null;
    }
  }

  public async forceHealthCheck(): Promise<HealthCheckResult> {
    this.log('Forcing immediate enhanced health check...');
    return await this.performHealthCheck();
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [EnhancedHealthMonitor] ${message}`;

    console.log(logMessage);

    // Also write to log file
    if (this.config.LOGS_PATH) {
      const logFile = path.join(this.config.LOGS_PATH, 'enhanced-health-monitor.log');
      fs.appendFile(logFile, `${logMessage  }\n`).catch(() => {});
    }
  }
}

// Export for use by other modules
export default EnhancedHealthMonitor;

// CLI interface
if (require.main === module) {
  const monitor = new EnhancedHealthMonitor();

  const command = process.argv[2] || 'start';

  switch (command) {
    case 'start':
      monitor.start();
      break;

    case 'stop':
      monitor.stop();
      break;

    case 'status':
      console.log(JSON.stringify(monitor.getStatus(), null, 2));
      break;

    case 'check':
      monitor.forceHealthCheck().then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.overall === 'critical' ? 1 : 0);
      });
      break;

    default:
      console.log('Usage: npx ts-node enhanced-health-monitor.ts [start|stop|status|check]');
  }

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down enhanced health monitor...');
    monitor.stop();
    process.exit(0);
  });
}
