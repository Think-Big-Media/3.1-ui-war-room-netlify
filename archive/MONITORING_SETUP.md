# War Room Site Monitoring Setup

## Overview
Comprehensive monitoring solution for the War Room application deployed at https://war-room-oa9t.onrender.com

## Components

### 1. Playwright Health Checks
- **Basic Health Check**: `tests/monitoring/live-site-health.spec.js`
- **Comprehensive Check**: `tests/monitoring/comprehensive-health-check.spec.js`

### 2. Continuous Monitoring Service
- **Service**: `src/services/monitoring-service.js`
- **CLI Script**: `scripts/monitor-site.js`

### 3. API Structure
Created directories for future API integrations:
- `src/api/meta/` - Meta (Facebook) API integration
- `src/api/google/` - Google Ads API integration
- `src/api/monitoring/` - Monitoring endpoints

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

## Usage

### Run Health Checks
```bash
# Quick health check
npm run test:health

# Comprehensive health check
npm run test:comprehensive

# All monitoring tests
npm run test:all-monitoring
```

### Continuous Monitoring
```bash
# Start continuous monitoring (checks every 5 minutes)
npm run monitor
```

### What It Monitors

1. **Frontend Availability**
   - Page loads successfully
   - Title renders
   - Main app container visible

2. **API Endpoints**
   - `/api/health` - Health check endpoint
   - `/api/v1/status` - Status endpoint
   - `/docs` - FastAPI documentation

3. **Performance Metrics**
   - DOM content loaded time
   - Total page load time
   - Response times for each endpoint

4. **Error Detection**
   - Console errors
   - Network failures
   - API errors

5. **Render.com Specific**
   - Deployment headers
   - Server identification

## Monitoring Output

The continuous monitor displays:
- Real-time health check results
- Response times for each component
- Uptime percentage
- Average response times
- Error tracking

## Next Steps

1. **Set up automated alerts**
   - Email/SMS notifications on failures
   - Slack/Discord integration
   - PagerDuty for critical issues

2. **Enhanced metrics**
   - Database connection monitoring
   - Memory/CPU usage tracking
   - User session monitoring

3. **Dashboard creation**
   - Real-time monitoring dashboard
   - Historical trend analysis
   - SLA tracking

4. **API Integration**
   - Connect Meta Ads API
   - Connect Google Ads API
   - Unified reporting

## Configuration

Edit `MONITORING_CONFIG` in `src/services/monitoring-service.js` to adjust:
- Check intervals
- Timeout values
- Alert thresholds
- Endpoints to monitor