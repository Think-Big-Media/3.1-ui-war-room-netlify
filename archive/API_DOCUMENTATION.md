# War Room API Documentation

## Overview

The War Room API provides comprehensive functionality for campaign management, analytics, monitoring, and automation. Built with FastAPI, it offers high-performance REST endpoints with automatic OpenAPI documentation.

**Base URL:** `https://war-room-oa9t.onrender.com/api/v1`  
**Documentation:** `https://war-room-oa9t.onrender.com/docs`  
**Redoc:** `https://war-room-oa9t.onrender.com/redoc`

## Authentication

War Room uses secure httpOnly cookie-based authentication with CSRF protection.

### Security Features
- **httpOnly Cookies**: Tokens stored securely, not accessible via JavaScript
- **CSRF Protection**: All state-changing operations require CSRF tokens
- **Rate Limiting**: 100 requests per minute per endpoint
- **Request Timeouts**: 30s default, optimized per endpoint type
- **Error Sanitization**: No sensitive data leaked in error responses

### Authentication Flow

```bash
# 1. Login (receives httpOnly cookie + CSRF token)
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=securepass&grant_type=password

# Response includes Set-Cookie header and CSRF token
# Cookie: auth_token=...; HttpOnly; Secure; SameSite=Lax
```

### Required Headers for Protected Endpoints
```http
X-CSRF-Token: <csrf_token_from_login>
Cookie: auth_token=<received_from_login>
```

## API Endpoints

### Authentication

#### POST `/auth/login`
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "organization_id": "org_uuid"
  },
  "csrf_token": "csrf_token_string"
}
```

#### POST `/auth/register`
Register new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "full_name": "Jane Doe",
  "organization_name": "Campaign Organization"
}
```

#### POST `/auth/refresh`
Refresh authentication token.

**Response:**
```json
{
  "message": "Token refreshed",
  "csrf_token": "new_csrf_token"
}
```

#### POST `/auth/logout`
Logout and clear authentication cookies.

#### GET `/auth/me`
Get current user information.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "organization_id": "org_uuid",
  "permissions": ["analytics.view", "campaigns.edit"]
}
```

### Analytics

#### GET `/analytics/dashboard`
Get comprehensive analytics dashboard data.

**Parameters:**
- `date_range`: `7d` | `30d` | `90d` | `1y` | `custom`
- `start_date`: ISO date (required if date_range=custom)
- `end_date`: ISO date (required if date_range=custom)

**Response:**
```json
{
  "metrics": {
    "volunteers": {
      "total": 1250,
      "active": 890,
      "new_this_period": 45,
      "growth_rate": 12.5
    },
    "events": {
      "total": 28,
      "upcoming": 12,
      "attendance_rate": 85.3
    },
    "donations": {
      "total_amount": 45230.50,
      "donor_count": 234,
      "average_donation": 193.29
    },
    "reach": {
      "social_media": 125000,
      "email_subscribers": 8500,
      "website_visitors": 15420
    }
  },
  "charts": {
    "volunteer_growth": [...],
    "event_attendance": [...],
    "donation_trends": [...],
    "geographic_data": [...]
  },
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### POST `/analytics/export`
Export analytics data in various formats.

**Request:**
```json
{
  "format": "csv" | "excel" | "pdf",
  "date_range": "30d",
  "metrics": ["volunteers", "events", "donations"],
  "email_to": "user@example.com"
}
```

### Monitoring

#### GET `/health`
System health check endpoint (root level, not under /api/v1).

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": 12,
      "connections": 5
    },
    "cache": {
      "status": "healthy",
      "hit_rate": 85.2,
      "memory_usage": "45%"
    },
    "external_apis": {
      "meta": "healthy",
      "google": "healthy",
      "openai": "degraded"
    }
  },
  "performance": {
    "avg_response_time": 245,
    "error_rate": 0.02,
    "requests_per_minute": 1250
  }
}
```

#### GET `/monitoring/metrics`
Real-time performance metrics.

**Response:**
```json
{
  "system": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 23.4
  },
  "application": {
    "active_connections": 125,
    "cache_hit_rate": 89.2,
    "avg_response_time": 185
  },
  "database": {
    "active_connections": 12,
    "query_time_avg": 45,
    "slow_queries": 2
  }
}
```

#### GET `/monitoring/crisis-alerts`
Get active crisis alerts.

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_uuid",
      "title": "Negative Sentiment Spike",
      "description": "Unusual increase in negative mentions detected",
      "severity": "high",
      "category": "sentiment",
      "status": "active",
      "timestamp": "2024-01-15T10:15:00Z",
      "source": "Twitter",
      "affected_metrics": ["sentiment_score", "mention_volume"],
      "recommendations": [
        "Monitor conversation closely",
        "Prepare response strategy"
      ]
    }
  ],
  "summary": {
    "total_alerts": 3,
    "high_severity": 1,
    "medium_severity": 2,
    "low_severity": 0
  }
}
```

