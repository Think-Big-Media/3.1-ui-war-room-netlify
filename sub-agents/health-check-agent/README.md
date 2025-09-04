# SUB-AGENT 1 - HEALTH_CHECK_AGENT

## 🏥 War Room Platform Migration Readiness Validator

A comprehensive health validation system for the War Room platform, designed to ensure 100% migration readiness to Render.com deployment.

### 🎯 MISSION STATEMENT

Complete health validation of War Room platform for Render.com migration readiness with comprehensive testing, monitoring, and alerting capabilities.

**Target:** https://war-room-oa9t.onrender.com/

## 📋 CORE RESPONSIBILITIES

### 1. API Health Validation ✅
- Test all `/api/health` endpoints
- Verify authentication endpoints and token validation
- Check all API response codes and data structure
- Test rate limiting functionality
- Validate CORS configuration

### 2. Performance Testing ⚡
- Validate <3 second response time SLA
- Test database query performance
- Check frontend bundle load times
- Test WebSocket connection stability
- Measure static asset loading

### 3. Fallback Mechanism Testing 🛡️
- Test mock data fallback when APIs fail
- Verify error boundary functionality
- Check graceful degradation
- Test offline capability

### 4. Database Connectivity 🗄️
- Test PostgreSQL/Supabase connection health
- Verify all migrations are applied
- Check connection pooling
- Test backup procedures

### 5. Infrastructure Checks 🏗️
- Test Redis caching if used
- Verify environment variables
- Check external integrations (Supabase, etc.)
- Validate SSL/TLS certificates

## 🚀 QUICK START

### Prerequisites
```bash
# Install dependencies
pip install -r requirements.txt
```

### Basic Usage
```bash
# Run single comprehensive health check
python run_health_check.py

# Custom target URL
python run_health_check.py https://your-war-room-url.com

# Generate HTML report and open in browser
python run_health_check.py --format html --browser

# CI/CD mode (minimal output, exit codes)
python run_health_check.py --ci
```

### Real-time Monitoring
```bash
# Start continuous monitoring (5-minute intervals)
python monitoring_dashboard.py

# Custom interval (2 minutes)
python monitoring_dashboard.py --interval 120

# Monitor with alerts disabled
python monitoring_dashboard.py --no-alerts
```

## 📊 HEALTH CHECK COMPONENTS

### Core Health Checks

1. **Site Availability**
   - Basic connectivity test
   - SSL certificate validation
   - Response time measurement
   - Content verification

2. **API Endpoint Testing**
   - `/` - Root endpoint
   - `/health` - Main health check
   - `/api/health` - Backend health
   - `/api/v1/status` - API status
   - `/docs` - FastAPI documentation
   - All analytics, monitoring, alerts endpoints

3. **Performance Benchmarking**
   - Concurrent request testing
   - Response time statistics
   - SLA compliance validation
   - Consistency measurement

4. **System Resources**
   - Memory usage monitoring
   - CPU load tracking
   - Disk space validation
   - Process health

5. **Database Connectivity**
   - Connection validation through API
   - Health endpoint parsing
   - Service status verification

6. **Fallback Mechanisms**
   - Error boundary testing
   - Invalid endpoint handling
   - Graceful degradation verification

## 📈 PERFORMANCE METRICS

### SLA Requirements
- **Response Time:** < 3 seconds (3000ms)
- **Success Rate:** > 95%
- **Availability:** 99.9% uptime
- **Consistency:** < 2 second variation

### Health Score Calculation
- **Site Availability:** 25 points
- **Performance Benchmark:** 20 points
- **Database Connectivity:** 15 points
- **System Resources:** 15 points
- **SSL Certificate:** 10 points
- **Fallback Mechanisms:** 10 points
- **API Endpoints:** 5 points (distributed)

### Migration Readiness Criteria
- Health Score ≥ 80
- No critical issues
- Site availability: PASS
- Performance SLA: COMPLIANT

## 🎨 OUTPUT FORMATS

### 1. Console Output
```bash
python run_health_check.py --format console
```
Real-time status updates with colored output and detailed results.

### 2. HTML Report
```bash
python run_health_check.py --format html --browser
```
Beautiful, interactive HTML dashboard with charts and visualizations.

### 3. JSON Export
```bash
python run_health_check.py --format json
```
Machine-readable JSON for CI/CD integration and automation.

### 4. Real-time Dashboard
```bash
python monitoring_dashboard.py
```
Live HTML dashboard with auto-refresh and trend analysis.

## 🚨 ALERTING SYSTEM

### Configuration
```bash
# Create sample config
python alerting_system.py --create-config

# Test alerting
python alerting_system.py --test --config alerting_config.json
```

### Supported Channels
- **Console:** Colored terminal alerts
- **File Logging:** Persistent alert history
- **Email:** SMTP notifications
- **Slack:** Webhook integration
- **Custom Webhooks:** REST API calls
- **Pushcut:** iOS push notifications

### Alert Types
- **CRITICAL_FAILURE:** Component completely down
- **MIGRATION_READINESS:** System not ready for migration
- **PERFORMANCE_DEGRADATION:** SLA violations
- **CONSECUTIVE_FAILURES:** Repeated failures
- **HEALTH_SCORE_DROP:** Score below threshold

## 📁 PROJECT STRUCTURE

```
sub-agents/health-check-agent/
├── README.md                    # This documentation
├── requirements.txt             # Python dependencies
├── health_check_agent.py        # Main health check engine
├── html_report_generator.py     # HTML report generation
├── monitoring_dashboard.py      # Real-time monitoring
├── alerting_system.py          # Alert management
├── run_health_check.py         # CLI launcher
├── reports/                    # Generated reports
│   ├── health_report_*.json    # JSON reports
│   └── health_report_*.html    # HTML reports
├── dashboard/                  # Live dashboard
│   └── live_dashboard.html     # Real-time HTML
├── logs/                       # System logs
│   ├── health_monitor_*.log    # Monitoring logs
│   └── alerts.log             # Alert history
└── alerting_config.json       # Alert configuration
```

