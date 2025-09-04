# War Room API Documentation v1.0

## Overview

War Room provides a comprehensive RESTful API for campaign management, real-time monitoring, data analytics, and AI-powered document intelligence. This documentation covers all available endpoints, authentication methods, request/response formats, and integration examples.

## Base URLs

```
Production:     https://war-room-oa9t.onrender.com/api/v1
Health Check:   https://war-room-oa9t.onrender.com/health
API Docs:       https://war-room-oa9t.onrender.com/docs
WebSocket:      wss://war-room-oa9t.onrender.com/ws
Development:    http://localhost:8000/api/v1
```

## API Versioning

- **Current Version**: v1.0
- **Version Header**: `Accept: application/json; version=1.0`
- **Deprecation Policy**: 6 months notice for breaking changes
- **Backward Compatibility**: Minor versions maintain compatibility

## Security

### Security Headers

War Room Analytics implements comprehensive security headers to protect against common web vulnerabilities. All responses include the following security headers:

#### Implemented Security Headers

| Header | Value | Protection |
|--------|-------|------------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'...` | XSS, injection attacks |
| `X-Frame-Options` | `DENY` | Clickjacking protection |
| `X-Content-Type-Options` | `nosniff` | MIME type sniffing attacks |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS connections |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Information leakage protection |
| `Permissions-Policy` | `accelerometer=(), camera=(), geolocation=()...` | Limit browser permissions |
| `Cross-Origin-Embedder-Policy` | `require-corp` | Cross-origin isolation |
| `Cross-Origin-Opener-Policy` | `same-origin` | Cross-origin isolation |
| `Cross-Origin-Resource-Policy` | `same-origin` | Cross-origin resource protection |

#### CORS Configuration

Production CORS settings are restrictive and only allow specific origins:

```http
Access-Control-Allow-Origin: https://war-room-oa9t.onrender.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, X-CSRF-Token, X-API-Version
Access-Control-Expose-Headers: X-API-Version, X-Rate-Limit-Remaining
Access-Control-Max-Age: 86400
```

### Rate Limiting

API endpoints are protected with rate limiting to prevent abuse:

| Endpoint Category | Rate Limit | Description |
|------------------|------------|-------------|
| Analytics Endpoints | 30 requests/minute | Campaign and performance data |
| Export Endpoints | 10 requests/hour | Data export and reporting |
| WebSocket Connections | 100 messages/minute | Real-time updates |
| Authentication | 5 attempts/minute | Login and registration |

Rate limit headers are included in responses:
```http
X-Rate-Limit-Limit: 30
X-Rate-Limit-Remaining: 25
X-Rate-Limit-Reset: 1609459200
```

## Authentication

### Overview
War Room uses JWT (JSON Web Tokens) with httpOnly cookies for secure authentication. The API supports multiple authentication methods for different use cases.

### Authentication Methods

#### 1. Cookie-based Authentication (Primary)
Used by the frontend application. Tokens are stored in httpOnly cookies for security.

```bash
# Login request
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

# Response includes httpOnly cookie with security flags
Set-Cookie: war_room_token=eyJhbGci...; HttpOnly; Secure; SameSite=Strict; Path=/
```

#### 2. Bearer Token Authentication
Used for API integrations and external applications.

```bash
# Include in all authenticated requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### 3. API Key Authentication
For service-to-service communication and webhooks.

```bash
# Include in request headers
X-API-Key: your-api-key-here
Content-Type: application/json
```

### Token Lifecycle

- **Access Token Lifetime**: 1 hour
- **Refresh Token Lifetime**: 30 days
- **Session Timeout**: 24 hours of inactivity
- **Token Refresh**: Automatic via `/auth/refresh` endpoint

### Security Headers

All responses include security headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/login
Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "remember_me": false
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "organization_id": "org_123",
    "permissions": ["analytics.view", "campaigns.view"]
  },
  "access_token": "eyJhbGci...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": "Authentication failed"
  }
}
```

#### POST /auth/register
Register new user account.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "secure_password123",
  "name": "Jane Smith",
  "organization_name": "Campaign 2024"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "email_verified": false,
    "organization_id": "org_124"
  },
  "message": "Registration successful. Please verify your email."
}
```

#### GET /auth/me
Get current user information.

**Headers:**
```http
Authorization: Bearer eyJhbGci...
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "organization_id": "org_123",
    "permissions": ["analytics.view", "campaigns.view"],
    "last_login": "2025-08-08T12:00:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Analytics & Reporting Endpoints

