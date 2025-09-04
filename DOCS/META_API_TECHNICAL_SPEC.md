# Meta Business API Technical Specification

## API Integration Overview

War Room integrates with Meta Business API v18.0 to provide unified campaign analytics for political campaigns and advocacy organizations.

## Authentication Flow

### OAuth2 Implementation

```python
# Authorization URL Generation
def generate_auth_url(state: str) -> str:
    params = {
        'client_id': META_APP_ID,
        'redirect_uri': 'https://war-room-oa9t.onrender.com/auth/callback',
        'scope': 'ads_read,business_management,pages_read_engagement',
        'response_type': 'code',
        'state': state
    }
    
    return f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode(params)}"
```

### Token Exchange

```python
# Exchange authorization code for access token
async def exchange_code_for_token(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            'https://graph.facebook.com/v18.0/oauth/access_token',
            params={
                'client_id': META_APP_ID,
                'client_secret': META_APP_SECRET,
                'redirect_uri': REDIRECT_URI,
                'code': code
            }
        )
        return response.json()
```

## API Endpoints

### Authentication Endpoints

#### POST /api/v1/meta/auth/callback
**Purpose**: Handle OAuth callback and exchange code for token

**Request**:
```json
{
  "code": "authorization_code_from_meta",
  "redirect_uri": "https://war-room-oa9t.onrender.com/auth/callback"
}
```

**Response**:
```json
{
  "access_token": "encrypted_token",
  "token_type": "bearer",
  "expires_in": 5184000,
  "account_id": "act_123456789",
  "user_id": "user_uuid"
}
```

#### GET /api/v1/meta/auth/status
**Purpose**: Check current authentication status

**Response**:
```json
{
  "authenticated": true,
  "account_id": "act_123456789",
  "expires_at": "2024-10-07T12:00:00Z"
}
```

#### DELETE /api/v1/meta/auth/disconnect
**Purpose**: Revoke Meta access and delete stored tokens

**Response**:
```json
{
  "status": "success",
  "message": "Meta account disconnected"
}
```

### Data Retrieval Endpoints

#### GET /api/v1/meta/accounts
**Purpose**: Retrieve user's accessible ad accounts

**Response**:
```json
{
  "accounts": [
    {
      "id": "act_123456789",
      "name": "Campaign Account",
      "account_id": "123456789",
      "account_status": 1,
      "currency": "USD",
      "timezone_name": "America/New_York",
      "amount_spent": "1000.50",
      "balance": "2000.00"
    }
  ],
  "selected_account_id": "123456789"
}
```

#### GET /api/v1/meta/campaigns
**Purpose**: Get campaigns for selected ad account

**Query Parameters**:
- `account_id`: Ad account ID
- `date_range`: Date range for metrics (optional)
- `limit`: Number of campaigns to return (default: 25)

**Response**:
```json
{
  "data": [
    {
      "id": "campaign_id",
      "name": "Campaign Name",
      "status": "ACTIVE",
      "objective": "REACH",
      "insights": {
        "impressions": "10000",
        "clicks": "500",
        "spend": "100.00",
        "cpm": "10.00",
        "ctr": "5.0"
      }
    }
  ],
  "paging": {
    "next": "next_page_cursor"
  }
}
```

## Data Fields Accessed

### Ad Account Fields
```python
AD_ACCOUNT_FIELDS = [
    'id',
    'name', 
    'account_id',
    'account_status',
    'currency',
    'timezone_name',
    'amount_spent',
    'balance'
]
```

### Campaign Insight Fields
```python
CAMPAIGN_INSIGHT_FIELDS = [
    'campaign_name',
    'impressions',
    'clicks',
    'spend',
    'reach',
    'frequency',
    'cpm',
    'cpc',
    'ctr',
    'conversions',
    'conversion_rate_ranking',
    'quality_ranking',
    'engagement_rate_ranking'
]
```

### Audience Breakdown Fields
```python
AUDIENCE_BREAKDOWN_FIELDS = [
    'age',
    'gender',
    'country',
    'region',
    'impressions',
    'clicks',
    'spend'
]
```

## Rate Limiting

### Implementation
```python
import asyncio
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, calls_per_hour: int = 200):
        self.calls_per_hour = calls_per_hour
        self.calls = []
    
    async def acquire(self):
        now = datetime.utcnow()
        # Remove calls older than 1 hour
        self.calls = [call for call in self.calls if now - call < timedelta(hours=1)]
        
        if len(self.calls) >= self.calls_per_hour:
            # Wait until we can make another call
            oldest_call = min(self.calls)
            wait_time = 3600 - (now - oldest_call).total_seconds()
            await asyncio.sleep(wait_time)
        
        self.calls.append(now)
```

