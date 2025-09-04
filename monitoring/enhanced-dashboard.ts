#!/usr/bin/env node

/**
 * Enhanced War Room Real-Time Monitoring Dashboard
 *
 * Features:
 * - WebSocket real-time updates from health monitor
 * - Enhanced circuit breaker visualization
 * - Performance SLA tracking with alerts
 * - Auto-fix pattern display
 * - Sub-agent coordination status
 * - Pieces knowledge base integration status
 */

import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import WebSocket from 'ws';

interface DashboardConfig {
  SITE_URL: string;
  WEBSOCKET_URL: string;
  HEALTH_REPORT_FILE: string;
  ALERTS_FILE: string;
  REFRESH_INTERVAL: number;
  MAX_LOG_ENTRIES: number;
  CHART_DATA_POINTS: number;
}

interface DashboardState {
  healthData: any;
  performanceHistory: any[];
  alertHistory: any[];
  logHistory: string[];
  circuitBreakerStates: Record<string, any>;
  autoFixHistory: any[];
  connectedSubAgents: number;
  wsConnected: boolean;
  lastUpdate: Date | null;
}

class EnhancedDashboard {
  private config: DashboardConfig;
  private state: DashboardState;
  private screen: blessed.Widgets.Screen;
  private widgets: Record<string, any>;
  private grid: any;
  private ws: WebSocket | null;
  private refreshInterval: NodeJS.Timeout | null;

  constructor() {
    this.config = {
      SITE_URL: 'https://war-room-oa9t.onrender.com',
      WEBSOCKET_URL: 'ws://localhost:8080',
      HEALTH_REPORT_FILE: path.join(__dirname, 'reports', 'latest-enhanced-health-report.json'),
      ALERTS_FILE: path.join(__dirname, 'logs', 'alerts.log'),
      REFRESH_INTERVAL: 5000, // 5 seconds
      MAX_LOG_ENTRIES: 100,
      CHART_DATA_POINTS: 30,
    };

    this.state = {
      healthData: null,
      performanceHistory: [],
      alertHistory: [],
      logHistory: [],
      circuitBreakerStates: {},
      autoFixHistory: [],
      connectedSubAgents: 0,
      wsConnected: false,
      lastUpdate: null,
    };

    this.ws = null;
    this.refreshInterval = null;

    this.initializeScreen();
    this.setupWebSocket();
  }

