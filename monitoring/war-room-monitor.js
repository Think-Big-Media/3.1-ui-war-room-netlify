#!/usr/bin/env node

/**
 * War Room Comprehensive Monitoring System
 * 
 * This script provides real-time monitoring for:
 * - Live site availability
 * - API endpoints health
 * - Database connectivity
 * - Pinecone service status
 * - Performance metrics
 * - Memory and CPU usage
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  SITE_URL: 'https://war-room-oa9t.onrender.com',
  API_ENDPOINTS: [
    '/api/health',
    '/api/v1/status',
    '/docs',
    '/api/v1/analytics/status',
    '/api/v1/auth/status'
  ],
  THRESHOLDS: {
    RESPONSE_TIME: 3000, // 3 seconds
    ERROR_RATE: 0.01, // 1%
    MEMORY_USAGE: 0.80, // 80%
    CPU_USAGE: 0.80 // 80%
  },
  MONITORING_INTERVAL: 30000, // 30 seconds
  ALERT_COOLDOWN: 300000, // 5 minutes between same alerts
  MAX_RETRIES: 3,
  TIMEOUT: 10000, // 10 seconds
  REPORT_INTERVAL: 300000, // 5 minutes
  LOG_FILE: path.join(__dirname, 'logs', 'monitoring.log'),
  ALERTS_FILE: path.join(__dirname, 'logs', 'alerts.log'),
  HEALTH_REPORT_FILE: path.join(__dirname, 'reports', 'health-report.json')
};

// Global state
let monitoringState = {
  startTime: Date.now(),
  totalChecks: 0,
  successfulChecks: 0,
  failedChecks: 0,
  lastAlerts: new Map(),
  performanceHistory: [],
  currentAlerts: [],
  systemMetrics: {
    memory: { used: 0, total: 0, percentage: 0 },
    cpu: { percentage: 0 },
    uptime: 0
  }
};

// Utility functions
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  console.log(`[${timestamp}] ${level}: ${message}`, data || '');
  
  // Write to log file
  fs.appendFile(CONFIG.LOG_FILE, JSON.stringify(logEntry) + '\n').catch(err => 
    console.error('Failed to write to log file:', err)
  );
}

function logAlert(type, message, severity = 'warning') {
  const alert = {
    timestamp: new Date().toISOString(),
    type,
    message,
    severity
  };
  
  console.log(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`);
  
  fs.appendFile(CONFIG.ALERTS_FILE, JSON.stringify(alert) + '\n').catch(err =>
    console.error('Failed to write alert:', err)
  );
  
  monitoringState.currentAlerts.push(alert);
  
  // Keep only last 50 alerts
  if (monitoringState.currentAlerts.length > 50) {
    monitoringState.currentAlerts = monitoringState.currentAlerts.slice(-50);
  }
}

function shouldAlert(alertType) {
  const lastAlert = monitoringState.lastAlerts.get(alertType);
  const now = Date.now();
  
  if (!lastAlert || (now - lastAlert) > CONFIG.ALERT_COOLDOWN) {
    monitoringState.lastAlerts.set(alertType, now);
    return true;
  }
  
  return false;
}

// System metrics collection
function getSystemMetrics() {
  const memInfo = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    memory: {
      used: usedMem,
      total: totalMem,
      percentage: usedMem / totalMem,
      process: {
        rss: memInfo.rss,
        heapUsed: memInfo.heapUsed,
        heapTotal: memInfo.heapTotal,
        external: memInfo.external
      }
    },
    cpu: {
      loadAvg: os.loadavg(),
      cpuCount: os.cpus().length
    },
    uptime: os.uptime(),
    processUptime: process.uptime()
  };
}

// Site availability check
async function checkSiteAvailability() {
  const startTime = performance.now();
  
  try {
    const response = await axios.get(CONFIG.SITE_URL, {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'WarRoom-Monitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    const result = {
      available: true,
      statusCode: response.status,
      responseTime: Math.round(responseTime),
      contentLength: response.data?.length || 0,
      headers: {
        server: response.headers.server,
        'content-type': response.headers['content-type'],
        'x-render-upstream': response.headers['x-render-upstream']
      }
    };
    
    // Check for performance issues
    if (responseTime > CONFIG.THRESHOLDS.RESPONSE_TIME && shouldAlert('slow_response')) {
      logAlert('performance', 
        `Site response time is ${Math.round(responseTime)}ms (threshold: ${CONFIG.THRESHOLDS.RESPONSE_TIME}ms)`,
        'warning'
      );
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    if (shouldAlert('site_down')) {
      logAlert('availability', 
        `Site is down: ${error.message}`,
        'critical'
      );
    }
    
    return {
      available: false,
      error: error.message,
      responseTime: Math.round(responseTime),
      statusCode: error.response?.status || null
    };
  }
}

// API endpoints health check
async function checkAPIEndpoints() {
  const results = {};
  
  for (const endpoint of CONFIG.API_ENDPOINTS) {
    const url = `${CONFIG.SITE_URL}${endpoint}`;
    const startTime = performance.now();
    
    try {
      const response = await axios.get(url, {
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'WarRoom-Monitor/1.0',
          'Accept': 'application/json'
        }
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      results[endpoint] = {
        healthy: true,
        statusCode: response.status,
        responseTime: Math.round(responseTime),
        data: response.data
      };
      
      // Check for slow API responses
      if (responseTime > CONFIG.THRESHOLDS.RESPONSE_TIME && shouldAlert(`api_slow_${endpoint}`)) {
        logAlert('api_performance', 
          `API ${endpoint} response time is ${Math.round(responseTime)}ms`,
          'warning'
        );
      }
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      results[endpoint] = {
        healthy: false,
        error: error.message,
        statusCode: error.response?.status || null,
        responseTime: Math.round(responseTime)
      };
      
      if (shouldAlert(`api_down_${endpoint}`)) {
        logAlert('api_health', 
          `API endpoint ${endpoint} is unhealthy: ${error.message}`,
          error.response?.status >= 500 ? 'critical' : 'warning'
        );
      }
    }
  }
  
  return results;
}

// Database connectivity check
async function checkDatabaseConnectivity() {
  try {
    // Try to hit a database-dependent endpoint
    const response = await axios.get(`${CONFIG.SITE_URL}/api/v1/status`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.data && response.data.database) {
      return {
        connected: true,
        status: response.data.database,
        connectionPool: response.data.connectionPool || null
      };
    }
    
    return {
      connected: true,
      status: 'unknown'
    };
    
  } catch (error) {
    if (shouldAlert('database_connection')) {
      logAlert('database', 
        `Database connectivity check failed: ${error.message}`,
        'critical'
      );
    }
    
    return {
      connected: false,
      error: error.message
    };
  }
}

// Pinecone service check
async function checkPineconeStatus() {
  try {
    // Try to hit a Pinecone-dependent endpoint
    const response = await axios.get(`${CONFIG.SITE_URL}/api/v1/documents/health`, {
      timeout: CONFIG.TIMEOUT
    });
    
    if (response.status === 200) {
      return {
        available: true,
        status: response.data
      };
    }
    
    return {
      available: false,
      error: 'Pinecone service returned non-200 status'
    };
    
  } catch (error) {
    // Only alert if it's not a 404 (endpoint might not exist)
    if (error.response?.status !== 404 && shouldAlert('pinecone_service')) {
      logAlert('pinecone', 
        `Pinecone service check failed: ${error.message}`,
        'warning'
      );
    }
    
    return {
      available: false,
      error: error.message,
      statusCode: error.response?.status || null
    };
  }
}

// Memory and CPU monitoring
function checkSystemResources() {
  const metrics = getSystemMetrics();
  monitoringState.systemMetrics = metrics;
  
  // Memory usage alert
  if (metrics.memory.percentage > CONFIG.THRESHOLDS.MEMORY_USAGE && shouldAlert('high_memory')) {
    logAlert('resources', 
      `High memory usage: ${(metrics.memory.percentage * 100).toFixed(1)}% (threshold: ${(CONFIG.THRESHOLDS.MEMORY_USAGE * 100)}%)`,
      'warning'
    );
  }
  
  // CPU load alert (using load average)
  const avgLoad = metrics.cpu.loadAvg[0] / metrics.cpu.cpuCount;
  if (avgLoad > CONFIG.THRESHOLDS.CPU_USAGE && shouldAlert('high_cpu')) {
    logAlert('resources', 
      `High CPU load: ${(avgLoad * 100).toFixed(1)}% (threshold: ${(CONFIG.THRESHOLDS.CPU_USAGE * 100)}%)`,
      'warning'
    );
  }
  
  return metrics;
}

// Main monitoring cycle
async function runHealthCheck() {
  log('INFO', 'Starting health check cycle');
  
  const checkStartTime = Date.now();
  monitoringState.totalChecks++;
  
  try {
    const [
      siteStatus,
      apiStatus,
      dbStatus,
      pineconeStatus,
      systemMetrics
    ] = await Promise.all([
      checkSiteAvailability(),
      checkAPIEndpoints(),
      checkDatabaseConnectivity(),
      checkPineconeStatus(),
      checkSystemResources()
    ]);
    
    const checkEndTime = Date.now();
    const checkDuration = checkEndTime - checkStartTime;
    
    const healthReport = {
      timestamp: new Date().toISOString(),
      checkDuration,
      site: siteStatus,
      apis: apiStatus,
      database: dbStatus,
      pinecone: pineconeStatus,
      system: systemMetrics,
      alerts: monitoringState.currentAlerts.slice(-10), // Last 10 alerts
      summary: {
        overall: siteStatus.available && dbStatus.connected ? 'healthy' : 'unhealthy',
        totalChecks: monitoringState.totalChecks,
        successRate: (monitoringState.successfulChecks / monitoringState.totalChecks * 100).toFixed(2) + '%',
        uptime: checkEndTime - monitoringState.startTime
      }
    };
    
    // Store performance data
    monitoringState.performanceHistory.push({
      timestamp: checkStartTime,
      siteResponseTime: siteStatus.responseTime,
      apiResponseTimes: Object.entries(apiStatus).reduce((acc, [endpoint, data]) => {
        acc[endpoint] = data.responseTime;
        return acc;
      }, {}),
      systemLoad: systemMetrics.cpu.loadAvg[0] / systemMetrics.cpu.cpuCount,
      memoryUsage: systemMetrics.memory.percentage
    });
    
    // Keep only last 100 performance records
    if (monitoringState.performanceHistory.length > 100) {
      monitoringState.performanceHistory = monitoringState.performanceHistory.slice(-100);
    }
    
    if (siteStatus.available && dbStatus.connected) {
      monitoringState.successfulChecks++;
      log('INFO', 'Health check completed successfully', {
        responseTime: siteStatus.responseTime,
        checkDuration
      });
    } else {
      monitoringState.failedChecks++;
      log('WARNING', 'Health check found issues', {
        siteAvailable: siteStatus.available,
        dbConnected: dbStatus.connected
      });
    }
    
    // Save health report
    await fs.writeFile(CONFIG.HEALTH_REPORT_FILE, JSON.stringify(healthReport, null, 2));
    
    return healthReport;
    
  } catch (error) {
    monitoringState.failedChecks++;
    log('ERROR', 'Health check failed', error.message);
    
    if (shouldAlert('health_check_failure')) {
      logAlert('system', 
        `Health check system failure: ${error.message}`,
        'critical'
      );
    }
  }
}

// Generate detailed report
function generateStatusReport() {
  const uptime = Date.now() - monitoringState.startTime;
  const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);
  
  const report = {
    timestamp: new Date().toISOString(),
    monitoringUptime: {
      milliseconds: uptime,
      hours: parseFloat(uptimeHours),
      formatted: `${Math.floor(uptime / (1000 * 60 * 60))}h ${Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))}m`
    },
    statistics: {
      totalChecks: monitoringState.totalChecks,
      successfulChecks: monitoringState.successfulChecks,
      failedChecks: monitoringState.failedChecks,
      successRate: ((monitoringState.successfulChecks / monitoringState.totalChecks) * 100).toFixed(2) + '%',
      currentAlerts: monitoringState.currentAlerts.length
    },
    performance: {
      averageResponseTime: monitoringState.performanceHistory.length > 0 ? 
        (monitoringState.performanceHistory.reduce((sum, record) => sum + record.siteResponseTime, 0) / monitoringState.performanceHistory.length).toFixed(2) + 'ms' : 'N/A',
      last24Hours: monitoringState.performanceHistory.slice(-48) // 30-second intervals
    },
    activeAlerts: monitoringState.currentAlerts.filter(alert => 
      (Date.now() - new Date(alert.timestamp).getTime()) < 3600000 // Last hour
    ),
    systemHealth: monitoringState.systemMetrics
  };
  
  console.log('\n=== WAR ROOM MONITORING STATUS ===');
  console.log(`Monitoring Uptime: ${report.monitoringUptime.formatted}`);
  console.log(`Total Checks: ${report.statistics.totalChecks}`);
  console.log(`Success Rate: ${report.statistics.successRate}`);
  console.log(`Active Alerts: ${report.activeAlerts.length}`);
  console.log(`Memory Usage: ${(monitoringState.systemMetrics.memory.percentage * 100).toFixed(1)}%`);
  console.log('=====================================\n');
  
  return report;
}

// Initialize monitoring system
async function initializeMonitoring() {
  log('INFO', 'Initializing War Room monitoring system');
  
  // Create necessary directories
  const dirs = [
    path.dirname(CONFIG.LOG_FILE),
    path.dirname(CONFIG.HEALTH_REPORT_FILE)
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
  
  // Clear old alerts
  monitoringState.currentAlerts = [];
  
  log('INFO', 'Monitoring system initialized', {
    siteUrl: CONFIG.SITE_URL,
    endpoints: CONFIG.API_ENDPOINTS,
    interval: CONFIG.MONITORING_INTERVAL
  });
}

// Signal handling for graceful shutdown
function setupSignalHandlers() {
  const gracefulShutdown = (signal) => {
    log('INFO', `Received ${signal}, shutting down gracefully`);
    
    const finalReport = generateStatusReport();
    console.log('\nFinal Status Report:', JSON.stringify(finalReport, null, 2));
    
    process.exit(0);
  };
  
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Main execution
async function main() {
  try {
    await initializeMonitoring();
    setupSignalHandlers();
    
    // Initial health check
    await runHealthCheck();
    
    // Set up monitoring intervals
    const monitoringInterval = setInterval(runHealthCheck, CONFIG.MONITORING_INTERVAL);
    const reportInterval = setInterval(generateStatusReport, CONFIG.REPORT_INTERVAL);
    
    log('INFO', `Monitoring started - checking every ${CONFIG.MONITORING_INTERVAL / 1000} seconds`);
    
    // Keep process alive
    process.on('uncaughtException', (error) => {
      log('ERROR', 'Uncaught exception', error.message);
      logAlert('system', `Uncaught exception: ${error.message}`, 'critical');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      log('ERROR', 'Unhandled promise rejection', reason);
      logAlert('system', `Unhandled promise rejection: ${reason}`, 'critical');
    });
    
  } catch (error) {
    console.error('Failed to start monitoring system:', error);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  runHealthCheck,
  checkSiteAvailability,
  checkAPIEndpoints,
  checkDatabaseConnectivity,
  checkPineconeStatus,
  generateStatusReport,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}