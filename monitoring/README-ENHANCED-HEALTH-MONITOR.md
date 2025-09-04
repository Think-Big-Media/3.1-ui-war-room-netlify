# War Room Enhanced Health Monitor Sub-Agent

## 🎯 Mission Statement

**MISSION**: Monitor War Room application health and auto-fix issues  
**TARGET**: https://war-room-oa9t.onrender.com/

The Enhanced Health Monitor Sub-Agent is a comprehensive TypeScript-based monitoring system that provides real-time health monitoring, automated issue resolution, and intelligent coordination with other sub-agents in the War Room ecosystem.

## 🚀 Key Features

### Core Capabilities
- ✅ **30-minute automated health checks** with comprehensive reporting
- ✅ **3-second Performance SLA enforcement** with real-time monitoring
- ✅ **Circuit breaker patterns** for system resilience 
- ✅ **Automated endpoint discovery** from robots.txt, sitemaps, and common patterns
- ✅ **Mock data validation system** with fallback verification
- ✅ **Advanced auto-fix capabilities** with success pattern learning
- ✅ **WebSocket coordination** between sub-agents
- ✅ **Pieces Knowledge Manager integration** for pattern storage

### Enhanced Monitoring
- 📊 **Real-time dashboard** with blessed/blessed-contrib terminal UI
- 🔄 **Circuit breaker visualization** showing system resilience status
- 📈 **Performance trending** with SLA violation tracking
- 🎯 **Health scoring system** with weighted component analysis
- 🔍 **Enhanced accessibility testing** with WCAG compliance checks
- 🛠️ **Auto-fix pattern recognition** with machine learning insights

### Sub-Agent Coordination
- 🌐 **WebSocket server** on port 8080 for real-time communication
- 📡 **Message broadcasting** for critical alerts and performance violations
- 🤝 **Inter-agent coordination** with AMP Refactoring and CodeRabbit agents
- 📚 **Shared knowledge base** through Pieces integration

## 📋 System Requirements

- **Node.js**: v18.0.0 or higher
- **TypeScript**: v5.2.2 or higher  
- **Memory**: 512MB RAM minimum
- **Disk**: 100MB free space for logs and reports
- **Network**: Outbound HTTPS access to target application

## 🛠️ Installation & Setup

### Quick Start

```bash
# Navigate to monitoring directory
cd /path/to/war-room/monitoring

# Install dependencies
npm install

# Start enhanced monitoring system
./start-enhanced-monitoring.sh
```

### Manual Setup

```bash
# Install TypeScript dependencies
npm install typescript ts-node @types/node -g

# Compile TypeScript files
npm run build

# Start individual components
npm run start           # Full system
npm run start:dev       # Development mode
npm run dashboard:enhanced  # Dashboard only
```

## 🎛️ Usage Commands

### Basic Operations
```bash
# Start complete monitoring system
./start-enhanced-monitoring.sh

# Stop all services  
./stop-enhanced-monitoring.sh

# Force immediate health check
npm run health-check

# View system status
npm run status
```

### Development Mode
```bash
# Start in development with auto-reload
npm run dev

# Run unit tests
npm run test:unit

# Run integration tests (Playwright)
npm run test:integration

# Run performance tests
npm run test:performance
```

### Dashboard & Monitoring
```bash
# Start enhanced terminal dashboard
npm run dashboard:enhanced

# View real-time logs
tail -f logs/enhanced-health-monitor.log

# WebSocket test client
npm run websocket:test
```

## 📊 Dashboard Interface

The enhanced dashboard provides a comprehensive real-time view:

### Layout Overview
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  System Status  │  Performance    │ Circuit Breaker │ Sub-Agent Coord │
│  & Health Score │  & SLA Monitor  │     States      │   & WebSocket   │
├─────────────────┴─────────────────┼─────────────────┴─────────────────┤
│        Response Time Trends        │      Health Score Over Time      │
│     (with SLA threshold line)      │       (0-100 point scale)        │
├─────────────────┬─────────────────┼─────────────────┬─────────────────┤
│     Recent      │    Auto-Fix     │    System       │                 │
│   Alerts &      │   Operations    │   Events &      │                 │
│ Critical Issues │     Log         │  WebSocket      │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

### Keyboard Shortcuts
- `q/ESC/Ctrl+C` - Quit dashboard
- `r` - Manual refresh  
- `c` - Clear all widgets
- `f` - Force health check
- `w` - Reconnect WebSocket
- `h` - Show help

## 🔧 Configuration

