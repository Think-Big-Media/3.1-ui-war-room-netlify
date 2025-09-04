# Troubleshooting Guide - War Room Platform

## Overview

This comprehensive troubleshooting guide covers common issues, their symptoms, root causes, and step-by-step resolution procedures for the War Room platform deployed on Render.com.

**Last Updated**: August 9, 2025  
**Current Status**: Production-ready with active monitoring

## 🆕 Recent Fixes & Known Solutions (August 2025)

### ✅ NPM Vulnerabilities - RESOLVED
**Issue**: 7 npm vulnerabilities were detected causing security concerns
**Solution Applied**: 
- Updated all dependencies to latest secure versions
- Ran `npm audit fix` to automatically resolve issues
- Verified with `npm audit` showing 0 vulnerabilities
**Prevention**: Regular dependency updates scheduled

### ✅ Performance Cold Starts - RESOLVED  
**Issue**: Service taking 30+ seconds to respond after inactivity
**Solution Applied**:
- Implemented GitHub Actions keep-warm workflow (every 10 minutes)
- Created manual keep-warm script for development use
- Verified solution effectiveness with performance testing
**Current Performance**: 0.2s average response time (warm service)
**Prevention**: Automated monitoring maintains warm state

### 🔄 TypeScript Errors - IN PROGRESS
**Current Status**: 539 TypeScript errors remaining (reduced from ~800)
**Common Error Patterns**:
```typescript
// Pattern 1: API client type definitions
error TS2339: Property 'access_token' does not exist on type 'unknown'

// Pattern 2: Component prop interfaces  
error TS2322: Type '{}' is not assignable to type 'Props'

// Pattern 3: Service layer type safety
error TS2345: Argument of type 'string' is not assignable to parameter
```
**Resolution Strategy**: Systematic type definition improvements
**Timeline**: Target <200 errors within 2 weeks