#### GET /analytics/dashboard
Get comprehensive dashboard analytics data.

**Query Parameters:**
- `date_range`: enum (`last_7_days`, `last_30_days`, `last_90_days`, `custom`)
- `start_date`: ISO date string (required if date_range=custom)
- `end_date`: ISO date string (required if date_range=custom)
- `organization_id`: string (optional, defaults to user's org)

**Request:**
```http
GET /api/v1/analytics/dashboard?date_range=last_30_days
Authorization: Bearer eyJhbGci...
```

**Response (200 OK):**
```json
{
  "summary": {
    "total_volunteers": 1247,
    "total_events": 45,
    "total_donations": 125430.50,
    "total_reach": 245680,
    "engagement_rate": 0.087,
    "conversion_rate": 0.034
  },
  "volunteers": {
    "new_signups": 127,
    "active_volunteers": 892,
    "retention_rate": 0.78,
    "by_region": {
      "north": 312,
      "south": 289,
      "east": 334,
      "west": 312
    }
  },
  "trends": {
    "volunteers_growth": 0.15,
    "donations_growth": 0.23,
    "events_growth": 0.08,
    "reach_growth": 0.31
  },
  "period": {
    "start_date": "2025-07-08",
    "end_date": "2025-08-08",
    "days": 31
  }
}
```

#### GET /analytics/campaigns
Get campaign performance metrics.

**Request:**
```http
GET /api/v1/analytics/campaigns?status=active&limit=50
Authorization: Bearer eyJhbGci...
```

**Response (200 OK):**
```json
{
  "campaigns": [
    {
      "id": "campaign_123",
      "name": "Summer Outreach 2025",
      "status": "active",
      "start_date": "2025-06-01",
      "end_date": "2025-08-31",
      "budget": 50000.00,
      "spent": 23450.75,
      "metrics": {
        "impressions": 145670,
        "clicks": 8934,
        "conversions": 234,
        "ctr": 0.0613,
        "conversion_rate": 0.0262,
        "cpc": 2.62,
        "cpa": 100.22
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 23,
    "total_pages": 1
  }
}
```

#### POST /analytics/export
Export analytics data to CSV or PDF.

**Request:**
```json
{
  "report_type": "dashboard",
  "format": "csv",
  "date_range": "last_30_days",
  "sections": ["volunteers", "events", "donations"],
  "email_delivery": true,
  "email": "user@example.com"
}
```

**Response (202 Accepted):**
```json
{
  "export_job_id": "export_550e8400",
  "status": "queued",
  "estimated_completion": "2025-08-08T12:05:00Z",
  "download_url": null,
  "created_at": "2025-08-08T12:00:00Z"
}
```

### Monitoring & Crisis Management Endpoints

#### GET /monitoring/health
Get comprehensive system health status.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-08T12:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "components": {
    "database": {
      "status": "healthy",
      "response_time_ms": 12,
      "connection_pool": {
        "active": 3,
        "idle": 7,
        "total": 10
      }
    },
    "redis": {
      "status": "healthy",
      "response_time_ms": 2,
      "memory_usage_mb": 45.2,
      "hit_rate": 0.892
    },
    "external_apis": {
      "supabase": {"status": "healthy"},
      "openai": {"status": "healthy"},
      "pinecone": {"status": "degraded", "error": "Increased response times"}
    }
  },
  "metrics": {
    "response_time_avg_ms": 185,
    "requests_per_minute": 847,
    "error_rate": 0.0023,
    "memory_usage_mb": 445,
    "cpu_usage_percent": 23.5
  }
}
```

#### GET /monitoring/alerts
Get active system alerts and warnings.

**Response (200 OK):**
```json
{
  "alerts": [
    {
      "id": "alert_550e8400",
      "title": "High Response Time Detected",
      "description": "API response times exceeding 2 seconds",
      "severity": "medium",
      "status": "active",
      "category": "performance",
      "component": "api",
      "threshold": 2000,
      "current_value": 2347,
      "created_at": "2025-08-08T11:55:00Z"
    }
  ],
  "summary": {
    "total_active": 3,
    "by_severity": {
      "critical": 0,
      "high": 1,
      "medium": 2,
      "low": 0
    }
  }
}
```

#### GET /monitoring/crisis-alerts
Get crisis detection and sentiment monitoring alerts.

**Response (200 OK):**
```json
{
  "crisis_alerts": [
    {
      "id": "crisis_alert_123",
      "title": "Negative Sentiment Spike Detected",
      "description": "40% increase in negative mentions in the last 2 hours",
      "severity": "high",
      "type": "sentiment_anomaly",
      "confidence": 0.87,
      "detected_at": "2025-08-08T10:30:00Z",
      "platforms": ["twitter", "facebook", "instagram"],
      "keywords": ["campaign", "policy", "debate"],
      "metrics": {
        "mention_volume": 1247,
        "sentiment_score": -0.34,
        "reach_estimate": 45670,
        "engagement_rate": 0.12
      }
    }
  ]
}
```

### Campaign Management Endpoints

#### GET /campaigns
List all campaigns with filtering and pagination.

**Query Parameters:**
- `status`: enum (`draft`, `active`, `paused`, `completed`)
- `platform`: enum (`meta`, `google_ads`, `email`, `sms`)
- `page`: integer (default: 1)
- `per_page`: integer (default: 20, max: 100)

#### POST /campaigns
Create a new campaign.

**Request:**
```json
{
  "name": "Fall Fundraising Drive",
  "description": "Q4 fundraising campaign with donation matching",
  "platform": "email",
  "budget": {
    "total": 25000.00,
    "daily_budget": 300.00
  },
  "schedule": {
    "start_date": "2025-09-01",
    "end_date": "2025-11-30",
    "timezone": "America/New_York"
  }
}
```

**Response (201 Created):**
```json
{
  "campaign": {
    "id": "campaign_124",
    "name": "Fall Fundraising Drive",
    "status": "draft",
    "platform": "email",
    "created_at": "2025-08-08T12:00:00Z",
    "approval_required": true,
    "estimated_reach": 15670
  }
}
```

### Platform Administration Endpoints

#### GET /platform/admin/users
List all platform users (admin only).

#### GET /platform/admin/organizations
List all organizations (admin only).

#### GET /platform/admin/metrics
Get platform-wide metrics and analytics (admin only).

### External Integration Endpoints

#### Meta Business Suite Integration

##### POST /auth/meta/redirect
Generate Meta Business Suite OAuth2 authorization URL.

**Authentication**: JWT Bearer token required

**Request:**
```json
{
  "state": "optional-state-parameter"
}
```

**Response (200 OK):**
```json
{
  "authorization_url": "https://www.facebook.com/v19.0/dialog/oauth?client_id=123&redirect_uri=...",
  "message": "Redirect user to this URL to authorize Meta Business Suite access"
}
```

**cURL Example:**
```bash
curl -X POST "https://war-room-oa9t.onrender.com/api/v1/auth/meta/redirect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state": "meta-integration"}'
```

##### GET /auth/meta/callback
Handle Meta Business Suite OAuth2 authorization callback.

**Query Parameters:**
- `code`: Authorization code from Meta
- `state`: State parameter for security validation
- `error`: Error code (if authorization failed)
- `error_description`: Human-readable error description

**Success Response:**
- HTTP 302 redirect to frontend with success parameters
- Creates encrypted Meta auth record in database

**Error Response:**
- HTTP 302 redirect to frontend with error parameters

##### GET /auth/meta/status
Get current Meta Business Suite authentication status.

**Authentication**: JWT Bearer token required

**Response (200 OK):**
```json
{
  "is_authenticated": true,
  "ad_account_id": "act_123456789",
  "business_id": "123456789012345",
  "scopes": [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_show_list",
    "pages_read_engagement"
  ],
  "expires_at": "2025-09-08T12:00:00Z",
  "page_count": 3,
  "error": null
}
```

**Error Response (200 OK - Not Connected):**
```json
{
  "is_authenticated": false,
  "error": "Meta Business Suite not connected"
}
```

**cURL Example:**
```bash
curl -X GET "https://war-room-oa9t.onrender.com/api/v1/auth/meta/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### POST /auth/meta/refresh
Manually refresh Meta Business Suite access token.