### Documents

#### POST `/documents/upload`
Upload documents for AI analysis.

**Request:** `multipart/form-data`
- `file`: Document file (PDF, DOC, TXT)
- `category`: Document category
- `tags`: Comma-separated tags

**Response:**
```json
{
  "id": "doc_uuid",
  "filename": "campaign_plan.pdf",
  "status": "processing",
  "upload_url": "https://storage.url/doc_uuid",
  "analysis_job_id": "job_uuid"
}
```

#### GET `/documents/{document_id}/analysis`
Get AI analysis results for document.

**Response:**
```json
{
  "document_id": "doc_uuid",
  "status": "completed",
  "analysis": {
    "summary": "Executive summary of the document...",
    "key_topics": ["policy", "healthcare", "education"],
    "sentiment": "positive",
    "entities": [
      {"text": "Healthcare Act", "type": "LEGISLATION"},
      {"text": "January 2024", "type": "DATE"}
    ],
    "recommendations": [
      "Focus on healthcare messaging",
      "Emphasize education benefits"
    ]
  },
  "metadata": {
    "page_count": 25,
    "word_count": 5420,
    "processed_at": "2024-01-15T10:30:00Z"
  }
}
```

### Ad Insights

#### GET `/ad-insights/meta`
Get Meta/Facebook campaign insights.

**Parameters:**
- `account_id`: Meta Ad Account ID
- `date_range`: Date range for insights
- `metrics`: Comma-separated list of metrics

**Response:**
```json
{
  "campaigns": [
    {
      "id": "campaign_id",
      "name": "Healthcare Campaign",
      "status": "ACTIVE",
      "insights": {
        "impressions": 125000,
        "clicks": 3250,
        "ctr": 2.6,
        "spend": 1250.50,
        "cpc": 0.38,
        "conversions": 45
      }
    }
  ],
  "summary": {
    "total_spend": 5430.25,
    "total_impressions": 450000,
    "overall_ctr": 2.4,
    "roas": 3.2
  }
}
```

#### GET `/ad-insights/google`
Get Google Ads campaign insights.

**Response:** Similar structure to Meta insights

### Alerts

#### GET `/alerts`
Get user alerts and notifications.

**Parameters:**
- `status`: `unread` | `read` | `all`
- `category`: Alert category filter
- `limit`: Number of alerts to return (default: 20)

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_uuid",
      "title": "Campaign Performance Alert",
      "message": "Your healthcare campaign is performing 20% below target",
      "category": "performance",
      "severity": "medium",
      "status": "unread",
      "timestamp": "2024-01-15T09:30:00Z",
      "action_url": "/campaigns/campaign_id",
      "metadata": {
        "campaign_id": "campaign_uuid",
        "metric": "ctr",
        "current_value": 1.8,
        "target_value": 2.2
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "per_page": 20,
    "has_next": true
  }
}
```

#### POST `/alerts/{alert_id}/acknowledge`
Mark alert as acknowledged.

#### DELETE `/alerts/{alert_id}`
Dismiss/delete alert.

### WebSocket

#### WS `/websocket`
Real-time WebSocket connection for live updates.

**Connection URL:** `wss://war-room-oa9t.onrender.com/api/v1/websocket`

