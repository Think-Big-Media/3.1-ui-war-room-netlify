#!/usr/bin/env node

/**
 * War Room Real-Time Monitoring Dashboard
 * 
 * Terminal-based dashboard showing:
 * - Live system status
 * - Performance trends (last 24 hours)
 * - Active alerts
 * - User activity metrics
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
  SITE_URL: 'https://war-room-oa9t.onrender.com',
  HEALTH_REPORT_FILE: path.join(__dirname, 'reports', 'health-report.json'),
  ALERTS_FILE: path.join(__dirname, 'logs', 'alerts.log'),
  REFRESH_INTERVAL: 5000, // 5 seconds
  MAX_LOG_ENTRIES: 50,
  CHART_DATA_POINTS: 20
};

// Global state
let dashboardData = {
  system: {
    status: 'unknown',
    uptime: 0,
    responseTime: 0,
    successRate: 0
  },
  performance: {
    responseHistory: [],
    memoryHistory: [],
    cpuHistory: []
  },
  alerts: [],
  logs: []
};

// Create blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'War Room Monitoring Dashboard'
});

// Create grid layout
const grid = new contrib.grid({
  rows: 12,
  cols: 12,
  screen: screen
});

// Dashboard widgets
const widgets = {
  // Top row - System overview
  systemStatus: grid.set(0, 0, 3, 4, blessed.box, {
    label: 'System Status',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white' }
    }
  }),
  
  performanceMetrics: grid.set(0, 4, 3, 4, blessed.box, {
    label: 'Performance Metrics',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white' }
    }
  }),
  
  quickStats: grid.set(0, 8, 3, 4, blessed.box, {
    label: 'Quick Stats',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'white' }
    }
  }),
  
  // Second row - Charts
  responseTimeChart: grid.set(3, 0, 4, 6, contrib.line, {
    label: 'Response Time (ms)',
    border: { type: 'line' },
    style: {
      line: 'yellow',
      text: 'green',
      baseline: 'black'
    },
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    whiteOnBlack: true,
    legend: { width: 10 }
  }),
  
  systemResourceChart: grid.set(3, 6, 4, 6, contrib.line, {
    label: 'System Resources (%)',
    border: { type: 'line' },
    style: {
      line: 'red',
      text: 'green',
      baseline: 'black'
    },
    xLabelPadding: 3,
    xPadding: 5,
    showLegend: true,
    whiteOnBlack: true,
    legend: { width: 10 }
  }),
  
  // Third row - Alerts and logs
  alertsTable: grid.set(7, 0, 5, 6, contrib.table, {
    label: 'Recent Alerts',
    border: { type: 'line' },
    style: {
      border: { fg: 'red' },
      header: { fg: 'white', bold: true }
    },
    columnSpacing: 2,
    columnWidth: [20, 15, 40]
  }),
  
  systemLogs: grid.set(7, 6, 5, 6, blessed.log, {
    label: 'System Events',
    border: { type: 'line' },
    style: {
      border: { fg: 'green' },
      label: { fg: 'white' }
    },
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true
  })
};

// Utility functions
function formatUptime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'healthy': return 'green';
    case 'unhealthy': return 'red';
    case 'degraded': return 'yellow';
    default: return 'white';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Data loading functions
async function loadHealthReport() {
  try {
    const data = await fs.readFile(CONFIG.HEALTH_REPORT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    widgets.systemLogs.log(`Error loading health report: ${error.message}`);
    return null;
  }
}

async function loadAlerts() {
  try {
    const data = await fs.readFile(CONFIG.ALERTS_FILE, 'utf8');
    const lines = data.trim().split('\n').filter(line => line);
    return lines.slice(-20).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    return [];
  }
}

// Widget update functions
function updateSystemStatus(healthReport) {
  if (!healthReport) {
    widgets.systemStatus.setContent('No health data available');
    return;
  }
  
  const status = healthReport.summary?.overall || 'unknown';
  const color = getStatusColor(status);
  
  const content = [
    `{${color}-fg}{bold}Status: ${status.toUpperCase()}{/}`,
    '',
    `Site Available: ${healthReport.site?.available ? '{green-fg}✓ YES{/}' : '{red-fg}✗ NO{/}'}`,
    `Database: ${healthReport.database?.connected ? '{green-fg}✓ Connected{/}' : '{red-fg}✗ Disconnected{/}'}`,
    `Pinecone: ${healthReport.pinecone?.available ? '{green-fg}✓ Available{/}' : '{yellow-fg}! Unavailable{/}'}`,
    '',
    `Response Time: ${healthReport.site?.responseTime || 0}ms`,
    `Success Rate: ${healthReport.summary?.successRate || '0%'}`,
    `Total Checks: ${healthReport.summary?.totalChecks || 0}`,
    '',
    `Uptime: ${formatUptime(healthReport.summary?.uptime || 0)}`
  ].join('\n');
  
  widgets.systemStatus.setContent(content);
}

function updatePerformanceMetrics(healthReport) {
  if (!healthReport) {
    widgets.performanceMetrics.setContent('No performance data available');
    return;
  }
  
  const system = healthReport.system || {};
  const memory = system.memory || {};
  const cpu = system.cpu || {};
  
  const content = [
    '{bold}Memory Usage{/}',
    `Used: ${formatBytes(memory.used || 0)}`,
    `Total: ${formatBytes(memory.total || 0)}`,
    `Percentage: ${((memory.percentage || 0) * 100).toFixed(1)}%`,
    '',
    '{bold}CPU Information{/}',
    `Load Average: ${cpu.loadAvg ? cpu.loadAvg[0].toFixed(2) : 'N/A'}`,
    `CPU Cores: ${cpu.cpuCount || 'N/A'}`,
    '',
    '{bold}Process Memory{/}',
    `Heap Used: ${formatBytes(memory.process?.heapUsed || 0)}`,
    `RSS: ${formatBytes(memory.process?.rss || 0)}`
  ].join('\n');
  
  widgets.performanceMetrics.setContent(content);
}

function updateQuickStats(healthReport) {
  if (!healthReport) {
    widgets.quickStats.setContent('No statistics available');
    return;
  }
  
  const now = new Date();
  const checkTime = new Date(healthReport.timestamp);
  const lastCheckAgo = Math.floor((now - checkTime) / 1000);
  
  const apiHealthy = Object.values(healthReport.apis || {}).filter(api => api.healthy).length;
  const apiTotal = Object.keys(healthReport.apis || {}).length;
  
  const content = [
    '{bold}Current Status{/}',
    `Last Check: ${lastCheckAgo}s ago`,
    `Check Duration: ${healthReport.checkDuration || 0}ms`,
    '',
    '{bold}API Endpoints{/}',
    `Healthy: ${apiHealthy}/${apiTotal}`,
    `Health Rate: ${apiTotal > 0 ? ((apiHealthy / apiTotal) * 100).toFixed(1) : 0}%`,
    '',
    '{bold}Active Alerts{/}',
    `Current: ${healthReport.alerts?.length || 0}`,
    `Severity: ${healthReport.alerts?.some(a => a.severity === 'critical') ? '{red-fg}Critical{/}' : 
                healthReport.alerts?.some(a => a.severity === 'warning') ? '{yellow-fg}Warning{/}' : '{green-fg}None{/}'}`
  ].join('\n');
  
  widgets.quickStats.setContent(content);
}

function updateResponseTimeChart(healthReport) {
  // Generate sample data for demo (replace with real historical data)
  const now = Date.now();
  const dataPoints = [];
  
  for (let i = CONFIG.CHART_DATA_POINTS; i >= 0; i--) {
    const timestamp = new Date(now - (i * 30000)); // 30-second intervals
    const responseTime = Math.random() * 1000 + 500 + (healthReport?.site?.responseTime || 0) * 0.1;
    dataPoints.push({ x: timestamp.toISOString().substr(11, 8), y: responseTime });
  }
  
  widgets.responseTimeChart.setData([{
    title: 'Site Response',
    x: dataPoints.map(d => d.x),
    y: dataPoints.map(d => Math.round(d.y)),
    style: { line: 'yellow' }
  }]);
}

function updateSystemResourceChart(healthReport) {
  if (!healthReport?.system) {
    return;
  }
  
  // Generate sample historical data
  const now = Date.now();
  const memoryPoints = [];
  const cpuPoints = [];
  
  for (let i = CONFIG.CHART_DATA_POINTS; i >= 0; i--) {
    const timestamp = new Date(now - (i * 30000)); // 30-second intervals
    const timeLabel = timestamp.toISOString().substr(11, 8);
    
    // Simulate some variation around current values
    const memBase = (healthReport.system.memory?.percentage || 0.5) * 100;
    const cpuBase = (healthReport.system.cpu?.loadAvg?.[0] || 1) / (healthReport.system.cpu?.cpuCount || 4) * 100;
    
    memoryPoints.push({ x: timeLabel, y: Math.max(0, memBase + (Math.random() - 0.5) * 10) });
    cpuPoints.push({ x: timeLabel, y: Math.max(0, cpuBase + (Math.random() - 0.5) * 20) });
  }
  
  widgets.systemResourceChart.setData([
    {
      title: 'Memory %',
      x: memoryPoints.map(d => d.x),
      y: memoryPoints.map(d => Math.round(d.y)),
      style: { line: 'red' }
    },
    {
      title: 'CPU %',
      x: cpuPoints.map(d => d.x),
      y: cpuPoints.map(d => Math.round(d.y)),
      style: { line: 'blue' }
    }
  ]);
}

function updateAlertsTable(alerts) {
  const headers = ['Time', 'Severity', 'Message'];
  const data = alerts.slice(-10).map(alert => {
    const time = new Date(alert.timestamp).toLocaleTimeString();
    const severity = alert.severity?.toUpperCase() || 'INFO';
    const message = alert.message?.substr(0, 35) + (alert.message?.length > 35 ? '...' : '') || '';
    return [time, severity, message];
  });
  
  widgets.alertsTable.setData({
    headers,
    data
  });
}

// Main update function
async function updateDashboard() {
  try {
    widgets.systemLogs.log('Updating dashboard...');
    
    // Load health report and alerts
    const [healthReport, alerts] = await Promise.all([
      loadHealthReport(),
      loadAlerts()
    ]);
    
    // Update all widgets
    updateSystemStatus(healthReport);
    updatePerformanceMetrics(healthReport);
    updateQuickStats(healthReport);
    updateResponseTimeChart(healthReport);
    updateSystemResourceChart(healthReport);
    updateAlertsTable(alerts);
    
    // Update title with current time and status
    const status = healthReport?.summary?.overall || 'unknown';
    const statusIcon = status === 'healthy' ? '✓' : status === 'unhealthy' ? '✗' : '?';
    screen.title = `War Room Monitoring [${statusIcon} ${status.toUpperCase()}] - ${new Date().toLocaleTimeString()}`;
    
    widgets.systemLogs.log(`Dashboard updated - Status: ${status}`);
    
  } catch (error) {
    widgets.systemLogs.log(`Error updating dashboard: ${error.message}`);
  }
  
  screen.render();
}

// Initialize dashboard
async function initializeDashboard() {
  widgets.systemLogs.log('Initializing War Room Monitoring Dashboard...');
  widgets.systemLogs.log(`Site: ${CONFIG.SITE_URL}`);
  widgets.systemLogs.log(`Refresh interval: ${CONFIG.REFRESH_INTERVAL / 1000}s`);
  
  // Set up keyboard shortcuts
  screen.key(['escape', 'q', 'C-c'], () => {
    widgets.systemLogs.log('Shutting down dashboard...');
    return process.exit(0);
  });
  
  screen.key('r', () => {
    widgets.systemLogs.log('Manual refresh triggered');
    updateDashboard();
  });
  
  screen.key('c', () => {
    widgets.systemLogs.clear();
    widgets.systemLogs.log('Logs cleared');
    screen.render();
  });
  
  // Set initial content
  widgets.systemStatus.setContent('Loading system status...');
  widgets.performanceMetrics.setContent('Loading performance data...');
  widgets.quickStats.setContent('Loading statistics...');
  
  // Initial update
  await updateDashboard();
  
  // Set up auto-refresh
  setInterval(updateDashboard, CONFIG.REFRESH_INTERVAL);
  
  widgets.systemLogs.log('Dashboard ready! Press "q" to quit, "r" to refresh, "c" to clear logs');
  screen.render();
}

// Handle process termination
process.on('SIGINT', () => {
  screen.destroy();
  console.log('\nDashboard terminated gracefully');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  screen.destroy();
  console.error('Dashboard crashed:', error);
  process.exit(1);
});

// Start the dashboard
if (require.main === module) {
  initializeDashboard().catch(error => {
    console.error('Failed to start dashboard:', error);
    process.exit(1);
  });
}

module.exports = {
  updateDashboard,
  CONFIG
};