**Authentication**: JWT Bearer token required

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": {
    "code": "TOKEN_REFRESH_FAILED",
    "message": "Failed to refresh token",
    "details": "Invalid or expired refresh token"
  }
}
```

**cURL Example:**
```bash
curl -X POST "https://war-room-oa9t.onrender.com/api/v1/auth/meta/refresh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### POST /auth/meta/revoke
Revoke Meta Business Suite access for user's organization.

**Authentication**: JWT Bearer token required

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Meta Business Suite access revoked successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": {
    "code": "REVOKE_FAILED",
    "message": "Failed to revoke access",
    "details": "No active Meta connection found"
  }
}
```

**cURL Example:**
```bash
curl -X POST "https://war-room-oa9t.onrender.com/api/v1/auth/meta/revoke" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### GET /auth/meta/accounts
Get Meta ad accounts available to the authenticated user.

**Authentication**: JWT Bearer token required

**Response (200 OK):**
```json
{
  "success": true,
  "ad_accounts": [
    {
      "account_id": "act_123456789",
      "name": "Campaign Account 2024",
      "currency": "USD",
      "timezone_name": "America/New_York",
      "account_status": "ACTIVE",
      "business_id": "123456789012345",
      "permissions": ["ADVERTISE", "ANALYZE"],
      "amount_spent": "1250.75",
      "balance": "8749.25"
    },
    {
      "account_id": "act_987654321",
      "name": "Brand Awareness Account",
      "currency": "USD",
      "timezone_name": "America/Los_Angeles",
      "account_status": "ACTIVE",
      "business_id": "123456789012345",
      "permissions": ["ADVERTISE", "ANALYZE"],
      "amount_spent": "2100.50",
      "balance": "7899.50"
    }
  ],
  "count": 2
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": {
    "code": "META_NOT_AUTHENTICATED",
    "message": "Meta Business Suite not connected",
    "details": "Please complete OAuth flow first"
  }
}
```

