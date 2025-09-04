#!/usr/bin/env node

/**
 * War Room Automated Alert System
 * 
 * Handles automated alerts for:
 * - Service downtime
 * - Response time > 3 seconds  
 * - Error rate > 1%
 * - Memory usage > 80%
 * - Critical system failures
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
  HEALTH_REPORT_FILE: path.join(__dirname, 'reports', 'health-report.json'),
  ALERTS_FILE: path.join(__dirname, 'logs', 'alerts.log'),
  ALERT_CONFIG_FILE: path.join(__dirname, 'config', 'alert-config.json'),
  
  // Alert thresholds
  THRESHOLDS: {
    RESPONSE_TIME: 3000, // 3 seconds
    ERROR_RATE: 0.01, // 1%
    MEMORY_USAGE: 0.80, // 80%
    CPU_USAGE: 0.80, // 80%
    UPTIME_MINIMUM: 300000 // 5 minutes
  },
  
  // Alert cooldown periods (prevent spam)
  COOLDOWNS: {
    CRITICAL: 300000, // 5 minutes
    WARNING: 900000, // 15 minutes
    INFO: 1800000 // 30 minutes
  },
  
  // Notification settings
  EMAIL: {
    ENABLED: false, // Set to true when email config is available
    FROM: 'warroom-alerts@yourdomain.com',
    TO: ['admin@yourdomain.com'],
    SMTP: {
      HOST: 'smtp.gmail.com',
      PORT: 587,
      SECURE: false,
      AUTH: {
        USER: process.env.ALERT_EMAIL_USER || '',
        PASS: process.env.ALERT_EMAIL_PASS || ''
      }
    }
  },
  
  // Webhook notifications (Slack, Discord, etc.)
  WEBHOOKS: {
    SLACK: process.env.SLACK_WEBHOOK_URL || '',
    DISCORD: process.env.DISCORD_WEBHOOK_URL || '',
    TEAMS: process.env.TEAMS_WEBHOOK_URL || ''
  },
  
  // Apple Watch notifications (using existing script)
  APPLE_WATCH: {
    ENABLED: true,
    SCRIPT_PATH: '/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh'
  },
  
  CHECK_INTERVAL: 30000 // 30 seconds
};

// Alert state tracking
let alertState = {
  lastAlerts: new Map(),
  activeAlerts: new Set(),
  alertHistory: [],
  emailTransporter: null
};

// Alert severity levels
const SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

// Alert types
const ALERT_TYPES = {
  SITE_DOWN: 'site_down',
  SLOW_RESPONSE: 'slow_response',
  HIGH_ERROR_RATE: 'high_error_rate',
  HIGH_MEMORY: 'high_memory',
  HIGH_CPU: 'high_cpu',
  API_UNHEALTHY: 'api_unhealthy',
  DATABASE_DOWN: 'database_down',
  PINECONE_DOWN: 'pinecone_down',
  SYSTEM_FAILURE: 'system_failure'
};

// Initialize email transporter
function initializeEmailTransporter() {
  if (!CONFIG.EMAIL.ENABLED) return null;
  
  try {
    return nodemailer.createTransporter({
      host: CONFIG.EMAIL.SMTP.HOST,
      port: CONFIG.EMAIL.SMTP.PORT,
      secure: CONFIG.EMAIL.SMTP.SECURE,
      auth: CONFIG.EMAIL.SMTP.AUTH
    });
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
    return null;
  }
}

// Utility functions
function shouldAlert(alertType, severity) {
  const alertKey = `${alertType}_${severity}`;
  const lastAlert = alertState.lastAlerts.get(alertKey);
  const now = Date.now();
  const cooldown = CONFIG.COOLDOWNS[severity.toUpperCase()] || CONFIG.COOLDOWNS.WARNING;
  
  if (!lastAlert || (now - lastAlert) > cooldown) {
    alertState.lastAlerts.set(alertKey, now);
    return true;
  }
  
  return false;
}

function logAlert(type, message, severity = SEVERITY.WARNING, metadata = {}) {
  const alert = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    severity,
    metadata,
    acknowledged: false,
    resolved: false
  };
  
  alertState.alertHistory.push(alert);
  alertState.activeAlerts.add(alert.id);
  
  console.log(`🚨 ALERT [${severity.toUpperCase()}] ${type}: ${message}`);
  
  // Write to alert log file
  fs.appendFile(CONFIG.ALERTS_FILE, JSON.stringify(alert) + '\n').catch(err =>
    console.error('Failed to write alert to file:', err)
  );
  
  return alert;
}

// Notification methods
async function sendAppleWatchNotification(alert) {
  if (!CONFIG.APPLE_WATCH.ENABLED) return false;
  
  try {
    const { spawn } = require('child_process');
    const notificationType = alert.severity === SEVERITY.CRITICAL ? 'error' : 
                            alert.severity === SEVERITY.WARNING ? 'approval' : 'next';
    
    const process = spawn(CONFIG.APPLE_WATCH.SCRIPT_PATH, [
      notificationType,
      `${alert.type.toUpperCase()}: ${alert.message}`,
      `Severity: ${alert.severity} | Time: ${new Date(alert.timestamp).toLocaleTimeString()}`
    ]);
    
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        resolve(code === 0);
      });
      
      process.on('error', () => {
        resolve(false);
      });
    });
  } catch (error) {
    console.error('Failed to send Apple Watch notification:', error);
    return false;
  }
}

async function sendEmailAlert(alert) {
  if (!alertState.emailTransporter || !CONFIG.EMAIL.ENABLED) return false;
  
  const subject = `🚨 War Room Alert: ${alert.type} [${alert.severity.toUpperCase()}]`;
  const html = `
    <h2>War Room System Alert</h2>
    <p><strong>Alert Type:</strong> ${alert.type}</p>
    <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
    <p><strong>Message:</strong> ${alert.message}</p>
    <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
    
    ${alert.metadata && Object.keys(alert.metadata).length > 0 ? 
      `<h3>Additional Information:</h3>
       <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>` : ''
    }
    
    <hr>
    <p><small>War Room Monitoring System | ${new Date().toLocaleString()}</small></p>
  `;
  
  try {
    await alertState.emailTransporter.sendMail({
      from: CONFIG.EMAIL.FROM,
      to: CONFIG.EMAIL.TO.join(','),
      subject,
      html
    });
    
    console.log(`Email alert sent for: ${alert.type}`);
    return true;
  } catch (error) {
    console.error('Failed to send email alert:', error);
    return false;
  }
}

async function sendSlackAlert(alert) {
  if (!CONFIG.WEBHOOKS.SLACK) return false;
  
  const color = alert.severity === SEVERITY.CRITICAL ? '#ff0000' : 
                alert.severity === SEVERITY.WARNING ? '#ffaa00' : '#00ff00';
  
  const payload = {
    text: `🚨 War Room Alert: ${alert.type}`,
    attachments: [{
      color,
      fields: [
        { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
        { title: 'Type', value: alert.type, short: true },
        { title: 'Message', value: alert.message, short: false },
        { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: true }
      ]
    }]
  };
  
  try {
    await axios.post(CONFIG.WEBHOOKS.SLACK, payload);
    console.log(`Slack alert sent for: ${alert.type}`);
    return true;
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
    return false;
  }
}

async function sendDiscordAlert(alert) {
  if (!CONFIG.WEBHOOKS.DISCORD) return false;
  
  const color = alert.severity === SEVERITY.CRITICAL ? 16711680 : // Red
                alert.severity === SEVERITY.WARNING ? 16753920 : // Orange
                65280; // Green
  
  const payload = {
    embeds: [{
      title: `🚨 War Room Alert: ${alert.type}`,
      description: alert.message,
      color,
      fields: [
        { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
        { name: 'Time', value: new Date(alert.timestamp).toLocaleString(), inline: true }
      ],
      timestamp: alert.timestamp
    }]
  };
  
  try {
    await axios.post(CONFIG.WEBHOOKS.DISCORD, payload);
    console.log(`Discord alert sent for: ${alert.type}`);
    return true;
  } catch (error) {
    console.error('Failed to send Discord alert:', error);
    return false;
  }
}

// Send alert through all configured channels
async function sendAlert(alert) {
  const results = await Promise.allSettled([
    sendAppleWatchNotification(alert),
    sendEmailAlert(alert),
    sendSlackAlert(alert),
    sendDiscordAlert(alert)
  ]);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  console.log(`Alert sent through ${successful}/${results.length} notification channels`);
  
  return successful > 0;
}

// Health check analysis functions
function analyzeHealthReport(healthReport) {
  const alerts = [];
  
  if (!healthReport) {
    alerts.push({
      type: ALERT_TYPES.SYSTEM_FAILURE,
      message: 'Health report is not available',
      severity: SEVERITY.CRITICAL
    });
    return alerts;
  }
  
  // Site availability check
  if (!healthReport.site?.available) {
    alerts.push({
      type: ALERT_TYPES.SITE_DOWN,
      message: `Site is down: ${healthReport.site?.error || 'Unknown error'}`,
      severity: SEVERITY.CRITICAL,
      metadata: {
        statusCode: healthReport.site?.statusCode,
        responseTime: healthReport.site?.responseTime
      }
    });
  }
  
  // Response time check
  if (healthReport.site?.responseTime > CONFIG.THRESHOLDS.RESPONSE_TIME) {
    alerts.push({
      type: ALERT_TYPES.SLOW_RESPONSE,
      message: `Site response time is ${healthReport.site.responseTime}ms (threshold: ${CONFIG.THRESHOLDS.RESPONSE_TIME}ms)`,
      severity: SEVERITY.WARNING,
      metadata: {
        responseTime: healthReport.site.responseTime,
        threshold: CONFIG.THRESHOLDS.RESPONSE_TIME
      }
    });
  }
  
  // Database connectivity check
  if (!healthReport.database?.connected) {
    alerts.push({
      type: ALERT_TYPES.DATABASE_DOWN,
      message: `Database is not connected: ${healthReport.database?.error || 'Connection failed'}`,
      severity: SEVERITY.CRITICAL,
      metadata: healthReport.database
    });
  }
  
  // Memory usage check
  if (healthReport.system?.memory?.percentage > CONFIG.THRESHOLDS.MEMORY_USAGE) {
    const percentage = (healthReport.system.memory.percentage * 100).toFixed(1);
    alerts.push({
      type: ALERT_TYPES.HIGH_MEMORY,
      message: `High memory usage: ${percentage}% (threshold: ${CONFIG.THRESHOLDS.MEMORY_USAGE * 100}%)`,
      severity: SEVERITY.WARNING,
      metadata: {
        currentUsage: percentage,
        threshold: CONFIG.THRESHOLDS.MEMORY_USAGE * 100,
        usedBytes: healthReport.system.memory.used,
        totalBytes: healthReport.system.memory.total
      }
    });
  }
  
  // CPU usage check (using load average)
  if (healthReport.system?.cpu?.loadAvg?.[0]) {
    const cpuCount = healthReport.system.cpu.cpuCount || 1;
    const loadPercentage = healthReport.system.cpu.loadAvg[0] / cpuCount;
    
    if (loadPercentage > CONFIG.THRESHOLDS.CPU_USAGE) {
      alerts.push({
        type: ALERT_TYPES.HIGH_CPU,
        message: `High CPU load: ${(loadPercentage * 100).toFixed(1)}% (threshold: ${CONFIG.THRESHOLDS.CPU_USAGE * 100}%)`,
        severity: SEVERITY.WARNING,
        metadata: {
          loadAverage: healthReport.system.cpu.loadAvg[0],
          cpuCount,
          percentage: (loadPercentage * 100).toFixed(1)
        }
      });
    }
  }
  
  // API endpoints check
  if (healthReport.apis) {
    const unhealthyAPIs = Object.entries(healthReport.apis)
      .filter(([_, api]) => !api.healthy);
    
    if (unhealthyAPIs.length > 0) {
      const criticalAPIs = unhealthyAPIs.filter(([_, api]) => api.statusCode >= 500);
      const severity = criticalAPIs.length > 0 ? SEVERITY.CRITICAL : SEVERITY.WARNING;
      
      alerts.push({
        type: ALERT_TYPES.API_UNHEALTHY,
        message: `${unhealthyAPIs.length} API endpoint(s) are unhealthy: ${unhealthyAPIs.map(([endpoint]) => endpoint).join(', ')}`,
        severity,
        metadata: {
          unhealthyAPIs: unhealthyAPIs.map(([endpoint, api]) => ({
            endpoint,
            error: api.error,
            statusCode: api.statusCode,
            responseTime: api.responseTime
          }))
        }
      });
    }
  }
  
  // Error rate calculation (based on success rate)
  if (healthReport.summary?.successRate) {
    const successRate = parseFloat(healthReport.summary.successRate.replace('%', '')) / 100;
    const errorRate = 1 - successRate;
    
    if (errorRate > CONFIG.THRESHOLDS.ERROR_RATE) {
      alerts.push({
        type: ALERT_TYPES.HIGH_ERROR_RATE,
        message: `High error rate: ${(errorRate * 100).toFixed(2)}% (threshold: ${CONFIG.THRESHOLDS.ERROR_RATE * 100}%)`,
        severity: SEVERITY.WARNING,
        metadata: {
          errorRate: (errorRate * 100).toFixed(2),
          successRate: healthReport.summary.successRate,
          totalChecks: healthReport.summary.totalChecks
        }
      });
    }
  }
  
  return alerts;
}

// Main alert processing function
async function processAlerts() {
  try {
    console.log('Processing alerts...');
    
    // Load health report
    const healthData = await fs.readFile(CONFIG.HEALTH_REPORT_FILE, 'utf8');
    const healthReport = JSON.parse(healthData);
    
    // Analyze health report for potential alerts
    const potentialAlerts = analyzeHealthReport(healthReport);
    
    // Process each potential alert
    for (const alertData of potentialAlerts) {
      if (shouldAlert(alertData.type, alertData.severity)) {
        const alert = logAlert(
          alertData.type,
          alertData.message,
          alertData.severity,
          alertData.metadata
        );
        
        // Send notifications
        await sendAlert(alert);
      }
    }
    
    // Clean up old alerts (remove resolved alerts older than 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    alertState.alertHistory = alertState.alertHistory.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo || !alert.resolved
    );
    
    console.log(`Alert processing complete. Found ${potentialAlerts.length} potential alerts`);
    
  } catch (error) {
    console.error('Error processing alerts:', error);
    
    // Send system failure alert if we haven't sent one recently
    if (shouldAlert(ALERT_TYPES.SYSTEM_FAILURE, SEVERITY.CRITICAL)) {
      const alert = logAlert(
        ALERT_TYPES.SYSTEM_FAILURE,
        `Alert system failure: ${error.message}`,
        SEVERITY.CRITICAL,
        { error: error.stack }
      );
      
      await sendAlert(alert);
    }
  }
}

// Initialize alert system
async function initializeAlertSystem() {
  console.log('Initializing War Room Alert System...');
  
  // Create necessary directories
  const dirs = [
    path.dirname(CONFIG.ALERTS_FILE),
    path.dirname(CONFIG.HEALTH_REPORT_FILE),
    path.dirname(CONFIG.ALERT_CONFIG_FILE)
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
  
  // Initialize email transporter
  alertState.emailTransporter = initializeEmailTransporter();
  
  console.log('Alert system configuration:');
  console.log(`- Apple Watch notifications: ${CONFIG.APPLE_WATCH.ENABLED ? 'Enabled' : 'Disabled'}`);
  console.log(`- Email notifications: ${CONFIG.EMAIL.ENABLED ? 'Enabled' : 'Disabled'}`);
  console.log(`- Slack webhook: ${CONFIG.WEBHOOKS.SLACK ? 'Configured' : 'Not configured'}`);
  console.log(`- Discord webhook: ${CONFIG.WEBHOOKS.DISCORD ? 'Configured' : 'Not configured'}`);
  console.log(`- Check interval: ${CONFIG.CHECK_INTERVAL / 1000}s`);
  
  console.log('Alert system initialized successfully');
}

// Signal handlers
function setupSignalHandlers() {
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}, shutting down alert system gracefully...`);
    console.log(`Total alerts processed: ${alertState.alertHistory.length}`);
    console.log(`Active alerts: ${alertState.activeAlerts.size}`);
    process.exit(0);
  };
  
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Main execution
async function main() {
  try {
    await initializeAlertSystem();
    setupSignalHandlers();
    
    // Initial alert processing
    await processAlerts();
    
    // Set up periodic alert processing
    setInterval(processAlerts, CONFIG.CHECK_INTERVAL);
    
    console.log(`\nAlert system is running. Press Ctrl+C to stop.`);
    console.log(`Monitoring health report: ${CONFIG.HEALTH_REPORT_FILE}`);
    console.log(`Alert log: ${CONFIG.ALERTS_FILE}`);
    
  } catch (error) {
    console.error('Failed to start alert system:', error);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  processAlerts,
  analyzeHealthReport,
  sendAlert,
  logAlert,
  CONFIG,
  SEVERITY,
  ALERT_TYPES
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}