### Health Monitor Configuration
```typescript
// health-monitor-enhanced.ts
const config = {
  TARGET_URL: 'https://war-room-oa9t.onrender.com',
  MONITORING_INTERVAL: '*/30 * * * *', // Every 30 minutes
  PERFORMANCE_SLA: 3000, // 3 seconds max response time
  WEBSOCKET_PORT: 8080,
  AUTO_FIX_ENABLED: true,
  PIECES_INTEGRATION_ENABLED: true
};
```

### Endpoint Monitoring
```typescript
HEALTH_ENDPOINTS: [
  { path: '/api/health', name: 'Main Health', critical: true, timeout: 5000 },
  { path: '/api/v1/status', name: 'API Status', critical: true, timeout: 5000 },
  { path: '/api/v1/analytics/status', name: 'Analytics', critical: false },
  { path: '/api/v1/auth/status', name: 'Auth Status', critical: true },
  { path: '/docs', name: 'Documentation', critical: false },
  { path: '/', name: 'Site Root', critical: true }
]
```

### Circuit Breaker Settings
```typescript
// Per-endpoint circuit breakers
const breaker = new CircuitBreaker(
  'endpoint-name',
  failureThreshold: 3,     // Open after 3 failures
  recoveryTimeout: 30000,  // 30 seconds before half-open
  successThreshold: 2      // Close after 2 successes
);
```

## 🧠 Auto-Fix Capabilities

### Supported Fix Patterns
- **Service Recovery**: Application warmup and cache clearing
- **Performance Optimization**: Multi-request warmup strategies  
- **Circuit Breaker Management**: Automatic reset on recovery
- **Endpoint Validation**: Force health checks with cache bypass
- **Mock Data Recovery**: Fallback mechanism validation

### Knowledge Learning
The system learns from successful fixes and builds a knowledge base:

```typescript
interface AutoFixPattern {
  pattern: string;           // Error pattern identifier
  action: string;           // Fix action to apply  
  successRate: number;      // Historical success rate
  appliedCount: number;     // Times this fix was applied
  tags: string[];          // Categorization tags
  metadata: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    endpoint?: string;
    errorType?: string;
  };
}
```

## 📡 WebSocket Communication

### Message Types
```typescript
interface SubAgentMessage {
  type: 'health-update' | 'fix-applied' | 'critical-alert' | 'performance-violation';
  timestamp: string;
  source: 'health-monitor';
  data: any;
}
```

### Integration with Other Sub-Agents
- **AMP Refactoring Specialist**: Performance violation notifications
- **CodeRabbit Integration**: Code quality alerts from health issues
- **Pieces Knowledge Manager**: Pattern sharing and learning