**cURL Example:**
```bash
curl -X GET "https://war-room-oa9t.onrender.com/api/v1/auth/meta/accounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### POST /auth/meta/select-account/{account_id}
Select a specific Meta ad account as the primary account for the organization.

**Authentication**: JWT Bearer token required

**Path Parameters:**
- `account_id`: Meta ad account ID (e.g., "act_123456789")

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Selected ad account act_123456789 as primary account",
  "account_id": "act_123456789"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": {
    "code": "ACCOUNT_ACCESS_DENIED",
    "message": "No access to this ad account or account not found",
    "details": "User does not have permissions for account act_123456789"
  }
}
```

**cURL Example:**
```bash
curl -X POST "https://war-room-oa9t.onrender.com/api/v1/auth/meta/select-account/act_123456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

##### GET /auth/meta/pages/{page_id}/token
Get page access token status for specific Facebook page.

**Authentication**: JWT Bearer token required

**Path Parameters:**
- `page_id`: Facebook page ID

**Response (200 OK):**
```json
{
  "success": true,
  "has_token": true,
  "page_id": "123456789012345"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": {
    "code": "PAGE_TOKEN_NOT_FOUND",
    "message": "Page token not found or page not accessible",
    "details": "No access token available for page 123456789012345"
  }
}
```

**cURL Example:**
```bash
curl -X GET "https://war-room-oa9t.onrender.com/api/v1/auth/meta/pages/123456789012345/token" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Google Ads Integration

##### GET /google-ads/auth
Get Google Ads authentication status.

##### GET /google-ads/campaigns
Get Google Ads campaigns and performance data.

### WebSocket Real-Time Endpoints

#### WebSocket Connection
Establish real-time connection for live updates.

**Connection URL:**
```
wss://war-room-oa9t.onrender.com/ws/connect?token=eyJhbGci...
```

**Subscribe Message:**
```json
{
  "type": "subscribe",
  "channel": "dashboard",
  "filters": {
    "organization_id": "org_123",
    "metrics": ["volunteers", "donations", "events"]
  }
}
```

## Rate Limiting

### Rate Limit Policy

All API endpoints are subject to rate limiting:

