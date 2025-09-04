# Google Ads API Integration

This document provides setup instructions and usage examples for the Google Ads API integration in War Room.

## Overview

The Google Ads API integration allows War Room users to:
- Connect their Google Ads accounts via OAuth2
- Retrieve campaign, ad group, and performance data
- Execute custom GAQL queries
- Generate comprehensive reports

## Prerequisites

### 1. Google Ads API Access

1. **Google Ads Account**: You need an active Google Ads account
2. **Developer Token**: Apply for a Google Ads API developer token at [Google Ads API Center](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
3. **Google Cloud Project**: Create a project in Google Cloud Console

### 2. OAuth2 Application Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Ads API
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Add authorized redirect URIs:
   - For development: `http://localhost:8000/api/v1/auth/google-ads/callback`
   - For production: `https://your-domain.com/api/v1/auth/google-ads/callback`

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_CLIENT_ID=your_oauth_client_id_here
GOOGLE_ADS_CLIENT_SECRET=your_oauth_client_secret_here
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_login_customer_id_here  # Optional
API_BASE_URL=http://localhost:8000  # Update for production
```

### Environment Variables Explained

- **GOOGLE_ADS_DEVELOPER_TOKEN**: Your Google Ads API developer token
- **GOOGLE_ADS_CLIENT_ID**: OAuth2 client ID from Google Cloud Console
- **GOOGLE_ADS_CLIENT_SECRET**: OAuth2 client secret from Google Cloud Console
- **GOOGLE_ADS_LOGIN_CUSTOMER_ID**: (Optional) Customer ID for manager accounts
- **API_BASE_URL**: Base URL for your API server (used for OAuth2 redirects)

## Database Migration

The integration includes a new database table `google_ads_auth` for storing OAuth2 tokens. Run the database migration:

```bash
cd src/backend
alembic revision --autogenerate -m "Add Google Ads authentication table"
alembic upgrade head
```

## API Endpoints

### Authentication Endpoints

#### 1. Get Authorization URL
```http
POST /api/v1/auth/google-ads/redirect
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

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

#### 2. OAuth2 Callback
```http
GET /api/v1/auth/google-ads/callback?code=...&state=...
```

This endpoint is called automatically by Google during the OAuth flow.

#### 3. Check Authentication Status
```http
GET /api/v1/auth/google-ads/status
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
    "is_authenticated": true,
    "customer_id": "1234567890",
    "scopes": ["https://www.googleapis.com/auth/adwords"],
    "expires_at": "2024-12-31T23:59:59Z"
}
```

#### 4. Refresh Token
```http
POST /api/v1/auth/google-ads/refresh
Authorization: Bearer <your_jwt_token>
```

#### 5. Revoke Access
```http
POST /api/v1/auth/google-ads/revoke
Authorization: Bearer <your_jwt_token>
```

### Data Retrieval Endpoints

#### 1. Get Accessible Customers
```http
GET /api/v1/google-ads/customers
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
    "success": true,
    "customers": [
        {
            "customer_id": "1234567890",
            "descriptive_name": "My Campaign Account",
            "currency_code": "USD",
            "time_zone": "America/New_York",
            "is_manager": false
        }
    ],
    "count": 1
}
```

#### 2. Get Customer Details
```http
GET /api/v1/google-ads/customers/{customer_id}
Authorization: Bearer <your_jwt_token>
```

#### 3. Get Campaigns
```http
GET /api/v1/google-ads/campaigns/{customer_id}?page_size=50
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
    "success": true,
    "customer_id": "1234567890",
    "campaigns": [
        {
            "id": "987654321",
            "name": "Search Campaign",
            "status": "ENABLED",
            "advertising_channel_type": "SEARCH",
            "start_date": "2024-01-01",
            "end_date": null,
            "budget_amount_micros": 50000000,
            "delivery_method": "STANDARD",
            "optimization_goal_types": ["MAXIMIZE_CLICKS"]
        }
    ],
    "count": 1
}
```

#### 4. Get Ad Groups
```http
GET /api/v1/google-ads/ad-groups/{customer_id}?campaign_id=987654321&page_size=50
Authorization: Bearer <your_jwt_token>
```

#### 5. Get Performance Metrics
```http
POST /api/v1/google-ads/metrics/{customer_id}
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "segments": ["date", "campaign"],
    "metrics": ["impressions", "clicks", "cost_micros", "conversions"]
}
```

**Response:**
```json
{
    "success": true,
    "customer_id": "1234567890",
    "date_range": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    },
    "data": [
        {
            "date": "2024-01-01",
            "campaign_id": "987654321",
            "campaign_name": "Search Campaign",
            "impressions": 1000,
            "clicks": 50,
            "cost": 75.00,
            "conversions": 5
        }
    ],
    "count": 1
}
```

#### 6. Search Stream (Custom GAQL Queries)
```http
POST /api/v1/google-ads/search-stream?customer_id=1234567890
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
    "query": "SELECT campaign.name, metrics.clicks, metrics.impressions FROM campaign WHERE campaign.status = 'ENABLED' ORDER BY metrics.clicks DESC",
    "page_size": 100
}
```

#### 7. Account Summary Report
```http
GET /api/v1/google-ads/reports/summary/{customer_id}?days=30
Authorization: Bearer <your_jwt_token>
```

## Usage Examples

### Frontend Integration

```typescript
// 1. Initiate OAuth Flow
const initiateGoogleAdsAuth = async () => {
    const response = await fetch('/api/v1/auth/google-ads/redirect', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: 'custom_state' })
    });
    
    const data = await response.json();
    window.location.href = data.authorization_url;
};

// 2. Check Authentication Status
const checkAuthStatus = async () => {
    const response = await fetch('/api/v1/auth/google-ads/status', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return await response.json();
};

// 3. Get Campaign Data
const getCampaigns = async (customerId: string) => {
    const response = await fetch(`/api/v1/google-ads/campaigns/${customerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return await response.json();
};
```

### Backend Service Usage

```python
from services.googleAds import google_ads_service, google_ads_auth_service

# Get authenticated client
client = await google_ads_service._get_client(org_id)

# Get campaigns
campaigns = await google_ads_service.get_campaigns(org_id, customer_id)

# Execute custom query
results = await google_ads_service.search_stream(
    org_id, 
    customer_id, 
    "SELECT campaign.name, metrics.clicks FROM campaign"
)
```

## Google Ads Query Language (GAQL)

The search-stream endpoint supports GAQL for flexible data retrieval:

### Basic Query Structure
```sql
SELECT [fields] FROM [resource] WHERE [conditions] ORDER BY [field] LIMIT [number]
```

### Common Resources
- `campaign`
- `ad_group`
- `ad_group_ad`
- `keyword_view`
- `customer`

### Common Fields
- **Campaign**: `campaign.id`, `campaign.name`, `campaign.status`
- **Metrics**: `metrics.impressions`, `metrics.clicks`, `metrics.cost_micros`
- **Segments**: `segments.date`, `segments.device`, `segments.keyword.info.text`

### Example Queries

```sql
-- Get campaign performance by date
SELECT 
    campaign.name,
    segments.date,
    metrics.impressions,
    metrics.clicks,
    metrics.cost_micros
FROM campaign
WHERE segments.date BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY segments.date DESC

-- Get keyword performance
SELECT 
    ad_group.name,
    segments.keyword.info.text,
    metrics.clicks,
    metrics.impressions
FROM keyword_view
WHERE campaign.status = 'ENABLED'
ORDER BY metrics.clicks DESC

-- Get device performance
SELECT 
    segments.device,
    metrics.impressions,
    metrics.clicks
FROM campaign
WHERE segments.date = '2024-01-01'
```

## Error Handling

The API includes comprehensive error handling:

### Rate Limiting
- Automatic retry with exponential backoff
- Rate limit errors are handled gracefully
- Maximum 3 retry attempts

### Authentication Errors
- Automatic token refresh when expired
- Fallback to mock data when API unavailable
- Detailed error logging

### Common Error Responses

```json
{
    "detail": "Google Ads not connected",
    "status_code": 400
}

{
    "detail": "Failed to refresh token",
    "status_code": 400
}

{
    "detail": "Query contains prohibited keywords",
    "status_code": 400
}
```

## Mock Data Fallback

When the Google Ads API is unavailable or not configured, the service provides mock data for development and testing:

- Mock customer accounts
- Sample campaign data
- Example performance metrics
- Placeholder search results

## Security Considerations

### Token Storage
- OAuth2 tokens are encrypted in the database
- Refresh tokens are securely stored
- Access tokens are automatically refreshed

### API Security
- All endpoints require JWT authentication
- Organization-based access control
- Query validation to prevent malicious queries

### Environment Variables
- Never commit API credentials to version control
- Use separate credentials for development and production
- Regularly rotate client secrets

## Troubleshooting

### Common Issues

1. **"Google Ads OAuth2 not configured"**
   - Check that all environment variables are set
   - Verify client ID and secret are correct

2. **"Failed to refresh token"**
   - Check if refresh token is valid
   - Re-authenticate if refresh token expired

3. **"Customer not found or not accessible"**
   - Verify customer ID is correct
   - Check if user has access to the account

4. **Rate limit errors**
   - API includes automatic retry logic
   - Consider reducing request frequency

### Logging

The service includes detailed logging:
- Authentication events
- API requests and responses
- Error conditions
- Performance metrics

Check application logs for detailed error information.

## Testing

### Unit Tests
```bash
cd src/backend
pytest tests/test_google_ads_service.py -v
```

### Integration Tests
```bash
# Set test environment variables
export GOOGLE_ADS_DEVELOPER_TOKEN="test_token"
export GOOGLE_ADS_CLIENT_ID="test_client_id"
export GOOGLE_ADS_CLIENT_SECRET="test_client_secret"

pytest tests/integration/test_google_ads_api.py -v
```

## Support

For issues related to:
- **Google Ads API**: [Google Ads API Support](https://developers.google.com/google-ads/api/support)
- **OAuth2 Setup**: [Google Cloud Console Help](https://cloud.google.com/docs/authentication)
- **War Room Integration**: Contact development team

## References

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs)
- [Google Ads Query Language](https://developers.google.com/google-ads/api/docs/query/overview)
- [OAuth2 Setup Guide](https://developers.google.com/google-ads/api/docs/oauth/overview)
- [API Rate Limits](https://developers.google.com/google-ads/api/docs/best-practices/rate-limits)