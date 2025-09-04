#!/usr/bin/env node

/**
 * War Room One-time Health Check Script
 * 
 * Performs a comprehensive health check and generates a detailed report
 * Perfect for manual testing or CI/CD integration
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

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
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  EXPECTED_RESPONSE_TIME: 3000,
  OUTPUT_FORMAT: process.argv[2] || 'detailed' // 'json', 'brief', 'detailed'
};

// Colors for console output
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

// Health check results
let healthResults = {
  timestamp: new Date().toISOString(),
  overall: 'unknown',
  site: {},
  apis: {},
  system: {},
  performance: {},
  summary: {},
  recommendations: []
};

// Utility functions
function log(message, color = '') {
  if (CONFIG.OUTPUT_FORMAT !== 'json') {
    console.log(`${color}${message}${COLORS.RESET}`);
  }
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatusIcon(success) {
  return success ? '✅' : '❌';
}

// Site availability check
async function checkSiteAvailability() {
  log(`\n${COLORS.BOLD}🌐 Checking site availability...${COLORS.RESET}`);
  
  const startTime = Date.now();
  
  try {
    const response = await axios.get(CONFIG.SITE_URL, {
      timeout: CONFIG.TIMEOUT,
      headers: {
        'User-Agent': 'WarRoom-HealthCheck/1.0'
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const result = {
      available: true,
      statusCode: response.status,
      responseTime,
      contentLength: response.data?.length || 0,
      headers: {
        server: response.headers.server,
        'content-type': response.headers['content-type'],
        'x-render-upstream': response.headers['x-render-upstream']
      }
    };
    
    log(`${getStatusIcon(true)} Site is available (${response.status}) - ${formatTime(responseTime)}`, COLORS.GREEN);
    
    if (responseTime > CONFIG.EXPECTED_RESPONSE_TIME) {
      log(`⚠️  Response time is slower than expected (${formatTime(responseTime)} > ${formatTime(CONFIG.EXPECTED_RESPONSE_TIME)})`, COLORS.YELLOW);
      healthResults.recommendations.push(`Consider investigating slow response times (${formatTime(responseTime)})`);
    }
    
    return result;
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const result = {
      available: false,
      error: error.message,
      responseTime,
      statusCode: error.response?.status || null
    };
    
    log(`${getStatusIcon(false)} Site is not available: ${error.message}`, COLORS.RED);
    healthResults.recommendations.push('Investigate site availability issues immediately');
    
    return result;
  }
}

// API endpoints health check
async function checkAPIEndpoints() {
  log(`\n${COLORS.BOLD}🔌 Checking API endpoints...${COLORS.RESET}`);
  
  const results = {};
  let healthyCount = 0;
  
  for (const endpoint of CONFIG.API_ENDPOINTS) {
    const url = `${CONFIG.SITE_URL}${endpoint}`;
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'WarRoom-HealthCheck/1.0'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results[endpoint] = {
        healthy: true,
        statusCode: response.status,
        responseTime,
        data: response.data
      };
      
      healthyCount++;
      log(`${getStatusIcon(true)} ${endpoint} (${response.status}) - ${formatTime(responseTime)}`, COLORS.GREEN);
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results[endpoint] = {
        healthy: false,
        error: error.message,
        statusCode: error.response?.status || null,
        responseTime
      };
      
      const statusCode = error.response?.status || 'ERR';
      log(`${getStatusIcon(false)} ${endpoint} (${statusCode}) - ${error.message}`, COLORS.RED);
      
      if (error.response?.status >= 500) {
        healthResults.recommendations.push(`Critical API error on ${endpoint} - server error (${error.response.status})`);
      } else if (error.response?.status === 404) {
        // 404 might be expected for some endpoints
        log(`ℹ️  Note: ${endpoint} returned 404 - this might be expected`, COLORS.BLUE);
      }
    }
  }
  
  const healthPercentage = (healthyCount / CONFIG.API_ENDPOINTS.length * 100).toFixed(1);
  log(`📊 API Health: ${healthyCount}/${CONFIG.API_ENDPOINTS.length} endpoints healthy (${healthPercentage}%)`, 
      healthyCount === CONFIG.API_ENDPOINTS.length ? COLORS.GREEN : COLORS.YELLOW);
  
  return results;
}

// System resources check
function checkSystemResources() {
  log(`\n${COLORS.BOLD}💻 Checking system resources...${COLORS.RESET}`);
  
  const memInfo = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const loadAvg = os.loadavg();
  
  const result = {
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percentage: usedMem / totalMem,
      process: {
        rss: memInfo.rss,
        heapUsed: memInfo.heapUsed,
        heapTotal: memInfo.heapTotal,
        external: memInfo.external
      }
    },
    cpu: {
      loadAvg: loadAvg,
      cpuCount: os.cpus().length,
      platform: os.platform(),
      arch: os.arch()
    },
    uptime: os.uptime(),
    processUptime: process.uptime()
  };
  
  // Format memory info
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  log(`💾 Memory: ${formatBytes(usedMem)} / ${formatBytes(totalMem)} (${(result.memory.percentage * 100).toFixed(1)}%)`, 
      result.memory.percentage > 0.8 ? COLORS.YELLOW : COLORS.GREEN);
  log(`🖥️  CPU Load: ${loadAvg[0].toFixed(2)} (1min) | Cores: ${result.cpu.cpuCount}`, COLORS.BLUE);
  log(`⏱️  System Uptime: ${formatTime(result.uptime * 1000)}`, COLORS.BLUE);
  
  // Add recommendations based on resource usage
  if (result.memory.percentage > 0.8) {
    healthResults.recommendations.push(`High memory usage detected (${(result.memory.percentage * 100).toFixed(1)}%)`);
  }
  
  if (loadAvg[0] / result.cpu.cpuCount > 0.8) {
    healthResults.recommendations.push(`High CPU load detected (${(loadAvg[0] / result.cpu.cpuCount * 100).toFixed(1)}%)`);
  }
  
  return result;
}

// Performance benchmark
async function runPerformanceBenchmark() {
  log(`\n${COLORS.BOLD}⚡ Running performance benchmark...${COLORS.RESET}`);
  
  const results = {
    requests: [],
    stats: {}
  };
  
  const requestCount = 5;
  log(`Performing ${requestCount} requests to measure consistency...`);
  
  for (let i = 0; i < requestCount; i++) {
    const startTime = Date.now();
    
    try {
      await axios.get(CONFIG.SITE_URL, {
        timeout: CONFIG.TIMEOUT,
        headers: { 'User-Agent': 'WarRoom-PerfTest/1.0' }
      });
      
      const responseTime = Date.now() - startTime;
      results.requests.push({ success: true, responseTime });
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.requests.push({ success: false, responseTime, error: error.message });
    }
    
    // Small delay between requests
    if (i < requestCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Calculate statistics
  const successfulRequests = results.requests.filter(r => r.success);
  const responseTimes = successfulRequests.map(r => r.responseTime);
  
  if (responseTimes.length > 0) {
    results.stats = {
      successRate: (successfulRequests.length / requestCount * 100).toFixed(1),
      avgResponseTime: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      consistency: Math.max(...responseTimes) - Math.min(...responseTimes)
    };
    
    log(`📈 Success Rate: ${results.stats.successRate}%`, COLORS.GREEN);
    log(`📊 Response Times: avg ${formatTime(parseFloat(results.stats.avgResponseTime))}, min ${formatTime(results.stats.minResponseTime)}, max ${formatTime(results.stats.maxResponseTime)}`, COLORS.BLUE);
    log(`📏 Consistency: ${formatTime(results.stats.consistency)} variation`, 
        results.stats.consistency > 1000 ? COLORS.YELLOW : COLORS.GREEN);
    
    if (results.stats.consistency > 2000) {
      healthResults.recommendations.push(`High response time variation (${formatTime(results.stats.consistency)}) - investigate performance consistency`);
    }
  } else {
    results.stats = {
      successRate: '0.0',
      error: 'All requests failed'
    };
    log(`${getStatusIcon(false)} All performance test requests failed`, COLORS.RED);
  }
  
  return results;
}

// Generate health score
function calculateHealthScore() {
  let score = 100;
  const penalties = [];
  
  // Site availability (40 points)
  if (!healthResults.site.available) {
    score -= 40;
    penalties.push('Site unavailable (-40)');
  } else if (healthResults.site.responseTime > CONFIG.EXPECTED_RESPONSE_TIME) {
    score -= 10;
    penalties.push(`Slow response time (-10)`);
  }
  
  // API health (30 points)
  const apiEndpoints = Object.keys(healthResults.apis);
  const healthyAPIs = Object.values(healthResults.apis).filter(api => api.healthy);
  const apiHealthRatio = apiEndpoints.length > 0 ? healthyAPIs.length / apiEndpoints.length : 0;
  
  const apiPenalty = Math.round((1 - apiHealthRatio) * 30);
  score -= apiPenalty;
  if (apiPenalty > 0) {
    penalties.push(`Unhealthy APIs (-${apiPenalty})`);
  }
  
  // System resources (20 points)
  if (healthResults.system.memory?.percentage > 0.9) {
    score -= 15;
    penalties.push('Critical memory usage (-15)');
  } else if (healthResults.system.memory?.percentage > 0.8) {
    score -= 5;
    penalties.push('High memory usage (-5)');
  }
  
  // Performance (10 points)
  if (healthResults.performance.stats?.successRate) {
    const successRate = parseFloat(healthResults.performance.stats.successRate);
    if (successRate < 80) {
      const penalty = Math.round((100 - successRate) / 10);
      score -= penalty;
      penalties.push(`Low success rate (-${penalty})`);
    }
  }
  
  score = Math.max(0, score); // Don't go below 0
  
  return {
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    penalties
  };
}

// Generate final summary
function generateSummary() {
  const healthScore = calculateHealthScore();
  
  healthResults.summary = {
    healthScore: healthScore.score,
    healthGrade: healthScore.grade,
    penalties: healthScore.penalties,
    overall: healthScore.score >= 80 ? 'healthy' : healthScore.score >= 60 ? 'degraded' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checkDuration: Date.now() - new Date(healthResults.timestamp).getTime()
  };
  
  // Determine overall status
  if (!healthResults.site.available) {
    healthResults.overall = 'critical';
  } else if (healthScore.score >= 80) {
    healthResults.overall = 'healthy';
  } else if (healthScore.score >= 60) {
    healthResults.overall = 'degraded';
  } else {
    healthResults.overall = 'unhealthy';
  }
}

// Output functions
function outputDetailed() {
  log(`\n${COLORS.BOLD}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  log(`${COLORS.BOLD}                    WAR ROOM HEALTH CHECK REPORT${COLORS.RESET}`);
  log(`${COLORS.BOLD}═══════════════════════════════════════════════════════════════${COLORS.RESET}`);
  
  const statusColor = healthResults.overall === 'healthy' ? COLORS.GREEN :
                     healthResults.overall === 'degraded' ? COLORS.YELLOW : COLORS.RED;
  
  log(`\n${COLORS.BOLD}Overall Status: ${statusColor}${healthResults.overall.toUpperCase()}${COLORS.RESET}`);
  log(`Health Score: ${healthResults.summary.healthScore}/100 (Grade: ${healthResults.summary.healthGrade})`);
  log(`Check Duration: ${formatTime(healthResults.summary.checkDuration)}`);
  log(`Timestamp: ${new Date(healthResults.timestamp).toLocaleString()}`);
  
  if (healthResults.summary.penalties.length > 0) {
    log(`\n${COLORS.YELLOW}Score Penalties:${COLORS.RESET}`);
    healthResults.summary.penalties.forEach(penalty => log(`  • ${penalty}`, COLORS.YELLOW));
  }
  
  if (healthResults.recommendations.length > 0) {
    log(`\n${COLORS.BLUE}Recommendations:${COLORS.RESET}`);
    healthResults.recommendations.forEach(rec => log(`  💡 ${rec}`, COLORS.BLUE));
  }
  
  log(`\n${COLORS.BOLD}Component Status Summary:${COLORS.RESET}`);
  log(`${getStatusIcon(healthResults.site.available)} Site Available: ${healthResults.site.available ? 'Yes' : 'No'}`);
  
  const healthyAPIs = Object.values(healthResults.apis).filter(api => api.healthy).length;
  const totalAPIs = Object.keys(healthResults.apis).length;
  log(`${getStatusIcon(healthyAPIs === totalAPIs)} APIs: ${healthyAPIs}/${totalAPIs} healthy`);
  
  const memUsage = healthResults.system.memory?.percentage || 0;
  log(`${getStatusIcon(memUsage < 0.8)} Memory: ${(memUsage * 100).toFixed(1)}% used`);
  
  log(`\n${COLORS.BOLD}Performance Metrics:${COLORS.RESET}`);
  if (healthResults.site.responseTime) {
    log(`⚡ Site Response Time: ${formatTime(healthResults.site.responseTime)}`);
  }
  if (healthResults.performance.stats?.avgResponseTime) {
    log(`📊 Average Response Time: ${formatTime(parseFloat(healthResults.performance.stats.avgResponseTime))}`);
    log(`📈 Success Rate: ${healthResults.performance.stats.successRate}%`);
  }
}

function outputBrief() {
  const status = healthResults.overall.toUpperCase();
  const score = healthResults.summary.healthScore;
  const siteStatus = healthResults.site.available ? 'UP' : 'DOWN';
  const responseTime = healthResults.site.responseTime ? `${healthResults.site.responseTime}ms` : 'N/A';
  
  console.log(`Status: ${status} | Score: ${score}/100 | Site: ${siteStatus} | Response: ${responseTime}`);
}

function outputJSON() {
  console.log(JSON.stringify(healthResults, null, 2));
}

// Main health check function
async function runHealthCheck() {
  try {
    log(`${COLORS.BOLD}Starting War Room health check...${COLORS.RESET}`);
    log(`Target: ${CONFIG.SITE_URL}`, COLORS.BLUE);
    
    // Run all checks
    healthResults.site = await checkSiteAvailability();
    healthResults.apis = await checkAPIEndpoints();
    healthResults.system = checkSystemResources();
    healthResults.performance = await runPerformanceBenchmark();
    
    // Generate summary
    generateSummary();
    
    // Output results based on format
    switch (CONFIG.OUTPUT_FORMAT) {
      case 'json':
        outputJSON();
        break;
      case 'brief':
        outputBrief();
        break;
      default:
        outputDetailed();
    }
    
    // Save results to file
    const reportPath = path.join(__dirname, 'reports', `health-check-${Date.now()}.json`);
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(healthResults, null, 2));
      
      if (CONFIG.OUTPUT_FORMAT === 'detailed') {
        log(`\n📄 Full report saved to: ${reportPath}`, COLORS.BLUE);
      }
    } catch (error) {
      if (CONFIG.OUTPUT_FORMAT === 'detailed') {
        log(`⚠️  Could not save report: ${error.message}`, COLORS.YELLOW);
      }
    }
    
    // Exit with appropriate code
    const exitCode = healthResults.overall === 'healthy' ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
    log(`Fatal error during health check: ${error.message}`, COLORS.RED);
    console.error(error.stack);
    process.exit(2);
  }
}

// Export for testing
module.exports = {
  runHealthCheck,
  checkSiteAvailability,
  checkAPIEndpoints,
  checkSystemResources,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  runHealthCheck().catch(console.error);
}