### 🔄 Test Suite Issues - ONGOING
**Current Issue**: Axios mock compatibility in Google Ads API tests
**Specific Error Pattern**:
```
TypeError: axios_1.default.isAxiosError is not a function
Expected constructor: AuthenticationError  
Received constructor: Error
```
**Root Cause**: Mock implementation not compatible with axios methods
**Resolution in Progress**: Updating mock configuration and test patterns

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Deployment Issues](#deployment-issues)
- [Runtime Issues](#runtime-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [API Issues](#api-issues)
- [Frontend Issues](#frontend-issues)
- [Performance Issues](#performance-issues)
- [External Integration Issues](#external-integration-issues)
- [Monitoring & Alerting Issues](#monitoring--alerting-issues)
- [Sub-Agent Issues](#sub-agent-issues)
- [Emergency Procedures](#emergency-procedures)

## Quick Diagnostics

### Health Check Commands

```bash
# Basic service health
curl https://war-room-oa9t.onrender.com/health

# API health check
curl https://war-room-oa9t.onrender.com/api/v1/health

# Frontend availability
curl -I https://war-room-oa9t.onrender.com/

# WebSocket connectivity test
curl -I -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://war-room-oa9t.onrender.com/ws
```

### Quick Status Verification

| Component | Check | Expected Result | Current Status |
|-----------|-------|----------------|----------------|
| Service | `curl /health` | `{"status": "healthy"}` | ✅ 0.2s avg |
| API | `curl /api/v1/health` | Detailed health response | ✅ Active |
| Database | API health check | `"database": "connected"` | ✅ Connected |
| Redis | API health check | `"redis": "connected"` | ✅ Connected |
| Frontend | Browser access | Page loads without errors | ✅ Loading |
| Keep-Warm | GitHub Actions | Running every 10 min | ✅ Active |

### Performance Baseline (Updated August 9, 2025)

| Metric | Current Value | Threshold | Status |
|--------|---------------|-----------|---------|
| Response Time (Health) | 0.2s | <3s | ✅ Excellent |
| Response Time (Settings) | 0.21s | <3s | ✅ Excellent |
| Load Capacity | 15+ req/s | >5 req/s | ✅ Excellent |
| Uptime | 99.9% | >99% | ✅ Excellent |
| Error Rate | 0% | <1% | ✅ Perfect |
| Cold Start Prevention | 99.9% | >95% | ✅ Effective |

## Deployment Issues

### Issue: Build Failure

**Symptoms:**
- Deploy fails during build phase
- Build logs show error messages
- Service doesn't start

**Common Causes:**
1. Missing or incompatible dependencies
2. Incorrect build commands
3. Environment variable issues
4. Memory/resource constraints

**Diagnostic Steps:**
1. Check Render build logs
2. Verify `render.yaml` configuration
3. Check `package.json` and `requirements.txt`
4. Validate environment variables

**Resolution:**

```bash
# Check local build
cd src/frontend
npm install
npm run build

cd ../backend
pip install -r requirements.txt
```

**Fix Strategies:**
- Update dependencies to compatible versions
- Fix build command syntax in `render.yaml`
- Ensure all required environment variables are set
- Optimize build process to reduce memory usage

### Issue: Start Command Failure

**Symptoms:**
- Build succeeds but service won't start
- "Start command failed" in logs
- Service shows "Deploy failed" status

**Common Causes:**
1. Incorrect start command
2. Missing Python/Node.js version
3. Port binding issues
4. Missing environment variables

**Diagnostic Steps:**
```bash
# Test start command locally
cd src/backend
python serve_bulletproof.py

# Check port binding
netstat -tlnp | grep :5000
```

**Resolution:**
1. Verify start command in `render.yaml`
2. Ensure Python version is specified
3. Check that server binds to `0.0.0.0`, not `127.0.0.1`
4. Validate all required environment variables

### Issue: Service Won't Stay Running

**Symptoms:**
- Service starts but crashes immediately
- Repeated restart attempts
- Memory or CPU limit exceeded

**Common Causes:**
1. Unhandled exceptions in code
2. Memory leaks
3. Database connection issues
4. Missing critical configuration

**Diagnostic Steps:**
1. Check service logs for error messages
2. Monitor resource usage in Render dashboard
3. Test database connectivity
4. Validate environment configuration

**Resolution:**
```python
# Add proper error handling
try:
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
except Exception as e:
    logger.error(f"Failed to start server: {e}")
    sys.exit(1)
```

## Runtime Issues

### Issue: 500 Internal Server Error

**Symptoms:**
- API endpoints return 500 errors
- "Internal Server Error" messages
- Error tracking shows exceptions

**Common Causes:**
1. Unhandled exceptions in code
2. Database connection failures
3. Missing dependencies
4. Configuration errors

**Diagnostic Steps:**
```bash
# Check specific endpoint
curl -v https://war-room-oa9t.onrender.com/api/v1/analytics/dashboard

# Check error logs
# View in Render dashboard or via logs API
```

**Resolution:**
1. Check Sentry error tracking for specific errors
2. Review server logs for stack traces
3. Test database connectivity
4. Validate API endpoint logic

### Issue: Service Timeout

**Symptoms:**
- Requests timeout after 30 seconds
- "Gateway timeout" errors
- Slow response times

**Common Causes:**
1. Slow database queries
2. External API delays
3. Inefficient code execution
4. Memory/CPU constraints

**Diagnostic Steps:**
```python
# Add request timing
import time
start_time = time.time()
# ... your code ...
print(f"Request took {time.time() - start_time:.2f} seconds")
```

**Resolution:**
1. Optimize database queries
2. Add request timeouts for external APIs
3. Implement caching for slow operations
4. Upgrade to higher resource tier

### Issue: Memory Limit Exceeded

**Symptoms:**
- Service crashes with memory errors
- "Out of memory" messages
- Performance degradation

**Common Causes:**
1. Memory leaks in application code
2. Large data processing without optimization
3. Inefficient caching strategies
4. Too many concurrent connections

**Diagnostic Steps:**
```python
# Monitor memory usage
import psutil
import os

process = psutil.Process(os.getpid())
print(f"Memory usage: {process.memory_info().rss / 1024 / 1024:.2f} MB")
```

**Resolution:**
1. Profile application memory usage
2. Implement pagination for large datasets
3. Optimize caching strategies
4. Close database connections properly
5. Upgrade to paid plan with more memory

## Database Issues

### Issue: Database Connection Failed

**Symptoms:**
- "Database connection failed" errors
- API endpoints returning database errors
- Health check showing database as disconnected

**Common Causes:**
1. Incorrect connection string
2. Database server unavailable
3. Connection pool exhausted
4. Network connectivity issues

**Diagnostic Steps:**
```python
# Test database connection
import asyncpg
import asyncio

async def test_connection():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        result = await conn.fetchval("SELECT 1")
        await conn.close()
        print(f"Database connection successful: {result}")
    except Exception as e:
        print(f"Database connection failed: {e}")

asyncio.run(test_connection())
```

**Resolution:**
1. Verify `DATABASE_URL` environment variable
2. Check Supabase service status
3. Test connection from external tool
4. Adjust connection pool settings

### Issue: Slow Database Queries

**Symptoms:**
- API responses taking > 2 seconds
- Database timeout errors
- High CPU usage on database

**Common Causes:**
1. Missing database indexes
2. Inefficient query patterns
3. Large table scans
4. Connection pool contention

**Diagnostic Steps:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check missing indexes
EXPLAIN ANALYZE SELECT * FROM campaigns WHERE status = 'active';
```

**Resolution:**
1. Add appropriate database indexes
2. Optimize query patterns
3. Implement query result caching
4. Use database query analysis tools

### Issue: Database Migration Failure

**Symptoms:**
- Migration scripts fail to execute
- Schema version mismatches
- Data integrity errors

**Common Causes:**
1. Incompatible schema changes
2. Missing migration dependencies
3. Data conflicts during migration
4. Insufficient permissions

**Diagnostic Steps:**
```bash
# Check migration status
cd src/backend
alembic current
alembic history --verbose
```

**Resolution:**
```bash
# Run migrations manually
alembic upgrade head

# If migration fails, rollback and fix
alembic downgrade -1
# Fix migration script
alembic upgrade head
```

## Authentication Issues

### Issue: JWT Token Invalid

**Symptoms:**
- "Invalid token" errors
- Users being logged out unexpectedly
- Authentication API returning 401 errors

**Common Causes:**
1. Token expiration
2. Invalid JWT secret
3. Token format issues
4. Clock synchronization problems

**Diagnostic Steps:**
```python
# Decode JWT token manually
import jwt
token = "your_jwt_token_here"
try:
    payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    print(f"Token payload: {payload}")
except jwt.ExpiredSignatureError:
    print("Token has expired")
except jwt.InvalidTokenError as e:
    print(f"Invalid token: {e}")
```

**Resolution:**
1. Check JWT secret configuration
2. Verify token expiration settings
3. Implement token refresh logic
4. Ensure server time synchronization

### Issue: Supabase Authentication Failure

**Symptoms:**
- Login/registration not working
- Supabase connection errors
- Authentication UI showing errors

**Common Causes:**
1. Incorrect Supabase configuration
2. Invalid API keys
3. CORS configuration issues
4. Supabase service outage

**Diagnostic Steps:**
```javascript
// Test Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Test authentication
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password'
})

if (error) {
  console.error('Supabase auth error:', error)
} else {
  console.log('Supabase auth success:', data)
}
```

**Resolution:**
1. Verify Supabase URL and keys
2. Check Supabase project settings
3. Update CORS configuration
4. Test with Supabase dashboard

### Issue: Session Management Problems

**Symptoms:**
- Users logged out after page refresh
- Session not persisting across browser tabs
- Cookie issues

**Common Causes:**
1. Cookie configuration issues
2. Session storage problems
3. HTTPS/HTTP mismatches
4. Cross-origin cookie issues

**Resolution:**
```javascript
// Configure secure cookies
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
```

## API Issues

### Issue: CORS Errors

**Symptoms:**
- "CORS policy" errors in browser console
- API requests blocked by browser
- Cross-origin request failures

**Common Causes:**
1. Missing CORS headers
2. Incorrect origin configuration
3. Preflight request failures
4. Credential handling issues

**Diagnostic Steps:**
```bash
# Test CORS headers
curl -H "Origin: https://war-room-oa9t.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://war-room-oa9t.onrender.com/api/v1/auth/login
```

**Resolution:**
```python
# Configure CORS properly
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://war-room-oa9t.onrender.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

### Issue: Rate Limiting Errors

**Symptoms:**
- 429 "Too Many Requests" errors
- Rate limit exceeded messages
- API calls being blocked

**Common Causes:**
1. Aggressive request patterns
2. Incorrect rate limit configuration
3. Shared IP addresses
4. Bot/automated traffic

**Diagnostic Steps:**
```bash
# Check rate limit headers
curl -I https://war-room-oa9t.onrender.com/api/v1/analytics/dashboard

# Look for:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 95
# X-RateLimit-Reset: 1625097600
```

**Resolution:**
1. Implement exponential backoff in client code
2. Adjust rate limiting configuration
3. Use API keys for higher limits
4. Implement request queuing

### Issue: API Response Validation Errors

**Symptoms:**
- 422 "Unprocessable Entity" errors
- Validation error messages
- Request body rejection

**Common Causes:**
1. Invalid request format
2. Missing required fields
3. Data type mismatches
4. Schema validation failures

**Diagnostic Steps:**
```python
# Test API endpoint manually
import requests
import json

response = requests.post(
    'https://war-room-oa9t.onrender.com/api/v1/campaigns',
    headers={'Content-Type': 'application/json'},
    data=json.dumps({
        'name': 'Test Campaign',
        'platform': 'email'
    })
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
```

**Resolution:**
1. Validate request format against API documentation
2. Check required field presence
3. Verify data types match schema
4. Review Pydantic model definitions

## Frontend Issues

### Issue: Duplicate Frontend Structures (RESOLVED)

**Symptoms:**
- Build failures with module resolution errors
- Import path conflicts
- Deployment confusion with multiple integration folders
- Components not appearing despite being present

**Background:**
Previously, the War Room frontend had duplicate integration structures that caused:
- Multiple `integrations/` directories in different locations
- Conflicting import paths
- Build system confusion during deployment
- Inconsistent component exports

**Root Cause:**
The frontend codebase had evolved to have duplicate folder structures:
```
src/
├── components/integrations/  # Original location
├── services/integrations/    # Duplicate location
└── lib/integrations/         # Another duplicate
```

**Resolution Applied:**
1. **Consolidated Integration Structure**: 
   - Moved all integration components to single location: `src/components/integrations/`
   - Updated all import paths throughout the codebase
   - Created unified index files for proper exports

2. **Fixed Import Paths**:
   ```typescript
   // OLD (multiple conflicting paths):
   import { MetaAds } from '../../../services/integrations/MetaAds'
   import { GoogleAds } from '../../components/integrations/GoogleAds'
   
   // NEW (unified path):
   import { MetaAds, GoogleAds } from '../components/integrations'
   ```

3. **Updated Build Configuration**:
   - Verified Vite build resolves paths correctly
   - Ensured no circular dependencies
   - Cleaned up unused duplicate files

**Prevention:**
- Use the DEPLOYMENT_CHECKLIST.md frontend verification steps
- Check for duplicate folders before any deployment
- Maintain centralized component organization
- Regular code structure audits

### Issue: Page Not Loading

**Symptoms:**
- White screen or blank page
- "Page not found" errors
- JavaScript console errors

**Common Causes:**
1. Build process failures
2. Asset loading issues
3. Route configuration problems
4. JavaScript errors
5. Import path conflicts from duplicated structures (now resolved)

**Diagnostic Steps:**
```bash
# Check build output
cd src/frontend
npm run build
ls -la dist/

# Test local build
npm run preview
```

**Resolution:**
1. Rebuild frontend with error checking
2. Verify asset paths and CDN configuration
3. Check React Router configuration
4. Fix JavaScript compilation errors

### Issue: API Integration Failures

**Symptoms:**
- Frontend can't connect to backend
- API calls returning CORS errors
- Authentication not working from frontend

**Common Causes:**
1. Incorrect API base URL
2. CORS configuration issues
3. Authentication token problems
4. Network connectivity issues

**Diagnostic Steps:**
```javascript
// Test API connection from browser console
fetch('https://war-room-oa9t.onrender.com/api/v1/health')
  .then(response => response.json())
  .then(data => console.log('API health:', data))
  .catch(error => console.error('API error:', error))
```

**Resolution:**
1. Verify `REACT_APP_API_BASE_URL` configuration
2. Fix CORS settings on backend
3. Check authentication token handling
4. Test API endpoints independently

### Issue: WebSocket Connection Failures

**Symptoms:**
- Real-time features not working
- WebSocket connection errors
- "Connection failed" messages

**Common Causes:**
1. WebSocket endpoint not accessible
2. Protocol mismatch (ws vs wss)
3. Authentication issues
4. Firewall/proxy blocking

**Diagnostic Steps:**
```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://war-room-oa9t.onrender.com/ws')

ws.onopen = () => console.log('WebSocket connected')
ws.onerror = (error) => console.error('WebSocket error:', error)
ws.onclose = (event) => console.log('WebSocket closed:', event)
```

**Resolution:**
1. Verify WebSocket endpoint configuration
2. Use WSS for HTTPS sites
3. Implement authentication for WebSocket
4. Add reconnection logic

## Performance Issues

### Issue: Slow Page Load Times

**Symptoms:**
- Pages taking > 3 seconds to load
- Large bundle sizes
- Slow first contentful paint

**Common Causes:**
1. Large JavaScript bundles
2. Unoptimized images/assets
3. Blocking render resources
4. Inefficient code patterns

**Diagnostic Steps:**
```bash
# Analyze bundle size
cd src/frontend
npm run build
npx webpack-bundle-analyzer dist/static/js/*.js
```

**Resolution:**
1. Implement code splitting
2. Optimize and compress images
3. Use lazy loading for components
4. Minimize CSS and JavaScript

### Issue: High Memory Usage

**Symptoms:**
- Browser tabs consuming excessive memory
- Performance degradation over time
- Memory leak warnings

**Common Causes:**
1. Memory leaks in React components
2. Event listeners not cleaned up
3. Large data structures in state
4. Inefficient re-rendering

**Diagnostic Steps:**
```javascript
// Monitor memory usage
if (performance.memory) {
  console.log('Used JSHeapSize:', performance.memory.usedJSHeapSize);
  console.log('Total JSHeapSize:', performance.memory.totalJSHeapSize);
}
```

**Resolution:**
1. Add cleanup in useEffect hooks
2. Remove event listeners on unmount
3. Optimize state management
4. Use React.memo for expensive components

### Issue: Database Query Performance

**Symptoms:**
- API responses taking > 2 seconds
- Database connection timeouts
- High database CPU usage

**Common Causes:**
1. Missing indexes
2. N+1 query problems
3. Large result sets
4. Inefficient joins

**Resolution:**
```sql
-- Add indexes for commonly queried columns
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(recorded_at);

-- Optimize queries
EXPLAIN ANALYZE SELECT * FROM campaigns 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 20;
```

## External Integration Issues

### Issue: Meta Business API Failures

**Symptoms:**
- Meta API calls returning errors
- Campaign data not syncing
- Authentication failures

**Common Causes:**
1. Invalid access tokens
2. Expired API credentials
3. API rate limits exceeded
4. Permission issues

**Diagnostic Steps:**
```bash
# Test Meta API connection
curl -X GET \
  "https://graph.facebook.com/v19.0/me/adaccounts?access_token=YOUR_TOKEN"
```

**Resolution:**
1. Refresh access tokens
2. Verify API permissions
3. Implement retry logic with exponential backoff
4. Monitor rate limit usage

### Issue: Google Ads API Problems

**Symptoms:**
- Google Ads data not loading
- OAuth authentication failures
- API quota exceeded errors

**Common Causes:**
1. OAuth token expiration
2. Invalid developer token
3. API quota limits
4. Account access issues

**Diagnostic Steps:**
```python
# Test Google Ads API
from google.ads.googleads.client import GoogleAdsClient

client = GoogleAdsClient.load_from_storage("google-ads.yaml")
customer_service = client.get_service("CustomerService")

try:
    customer = customer_service.get_customer(
        resource_name="customers/YOUR_CUSTOMER_ID"
    )
    print(f"Customer: {customer.descriptive_name}")
except Exception as e:
    print(f"Google Ads API error: {e}")
```

**Resolution:**
1. Refresh OAuth tokens
2. Verify developer token validity
3. Check API quota limits
4. Review account permissions

### Issue: Email/SMS Service Failures

**Symptoms:**
- Emails/SMS not being sent
- Delivery failures
- Service integration errors

**Common Causes:**
1. Invalid API credentials
2. Service outages
3. Rate limiting
4. Content policy violations

**Resolution:**
1. Verify service credentials
2. Check service status pages
3. Implement retry mechanisms
4. Review content for policy compliance

## Monitoring & Alerting Issues

### Issue: Sentry Not Reporting Errors

**Symptoms:**
- No error reports in Sentry
- Missing error tracking data
- Silent failures

**Common Causes:**
1. Invalid Sentry DSN
2. Incorrect configuration
3. Network connectivity issues
4. Error filtering too aggressive

**Diagnostic Steps:**
```javascript
// Test Sentry configuration
import * as Sentry from '@sentry/react'

Sentry.captureMessage('Test message', 'info')
Sentry.captureException(new Error('Test error'))
```

**Resolution:**
1. Verify Sentry DSN configuration
2. Check Sentry project settings
3. Adjust error filtering rules
4. Test error capture manually

### Issue: PostHog Analytics Not Working

**Symptoms:**
- No analytics data in PostHog
- Events not being tracked
- User behavior not recorded

**Common Causes:**
1. Invalid PostHog API key
2. Incorrect configuration
3. Ad blockers interfering
4. Network connectivity issues

**Diagnostic Steps:**
```javascript
// Test PostHog tracking
import posthog from 'posthog-js'

posthog.capture('test_event', {
  property: 'test_value'
})

console.log('PostHog configured:', posthog.__loaded)
```

**Resolution:**
1. Verify PostHog API key
2. Check PostHog project configuration
3. Test with ad blockers disabled
4. Implement server-side tracking as fallback

## Sub-Agent Issues

### Issue: Sub-Agents Not Running

**Symptoms:**
- Automated tasks not executing
- Agent status showing as inactive
- No agent output or logs

**Common Causes:**
1. Agent configuration errors
2. Missing dependencies
3. Permission issues
4. Resource constraints

**Diagnostic Steps:**
```bash
# Check agent status
cd agents
python -m agents.health_monitor --status

# Test individual agent
python -m agents.documentation_agent --test
```

**Resolution:**
1. Verify agent configuration files
2. Install missing dependencies
3. Check file permissions
4. Allocate sufficient resources

### Issue: Agent Communication Failures

**Symptoms:**
- Agents not coordinating properly
- Message queue errors
- Lost agent communications

**Common Causes:**
1. Message queue configuration issues
2. Network connectivity problems
3. Authentication failures
4. Message format errors

**Resolution:**
```python
# Test agent communication
from agents.base_agent import BaseAgent

agent = BaseAgent()
try:
    agent.send_message("test_message")
    print("Agent communication successful")
except Exception as e:
    print(f"Agent communication failed: {e}")
```

## Emergency Procedures

### Service Outage Response

**Immediate Actions (0-15 minutes):**
1. Confirm service status via health checks
2. Check Render dashboard for service status
3. Review recent deployments and changes
4. Check external service status (Supabase, Redis)

**Investigation Phase (15-30 minutes):**
1. Review error logs and metrics
2. Check resource usage and limits
3. Verify database connectivity
4. Test key functionality manually

**Resolution Phase (30-60 minutes):**
1. Implement immediate fixes if identified
2. Rollback to previous version if necessary
3. Scale resources if needed
4. Restore service functionality

**Communication:**
1. Update status page
2. Notify stakeholders
3. Provide regular updates
4. Document incident details

### Data Loss Prevention

**Immediate Actions:**
1. Stop all write operations
2. Create emergency backup
3. Assess scope of potential data loss
4. Implement recovery procedures

**Recovery Steps:**
1. Restore from most recent backup
2. Verify data integrity
3. Test critical functionality
4. Resume normal operations

### Security Incident Response

**Immediate Actions:**
1. Isolate affected systems
2. Change all relevant credentials
3. Review access logs
4. Implement emergency security measures

**Investigation:**
1. Analyze attack vectors
2. Assess data exposure
3. Document security timeline
4. Implement additional security measures

## FAQ - Frequently Asked Questions

### Q: Service is running but returns 404 for all routes
**A:** Check that the static file serving is configured correctly and the frontend build output is in the correct location.

### Q: Database connection works locally but fails in production
**A:** Verify the production DATABASE_URL format and ensure it includes SSL parameters if required by Supabase.

### Q: WebSocket connections fail with CORS errors
**A:** Ensure WebSocket endpoints are included in CORS configuration and use WSS protocol for HTTPS sites.

### Q: Build succeeds but service won't start
**A:** Check that the start command is correct and the server binds to 0.0.0.0 with the PORT environment variable.

### Q: API calls are slow (>5 seconds)
**A:** Check database query performance, implement caching, and verify external API response times.

### Q: Users are logged out frequently
**A:** Review JWT token expiration settings and implement proper token refresh logic.

### Q: Real-time features stop working after some time
**A:** Implement WebSocket reconnection logic and check for connection timeout issues.

### Q: Sub-agents are not executing tasks
**A:** Verify agent configuration, check resource allocation, and ensure message queue is operational.

## Support Contacts

### Technical Support
- **Primary**: Development Team Lead
- **Email**: tech-support@warroom.com
- **Response Time**: 2-4 hours (business hours)

### Infrastructure Support
- **Primary**: DevOps Engineer
- **Email**: infrastructure@warroom.com
- **Response Time**: 1-2 hours (critical issues)

### Emergency Contact
- **24/7 Hotline**: +1-XXX-XXX-XXXX
- **Email**: emergency@warroom.com
- **Response Time**: 15 minutes (critical outages)

---

*Troubleshooting Guide v1.0 | Last Updated: August 2025 | For War Room Platform*