  private initializeScreen(): void {
    // Create blessed screen with enhanced settings
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'War Room Enhanced Monitoring Dashboard',
      fullUnicode: true,
      autoPadding: true,
    });

    // Create responsive grid layout
    this.grid = new contrib.grid({
      rows: 16,
      cols: 16,
      screen: this.screen,
    });

    this.createWidgets();
    this.setupKeyboardShortcuts();
  }

  private createWidgets(): void {
    this.widgets = {
      // Top row - System overview (4x4 grid)
      systemStatus: this.grid.set(0, 0, 4, 4, blessed.box, {
        label: 'System Status & Health Score',
        border: { type: 'line' },
        style: {
          border: { fg: 'cyan' },
          label: { fg: 'white', bold: true },
        },
        content: 'Loading system status...',
        scrollable: true,
      }),

      performanceMetrics: this.grid.set(0, 4, 4, 4, blessed.box, {
        label: 'Performance & SLA Monitoring',
        border: { type: 'line' },
        style: {
          border: { fg: 'cyan' },
          label: { fg: 'white', bold: true },
        },
        scrollable: true,
      }),

      circuitBreakerStatus: this.grid.set(0, 8, 4, 4, blessed.box, {
        label: 'Circuit Breaker States',
        border: { type: 'line' },
        style: {
          border: { fg: 'yellow' },
          label: { fg: 'white', bold: true },
        },
        scrollable: true,
      }),

      subAgentCoordination: this.grid.set(0, 12, 4, 4, blessed.box, {
        label: 'Sub-Agent Coordination',
        border: { type: 'line' },
        style: {
          border: { fg: 'magenta' },
          label: { fg: 'white', bold: true },
        },
        scrollable: true,
      }),

      // Charts row (6 units high)
      responseTimeChart: this.grid.set(4, 0, 6, 8, contrib.line, {
        label: 'Response Time & Performance Trends',
        border: { type: 'line' },
        style: {
          line: 'yellow',
          text: 'green',
          baseline: 'black',
        },
        xLabelPadding: 3,
        xPadding: 5,
        showLegend: true,
        whiteOnBlack: true,
        legend: { width: 15 },
      }),

      healthScoreChart: this.grid.set(4, 8, 6, 8, contrib.line, {
        label: 'Health Score Over Time',
        border: { type: 'line' },
        style: {
          line: 'green',
          text: 'green',
          baseline: 'black',
        },
        xLabelPadding: 3,
        xPadding: 5,
        showLegend: true,
        whiteOnBlack: true,
        legend: { width: 15 },
      }),

      // Bottom section
      alertsTable: this.grid.set(10, 0, 6, 8, contrib.table, {
        label: 'Recent Alerts & Critical Issues',
        border: { type: 'line' },
        style: {
          border: { fg: 'red' },
          header: { fg: 'white', bold: true },
        },
        columnSpacing: 2,
        columnWidth: [18, 12, 15, 35],
      }),

      autoFixLog: this.grid.set(10, 8, 3, 8, blessed.log, {
        label: 'Auto-Fix Operations',
        border: { type: 'line' },
        style: {
          border: { fg: 'green' },
          label: { fg: 'white', bold: true },
        },
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        keys: true,
      }),

      systemLogs: this.grid.set(13, 8, 3, 8, blessed.log, {
        label: 'System Events & WebSocket',
        border: { type: 'line' },
        style: {
          border: { fg: 'blue' },
          label: { fg: 'white', bold: true },
        },
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        keys: true,
      }),
    };

    // Add focus capabilities
    this.widgets.systemLogs.focus();
  }

  private setupKeyboardShortcuts(): void {
    // Global shortcuts
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.cleanup();
      process.exit(0);
    });

    this.screen.key('r', () => {
      this.widgets.systemLogs.log('Manual refresh triggered');
      this.updateDashboard();
    });

    this.screen.key('c', () => {
      Object.values(this.widgets).forEach((widget: any) => {
        if (widget.clear) {widget.clear();}
        if (widget.clearValue) {widget.clearValue();}
      });
      this.widgets.systemLogs.log('All widgets cleared');
      this.screen.render();
    });

    this.screen.key('f', () => {
      this.forceHealthCheck();
    });

    this.screen.key('w', () => {
      this.reconnectWebSocket();
    });

    this.screen.key('h', () => {
      this.showHelp();
    });
  }

  private setupWebSocket(): void {
    try {
      this.ws = new WebSocket(this.config.WEBSOCKET_URL);

      this.ws.on('open', () => {
        this.state.wsConnected = true;
        this.widgets.systemLogs.log('✅ WebSocket connected to health monitor');
        this.updateConnectionStatus();
      });

      this.ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error: any) {
          this.widgets.systemLogs.log(`❌ Invalid WebSocket message: ${error.message}`);
        }
      });

      this.ws.on('close', () => {
        this.state.wsConnected = false;
        this.widgets.systemLogs.log('🔌 WebSocket connection closed');
        this.updateConnectionStatus();

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!this.state.wsConnected) {
            this.widgets.systemLogs.log('🔄 Attempting WebSocket reconnection...');
            this.setupWebSocket();
          }
        }, 5000);
      });

      this.ws.on('error', (error: Error) => {
        this.state.wsConnected = false;
        this.widgets.systemLogs.log(`❌ WebSocket error: ${error.message}`);
        this.updateConnectionStatus();
      });

    } catch (error: any) {
      this.widgets.systemLogs.log(`❌ Failed to setup WebSocket: ${error.message}`);
    }
  }

  private handleWebSocketMessage(message: any): void {
    this.state.lastUpdate = new Date();

    switch (message.type) {
      case 'health-update':
        this.state.healthData = message.data;
        this.widgets.systemLogs.log(`📊 Health update received: ${message.data.overall} (Score: ${message.data.score})`);
        this.updateHealthDisplays();
        break;

      case 'fix-applied':
        this.state.autoFixHistory.push({
          ...message.data,
          timestamp: message.timestamp,
        });
        this.widgets.autoFixLog.log(`🔧 Auto-fix applied: ${message.data.action} on ${message.data.endpoint} - ${message.data.success ? 'SUCCESS' : 'FAILED'}`);
        this.updateAutoFixDisplay();
        break;

      case 'critical-alert':
        this.state.alertHistory.push({
          ...message.data,
          timestamp: message.timestamp,
        });
        this.widgets.systemLogs.log(`🚨 CRITICAL ALERT: ${message.data.message}`);
        this.updateAlertsDisplay();
        break;

      case 'performance-violation':
        this.widgets.systemLogs.log(`⚠️ Performance violation: ${message.data.endpoint} (${message.data.responseTime}ms > ${message.data.slaThreshold}ms)`);
        break;

      default:
        this.widgets.systemLogs.log(`📨 Unknown message type: ${message.type}`);
    }

    this.screen.render();
  }

  private async updateDashboard(): Promise<void> {
    try {
      this.widgets.systemLogs.log('🔄 Updating dashboard...');

      // Load latest health report
      const healthReport = await this.loadHealthReport();
      if (healthReport) {
        this.state.healthData = healthReport;
        this.updateHealthDisplays();
      }

      // Load alerts
      const alerts = await this.loadAlerts();
      this.state.alertHistory = alerts;
      this.updateAlertsDisplay();

      // Update connection status
      this.updateConnectionStatus();

      // Update title with current status
      const status = this.state.healthData?.overall || 'unknown';
      const statusIcon = this.getStatusIcon(status);
      const wsIcon = this.state.wsConnected ? '🟢' : '🔴';
      this.screen.title = `War Room Enhanced Monitoring [${statusIcon} ${status.toUpperCase()}] [${wsIcon} WebSocket] - ${new Date().toLocaleTimeString()}`;

      this.widgets.systemLogs.log(`✅ Dashboard updated - Status: ${status}`);

    } catch (error: any) {
      this.widgets.systemLogs.log(`❌ Error updating dashboard: ${error.message}`);
    }

    this.screen.render();
  }

  private updateHealthDisplays(): void {
    if (!this.state.healthData) {return;}

    this.updateSystemStatus();
    this.updatePerformanceMetrics();
    this.updateCircuitBreakerStatus();
    this.updateSubAgentCoordination();
    this.updateResponseTimeChart();
    this.updateHealthScoreChart();
  }

  private updateSystemStatus(): void {
    const data = this.state.healthData;
    const color = this.getStatusColor(data.overall);
    const healthScore = data.score || 0;

    const content = [
      `{${color}-fg}{bold}Overall Status: ${data.overall?.toUpperCase()}{/}`,
      `{white-fg}Health Score: {bold}${healthScore.toFixed(1)}/100{/}`,
      '',
      '{bold}Site Availability{/}',
      `Status: ${data.site?.available ? '{green-fg}✓ Available{/}' : '{red-fg}✗ Unavailable{/}'}`,
      `Response Time: {${data.site?.responseTime > 3000 ? 'red' : 'yellow'}-fg}${data.site?.responseTime || 0}ms{/}`,
      `Status Code: ${data.site?.statusCode || 'N/A'}`,
      '',
      '{bold}Endpoints Health{/}',
      `Healthy: {green-fg}${data.endpoints?.healthy || 0}{/}/{cyan-fg}${data.endpoints?.total || 0}{/}`,
      `Success Rate: {${data.endpoints?.percentage >= 90 ? 'green' : data.endpoints?.percentage >= 70 ? 'yellow' : 'red'}-fg}${data.endpoints?.percentage?.toFixed(1) || 0}%{/}`,
      '',
      '{bold}UI & Accessibility{/}',
      `UI Tests: ${data.ui?.overall === 'passed' ? '{green-fg}✓ Passed{/}' : '{red-fg}✗ Failed{/}'}`,
      `Accessibility: {${data.ui?.accessibility?.score >= 0.8 ? 'green' : 'yellow'}-fg}${((data.ui?.accessibility?.score || 0) * 100).toFixed(0)}%{/}`,
      '',
      '{bold}Last Check{/}',
      `Time: ${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Never'}`,
      `Duration: ${data.checkDuration || 0}ms`,
    ].join('\\n');

    this.widgets.systemStatus.setContent(content);
  }

  private updatePerformanceMetrics(): void {
    const data = this.state.healthData;
    const perf = data.performance || {};

    const slaColor = perf.slaViolations === 0 ? 'green' : perf.slaViolations <= 2 ? 'yellow' : 'red';
    const gradeColor = perf.performanceGrade === 'A' ? 'green' :
      perf.performanceGrade === 'B' ? 'yellow' : 'red';

    const content = [
      '{bold}Performance SLA (3000ms){/}',
      `Average Response: {${perf.averageResponseTime > 3000 ? 'red' : 'yellow'}-fg}${perf.averageResponseTime || 0}ms{/}`,
      `SLA Violations: {${slaColor}-fg}${perf.slaViolations || 0}{/}`,
      `Availability: {${perf.availability >= 95 ? 'green' : perf.availability >= 80 ? 'yellow' : 'red'}-fg}${perf.availability?.toFixed(1) || 0}%{/}`,
      `Grade: {${gradeColor}-fg}{bold}${perf.performanceGrade || 'F'}{/}`,
      '',
      '{bold}Performance History{/}',
      `Metrics Collected: ${this.state.performanceHistory.length}`,
      `Trend: ${this.calculatePerformanceTrend()}`,
      '',
      '{bold}Mock Data Fallbacks{/}',
      `Working: {green-fg}${data.mockData?.working || 0}{/}/{cyan-fg}${data.mockData?.total || 0}{/}`,
      `Success Rate: {${data.mockData?.percentage >= 90 ? 'green' : 'yellow'}-fg}${data.mockData?.percentage?.toFixed(1) || 0}%{/}`,
      '',
      '{bold}Auto-Fix Operations{/}',
      `Total Applied: ${data.autoFixes?.length || 0}`,
      `Successful: {green-fg}${data.autoFixes?.filter((f: any) => f.success).length || 0}{/}`,
      `Success Rate: {green-fg}${data.autoFixes?.length ? ((data.autoFixes.filter((f: any) => f.success).length / data.autoFixes.length) * 100).toFixed(1) : 0}%{/}`,
    ].join('\\n');

    this.widgets.performanceMetrics.setContent(content);
  }

  private updateCircuitBreakerStatus(): void {
    const data = this.state.healthData;
    const breakers = data.circuitBreakers || {};

    const breakerEntries = Object.entries(breakers);
    const closedCount = breakerEntries.filter(([_, state]: [string, any]) => state.status === 'closed').length;
    const openCount = breakerEntries.filter(([_, state]: [string, any]) => state.status === 'open').length;
    const halfOpenCount = breakerEntries.filter(([_, state]: [string, any]) => state.status === 'half-open').length;

    const content = [
      '{bold}Circuit Breaker Overview{/}',
      `Total Breakers: ${breakerEntries.length}`,
      `{green-fg}Closed: ${closedCount}{/} | {red-fg}Open: ${openCount}{/} | {yellow-fg}Half-Open: ${halfOpenCount}{/}`,
      '',
    ];

    if (breakerEntries.length === 0) {
      content.push('{yellow-fg}No circuit breakers configured{/}');
    } else {
      content.push('{bold}Individual Breaker States:{/}');

      breakerEntries.forEach(([name, state]: [string, any]) => {
        const statusColor = state.status === 'closed' ? 'green' :
          state.status === 'open' ? 'red' : 'yellow';
        const failures = state.failures || 0;
        const lastFailure = state.lastFailure ?
          ` (Last: ${new Date(state.lastFailure).toLocaleTimeString()})` : '';

        content.push(`{${statusColor}-fg}● ${name.replace('endpoint-', '')}: ${state.status.toUpperCase()}{/}`);
        if (failures > 0) {
          content.push(`  Failures: ${failures}${lastFailure}`);
        }
      });
    }

    this.widgets.circuitBreakerStatus.setContent(content.join('\\n'));
  }

  private updateSubAgentCoordination(): void {
    const wsStatus = this.state.wsConnected ? 'Connected' : 'Disconnected';
    const wsColor = this.state.wsConnected ? 'green' : 'red';
    const lastUpdate = this.state.lastUpdate ?
      `${Math.floor((Date.now() - this.state.lastUpdate.getTime()) / 1000)}s ago` : 'Never';

    const content = [
      '{bold}WebSocket Connection{/}',
      `Status: {${wsColor}-fg}${wsStatus}{/}`,
      `URL: ${this.config.WEBSOCKET_URL}`,
      `Last Message: ${lastUpdate}`,
      '',
      '{bold}Sub-Agent Network{/}',
      `Connected Agents: ${this.state.connectedSubAgents}`,
      `Health Monitor: {${this.state.wsConnected ? 'green' : 'red'}-fg}${this.state.wsConnected ? 'Active' : 'Inactive'}{/}`,
      'AMP Refactoring: {yellow-fg}Pending{/}',
      'CodeRabbit: {yellow-fg}Pending{/}',
      '',
      '{bold}Pieces Integration{/}',
      'Status: {green-fg}Enabled{/}',
      `Auto-Fix Patterns: ${this.state.autoFixHistory.length}`,
      'Knowledge Entries: N/A',
      '',
      '{bold}Dashboard Stats{/}',
      `Refresh Rate: ${this.config.REFRESH_INTERVAL / 1000}s`,
      `Chart Data Points: ${this.config.CHART_DATA_POINTS}`,
      `Log Entries: ${this.state.logHistory.length}/${this.config.MAX_LOG_ENTRIES}`,
    ].join('\\n');

    this.widgets.subAgentCoordination.setContent(content);
  }

  private updateResponseTimeChart(): void {
    if (!this.state.healthData?.performance?.metrics) {
      return;
    }

    const metrics = this.state.healthData.performance.metrics.slice(-this.config.CHART_DATA_POINTS);
    const slaThreshold = 3000; // 3 seconds SLA

    // Add to performance history
    metrics.forEach((metric: any) => {
      this.state.performanceHistory.push(metric);
    });

    // Keep only recent data
    if (this.state.performanceHistory.length > this.config.CHART_DATA_POINTS) {
      this.state.performanceHistory = this.state.performanceHistory.slice(-this.config.CHART_DATA_POINTS);
    }

    if (this.state.performanceHistory.length === 0) {
      return;
    }

    const responseData = this.state.performanceHistory.map((metric, index) => ({
      x: index.toString(),
      y: metric.responseTime,
    }));

    const slaData = this.state.performanceHistory.map((_, index) => ({
      x: index.toString(),
      y: slaThreshold,
    }));

    this.widgets.responseTimeChart.setData([
      {
        title: 'Response Time',
        x: responseData.map(d => d.x),
        y: responseData.map(d => d.y),
        style: { line: 'yellow' },
      },
      {
        title: 'SLA Threshold',
        x: slaData.map(d => d.x),
        y: slaData.map(d => d.y),
        style: { line: 'red' },
      },
    ]);
  }

  private updateHealthScoreChart(): void {
    // Simulate health score history (in real implementation, this would come from historical data)
    const currentScore = this.state.healthData?.score || 0;

    // Add current score to history
    this.state.performanceHistory.push({
      timestamp: new Date().toISOString(),
      healthScore: currentScore,
    });

    const recentScores = this.state.performanceHistory
      .filter((entry: any) => entry.healthScore !== undefined)
      .slice(-this.config.CHART_DATA_POINTS);

    if (recentScores.length === 0) {
      return;
    }

    const scoreData = recentScores.map((entry: any, index: number) => ({
      x: index.toString(),
      y: entry.healthScore,
    }));

    this.widgets.healthScoreChart.setData([
      {
        title: 'Health Score',
        x: scoreData.map(d => d.x),
        y: scoreData.map(d => d.y),
        style: { line: 'green' },
      },
    ]);
  }

  private updateAlertsDisplay(): void {
    const headers = ['Time', 'Severity', 'Type', 'Message'];
    const data = this.state.alertHistory.slice(-20).map((alert: any) => {
      const time = new Date(alert.timestamp).toLocaleTimeString();
      const severity = alert.severity?.toUpperCase() || 'INFO';
      const type = alert.type?.replace(/-/g, ' ')?.toUpperCase() || 'UNKNOWN';
      const message = (alert.message?.substr(0, 30) || '') + (alert.message?.length > 30 ? '...' : '');
      return [time, severity, type, message];
    });

    this.widgets.alertsTable.setData({
      headers,
      data,
    });
  }

  private updateAutoFixDisplay(): void {
    // Keep only recent auto-fix history
    if (this.state.autoFixHistory.length > 50) {
      this.state.autoFixHistory = this.state.autoFixHistory.slice(-50);
    }
  }

  private updateConnectionStatus(): void {
    this.state.connectedSubAgents = this.state.wsConnected ? 1 : 0;
  }

  private async loadHealthReport(): Promise<any> {
    try {
      const data = await fs.readFile(this.config.HEALTH_REPORT_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error: any) {
      this.widgets.systemLogs.log(`Warning: Could not load health report: ${error.message}`);
      return null;
    }
  }

  private async loadAlerts(): Promise<any[]> {
    try {
      const data = await fs.readFile(this.config.ALERTS_FILE, 'utf8');
      const lines = data.trim().split('\\n').filter(line => line);
      return lines.slice(-50).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error: any) {
      return [];
    }
  }

  private getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'fair': return '🟠';
      case 'poor': return '🔴';
      case 'critical': return '🆘';
      default: return '❓';
    }
  }

  private getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'excellent': return 'green';
      case 'good': return 'yellow';
      case 'fair': return 'blue';
      case 'poor': return 'red';
      case 'critical': return 'red';
      default: return 'white';
    }
  }

  private calculatePerformanceTrend(): string {
    if (this.state.performanceHistory.length < 2) {return 'Insufficient data';}

    const recent = this.state.performanceHistory.slice(-5);
    const earlier = this.state.performanceHistory.slice(-10, -5);

    if (recent.length === 0 || earlier.length === 0) {return 'Insufficient data';}

    const recentAvg = recent.reduce((sum: number, metric: any) => sum + (metric.responseTime || 0), 0) / recent.length;
    const earlierAvg = earlier.reduce((sum: number, metric: any) => sum + (metric.responseTime || 0), 0) / earlier.length;

    if (recentAvg < earlierAvg * 0.95) {return '{green-fg}Improving{/}';}
    if (recentAvg > earlierAvg * 1.05) {return '{red-fg}Degrading{/}';}
    return '{yellow-fg}Stable{/}';
  }

  private async forceHealthCheck(): Promise<void> {
    try {
      this.widgets.systemLogs.log('🔍 Forcing immediate health check...');

      if (this.ws && this.state.wsConnected) {
        this.ws.send(JSON.stringify({
          type: 'force-health-check',
          timestamp: new Date().toISOString(),
          source: 'dashboard',
        }));
      } else {
        // Fallback to HTTP request
        await axios.post(`${this.config.SITE_URL}/api/v1/admin/force-health-check`, {}, {
          timeout: 10000,
          headers: { 'X-Dashboard-Request': 'true' },
        });
      }

      this.widgets.systemLogs.log('✅ Health check initiated');
    } catch (error: any) {
      this.widgets.systemLogs.log(`❌ Failed to force health check: ${error.message}`);
    }
  }

  private reconnectWebSocket(): void {
    this.widgets.systemLogs.log('🔄 Manually reconnecting WebSocket...');
    if (this.ws) {
      this.ws.close();
    }
    setTimeout(() => {
      this.setupWebSocket();
    }, 1000);
  }

  private showHelp(): void {
    const helpText = [
      '{bold}Enhanced Dashboard Keyboard Shortcuts:{/}',
      '',
      '{yellow-fg}q, ESC, Ctrl+C{/} - Quit dashboard',
      '{yellow-fg}r{/} - Manual refresh',
      '{yellow-fg}c{/} - Clear all widgets',
      '{yellow-fg}f{/} - Force health check',
      '{yellow-fg}w{/} - Reconnect WebSocket',
      '{yellow-fg}h{/} - Show this help',
      '',
      `{cyan-fg}WebSocket URL:{/} ${  this.config.WEBSOCKET_URL}`,
      `{cyan-fg}Target Site:{/} ${  this.config.SITE_URL}`,
      '',
      'Press any key to continue...',
    ].join('\\n');

    const helpBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 15,
      content: helpText,
      border: { type: 'line' },
      style: {
        border: { fg: 'cyan' },
        bg: 'black',
      },
      tags: true,
    });

    this.screen.render();

    this.screen.onceKey(['escape', 'enter', 'space', 'q'], () => {
      this.screen.remove(helpBox);
      this.screen.render();
    });
  }

  public async start(): Promise<void> {
    this.widgets.systemLogs.log('🚀 Starting Enhanced War Room Monitoring Dashboard...');
    this.widgets.systemLogs.log(`📡 WebSocket: ${this.config.WEBSOCKET_URL}`);
    this.widgets.systemLogs.log(`🌐 Target Site: ${this.config.SITE_URL}`);
    this.widgets.systemLogs.log(`🔄 Refresh Rate: ${this.config.REFRESH_INTERVAL / 1000}s`);

    // Initial update
    await this.updateDashboard();

    // Set up auto-refresh
    this.refreshInterval = setInterval(async () => {
      await this.updateDashboard();
    }, this.config.REFRESH_INTERVAL);

    this.widgets.systemLogs.log('✅ Enhanced dashboard ready!');
    this.widgets.systemLogs.log('💡 Press "h" for help, "q" to quit');

    this.screen.render();
  }

  public cleanup(): void {
    this.widgets.systemLogs.log('🔄 Shutting down Enhanced dashboard...');

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    if (this.ws) {
      this.ws.close();
    }

    if (this.screen) {
      this.screen.destroy();
    }
  }
}

// Initialize and start dashboard
if (require.main === module) {
  const dashboard = new EnhancedDashboard();

  // Handle process termination
  process.on('SIGINT', () => {
    dashboard.cleanup();
    console.log('\\nEnhanced dashboard terminated gracefully');
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    dashboard.cleanup();
    console.error('Enhanced dashboard crashed:', error);
    process.exit(1);
  });

  // Start the enhanced dashboard
  dashboard.start().catch(error => {
    console.error('Failed to start enhanced dashboard:', error);
    process.exit(1);
  });
}

export default EnhancedDashboard;
