# Continuous Monitoring Setup for War Room

## Overview
Comprehensive monitoring solution for https://war-room-oa9t.onrender.com with automated health checks, screenshot capture, and performance validation.

## Components

### 1. Basic Monitoring Scripts
- **Location**: `/scripts/monitor-site.js`
- **Purpose**: Simple health checks with console output
- **Interval**: 5 minutes

### 2. Enhanced Playwright Tests
- **Location**: `/tests/monitoring/enhanced-monitoring.spec.js`
- **Features**:
  - Performance metrics collection
  - Screenshot capture on errors
  - Visual regression placeholders
  - API endpoint monitoring

### 3. Continuous Monitoring Service
- **Location**: `/scripts/continuous-monitoring.sh`
- **Features**:
  - Bash script for reliable monitoring
  - Automatic alerts via Apple Watch
  - Screenshot management
  - Performance threshold alerts (3 seconds)

### 4. Advanced Node.js Service
- **Location**: `/scripts/monitoring-service.js`
- **Features**:
  - Real-time dashboard
  - Metrics collection and storage
  - Console error tracking
  - Failed request monitoring

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

## Usage

### Option 1: Simple Monitoring
```bash
npm run monitor
```

### Option 2: Playwright Tests
```bash
# Single health check
npm run test:health

# Comprehensive monitoring
npm run test:comprehensive

# All monitoring tests
npm run test:all-monitoring
```

### Option 3: Continuous Monitoring (Recommended)
```bash
# Bash script with alerts
./scripts/continuous-monitoring.sh

# OR

# Node.js service with dashboard
node scripts/monitoring-service.js
```

## Monitoring Features

### 1. Health Checks (Every 5 Minutes)
- Site availability
- HTTP status codes
- Response time measurement
- Performance threshold validation (3 seconds)

### 2. Screenshot Capture
- **Regular**: Every 30 minutes
- **On Error**: Automatic capture
- **Slow Response**: When > 3 seconds
- **Storage**: `/monitoring-screenshots/`

### 3. Performance Metrics
- DOM Content Loaded time
- Total page load time
- First Paint timing
- First Contentful Paint
- Resource loading analysis

### 4. Error Detection
- Console errors
- Failed network requests
- JavaScript exceptions
- API endpoint failures

### 5. Alerts & Notifications
- Apple Watch notifications via `claude-notify-unified.sh`
- Console alerts for threshold violations
- Log file for historical analysis

## Configuration

### Performance Thresholds
```javascript
const CONFIG = {
  performanceThreshold: 3000, // 3 seconds
  checkInterval: 5 * 60 * 1000, // 5 minutes
  screenshotInterval: 30 * 60 * 1000 // 30 minutes
};
```

### Alert Types
1. **Site Down**: HTTP status != 200
2. **Slow Response**: Load time > 3 seconds
3. **Console Errors**: JavaScript errors detected
4. **API Failures**: Endpoint not responding

## Metrics & Reporting

### Real-time Metrics
- Current status
- Response times
- Error counts
- Success rate

### Historical Data
- Stored in `/monitoring-metrics.json`
- Last 1000 checks retained
- Uptime percentage calculation

### Screenshot Archive
- Automatic cleanup after 7 days
- Named with timestamp
- Categorized by type (regular, error, slow)

## Integration Points

### 1. Meta API Integration
Monitor API endpoints as you add them:
- `/api/meta/campaigns`
- `/api/meta/insights`
- `/api/meta/auth/status`

### 2. Visual Regression
Placeholder for future integration:
- Before/after screenshots
- Pixel-by-pixel comparison
- Layout shift detection

### 3. CI/CD Pipeline
Can be integrated with:
- GitHub Actions
- Pre-deployment checks
- Post-deployment validation

## Troubleshooting

### Common Issues

1. **Playwright not installed**
   ```bash
   npm run playwright:install
   ```

2. **Permission denied**
   ```bash
   chmod +x scripts/*.sh scripts/*.js
   ```

3. **Screenshots directory missing**
   ```bash
   mkdir -p monitoring-screenshots
   ```

4. **High memory usage**
   - Restart monitoring service daily
   - Clear old screenshots regularly

## Best Practices

1. **Run continuously** in production environment
2. **Review metrics** daily for trends
3. **Archive screenshots** weekly
4. **Update thresholds** based on baseline performance
5. **Test alerts** regularly to ensure delivery

## Next Steps

1. Set up visual regression testing
2. Integrate with monitoring dashboard
3. Add custom performance budgets
4. Create alerting rules for teams
5. Export metrics to time-series database

## Support

For issues or enhancements:
1. Check `/monitoring.log` for errors
2. Review `/monitoring-metrics.json` for trends
3. Inspect screenshots for visual issues