### Rate Limit Headers
```python
# Check rate limit headers in response
def check_rate_limits(response_headers: dict):
    usage = response_headers.get('x-business-use-case-usage')
    if usage:
        usage_data = json.loads(usage)
        for account_id, limits in usage_data.items():
            call_count = limits.get('call_count', 0)
            total_cputime = limits.get('total_cputime', 0)
            
            # Log if approaching limits
            if call_count > 180:  # 90% of 200 limit
                logger.warning(f"Approaching call limit: {call_count}/200")
```

## Error Handling

### Common Error Responses
```python
# Meta API Error Response Format
{
    "error": {
        "message": "Error description",
        "type": "OAuthException",
        "code": 190,
        "error_subcode": 463,
        "fbtrace_id": "trace_id"
    }
}
```

### Error Handling Implementation
```python
class MetaAPIError(Exception):
    def __init__(self, error_data: dict):
        self.code = error_data.get('code')
        self.subcode = error_data.get('error_subcode')
        self.message = error_data.get('message')
        self.type = error_data.get('type')
        super().__init__(self.message)

async def make_api_request(url: str, params: dict):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            
            if response.status_code != 200:
                error_data = response.json().get('error', {})
                
                if error_data.get('code') == 190:  # Invalid token
                    # Attempt token refresh
                    await refresh_access_token()
                    # Retry request
                    response = await client.get(url, params=params)
                
                if response.status_code != 200:
                    raise MetaAPIError(error_data)
            
            return response.json()
            
    except httpx.RequestError as e:
        logger.error(f"Network error: {e}")
        raise MetaAPIError({'message': 'Network error occurred'})
```

## Data Security

### Token Encryption
```python
from cryptography.fernet import Fernet

class TokenEncryption:
    def __init__(self):
        self.key = os.getenv('ENCRYPTION_KEY').encode()
        self.cipher = Fernet(self.key)
    
    def encrypt_token(self, token: str) -> bytes:
        return self.cipher.encrypt(token.encode())
    
    def decrypt_token(self, encrypted_token: bytes) -> str:
        return self.cipher.decrypt(encrypted_token).decode()
```

### Secure Storage
```python
async def store_encrypted_token(user_id: str, token_data: dict):
    encrypted_data = encrypt_token(json.dumps(token_data))
    
    await redis_client.setex(
        f"meta_token:{user_id}",
        token_data.get('expires_in', 3600),
        encrypted_data
    )
```

## Webhook Implementation

### Deauthorization Webhook
```python
@router.post("/webhooks/meta/deauth")
async def handle_deauthorization(request: Request):
    """Handle user deauthorization webhook from Meta"""
    
    # Verify webhook signature
    signature = request.headers.get('X-Hub-Signature-256')
    body = await request.body()
    
    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    data = await request.json()
    user_id = data.get('user_id')
    
    if user_id:
        # Remove stored tokens for deauthorized user
        await redis_client.delete(f"meta_token:{user_id}")
        logger.info(f"Deauthorized user {user_id}")
    
    return {"status": "success"}

def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Meta webhook signature"""
    import hmac
    import hashlib
    
    expected_signature = hmac.new(
        META_APP_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected_signature}", signature)
```

## Data Processing Pipeline

### Analytics Data Flow
```python
class MetaDataProcessor:
    async def fetch_campaign_data(self, account_id: str, date_range: dict):
        """Fetch and process campaign data"""
        
        # Fetch campaigns
        campaigns = await self.get_campaigns(account_id)
        
        # Fetch insights for each campaign
        insights_data = []
        for campaign in campaigns:
            insights = await self.get_campaign_insights(
                campaign['id'], 
                date_range
            )
            insights_data.append({
                'campaign': campaign,
                'insights': insights
            })
        
        # Process and normalize data
        normalized_data = self.normalize_insights_data(insights_data)
        
        # Store in database
        await self.store_insights(account_id, normalized_data)
        
        return normalized_data
    
    def normalize_insights_data(self, raw_data: list) -> list:
        """Normalize insights data for consistent reporting"""
        normalized = []
        
        for item in raw_data:
            campaign = item['campaign']
            insights = item['insights']
            
            normalized.append({
                'campaign_id': campaign['id'],
                'campaign_name': campaign['name'],
                'impressions': int(insights.get('impressions', 0)),
                'clicks': int(insights.get('clicks', 0)),
                'spend': float(insights.get('spend', 0)),
                'cpm': float(insights.get('cpm', 0)),
                'cpc': float(insights.get('cpc', 0)),
                'ctr': float(insights.get('ctr', 0)),
                'date_range': insights.get('date_start', ''),
                'updated_at': datetime.utcnow().isoformat()
            })
        
        return normalized
```

