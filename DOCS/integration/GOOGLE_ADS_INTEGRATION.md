# Google Ads OAuth2 Integration Documentation

## Overview

The War Room platform includes comprehensive Google Ads integration that enables organizations to connect their Google Ads accounts for campaign management, performance monitoring, and analytics. The integration uses OAuth2 authentication with secure token storage and automatic refresh capabilities.

## Architecture

The Google Ads integration consists of several key components:

- **OAuth2 Authentication Service** (`services/googleAds/google_ads_auth_service.py`)
- **Google Ads API Service** (`services/googleAds/google_ads_service.py`) 
- **Authentication Model** (`models/google_ads_auth.py`)
- **API Endpoints** (`api/v1/endpoints/google_ads_auth.py`)
- **Encrypted Token Storage** with automatic refresh

## Prerequisites

### 1. Google Ads Account Requirements

Before setting up the integration, ensure you have:

- **Google Ads Account**: An active Google Ads account
- **Google Ads API Access**: Developer token approval from Google
- **Manager Account (Recommended)**: For accessing multiple client accounts
- **API Access Level**: At least Basic access level

### 2. Google Cloud Console Setup

#### Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID for later configuration

#### Step 2: Enable Google Ads API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Google Ads API"
3. Click **Enable** on the Google Ads API

#### Step 3: Create OAuth2 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Configure the consent screen:
   - User type: **External** (for production) or **Internal** (for testing)
   - App name: "War Room Campaign Management"
   - User support email: Your organization's email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/adwords`
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/google-ads/callback` (development)
   - `https://your-domain.com/api/v1/auth/google-ads/callback` (production)

#### Step 4: Obtain Developer Token