**Authentication:** Include `auth_token` cookie in connection

**Message Types:**

```javascript
// Subscribe to metrics updates
{
  "type": "subscribe",
  "channel": "metrics",
  "organization_id": "org_uuid"
}

// Subscribe to crisis alerts
{
  "type": "subscribe", 
  "channel": "crisis_alerts",
  "organization_id": "org_uuid"
}

// Receive real-time updates
{
  "type": "metric_update",
  "data": {
    "metric": "website_visitors",
    "value": 1543,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

{
  "type": "crisis_alert",
  "data": {
    "id": "alert_uuid",
    "title": "Negative Sentiment Spike",
    "severity": "high"
  }
}
```

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "request_id": "req_uuid",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (semantic errors)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

All endpoints are rate limited to **100 requests per minute** per user.

**Headers in response:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312200
```

## Caching

- **Dashboard data**: 5 minutes TTL
- **Analytics reports**: 15 minutes TTL  
- **Static configuration**: 1 hour TTL
- **User data**: 30 seconds TTL

**Cache headers:**
```http
Cache-Control: public, max-age=300
ETag: "abc123xyz"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT
```

## Performance Specifications

### Response Time Targets

- **Fast endpoints** (health, auth): 5-10 seconds
- **Standard endpoints** (campaigns, analytics): 20-25 seconds  
- **Slow endpoints** (reports, exports): 60-120 seconds
- **External API endpoints**: 45 seconds

### Timeout Configuration

All requests implement timeout hierarchies with automatic retry logic and exponential backoff for resilience.

## Security Features

### Implemented Security Measures

1. **Secure Authentication**
   - httpOnly cookies prevent XSS attacks
   - CSRF tokens for state-changing operations
   - Secure password hashing (bcrypt)

2. **Input Validation**
   - All inputs sanitized and validated
   - SQL injection prevention via ORM
   - File upload restrictions and scanning

3. **Error Handling**
   - Sensitive information sanitized from error messages
   - Structured error responses
   - Proper HTTP status codes

4. **Rate Limiting**
   - Per-endpoint rate limiting
   - Distributed rate limiting with Redis
   - Graceful degradation under load

5. **HTTPS Enforcement**
   - All communication encrypted
   - Secure cookie attributes
   - HSTS headers

## SDKs and Client Libraries

### JavaScript/TypeScript
```bash
npm install @war-room/api-client
```

```javascript
import { WarRoomClient } from '@war-room/api-client';

const client = new WarRoomClient({
  baseUrl: 'https://war-room-oa9t.onrender.com/api/v1',
  // Cookies handled automatically
});

// Usage
const dashboard = await client.analytics.getDashboard('30d');
const alerts = await client.alerts.getActive();
```

### Python
```bash
pip install war-room-client
```

```python
from war_room_client import WarRoomClient

client = WarRoomClient(
    base_url='https://war-room-oa9t.onrender.com/api/v1'
)

# Usage
dashboard = client.analytics.get_dashboard(date_range='30d')
alerts = client.alerts.get_active()
```

## Support and Resources

- **API Status**: https://status.war-room.onrender.com
- **Interactive Documentation**: https://war-room-oa9t.onrender.com/docs
- **GitHub Repository**: https://github.com/Think-Big-Media/1.0-war-room
- **Issue Tracking**: GitHub Issues
- **Support Email**: support@war-room-platform.com

## Changelog

### v1.0.0 (Current)
- Initial API release
- Complete authentication system
- Analytics dashboard endpoints
- Real-time monitoring
- Crisis alert system
- Document intelligence
- WebSocket support
- Comprehensive security implementation

---

*Last updated: January 2025*  
*API Version: 1.0.0*