## Monitoring and Logging

### API Usage Monitoring
```python
import structlog

logger = structlog.get_logger()

class APIMonitor:
    def __init__(self):
        self.metrics = {
            'total_calls': 0,
            'successful_calls': 0,
            'failed_calls': 0,
            'rate_limit_hits': 0
        }
    
    def log_api_call(self, endpoint: str, success: bool, response_time: float):
        self.metrics['total_calls'] += 1
        
        if success:
            self.metrics['successful_calls'] += 1
        else:
            self.metrics['failed_calls'] += 1
        
        logger.info(
            "meta_api_call",
            endpoint=endpoint,
            success=success,
            response_time=response_time,
            total_calls=self.metrics['total_calls']
        )
    
    def log_rate_limit_hit(self, account_id: str):
        self.metrics['rate_limit_hits'] += 1
        logger.warning(
            "meta_rate_limit_hit",
            account_id=account_id,
            total_hits=self.metrics['rate_limit_hits']
        )
```

## Testing

### Unit Tests
```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_oauth_callback_success():
    """Test successful OAuth callback handling"""
    
    # Mock successful token exchange
    with patch('httpx.AsyncClient') as mock_client:
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            'access_token': 'test_token',
            'expires_in': 3600
        }
        mock_response.status_code = 200
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        
        # Test callback handler
        result = await exchange_code_for_token('test_code')
        
        assert result['access_token'] == 'test_token'
        assert result['expires_in'] == 3600

@pytest.mark.asyncio
async def test_api_error_handling():
    """Test API error handling"""
    
    with patch('httpx.AsyncClient') as mock_client:
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            'error': {
                'message': 'Invalid token',
                'code': 190
            }
        }
        mock_response.status_code = 401
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        
        with pytest.raises(MetaAPIError) as exc_info:
            await make_api_request('test_url', {})
        
        assert exc_info.value.code == 190
```

### Integration Tests
```python
@pytest.mark.integration
async def test_full_oauth_flow():
    """Test complete OAuth flow integration"""
    
    # This test would require actual Meta credentials
    # and should only run in staging environment
    
    if not os.getenv('META_TEST_APP_ID'):
        pytest.skip("Meta test credentials not available")
    
    # Test OAuth flow with test credentials
    # Verify token storage and retrieval
    # Test API calls with stored token
```

## Performance Optimization

### Caching Strategy
```python
from functools import wraps
import json

def cache_result(ttl_seconds: int = 300):
    """Cache API results in Redis"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"meta_cache:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = await redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await redis_client.setex(cache_key, ttl_seconds, json.dumps(result))
            
            return result
        return wrapper
    return decorator

@cache_result(ttl_seconds=600)  # Cache for 10 minutes
async def get_campaign_insights(campaign_id: str, date_range: dict):
    """Cached campaign insights retrieval"""
    # Implementation here
    pass
```

### Batch Processing
```python
async def batch_fetch_insights(campaign_ids: list, date_range: dict):
    """Fetch insights for multiple campaigns in batch"""
    
    # Split into batches of 50 (Meta's limit)
    batch_size = 50
    batches = [campaign_ids[i:i + batch_size] 
               for i in range(0, len(campaign_ids), batch_size)]
    
    all_insights = []
    for batch in batches:
        # Create batch request
        batch_requests = []
        for campaign_id in batch:
            batch_requests.append({
                'method': 'GET',
                'relative_url': f"{campaign_id}/insights",
                'parameters': urlencode(date_range)
            })
        
        # Execute batch request
        batch_response = await make_batch_request(batch_requests)
        all_insights.extend(batch_response)
        
        # Respect rate limits
        await asyncio.sleep(1)
    
    return all_insights
```

---

**API Version**: v18.0  
**Last Updated**: August 7, 2024  
**Compatibility**: Facebook Graph API v18.0+