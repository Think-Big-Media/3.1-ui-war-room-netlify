# Timeout Configuration and Security Improvements Guide

This guide documents the comprehensive timeout hierarchy and security improvements implemented in the War Room application.

## Table of Contents
1. [Timeout Hierarchy](#timeout-hierarchy)
2. [Security Improvements](#security-improvements)
3. [Implementation Details](#implementation-details)
4. [Monitoring and Diagnostics](#monitoring-and-diagnostics)
5. [Best Practices](#best-practices)

## Timeout Hierarchy

The application implements a sophisticated timeout hierarchy that ensures optimal performance and user experience:

### Client-Side Timeouts

Location: `/src/frontend/src/config/timeouts.ts`

```typescript
TIMEOUT_CONFIG = {
  DEFAULT: 30000,  // 30 seconds - standard timeout for most requests
  
  FAST: {
    HEALTH: 5000,      // 5s - health checks
    AUTH: 10000,       // 10s - authentication operations
    USER_INFO: 10000,  // 10s - user profile fetches
  },
  
  STANDARD: {
    CAMPAIGNS: 20000,  // 20s - campaign data
    EVENTS: 20000,     // 20s - event operations
    VOLUNTEERS: 20000, // 20s - volunteer management
    ANALYTICS: 25000,  // 25s - analytics queries
    DASHBOARD: 25000,  // 25s - dashboard data aggregation
  },
  
  SLOW: {
    REPORTS: 60000,        // 60s - report generation
    EXPORTS: 60000,        // 60s - data exports
    FILE_UPLOAD: 120000,   // 120s - file uploads
    DOCUMENT_ANALYSIS: 90000, // 90s - AI document processing
  },
  
  EXTERNAL: {
    META_API: 45000,    // 45s - Meta/Facebook API calls
    GOOGLE_API: 45000,  // 45s - Google Ads API calls
    OPENAI_API: 60000,  // 60s - OpenAI API calls
    PINECONE_API: 30000, // 30s - Pinecone vector operations
  }
}
```

### Server-Side Timeouts

Location: `/src/backend/middleware/timeout_middleware.py`

The server enforces matching timeouts to prevent resource exhaustion:

- **Automatic Path Matching**: Server automatically applies appropriate timeout based on endpoint path
- **504 Gateway Timeout**: Returns proper HTTP status code when timeout is exceeded
- **Request Tracking**: All requests are tracked with duration and timeout statistics
- **Performance Headers**: Adds `X-Request-Duration` and `X-Timeout-Limit` headers

### Timeout Flow

1. **Client Request**: Axios client sets timeout based on endpoint type
2. **Server Processing**: FastAPI middleware enforces server-side timeout
3. **Timeout Handling**: 
   - Client: Retry with exponential backoff (max 3 attempts)
   - Server: Returns 504 with detailed error information
4. **Fallback**: Client falls back to mock data for critical operations

## Security Improvements

### 1. Cookie-Based Authentication

Replaced vulnerable localStorage with httpOnly cookies:

**Before (Vulnerable):**
```javascript
localStorage.setItem('access_token', token);
```

**After (Secure):**
```python
response.set_cookie(
    key="auth_token",
    value=access_token,
    max_age=7200,  # 2 hours
    secure=True,    # HTTPS only
    httponly=True,  # Not accessible via JavaScript
    samesite="lax", # CSRF protection
    path="/"
)
```

### 2. CSRF Protection

All state-changing requests now include CSRF tokens:

```typescript
// Client automatically adds CSRF token
if (['post', 'put', 'patch', 'delete'].includes(method)) {
  headers['X-CSRF-Token'] = getCsrfToken();
}
```

### 3. Rate Limiting

Comprehensive rate limiting with multiple strategies:

```python
RateLimitConfig = {
    "DEFAULT": "100/minute",     # Standard endpoints
    "AUTH": "10/minute",          # Authentication endpoints
    "STRICT": "20/minute",        # Sensitive operations
    "API_KEYS": "1000/hour",      # API key authenticated requests
    "UPLOADS": "10/hour",         # File uploads
    "EXPORTS": "20/hour",         # Data exports
    "REPORTS": "5/hour",          # Report generation
}
```

Features:
- **Sliding Window**: Smooth rate limiting without bursts
- **Per-IP Tracking**: Individual client limits
- **Redis Backend**: Distributed rate limiting across servers
- **429 Status Code**: Proper HTTP status with Retry-After header

### 4. Request Validation

Enhanced input validation and sanitization:

- **Pydantic Models**: Type-safe request/response validation
- **SQL Injection Prevention**: Parameterized queries via SQLAlchemy
- **XSS Protection**: Automatic HTML escaping in React
- **File Upload Validation**: Type, size, and content checks

## Implementation Details

### Enhanced API Client

Location: `/src/frontend/src/lib/apiWithTimeouts.ts`

Features:
- Automatic timeout configuration by endpoint
- CSRF token handling
- Retry logic with exponential backoff
- Performance monitoring integration
- 401/429 error handling

### Timeout Middleware

Location: `/src/backend/middleware/timeout_middleware.py`

Features:
- Request duration tracking
- Timeout enforcement
- Statistics collection
- Performance headers
- WebSocket bypass

### Fallback Service

Location: `/src/frontend/src/services/fallbackService.ts`

Provides resilience when APIs fail:
- Mock data generation for critical features
- Automatic fallback on network errors
- Configurable fallback behavior
- Performance impact < 200ms

## Monitoring and Diagnostics

### API Endpoints

Monitor timeout behavior via these endpoints:

```bash
# Get timeout statistics
GET /api/v1/timeout/timeout-stats

# Get slow endpoints
GET /api/v1/timeout/slow-endpoints?threshold=10

# Get timeout configuration
GET /api/v1/timeout/timeout-config

# Test timeout behavior
POST /api/v1/timeout/test-timeout/{duration}
```

### Performance Monitoring

JavaScript console utilities:

```javascript
// Get performance report
performanceUtils.logPerformanceReport();

// Get slow endpoints
performanceUtils.getSlowEndpoints();

// Get specific endpoint stats
performanceUtils.getEndpointStats('/api/v1/analytics');
```

### Timeout Headers

All responses include performance headers:

```
X-Request-Duration: 1.234
X-Timeout-Limit: 30
X-Timeout-Error: true (only on timeout)
```

## Best Practices

### 1. Choosing Timeout Values

- **Fast Operations**: 5-10 seconds (auth, health checks)
- **Standard Queries**: 20-25 seconds (data fetching)
- **Heavy Operations**: 60-120 seconds (reports, uploads)
- **External APIs**: 45-60 seconds (third-party services)

### 2. Handling Timeouts

```typescript
try {
  const data = await apiWithTimeouts.get('/api/data');
} catch (error) {
  if (error instanceof TimeoutError) {
    // Use fallback data
    const fallbackData = await fallbackService.getData();
    // Notify user of degraded experience
  }
}
```

### 3. Optimizing Slow Endpoints

1. Check timeout statistics regularly
2. Identify endpoints exceeding 80% of timeout
3. Optimize queries, add caching, or increase timeout
4. Monitor after changes

### 4. Security Checklist

- [ ] All tokens in httpOnly cookies
- [ ] CSRF tokens on state-changing requests
- [ ] Rate limiting configured appropriately
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Timeouts prevent resource exhaustion
- [ ] Monitoring alerts for suspicious activity

## Migration Notes

### Moving from localStorage to Cookies

The system automatically migrates tokens:

```typescript
// Automatic migration on app load
migrateFromLocalStorage();
```

Users may need to re-authenticate after deployment.

### Updating API Calls

Old pattern:
```typescript
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

New pattern:
```typescript
// Automatic - cookies sent with withCredentials: true
const response = await secureApi.get('/data');
```

## Troubleshooting

### Common Issues

1. **CSRF Token Errors**
   - Clear cookies and re-login
   - Ensure CSRF token middleware is enabled

2. **Timeout Errors**
   - Check if endpoint is in slow category
   - Verify server processing time
   - Consider implementing pagination

3. **Rate Limiting**
   - Check rate limit headers in response
   - Implement client-side throttling
   - Use caching to reduce requests

### Debug Mode

Enable debug logging:

```javascript
// Client
localStorage.setItem('DEBUG', 'api:*');

// Server
LOG_LEVEL=DEBUG
```

## Future Improvements

1. **Dynamic Timeout Adjustment**: Automatically adjust timeouts based on historical performance
2. **Circuit Breaker Pattern**: Temporarily disable failing endpoints
3. **Request Priority**: Priority queue for critical operations
4. **Timeout Budgets**: Total timeout budget for complex operations
5. **WebSocket Fallback**: Real-time updates via polling when WebSocket fails