- **Authenticated Users**: 100 requests per minute
- **Admin Users**: 500 requests per minute
- **Export Operations**: 10 requests per hour
- **WebSocket Connections**: 50 connections per user

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
X-RateLimit-Window: 60
```

### Rate Limit Exceeded Response

**Status Code:** 429 Too Many Requests

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

## Error Handling

### Standard Error Format

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional technical details",
    "field_errors": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    },
    "request_id": "req_550e8400",
    "timestamp": "2025-08-08T12:00:00Z"
  }
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests |
| 202 | Accepted | Async operations started |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Valid format but semantic errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_CREDENTIALS` | Login failed | Check email/password |
| `TOKEN_EXPIRED` | JWT token expired | Refresh token |
| `INSUFFICIENT_PERMISSIONS` | Access denied | Check user role |
| `RESOURCE_NOT_FOUND` | Resource missing | Verify resource ID |
| `VALIDATION_FAILED` | Input validation error | Check field_errors |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |

## Pagination

### Standard Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 147,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

## Webhooks

### Webhook Configuration

Receive real-time notifications for important events.

#### Supported Events
- `campaign.created` - New campaign created
- `campaign.updated` - Campaign modified
- `alert.triggered` - System alert activated
- `crisis.detected` - Crisis situation detected
- `user.registered` - New user registration
- `export.completed` - Data export ready

#### Webhook Setup

**Create Webhook:**
```http
POST /api/v1/webhooks
Authorization: Bearer eyJhbGci...
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/warroom",
  "events": ["campaign.created", "alert.triggered"],
  "secret": "your-webhook-secret",
  "active": true
}
```

#### Webhook Payload Format

```json
{
  "id": "webhook_550e8400",
  "event": "campaign.created",
  "timestamp": "2025-08-08T12:00:00Z",
  "data": {
    "campaign": {
      "id": "campaign_123",
      "name": "New Campaign",
      "status": "draft"
    }
  },
  "organization_id": "org_123"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { WarRoomClient } from '@warroom/api-client';

const client = new WarRoomClient({
  apiKey: 'your-api-key',
  baseURL: 'https://war-room-oa9t.onrender.com/api/v1'
});

// Get dashboard data
const dashboard = await client.analytics.getDashboard({
  dateRange: 'last_30_days'
});

// Create campaign
const campaign = await client.campaigns.create({
  name: 'Q4 Outreach',
  platform: 'email',
  budget: { total: 25000 }
});
```

### Python

```python
from warroom_api import WarRoomClient
import asyncio

client = WarRoomClient(
    api_key='your-api-key',
    base_url='https://war-room-oa9t.onrender.com/api/v1'
)

async def main():
    # Get dashboard data
    dashboard = await client.analytics.get_dashboard(
        date_range='last_30_days'
    )
    
    # Create campaign
    campaign = await client.campaigns.create({
        'name': 'Q4 Outreach',
        'platform': 'email',
        'budget': {'total': 25000}
    })

asyncio.run(main())
```

### cURL Examples

```bash
# Login
curl -X POST https://war-room-oa9t.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get dashboard (with token)
curl -X GET https://war-room-oa9t.onrender.com/api/v1/analytics/dashboard \
  -H "Authorization: Bearer eyJhbGci..." \
  -G -d "date_range=last_30_days"

# Create campaign
curl -X POST https://war-room-oa9t.onrender.com/api/v1/campaigns \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Campaign", "platform": "email", "budget": {"total": 1000}}'
```

## Support & Resources

### Getting Help

- **API Status**: [https://war-room-oa9t.onrender.com/health](https://war-room-oa9t.onrender.com/health)
- **Interactive Documentation**: [https://war-room-oa9t.onrender.com/docs](https://war-room-oa9t.onrender.com/docs)
- **GitHub Issues**: [Submit bug reports and feature requests](https://github.com/Think-Big-Media/1.0-war-room/issues)
- **Email Support**: api-support@warroom.com

### Additional Resources

- **Postman Collection**: [Download API collection](https://war-room-oa9t.onrender.com/postman)
- **OpenAPI Spec**: [Download OpenAPI 3.0 specification](https://war-room-oa9t.onrender.com/openapi.json)
- **SDK Documentation**: [Language-specific SDK guides](https://docs.warroom.com/sdks)
- **Webhook Testing**: [Webhook.site integration guide](https://docs.warroom.com/webhooks)

### Service Level Agreement

- **Uptime**: 99.5% monthly availability
- **Response Time**: 95th percentile under 2 seconds
- **Support Response**: 24 hours for API issues
- **Maintenance Windows**: Scheduled weekly, 2 AM - 4 AM UTC

---

*API Documentation v1.0 | Last Updated: August 2025 | For War Room Platform*