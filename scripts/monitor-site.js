#!/usr/bin/env node

const { MonitoringService } = require('../src/services/monitoring-service');
const chalk = require('chalk');

// ANSI escape codes for colors (in case chalk is not installed)
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

const monitor = new MonitoringService();

// Display banner
console.log(colors.blue(`
╔═══════════════════════════════════════╗
║     War Room Site Monitor v1.0        ║
║  Monitoring: war-room-oa9t.onrender.com ║
╚═══════════════════════════════════════╝
`));

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n' + colors.yellow('Stopping monitor...'));
  monitor.stopMonitoring();
  
  const metrics = monitor.getMetrics();
  console.log('\n' + colors.blue('Final Metrics:'));
  console.log(colors.gray('─'.repeat(40)));
  console.log(`Total Checks: ${metrics.checks}`);
  console.log(`Uptime: ${metrics.uptime}`);
  console.log(`Average Response Time: ${metrics.avgResponseTime}`);
  console.log(`Error Rate: ${metrics.errorRate}`);
  
  process.exit(0);
});

// Override checkSiteHealth to add console output
const originalCheck = monitor.checkSiteHealth.bind(monitor);
monitor.checkSiteHealth = async function() {
  const results = await originalCheck();
  
  const timestamp = new Date().toLocaleTimeString();
  const status = results.success ? colors.green('✓') : colors.red('✗');
  
  console.log(`\n[${timestamp}] ${status} Health Check`);
  
  if (results.success) {
    console.log(colors.green(`  Frontend: ${results.checks.frontend.status} (${results.checks.frontend.responseTime}ms)`));
    
    for (const [name, check] of Object.entries(results.checks)) {
      if (name !== 'frontend') {
        const checkStatus = check.ok ? colors.green('✓') : colors.yellow('!');
        console.log(`  ${checkStatus} ${name}: ${check.status || 'failed'}`);
      }
    }
    
    console.log(colors.gray(`  Total time: ${results.responseTime}ms`));
  } else {
    console.log(colors.red(`  Error: ${results.error}`));
  }
  
  const metrics = monitor.getMetrics();
  console.log(colors.gray(`  Uptime: ${metrics.uptime} | Avg Response: ${metrics.avgResponseTime}`));
  
  return results;
};

// Start monitoring
console.log(colors.yellow('Starting continuous monitoring...'));
console.log(colors.gray('Press Ctrl+C to stop\n'));

monitor.startMonitoring();