## 🔧 CONFIGURATION

### Environment Variables
```bash
# Optional: Override default target
export WAR_ROOM_URL="https://your-deployment.render.com"

# Optional: Custom check interval (seconds)
export HEALTH_CHECK_INTERVAL=300

# Optional: Enable debug logging
export DEBUG=1
```

### Health Check Configuration
Modify `health_check_agent.py` for custom settings:
```python
# Response time threshold (milliseconds)
self.max_response_time = 3000

# API endpoints to validate
self.api_endpoints = [
    "/",
    "/health",
    "/api/health",
    # Add custom endpoints
]

# Performance test settings
self.perf_test_requests = 10
self.perf_test_concurrent = 3
```

### Alerting Configuration
Create `alerting_config.json` for notification settings:
```json
{
  "email": {
    "enabled": true,
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "username": "alerts@yourcompany.com",
    "password": "your-app-password",
    "to_emails": ["admin@yourcompany.com"]
  },
  "slack": {
    "enabled": true,
    "webhook_url": "https://hooks.slack.com/services/...",
    "channel": "#war-room-alerts"
  }
}
```

## 🔬 TESTING & VALIDATION

### Manual Testing
```bash
# Test against production
python run_health_check.py https://war-room-oa9t.onrender.com

# Test against staging
python run_health_check.py https://staging-war-room.render.com

# Test with specific formats
python run_health_check.py --format all --browser
```

### CI/CD Integration
```bash
# Add to your CI pipeline
python run_health_check.py --ci
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Health check passed - deployment ready"
else
    echo "❌ Health check failed - deployment blocked"
    exit 1
fi
```

### Continuous Monitoring Setup
```bash
# Add to crontab for periodic checks
# Run every 5 minutes
*/5 * * * * cd /path/to/health-agent && python run_health_check.py --ci >> /var/log/war-room-health.log 2>&1

# Start monitoring service
nohup python monitoring_dashboard.py > monitoring.log 2>&1 &
```

## 📊 SAMPLE OUTPUTS

### Console Output
```
🚀 Starting comprehensive War Room health check...
✅ Site Availability: pass (1247.32ms)
✅ API Endpoint /health: pass (892.15ms)
⚠️  API Endpoint /api/v1/status: warning (3201.45ms)
✅ Performance Benchmark: pass (2156.78ms)
✅ Database Connectivity: pass (456.23ms)
✅ System Resources: pass (12.34ms)
✅ SSL Certificate: pass (234.56ms)
✅ Fallback Mechanisms: pass (678.90ms)

📊 FINAL ASSESSMENT
Overall Status: 🟢 GOOD
Health Score: 87/100
Migration Ready: ✅ YES
Duration: 15.43s
```

### Migration Readiness Decision
```json
{
  "migration_assessment": {
    "ready_for_migration": true,
    "critical_blockers": [],
    "recommendations": [
      "Optimize API response times",
      "Review SSL certificate expiration"
    ],
    "go_no_go_decision": "GO"
  }
}
```

## 🎯 SUCCESS CRITERIA

### ✅ DEPLOYMENT READINESS CHECKLIST

- [ ] All endpoints respond within 3 seconds
- [ ] Database connectivity 100% stable
- [ ] No critical security vulnerabilities
- [ ] All fallback mechanisms functional
- [ ] Zero risk of data corruption
- [ ] Complete API coverage testing
- [ ] SSL certificate valid and secure
- [ ] System resources within acceptable limits
- [ ] Performance benchmarks meet SLA
- [ ] Migration readiness score ≥ 80

### 🏆 EXPECTED OUTCOMES

1. **Complete Health Report:** Detailed HTML and JSON reports
2. **Performance Metrics:** Response time analysis and SLA compliance
3. **Migration Decision:** Clear GO/NO-GO recommendation
4. **Critical Issue Identification:** Prioritized list of blockers
5. **Monitoring Integration:** Continuous health validation
6. **Alert System:** Proactive failure notifications

## 🛠️ TROUBLESHOOTING

### Common Issues

**Connection Timeouts**
```bash
# Increase timeout in health_check_agent.py
self.timeout = 30.0  # Increase from 10.0
```

**SSL Certificate Errors**
```bash
# Disable SSL verification for testing
export PYTHONHTTPSVERIFY=0
```

**Permission Denied**
```bash
# Make scripts executable
chmod +x *.py
```

### Debug Mode
```bash
# Enable detailed logging
export DEBUG=1
python run_health_check.py
```

### Log Analysis
```bash
# View monitoring logs
tail -f logs/health_monitor_$(date +%Y%m%d).log

# Check alert history
cat logs/alerts.log | jq '.'
```

## 🔗 INTEGRATION POINTS

### War Room Platform
- Integrates with existing monitoring system
- Uses current API endpoints
- Validates production configuration

### Render.com Deployment
- Tests production URLs
- Validates environment variables
- Checks deployment health

### CI/CD Pipeline
- Returns appropriate exit codes
- Generates machine-readable reports
- Integrates with build systems

## 📞 SUPPORT

For technical support or configuration assistance:
1. Check logs in `logs/` directory
2. Review configuration in `alerting_config.json`
3. Test individual components with debug mode
4. Contact War Room development team

---

**Generated by SUB-AGENT 1 - HEALTH_CHECK_AGENT v1.0.0**
*War Room Platform Migration Readiness Validator*