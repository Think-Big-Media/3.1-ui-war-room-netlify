# Sentry Setup Guide for War Room Analytics

## Overview

Sentry provides comprehensive error tracking, performance monitoring, and application monitoring for War Room Analytics. This guide covers the complete setup process for both frontend and backend monitoring.

## Prerequisites

- War Room deployment ready for external service configuration
- Access to Sentry.io account (create free account if needed)
- Access to your Render.com dashboard for environment variable configuration

## Step 1: Create Sentry Projects

### 1. Sign up/Login to Sentry

- Go to [https://sentry.io](https://sentry.io)
- Sign up for a free account or login to existing account
- Sentry offers generous free tier: 5K errors/month

### 2. Create Organization

1. After login, create or join an organization
2. Organization name: `War Room Analytics` or your company name
3. Choose plan: Start with Developer (free) plan

### 3. Create Projects

You'll need separate projects for frontend and backend:

#### Frontend Project (React/JavaScript)
1. Click "Create Project"
2. Platform: **React**
3. Project name: `war-room-frontend`
4. Team: Default team
5. Click "Create Project"

#### Backend Project (Python/FastAPI)
1. Click "Create Project"  
2. Platform: **Python**
3. Project name: `war-room-backend`
4. Team: Default team
5. Click "Create Project"

## Step 2: Get Your Sentry Configuration

### For Each Project Created

1. **Copy the DSN**
   - After creating each project, you'll see the DSN
   - Format: `https://abc123def456@sentry.io/1234567`
   - You need both frontend and backend DSNs

2. **Create Auth Tokens** (for advanced features)
   - Go to Settings → Account → API
   - Create new token with `project:read` scope
   - Save token for programmatic access

## Step 3: Configure Environment Variables

### For Render.com Production Deployment

1. **Go to Render Dashboard**
   - Navigate to your War Room service
   - Click "Environment" tab

2. **Add Required Variables**
   ```bash
   # Sentry Configuration
   SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   SENTRY_TRACES_SAMPLE_RATE=0.1    # 10% of transactions
   SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% for profiling
   
   # Frontend Sentry (if needed separately)
   VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
   VITE_SENTRY_ENVIRONMENT=production
   ```

3. **Save and Redeploy**
   - Click "Save" to update environment variables
   - Your service will automatically redeploy

### For Local Development

1. **Update Your .env File**
   ```bash
   # Add to your .env file
   SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=development
   SENTRY_TRACES_SAMPLE_RATE=1.0    # 100% for development
   SENTRY_PROFILES_SAMPLE_RATE=1.0  # 100% for development
   
   VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
   VITE_SENTRY_ENVIRONMENT=development
   ```

## Step 4: Configure Backend Error Tracking (FastAPI/Python)

### 1. Install Sentry SDK

The Sentry SDK should already be in your requirements.txt. If not:
```bash
pip install sentry-sdk[fastapi]
```

### 2. Initialize Sentry in Your Backend

Check if this is already configured in `src/backend/core/sentry.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlAlchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import os

def init_sentry():
    """Initialize Sentry for error tracking and performance monitoring."""
    sentry_dsn = os.environ.get("SENTRY_DSN")
    
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
            
            # Performance monitoring
            traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            profiles_sample_rate=float(os.environ.get("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
            
            # Integrations
            integrations=[
                FastApiIntegration(auto_enabling_integrations=True),
                SqlAlchemyIntegration(),
                LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)
            ],
            
            # Additional options
            attach_stacktrace=True,
            send_default_pii=False,  # Don't send personally identifiable info
            max_breadcrumbs=50,
            
            # Custom release tracking
            release=os.environ.get("APP_VERSION", "1.0.0"),
        )
        
        print(f"✅ Sentry initialized for {os.environ.get('SENTRY_ENVIRONMENT', 'production')}")
    else:
        print("⚠️ Sentry DSN not configured - error tracking disabled")
```

### 3. Add to Your FastAPI App

In your main application file (serve_bulletproof.py):

```python
from core.sentry import init_sentry

# Initialize Sentry before creating FastAPI app
init_sentry()

# Your existing FastAPI app code...
app = FastAPI(...)
```

## Step 5: Configure Frontend Error Tracking (React)

### 1. Install Sentry SDK

The Sentry SDK should be in package.json. If not:
```bash
npm install @sentry/react @sentry/tracing
```

### 2. Initialize Sentry in Frontend

Check if this is configured in `src/main.tsx` or create configuration:

```typescript
import * as Sentry from "@sentry/react";

// Initialize Sentry before React app
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || "production",
  
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Additional options
  attachStacktrace: true,
  autoSessionTracking: true,
  
  // Privacy settings
  beforeSend(event) {
    // Filter out sensitive information
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('password') || error?.value?.includes('token')) {
        return null; // Don't send sensitive errors
      }
    }
    return event;
  },
  
  // Performance tracking
  integrations: [
    new Sentry.BrowserTracing({
      // Track specific routes
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
});
```

### 3. Add Error Boundary

Wrap your React app with Sentry's error boundary:

```typescript
import * as Sentry from "@sentry/react";

const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <button onClick={resetError}>Try again</button>
    </div>
  ),
});

ReactDOM.render(<SentryErrorBoundary />, document.getElementById('root'));
```

## Step 6: Configure Performance Monitoring

### 1. Backend Performance

Add custom performance tracking:

```python
import sentry_sdk

# Track database queries
with sentry_sdk.start_transaction(name="database_query", op="db"):
    result = await database.fetch_analytics_data()

# Track API endpoints
@app.get("/api/v1/analytics")
async def get_analytics():
    with sentry_sdk.start_transaction(name="get_analytics", op="http"):
        # Your API logic here
        pass
```

### 2. Frontend Performance

Add custom performance tracking:

```typescript
import * as Sentry from "@sentry/react";

// Track component performance
const AnalyticsDashboard = Sentry.withProfiler(React.memo(() => {
  // Your component logic
}));

// Track custom operations
const transaction = Sentry.startTransaction({
  name: "data_export",
  op: "user_action"
});

try {
  await exportData();
  transaction.setStatus("ok");
} catch (error) {
  transaction.setStatus("internal_error");
  throw error;
} finally {
  transaction.finish();
}
```

## Step 7: Configure Alerts and Notifications

### 1. Set Up Alert Rules

1. **Go to Alerts → Create Alert Rule**
2. **Configure conditions:**
   ```
   Error Rate Alert:
   - Condition: Error rate > 5% in 5 minutes
   - Environment: production
   - Action: Email + Slack notification
   
   Performance Alert:
   - Condition: Average response time > 2 seconds
   - Environment: production
   - Action: Email notification
   ```

### 2. Configure Integrations

1. **Slack Integration**
   - Go to Settings → Integrations
   - Add Slack integration
   - Configure channel: `#alerts` or `#war-room-errors`

2. **Email Notifications**
   - Go to Settings → Account → Notifications
   - Configure email preferences
   - Set up team notifications

## Step 8: Configure Release Tracking

### 1. Automated Release Tracking

Add to your CI/CD pipeline or deployment script:

```bash
# Install Sentry CLI
curl -sL https://sentry.io/get-cli/ | bash

# Create release
sentry-cli releases new "war-room@$VERSION"

# Upload source maps (for frontend)
sentry-cli releases files "war-room@$VERSION" upload-sourcemaps ./dist

# Finalize release
sentry-cli releases finalize "war-room@$VERSION"
```

### 2. Environment Variables for Releases

Add to render.yaml:
```yaml
- key: SENTRY_RELEASE
  value: "war-room@1.0.0"
- key: SENTRY_AUTH_TOKEN
  sync: false  # Add manually in Render dashboard
```

## Step 9: Test Integration

### 1. Test Error Capturing

#### Backend Test
```python
# Add test endpoint to trigger error
@app.get("/api/v1/test-error")
async def test_error():
    raise Exception("Test error for Sentry integration")
```

#### Frontend Test
```typescript
// Add test button to trigger error
const testError = () => {
  throw new Error("Test error for Sentry integration");
};
```

### 2. Verify in Sentry Dashboard

1. Trigger test errors
2. Check Sentry Issues dashboard
3. Verify errors appear with correct:
   - Stack traces
   - Environment tags
   - User context (if available)
   - Performance data

## Step 10: Production Optimization

### 1. Configure Sampling Rates

For production, optimize sampling to control costs:

```python
# Backend - Lower sampling in production
SENTRY_TRACES_SAMPLE_RATE=0.01  # 1% of transactions
SENTRY_PROFILES_SAMPLE_RATE=0.01  # 1% for profiling
```

```typescript
// Frontend - Lower sampling in production
tracesSampleRate: 0.1, // 10% of transactions
```

### 2. Filter Sensitive Data

```python
# Backend - Custom before_send
def before_send(event, hint):
    # Remove sensitive data
    if 'user' in event and 'email' in event['user']:
        event['user']['email'] = '[Filtered]'
    
    # Filter out noisy errors
    if event.get('logger') == 'django.security.DisallowedHost':
        return None
    
    return event

sentry_sdk.init(
    dsn=sentry_dsn,
    before_send=before_send
)
```

### 3. Set Up Health Checks

Monitor Sentry integration health:

```python
@app.get("/health/sentry")
async def sentry_health():
    try:
        # Test Sentry connectivity
        sentry_sdk.capture_message("Health check", level="info")
        return {"sentry": "ok"}
    except Exception as e:
        return {"sentry": "error", "message": str(e)}
```

## Step 11: Team Setup and Permissions

### 1. Invite Team Members

1. Go to Settings → Teams
2. Invite team members with appropriate roles:
   - **Admin**: Full access
   - **Manager**: Issue management
   - **Member**: View and comment on issues

### 2. Configure Issue Ownership

1. Go to Settings → Issue Owners
2. Set up code owners based on file paths:
   ```
   # Frontend issues
   src/components/ @frontend-team
   src/pages/ @frontend-team
   
   # Backend issues  
   src/backend/ @backend-team
   src/api/ @backend-team
   ```

## Troubleshooting

### Common Issues

1. **DSN Not Working**
   ```bash
   # Verify DSN format is correct
   # Check environment variables are loaded
   # Test with simple error capture
   ```

2. **Missing Source Maps**
   ```bash
   # Ensure source maps are uploaded
   # Check release configuration
   # Verify file paths match
   ```

3. **High Error Volume**
   - Implement proper error filtering
   - Increase sampling rates if needed
   - Set up rate limiting

### Debug Mode

Enable debug mode for troubleshooting:

```python
sentry_sdk.init(
    dsn=sentry_dsn,
    debug=True  # Only in development
)
```

## Security Checklist

- [ ] DSN stored securely as environment variables
- [ ] Sensitive data filtered from error reports
- [ ] PII (personally identifiable information) not sent
- [ ] Proper access controls for team members
- [ ] Rate limiting configured
- [ ] Source maps uploaded securely
- [ ] Auth tokens stored securely

## Cost Optimization

### Free Tier Limits
- 5,000 errors per month
- 10,000 performance units per month
- 30-day data retention

### Tips to Stay Within Limits
- Use appropriate sampling rates
- Filter out noisy/expected errors
- Set up proper error handling
- Monitor usage in Sentry dashboard
- Implement client-side error boundaries

## Next Steps

After Sentry is configured:

1. Monitor error trends and fix critical issues
2. Set up custom dashboards for key metrics
3. Implement proactive alerting for system health
4. Create runbooks for common error scenarios
5. Regular review of error patterns and resolution

---

**Note**: Keep your Sentry DSN and auth tokens secure. Never commit them to version control. Monitor your usage to optimize costs and maintain application reliability.