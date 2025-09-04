# War Room Monitoring System

A comprehensive, real-time monitoring solution for the War Room application designed specifically for production monitoring and client demonstrations.

## 🎯 Overview

The War Room Monitoring System provides complete visibility into your application's health, performance, and user activity. Perfect for client demos, production monitoring, and development debugging.

### Key Features

- **🌐 Live Site Monitoring** - Continuous availability and response time tracking
- **🔌 API Health Checks** - Monitor all endpoints with detailed status reporting  
- **🗄️ Database Connectivity** - Real-time database connection and performance monitoring
- **🧠 Pinecone Integration** - Vector database service health monitoring
- **📊 Real-time Dashboard** - Terminal-based live monitoring interface
- **🚨 Automated Alerts** - Multi-channel alerting (Apple Watch, email, Slack, Discord)
- **📈 Performance Trends** - Historical performance data and analysis
- **💻 System Resources** - Memory, CPU, and system health monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Access to https://war-room-oa9t.onrender.com
- Terminal access for dashboard

### Installation

1. **Navigate to monitoring directory:**
   ```bash
   cd /Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start monitoring system:**
   ```bash
   ./start-monitoring.sh
   ```

4. **View live dashboard:**
   ```bash
   npm run dashboard
   ```

### One-time Health Check

For quick status checks or CI/CD integration:

```bash
# Detailed report
node health-check.js

# Brief status line
node health-check.js brief

# JSON output
node health-check.js json
```

## 📋 What's Being Monitored

### Site Availability
- **URL:** https://war-room-oa9t.onrender.com
- **Frequency:** Every 30 seconds
- **Metrics:** Response time, status codes, content validation
- **Alerts:** Downtime, slow responses (>3s)

### API Endpoints
- `/api/health` - Basic health check
- `/api/v1/status` - Detailed system status
- `/docs` - FastAPI documentation
- `/api/v1/analytics/status` - Analytics service status
- `/api/v1/auth/status` - Authentication service status

### Performance Metrics
- **Response Times:** Site and API endpoint performance
- **Success Rates:** Request success/failure ratios
- **Consistency:** Response time variation analysis
- **Benchmarking:** Multi-request performance testing

### System Resources
- **Memory Usage:** System and process memory consumption
- **CPU Load:** System load average and process usage
- **Uptime:** System and process uptime tracking
- **Network:** Connection health and performance

### Database & Services
- **PostgreSQL:** Connection health and query performance
- **Pinecone:** Vector database service availability
- **Redis:** Cache service health (if configured)

## 🖥️ Dashboard Interface

The real-time dashboard provides a comprehensive view of system health:

### Main Sections

1. **System Status Panel**
   - Overall health status
   - Site availability indicator
   - Database connection status
   - Response time metrics

2. **Performance Metrics Panel**
   - Memory usage statistics
   - CPU load information
   - Process details

3. **Quick Stats Panel**
   - Last check information
   - API endpoint health summary
   - Active alerts count

4. **Response Time Chart**
   - Real-time response time graphing
   - Historical trend analysis
   - Performance over time

5. **System Resources Chart**
   - Memory usage trends
   - CPU utilization patterns
   - Resource consumption over time

6. **Alerts Table**
   - Recent alerts with timestamps
   - Severity levels
   - Alert message details

7. **System Events Log**
   - Live event streaming
   - Error messages
   - Status updates

### Dashboard Controls

- **q** or **Ctrl+C**: Quit dashboard
- **r**: Manual refresh
- **c**: Clear event logs

## 🚨 Alert System

### Alert Types

1. **CRITICAL Alerts**
   - Site completely down
   - Database disconnected
   - System failure errors
   - *Cooldown: 5 minutes*

2. **WARNING Alerts**
   - Slow response times (>3s)
   - High memory usage (>80%)
   - API endpoint failures
   - High CPU load (>80%)
   - *Cooldown: 15 minutes*

3. **INFO Alerts**
   - Service degradation
   - Performance variations
   - *Cooldown: 30 minutes*

### Notification Channels

#### Apple Watch Notifications ✅
- **Enabled by default**
- Uses existing claude-notify-unified.sh script
- Immediate notifications with sound alerts
- Shows full alert details on watch

#### Email Notifications
```bash
# Configure email alerts
export ALERT_EMAIL_USER="your-email@gmail.com"
export ALERT_EMAIL_PASS="your-app-password"
```

#### Slack Integration
```bash
# Configure Slack webhook
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
```

#### Discord Integration
```bash  
# Configure Discord webhook
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK"
```

## 📊 Health Scoring

The system calculates a health score (0-100) based on:

- **Site Availability (40 points):** Is the site accessible?
- **API Health (30 points):** Are API endpoints responding?
- **System Resources (20 points):** Memory and CPU usage
- **Performance (10 points):** Response time consistency

### Health Grades
- **A (90-100):** Excellent - All systems optimal
- **B (80-89):** Good - Minor issues detected  
- **C (70-79):** Fair - Some performance concerns
- **D (60-69):** Poor - Multiple issues need attention
- **F (<60):** Critical - Immediate action required

## 📁 File Structure

```
monitoring/
├── war-room-monitor.js       # Main monitoring script
├── real-time-dashboard.js    # Terminal dashboard
├── alert-system.js          # Automated alerting
├── health-check.js          # One-time health check
├── start-monitoring.sh      # Startup script
├── stop-monitoring.sh       # Shutdown script  
├── package.json            # Dependencies
├── README.md               # This documentation
├── logs/                   # Log files
│   ├── monitoring.log      # Main monitoring log
│   ├── alerts.log          # Alert history
│   ├── health-monitor.log  # Health monitor process log
│   └── alert-system.log    # Alert system process log
├── reports/                # Health reports
│   ├── health-report.json  # Current health status
│   └── health-check-*.json # Historical reports
└── pids/                   # Process ID files
    ├── health-monitor.pid
    └── alert-system.pid