### WebSocket Server Details
- **Port**: 8080 (configurable)
- **Protocol**: WebSocket (ws://)
- **Message Format**: JSON
- **Heartbeat**: 30-second keep-alive
- **Reconnection**: Automatic with exponential backoff

## 📁 File Structure

```
monitoring/
├── health-monitor-enhanced.ts     # Main health monitor (TypeScript)
├── enhanced-dashboard.ts          # Real-time dashboard
├── package.json                   # Enhanced dependencies
├── tsconfig.json                 # TypeScript configuration
├── start-enhanced-monitoring.sh   # System startup script
├── stop-enhanced-monitoring.sh    # System shutdown script
├── dist/                         # Compiled JavaScript files
├── logs/                         # System logs
│   ├── enhanced-health-monitor.log
│   ├── enhanced-dashboard.log
│   └── *.pid                     # Process ID files
├── reports/                      # Health reports
│   ├── latest-enhanced-health-report.json
│   ├── health-summary.json
│   └── enhanced-health-report-*.json
└── knowledge-base/               # Auto-fix patterns
    ├── health-check-fixes/
    │   └── known-fixes.json
    └── pieces-integration/
        └── fix-*.json
```

## 📈 Health Scoring System

### Scoring Components (Weighted)
- **Site Availability** (20%): Basic connectivity and response
- **Endpoints Health** (25%): Individual endpoint status
- **UI Functionality** (15%): Playwright tests and accessibility
- **Performance Metrics** (25%): Response times and SLA compliance
- **Mock Data Systems** (5%): Fallback mechanism integrity  
- **Circuit Breakers** (10%): System resilience status

### Health Grades
- **Excellent** (95-100): All systems optimal, no issues
- **Good** (85-94): Minor issues, within acceptable ranges
- **Fair** (70-84): Some problems, monitoring required
- **Poor** (50-69): Significant issues, intervention needed
- **Critical** (0-49): System compromised, immediate action required

## 🚨 Alert System

### Alert Severities
- **CRITICAL**: System down, immediate human intervention required
- **WARNING**: Performance degradation, automated fixes attempted
- **INFO**: Operational information, no action needed

### Alert Triggers
- Site completely unavailable (>50% endpoints down)
- Performance SLA violations (>3 violations in single check)
- UI functionality tests failing
- Circuit breakers stuck in open state
- Consecutive health check failures (>5)
- Auto-fix pattern failures

### Notification Channels
- Terminal dashboard (real-time)
- System logs (persistent)
- WebSocket broadcasts (sub-agents)
- External notification script integration

## 🔍 Monitoring Metrics

### Performance Metrics
```typescript
interface PerformanceMetric {
  timestamp: string;
  endpoint: string;
  responseTime: number;      // milliseconds
  withinSLA: boolean;       // < 3000ms
  statusCode: number;
  contentLength: number;
}
```

### Health Check Results
```typescript
interface HealthCheckResult {
  timestamp: string;
  checkId: string;
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number;            // 0-100 health score
  site: SiteResult;
  endpoints: EndpointsResult;
  ui: UITestResult;
  performance: PerformanceResult;
  mockData: MockDataResult;
  autoFixes: AutoFixResult[];
  criticalIssues: CriticalIssue[];
  recommendations: Recommendation[];
  circuitBreakers: Record<string, CircuitBreakerState>;
}
```

## 🧪 Testing & Validation

### Test Coverage
- **Unit Tests**: TypeScript classes and utility functions
- **Integration Tests**: Playwright UI functionality tests  
- **Performance Tests**: SLA compliance and load testing
- **Circuit Breaker Tests**: Failure simulation and recovery

### Continuous Testing
```bash
# Run all tests
npm test

# Specific test suites  
npm run test:unit          # Jest unit tests
npm run test:integration   # Playwright E2E tests
npm run test:performance   # Performance validation
```

### Test Configuration
```javascript
// playwright.config.js monitoring project
{
  name: 'monitoring',
  testDir: './tests/monitoring',
  use: {
    baseURL: 'https://war-room-oa9t.onrender.com',
    timeout: 30000
  }
}
```

## 🔒 Security Considerations

### Data Protection
- No sensitive data logged or transmitted
- Circuit breaker states are anonymized
- Health reports exclude authentication tokens
- WebSocket connections are localhost-only by default

### Access Control
- WebSocket server binds to localhost (127.0.0.1) 
- File permissions restricted to user access only
- Log rotation prevents disk space exhaustion
- PID files secured against unauthorized access

## 🚀 Deployment & Production

### Production Checklist
- [ ] Configure log rotation (logrotate)
- [ ] Set up process monitoring (PM2/systemd)
- [ ] Configure firewall rules for WebSocket port
- [ ] Set up backup for knowledge base files
- [ ] Configure external notification integrations
- [ ] Test disaster recovery procedures

### Systemd Service (Linux)
```ini
[Unit]
Description=War Room Enhanced Health Monitor
After=network.target

[Service]
Type=forking
User=warroom
WorkingDirectory=/path/to/monitoring
ExecStart=/path/to/monitoring/start-enhanced-monitoring.sh
ExecStop=/path/to/monitoring/stop-enhanced-monitoring.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: WebSocket connection fails  
**Solution**: Check port 8080 availability, firewall settings

**Issue**: TypeScript compilation errors  
**Solution**: Ensure TypeScript v5.2.2+, run `npm run build`

**Issue**: Health checks timing out  
**Solution**: Verify target URL accessibility, check network connectivity

**Issue**: Dashboard not updating  
**Solution**: Verify WebSocket connection, check health monitor logs

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run start:dev

# WebSocket connection testing
npm run websocket:test

# Validate configuration
npm run health-check:dev
```

### Log Analysis
```bash
# Monitor real-time logs
tail -f logs/enhanced-health-monitor.log

# Search for errors
grep "ERROR\|CRITICAL" logs/*.log

# Performance analysis
grep "SLA violation" logs/enhanced-health-monitor.log
```

## 🤝 Contributing

### Development Workflow
1. Fork repository and create feature branch
2. Install dependencies: `npm install`  
3. Make changes with TypeScript
4. Run tests: `npm test`
5. Build: `npm run build`
6. Test integration: `npm run start:dev`

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Comprehensive error handling required
- Unit test coverage >80%
- Documentation for all public interfaces

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Emergency Contacts

- **System Administrator**: [Contact Info]
- **Development Team**: [Contact Info]  
- **On-Call Support**: [Contact Info]

---

**War Room Enhanced Health Monitor Sub-Agent v2.0**  
*Comprehensive health monitoring with intelligent auto-fix capabilities*

Last Updated: August 2025