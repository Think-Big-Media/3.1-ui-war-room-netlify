# Sentry Error Tracking Setup

## Overview

Sentry has been integrated into the War Room backend to provide comprehensive error tracking, performance monitoring, and debugging capabilities.

## Features Implemented

### 1. **Error Tracking**
- Automatic capture of unhandled exceptions
- Custom error handler middleware
- Validation error tracking
- Filtered sensitive data (passwords, tokens, API keys)

### 2. **Performance Monitoring**
- Transaction tracing for API endpoints
- Database query performance tracking
- Redis operation monitoring
- WebSocket connection tracking

### 3. **Integrations**
- **FastAPI**: Full request/response tracking
- **SQLAlchemy**: Database query monitoring
- **Redis**: Cache operation tracking
- **Logging**: Automatic breadcrumb creation

### 4. **Security**
- Sensitive data filtering
- PII (Personally Identifiable Information) protection
- Development environment filtering
- Custom before_send filter

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production  # or development, staging
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% profiling
```

### Getting Your Sentry DSN

1. Sign up at [sentry.io](https://sentry.io) (free tier available)
2. Create a new project (Python/FastAPI)
3. Copy the DSN from project settings
4. Add to your `.env` file

## Usage

### Automatic Error Capture

All unhandled exceptions are automatically captured:

```python
@app.get("/api/test")
async def test_endpoint():
    # This will be automatically captured
    raise ValueError("Something went wrong")
```

### Manual Error Capture

Use the helper functions for manual capture:

```python
from backend.core.sentry import capture_exception, capture_message

try:
    risky_operation()
except Exception as e:
    # Capture with additional context
    capture_exception(
        e,
        extra={
            "user_id": user.id,
            "operation": "risky_operation"
        }
    )
    
# Capture messages
capture_message("Important event occurred", level="info")
```

### Performance Monitoring

Transactions are automatically created for:
- API endpoint calls
- Database queries
- Redis operations
- WebSocket connections

### Custom Context

Add custom context to errors:

```python
import sentry_sdk

# Set user context
sentry_sdk.set_user({
    "id": user.id,
    "email": user.email,
    "username": user.username
})

# Set custom tags
sentry_sdk.set_tag("organization", org.name)
sentry_sdk.set_tag("feature", "analytics")

# Set extra context
sentry_sdk.set_context("campaign", {
    "id": campaign.id,
    "name": campaign.name,
    "status": campaign.status
})
```

## Testing Sentry Integration

### 1. Test Error Capture

Add this temporary endpoint to test:

```python
@app.get("/test-sentry")
async def test_sentry():
    """Test endpoint to verify Sentry is working."""
    # This will create an error in Sentry
    division_by_zero = 1 / 0
    return {"status": "This won't be reached"}
```

### 2. Test Manual Capture

```python
@app.get("/test-sentry-message")
async def test_sentry_message():
    """Test manual message capture."""
    from backend.core.sentry import capture_message
    
    capture_message(
        "Test message from War Room", 
        level="info",
        extra={"test": True}
    )
    return {"status": "Message sent to Sentry"}
```

### 3. Verify in Sentry Dashboard

1. Navigate to your Sentry project
2. Check the Issues tab for errors
3. Check Performance tab for transactions
4. Verify sensitive data is filtered

## Best Practices

### 1. **Error Context**
Always add relevant context when manually capturing:
```python
capture_exception(
    e,
    extra={
        "request_id": request.headers.get("X-Request-ID"),
        "user_action": "export_analytics",
        "data_range": f"{start_date} to {end_date}"
    }
)
```

### 2. **Performance Monitoring**
Use custom spans for slow operations:
```python
import sentry_sdk

with sentry_sdk.start_span(op="analytics.aggregate"):
    result = perform_heavy_aggregation()
```

### 3. **User Feedback**
Enable user feedback for errors:
```python
event_id = capture_exception(e)
# Return event_id to frontend for user feedback widget
```

### 4. **Release Tracking**
Set release version for better debugging:
```python
# Automatically set from settings
release=f"{settings.APP_NAME}@{settings.APP_VERSION}"
```

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Error Rate**: Track spikes in errors
2. **Performance**: P95 response times
3. **User Impact**: Number of users affected
4. **Error Patterns**: Recurring issues

### Alerts to Configure

1. Error rate threshold exceeded
2. New error types detected
3. Performance degradation
4. Critical error in production

## Troubleshooting

### Sentry Not Receiving Events

1. Check `SENTRY_DSN` is set correctly
2. Verify network connectivity
3. Check debug logs: `SENTRY_DEBUG=true`
4. Ensure not filtered by `before_send`

### Missing Context

1. Verify integrations are loaded
2. Check middleware order
3. Ensure context is set before error

### Performance Issues

1. Adjust sample rates if needed
2. Disable profiling in development
3. Use `traces_sampler` for custom sampling

## Next Steps

1. ✅ Set up Sentry account and get DSN
2. ✅ Add DSN to environment variables
3. ✅ Deploy and test error capture
4. ✅ Configure alerts in Sentry dashboard
5. ✅ Add custom context as needed
6. ✅ Monitor and adjust sample rates