```

## 🔧 Configuration

### Main Configuration (war-room-monitor.js)
```javascript
const CONFIG = {
  SITE_URL: 'https://war-room-oa9t.onrender.com',
  THRESHOLDS: {
    RESPONSE_TIME: 3000,    // 3 seconds
    ERROR_RATE: 0.01,       // 1%
    MEMORY_USAGE: 0.80,     // 80%
    CPU_USAGE: 0.80         // 80%
  },
  MONITORING_INTERVAL: 30000, // 30 seconds
  ALERT_COOLDOWN: 300000      // 5 minutes
};
```

### Alert Configuration (alert-system.js)
```javascript
const CONFIG = {
  EMAIL: {
    ENABLED: false,  // Set to true when configured
    FROM: 'warroom-alerts@yourdomain.com',
    TO: ['admin@yourdomain.com']
  },
  APPLE_WATCH: {
    ENABLED: true,
    SCRIPT_PATH: '/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh'
  }
};
```

## 🎮 Usage Examples

### For Client Demos

1. **Start monitoring before demo:**
   ```bash
   ./start-monitoring.sh
   ```

2. **Open dashboard during demo:**
   ```bash
   npm run dashboard
   ```

3. **Show health report:**
   ```bash
   node health-check.js
   ```

### For Development

1. **Quick health check:**
   ```bash
   node health-check.js brief
   ```

2. **Monitor specific issues:**
   ```bash
   tail -f logs/alerts.log
   ```

3. **Check current status:**
   ```bash
   cat reports/health-report.json | jq .summary
   ```

### For Production Monitoring

1. **Run as service:**
   ```bash
   # Add to cron for auto-restart
   */5 * * * * cd /path/to/monitoring && ./start-monitoring.sh
   ```

2. **CI/CD Integration:**
   ```bash
   # Add to deployment pipeline
   node health-check.js json > health-report.json
   ```

## 📈 Performance Baselines

### Expected Performance
- **Site Response Time:** < 3 seconds
- **API Response Time:** < 2 seconds  
- **Memory Usage:** < 80%
- **CPU Usage:** < 80%
- **Success Rate:** > 99%

### Alert Triggers
- **Critical:** Site down, database disconnected
- **Warning:** Response > 3s, memory > 80%, API failures
- **Info:** Performance degradation, consistency issues

## 🛠️ Troubleshooting

### Common Issues

1. **"Cannot connect to site"**
   - Check internet connection
   - Verify site URL is correct
   - Check if site is actually down

2. **"Permission denied" on scripts**
   ```bash
   chmod +x *.sh
   ```

3. **Node.js version error**
   ```bash
   # Check version
   node --version
   # Upgrade if needed (requires Node 18+)
   ```

4. **Dashboard not updating**
   - Check if monitoring processes are running
   - Look for errors in log files
   - Restart monitoring system

### Log Analysis

```bash
# View all logs
tail -f logs/*.log

# Check for errors
grep -i error logs/*.log

# View recent alerts
tail -20 logs/alerts.log | jq .
```

### Process Management

```bash
# Check if processes are running
ps aux | grep node

# View process details
cat pids/*.pid | xargs ps -p

# Stop specific process
kill $(cat pids/health-monitor.pid)
```

## 🔮 Advanced Features

### Custom Endpoints
Add your own endpoints to monitor:
```javascript
API_ENDPOINTS: [
  '/api/health',
  '/api/v1/status',
  '/your/custom/endpoint'
]
```

### Custom Thresholds
Adjust alert sensitivity:
```javascript
THRESHOLDS: {
  RESPONSE_TIME: 5000,    // 5 seconds instead of 3
  MEMORY_USAGE: 0.90      // 90% instead of 80%
}
```

### Historical Data
The system maintains:
- Last 100 performance measurements
- Last 50 alerts
- 24-hour activity logs

## 🤝 Integration

### With Existing Systems

1. **Linear Integration:** Alert notifications can trigger Linear issue creation
2. **PostHog Analytics:** Performance data can be sent to PostHog
3. **Sentry Error Tracking:** System errors automatically reported
4. **Slack/Discord:** Team notifications for critical issues

### API Integration
```javascript
// Get current health status
const health = require('./reports/health-report.json');
console.log(health.summary.overall);
```

## 📞 Support

### Getting Help

1. **Check logs first:**
   ```bash
   tail -f logs/*.log
   ```

2. **Run health check:**
   ```bash
   node health-check.js
   ```

3. **Verify configuration:**
   ```bash
   grep -r "CONFIG" *.js
   ```

### Emergency Procedures

1. **Site is down:**
   - Check alert logs for root cause
   - Verify Render.com deployment status
   - Contact hosting provider if needed

2. **Monitoring system failure:**
   ```bash
   ./stop-monitoring.sh
   ./start-monitoring.sh
   ```

3. **High resource usage:**
   - Check system logs
   - Identify resource-heavy processes
   - Consider scaling up resources

## 🎯 Perfect for Client Demos

This monitoring system is specifically designed to impress clients by showing:

1. **Professional Monitoring:** Real-time system health tracking
2. **Proactive Alerting:** Issues detected before users notice
3. **Performance Transparency:** Clear metrics and trends
4. **Reliability Focus:** Continuous uptime and performance monitoring
5. **Enterprise-Grade Tools:** Dashboard and reporting capabilities

The visual dashboard and comprehensive reporting demonstrate your commitment to reliability and professional operations.

---

**🚀 Ready to start monitoring? Run `./start-monitoring.sh` and open the dashboard with `npm run dashboard`**