1. Visit [Google Ads API Center](https://ads.google.com/nav/selectaccount?authuser=0&dst=/aw/apicenter)
2. Apply for a developer token
3. Wait for approval (can take several days)

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Google Ads OAuth2 Configuration
GOOGLE_ADS_CLIENT_ID=your_oauth2_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_oauth2_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token

# Optional: Login Customer ID (for manager accounts)
GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890

# API Base URL (used for redirect URI construction)
API_BASE_URL=https://your-domain.com
```

### Database Migration

The Google Ads authentication table is created automatically via Alembic migrations:

```sql
-- Table: google_ads_auth
CREATE TABLE google_ads_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    access_token TEXT NOT NULL,              -- Encrypted
    refresh_token TEXT NOT NULL,             -- Encrypted  
    token_expires_at TIMESTAMPTZ NOT NULL,
    customer_id VARCHAR(50),                 -- Primary customer ID
    developer_token VARCHAR(255),            -- Encrypted
    client_id VARCHAR(255) NOT NULL,
    client_secret TEXT NOT NULL,             -- Encrypted
    is_active BOOLEAN DEFAULT TRUE,
    last_refreshed_at TIMESTAMPTZ,
    last_error TEXT,
    scopes JSON DEFAULT '[]'::JSON,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## OAuth2 Authentication Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   War Room      │    │   Google OAuth   │    │  Google Ads API │
│   Frontend      │    │      Server      │    │     Server      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │ 1. Request Auth URL    │                       │
         ├───────────────────────→│                       │
         │                        │                       │
         │ 2. Return Auth URL     │                       │
         │←───────────────────────┤                       │
         │                        │                       │
         │ 3. Redirect User       │                       │
         ├───────────────────────→│                       │
         │                        │                       │
         │                        │ 4. User Authorizes    │
         │                        │                       │
         │ 5. Authorization Code  │                       │
         │←───────────────────────┤                       │
         │                        │                       │
         │ 6. Exchange Code       │                       │
         ├───────────────────────→│                       │
         │                        │                       │
         │ 7. Access & Refresh    │                       │
         │    Tokens              │                       │
         │←───────────────────────┤                       │
         │                        │                       │
         │ 8. Store Encrypted     │                       │
         │    Tokens              │                       │
         │                        │                       │
         │ 9. API Requests        │                       │
         ├─────────────────────────────────────────────────→│
         │                        │                       │
         │10. API Response        │                       │
         │←─────────────────────────────────────────────────│
```

### Flow Details

1. **Authorization Request**: User initiates Google Ads connection
2. **Redirect to Google**: User is redirected to Google's OAuth consent screen
3. **User Authorization**: User grants permissions to War Room
4. **Authorization Code**: Google redirects back with authorization code
5. **Token Exchange**: War Room exchanges code for access and refresh tokens
6. **Secure Storage**: Tokens are encrypted and stored in database
7. **API Access**: War Room can now make authenticated requests to Google Ads API

## API Endpoints

### 1. Generate Authorization URL

**POST** `/api/v1/auth/google-ads/redirect`

Generates OAuth2 authorization URL for user redirection.

**Request Body:**
```json
{
  "state": "optional_custom_state"
}
```

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Redirect user to this URL to authorize Google Ads access"
}
```

**curl Example:**
```bash
curl -X POST "https://your-domain.com/api/v1/auth/google-ads/redirect" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"state": "custom_state"}'
```

### 2. OAuth2 Callback Handler

**GET** `/api/v1/auth/google-ads/callback`

Handles the OAuth2 callback from Google (automatic redirect).

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: State parameter containing organization ID
- `error`: Optional error parameter

### 3. Check Authentication Status

**GET** `/api/v1/auth/google-ads/status`

Returns current Google Ads authentication status.

**Response:**
```json
{
  "is_authenticated": true,
  "customer_id": "1234567890",
  "scopes": ["https://www.googleapis.com/auth/adwords"],
  "expires_at": "2024-12-31T23:59:59Z",
  "error": null
}
```

**curl Example:**
```bash
curl -X GET "https://your-domain.com/api/v1/auth/google-ads/status" \
  -H "Authorization: Bearer your_jwt_token"
```

### 4. Refresh Access Token

**POST** `/api/v1/auth/google-ads/refresh`

Manually refresh the access token.

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**curl Example:**
```bash
curl -X POST "https://your-domain.com/api/v1/auth/google-ads/refresh" \
  -H "Authorization: Bearer your_jwt_token"
```

### 5. Revoke Access

**POST** `/api/v1/auth/google-ads/revoke`

Revoke Google Ads access and remove stored tokens.

**Response:**
```json
{
  "success": true,
  "message": "Google Ads access revoked successfully"
}
```

**curl Example:**
```bash
curl -X POST "https://your-domain.com/api/v1/auth/google-ads/revoke" \
  -H "Authorization: Bearer your_jwt_token"
```

## Google Ads API Usage

### Get Accessible Customers

```python
from services.googleAds.google_ads_service import google_ads_service

# Get list of accessible customer accounts
customers = await google_ads_service.get_accessible_customers('org_id')
```

### Get Campaigns

```python
# Get campaigns for a specific customer
campaigns = await google_ads_service.get_campaigns(
    org_id='org_id',
    customer_id='1234567890',
    page_size=50
)
```

### Get Performance Metrics

```python
# Get performance metrics with date range
metrics = await google_ads_service.get_performance_metrics(
    org_id='org_id',
    customer_id='1234567890',
    date_range={
        'start_date': '2024-01-01',
        'end_date': '2024-01-31'
    },
    segments=['date', 'campaign'],
    metrics=['impressions', 'clicks', 'cost_micros', 'conversions']
)
```

### Custom GAQL Queries

```python
# Execute custom Google Ads Query Language queries
query = """
    SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks
    FROM campaign
    WHERE campaign.status = 'ENABLED'
    ORDER BY metrics.impressions DESC
    LIMIT 10
"""

results = await google_ads_service.search_stream(
    org_id='org_id',
    customer_id='1234567890',
    query=query
)
```

## Security Considerations

### Token Encryption

All sensitive data is encrypted before storage:

- **Access Tokens**: AES-256 encrypted
- **Refresh Tokens**: AES-256 encrypted  
- **Client Secrets**: AES-256 encrypted
- **Encryption Key**: Stored securely via environment variables

### Token Management

- **Automatic Refresh**: Tokens are automatically refreshed before expiration
- **Secure Storage**: Database-level encryption for all OAuth tokens
- **Access Control**: Organization-level token isolation
- **Audit Trail**: All authentication events are logged

### Rate Limiting

The service implements several layers of protection:

- **Exponential Backoff**: Automatic retry with increasing delays
- **Circuit Breaker**: Prevents cascading failures
- **Request Throttling**: Respects Google Ads API rate limits
- **Error Handling**: Comprehensive error recovery

### Best Practices

1. **Environment Security**: Store credentials in secure environment variables
2. **Network Security**: Use HTTPS for all OAuth redirects
3. **Token Rotation**: Implement regular token refresh cycles
4. **Access Logging**: Monitor all API access patterns
5. **Error Monitoring**: Track authentication failures and API errors

## Troubleshooting

### Common Issues

#### 1. "Google Ads OAuth2 not configured"

**Cause**: Missing environment variables
**Solution**: Ensure all required environment variables are set:
```bash
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
```

#### 2. "Invalid redirect URI"

**Cause**: Redirect URI not registered in Google Cloud Console
**Solution**: Add the exact callback URL to your OAuth2 credentials:
```
https://your-domain.com/api/v1/auth/google-ads/callback
```

#### 3. "Developer token not approved"

**Cause**: Google Ads developer token is pending approval
**Solution**: Wait for Google's approval or use test account for development

#### 4. "Token expired" errors

**Cause**: Access token has expired and refresh failed
**Solution**: Check refresh token validity and re-authenticate if necessary

#### 5. "Rate limit exceeded"

**Cause**: Too many API requests
**Solution**: The service automatically implements exponential backoff, but reduce request frequency if persistent

### Debug Mode

Enable debug logging for troubleshooting:

```python
import logging
logging.getLogger('services.googleAds').setLevel(logging.DEBUG)
```

### Health Check

Test the integration status:

```bash
curl -X GET "https://your-domain.com/api/v1/auth/google-ads/status" \
  -H "Authorization: Bearer your_jwt_token"
```

## Development Setup

### Local Development

1. **Install Dependencies**:
   ```bash
   pip install google-ads google-auth-oauthlib
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Google Ads credentials
   ```

3. **Run Database Migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Test Authentication Flow**:
   ```bash
   python -m pytest tests/test_google_ads_auth.py -v
   ```

### Testing

The integration includes comprehensive test coverage:

- **Unit Tests**: Mock-based testing of all components
- **Integration Tests**: End-to-end OAuth flow testing
- **Error Handling**: Comprehensive error scenario testing
- **Security Tests**: Token encryption and access control validation

Run tests:
```bash
# All Google Ads tests
pytest tests/test_google_ads* -v

# Specific test file
pytest tests/test_google_ads_auth.py::TestGoogleAdsAuthService -v
```

## Monitoring

### Metrics to Track

- **Authentication Success Rate**: OAuth completion percentage
- **Token Refresh Rate**: Automatic refresh frequency
- **API Request Volume**: Daily/hourly request counts
- **Error Rates**: Failed authentication and API calls
- **Response Times**: API call performance metrics

### Alerting

Set up alerts for:

- **Authentication Failures**: Failed OAuth attempts
- **Token Expiration**: Refresh token about to expire
- **API Quota Exceeded**: Near rate limit thresholds
- **Service Degradation**: High error rates or slow responses

## Support

For additional support with Google Ads integration:

1. **Google Ads API Documentation**: https://developers.google.com/google-ads/api/docs
2. **OAuth2 Flow Documentation**: https://developers.google.com/identity/protocols/oauth2
3. **War Room Support**: Contact your system administrator
4. **Error Logs**: Check application logs for detailed error information

---

*This documentation covers the complete Google Ads OAuth2 integration for the War Room platform. For additional technical details, see the source code and inline documentation.*