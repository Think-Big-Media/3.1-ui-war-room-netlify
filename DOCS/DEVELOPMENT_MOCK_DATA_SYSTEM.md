# Development Mock Data System

The War Room mock data system provides realistic Meta Business API responses for development and testing without requiring actual Meta API access or credentials.

## Overview

### Benefits

✅ **No API Credentials Required** - Develop without Meta app setup  
✅ **No Rate Limits** - Test without API quota concerns  
✅ **Consistent Data** - Predictable responses for reliable testing  
✅ **Error Simulation** - Test error handling scenarios safely  
✅ **Fast Development** - No network latency or API dependencies  
✅ **Offline Work** - Develop without internet connection  

### Features

- **Realistic Data**: Mock responses based on actual Meta API structure
- **Multiple Scenarios**: Success, errors, rate limiting, empty data
- **Configurable Delays**: Simulate API response times
- **Relationship Consistency**: Connected accounts, campaigns, and insights
- **Dynamic Generation**: Data varies by user for testing
- **Easy Switching**: Toggle between mock and real API

## Quick Start

### 1. Environment Configuration

**Development Mode (Automatic Mock)**:
```bash
# .env file
ENVIRONMENT=development
DEBUG=true
# No META_APP_ID or META_APP_SECRET needed
```

**Force Mock Mode**:
```bash
# .env file
FORCE_MOCK_META=true
MOCK_META_SCENARIO=success
```

### 2. Basic Usage

```python
from services.meta.meta_service_factory import get_meta_service

# Get service (automatically uses mock in development)
meta_service = get_meta_service(user_id="dev_user_123")

# Use exactly like real Meta API service
oauth_result = await meta_service.handle_oauth_callback(
    code="test_code",
    redirect_uri="http://localhost:8000/callback",
    user_id="dev_user_123"
)

accounts = await meta_service.get_ad_accounts("dev_user_123")
```

### 3. Development Utilities

```python
from services.meta.meta_service_factory import DevMetaService

# Switch to different scenarios
DevMetaService.use_mock("rate_limited")
DevMetaService.use_mock("no_ad_accounts")
DevMetaService.use_mock("success")

# Test current configuration
DevMetaService.test_service()

# List all available scenarios
DevMetaService.list_scenarios()
```

## Available Mock Scenarios

### 1. **Success** (Default)
```python
MOCK_META_SCENARIO=success
```
- ✅ All API calls succeed
- ✅ Returns realistic campaign data
- ✅ 6 mock ad accounts with campaigns
- ✅ Historical insights data
- ⏱️ 300ms response delay

### 2. **Rate Limited**
```python
MOCK_META_SCENARIO=rate_limited
```
- ⚠️ Returns rate limit errors after 50 calls
- 📊 Tests rate limiting handling
- 🔄 Includes retry-after headers
- ⏱️ 300ms response delay

### 3. **Network Errors**
```python
MOCK_META_SCENARIO=unreliable
```
- ❌ 20% of calls fail with network errors
- 🌐 Simulates connectivity issues
- 🔄 Tests error recovery logic
- ⏱️ 1000ms response delay

### 4. **No Permissions**
```python
MOCK_META_SCENARIO=no_permissions
```
- 🚫 Returns 403 Forbidden errors
- 🔐 Tests permission error handling
- 📝 Simulates insufficient app permissions
- ⏱️ 500ms response delay

### 5. **Empty Account**
```python
MOCK_META_SCENARIO=empty_account
```
- 📭 Returns no ad accounts
- 🆕 Tests new user experience
- 🎯 Tests empty state handling
- ⏱️ 300ms response delay

### 6. **Slow API**
```python
MOCK_META_SCENARIO=slow_api
```
- 🐌 2-second response delays
- ⏰ Tests timeout handling
- 🔄 Tests loading states
- ✅ All calls succeed

## Mock Data Structure

### Ad Accounts
```json
{
  "id": "act_1000000001",
  "account_id": "1000000001", 
  "name": "Presidential Campaign 2024",
  "account_status": 1,
  "currency": "USD",
  "timezone_name": "America/New_York",
  "amount_spent": "45000.50",
  "balance": "25000.00",
  "spend_cap": "200000.00",
  "created_time": "2024-01-15T10:30:00Z",
  "business": {
    "id": "business_0",
    "name": "Presidential Campaign 2024 Organization"
  }
}
```

### Campaigns
```json
{
  "id": "campaign_act_1000000001_0",
  "account_id": "act_1000000001",
  "name": "Presidential Campaign 2024 - Awareness Campaign 1",
  "objective": "REACH",
  "status": "ACTIVE",
  "created_time": "2024-07-01T09:00:00Z",
  "start_time": "2024-07-01T09:00:00Z",
  "daily_budget": "500.00",
  "lifetime_budget": "15000.00",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP"
}
```

### Campaign Insights
```json
{
  "campaign_id": "campaign_act_1000000001_0",
  "date_start": "2024-08-01",
  "date_stop": "2024-08-01", 
  "spend": "425.50",
  "impressions": "12500",
  "clicks": "180",
  "reach": "10200",
  "frequency": "1.23",
  "ctr": "1.44",
  "cpm": "34.04",
  "cpp": "0.042",
  "actions": [
    {"action_type": "link_click", "value": "75"},
    {"action_type": "post_engagement", "value": "32"}
  ]
}
```

## Integration Examples

### FastAPI Endpoint Integration

```python
from fastapi import APIRouter, Depends, HTTPException
from services.meta.meta_service_factory import get_meta_service

router = APIRouter()

@router.get("/meta/accounts")
async def get_meta_accounts(
    user_id: str = Depends(get_current_user_id)
):
    """Get user's Meta ad accounts (works with mock or real API)."""
    try:
        meta_service = get_meta_service(user_id)
        accounts = await meta_service.get_ad_accounts(user_id)
        
        return {
            "accounts": accounts["data"],
            "total": len(accounts["data"]),
            "service_info": get_service_info()  # Shows if using mock
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/meta/auth/callback") 
async def handle_meta_callback(
    callback_data: OAuthCallbackRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Handle Meta OAuth callback (works with mock or real API)."""
    meta_service = get_meta_service(user_id)
    
    result = await meta_service.handle_oauth_callback(
        code=callback_data.code,
        redirect_uri=callback_data.redirect_uri,
        user_id=user_id
    )
    
    return result
```

### Frontend Integration

```typescript
// No changes needed in frontend - API responses are identical
const fetchMetaAccounts = async () => {
  const response = await fetch('/api/v1/meta/accounts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Data structure is identical whether using mock or real API
  setAdAccounts(data.accounts);
  
  // Optional: Show service info in development
  if (data.service_info?.is_mock) {
    console.log('🔧 Using mock Meta API data');
  }
};
```

### Testing Integration

```python
import pytest
from services.meta.meta_service_factory import MetaServiceFactory

@pytest.fixture
async def mock_meta_service():
    """Fixture providing mock Meta service for testing."""
    factory = MetaServiceFactory.create_for_testing("success")
    return factory.create_service("test_user")

@pytest.mark.asyncio
async def test_oauth_flow(mock_meta_service):
    """Test OAuth callback handling."""
    result = await mock_meta_service.handle_oauth_callback(
        code="test_code",
        redirect_uri="http://localhost:8000/callback",
        user_id="test_user"
    )
    
    assert result["access_token"].startswith("mock_token_")
    assert result["user_id"] == "test_user"

@pytest.mark.asyncio
async def test_ad_accounts_retrieval(mock_meta_service):
    """Test ad accounts retrieval."""
    accounts = await mock_meta_service.get_ad_accounts("test_user")
    
    assert len(accounts["data"]) > 0
    assert accounts["data"][0]["currency"] == "USD"

@pytest.mark.asyncio
async def test_rate_limiting_scenario():
    """Test rate limiting error handling."""
    factory = MetaServiceFactory.create_for_testing("rate_limited")
    service = factory.create_service("test_user")
    
    # Make requests to trigger rate limiting
    with pytest.raises(HTTPException) as exc_info:
        for _ in range(60):  # Exceed rate limit threshold
            await service.get_ad_accounts("test_user")
    
    assert exc_info.value.status_code == 429
```

## Development Workflow

### 1. **Initial Development**
```bash
# Start with mock data - no setup required
ENVIRONMENT=development
MOCK_META_SCENARIO=success

# Develop features using mock API
npm run dev  # Frontend
uvicorn main:app --reload  # Backend
```

### 2. **Error Scenario Testing**
```python
# Test different error conditions
DevMetaService.use_mock("rate_limited")
DevMetaService.use_mock("no_permissions")
DevMetaService.use_mock("empty_account")

# Verify error handling works correctly
DevMetaService.test_service()
```

### 3. **Performance Testing**
```python
# Test with slow API responses
DevMetaService.use_mock("slow_api")

# Test with unreliable network
DevMetaService.use_mock("unreliable")
```

### 4. **Production Readiness**
```bash
# Test with real Meta API (requires credentials)
META_APP_ID=your_real_app_id
META_APP_SECRET=your_real_app_secret
FORCE_MOCK_META=false

# Verify real API integration works
DevMetaService.use_real()
DevMetaService.test_service()
```

## Configuration Options

### Environment Variables

```bash
# Service Selection
ENVIRONMENT=development|staging|production
FORCE_MOCK_META=true|false
TESTING=true|false

# Mock Configuration  
MOCK_META_SCENARIO=success|rate_limited|unreliable|no_permissions|empty_account|slow_api
META_RATE_LIMIT_ENABLED=true|false

# Real API Configuration (when not using mock)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_API_VERSION=v18.0

# Development Settings
DEBUG=true|false
API_BASE_URL=http://localhost:8000
```

### Programmatic Configuration

```python
from services.meta.mock_meta_service import MockConfig, MockScenario

# Custom mock configuration
config = MockConfig(
    scenario=MockScenario.SUCCESS,
    response_delay=0.1,  # Fast responses for testing
    failure_rate=0.05    # 5% failure rate
)

mock_service = MockMetaService(config)
```

## Custom Mock Data

### Adding New Scenarios

```python
# In mock_meta_service.py
MOCK_SCENARIOS["custom_scenario"] = MockConfig(
    scenario=MockScenario.SUCCESS,
    response_delay=0.5,
    failure_rate=0.0
    # Add custom parameters
)
```

### Modifying Mock Data

```python
class CustomMockMetaService(MockMetaService):
    """Custom mock service with modified data."""
    
    def _generate_mock_ad_accounts(self):
        """Override to provide custom account data."""
        return [
            {
                "id": "act_custom_001",
                "name": "Custom Campaign Account",
                "currency": "USD",
                # ... custom account data
            }
        ]
```

### Adding Mock Data Sources

```python
# Load mock data from JSON files
import json

with open("mock_data/campaigns.json") as f:
    custom_campaigns = json.load(f)

mock_service._mock_campaigns = custom_campaigns
```

## Best Practices

### 1. **Use Mock by Default**
- Keep `FORCE_MOCK_META=true` in development
- Only use real API when testing integration
- Prevents accidental API usage/charges

### 2. **Test Error Scenarios**
- Test all error scenarios before production
- Verify error handling and user experience
- Use appropriate mock scenarios for testing

### 3. **Keep Data Realistic**
- Use representative campaign names
- Use realistic spend amounts and metrics
- Match actual Meta API response structure

### 4. **Version Control**
- Never commit real API credentials
- Include mock configuration in version control
- Document scenario usage in team workflows

### 5. **CI/CD Integration**
```yaml
# GitHub Actions example
- name: Test with Mock Meta API
  env:
    FORCE_MOCK_META: true
    MOCK_META_SCENARIO: success
  run: pytest tests/test_meta_integration.py
```

## Troubleshooting

### Issue: Mock Service Not Used

**Problem**: Real API is being called despite configuration
**Solution**:
```bash
# Force mock usage
export FORCE_MOCK_META=true
export MOCK_META_SCENARIO=success

# Clear any cached instances
python -c "from services.meta.meta_service_factory import _default_factory; _default_factory.clear_cache() if _default_factory else None"
```

### Issue: Inconsistent Mock Data

**Problem**: Mock responses vary between calls
**Solution**: Use consistent user IDs for predictable data
```python
# Consistent data for same user
service1 = get_meta_service("user_123")
service2 = get_meta_service("user_123")  # Same data

# Different data for different users  
service3 = get_meta_service("user_456")  # Different data
```

### Issue: Mock Scenarios Not Working

**Problem**: Scenario configuration not taking effect
**Solution**:
```python
# Check current configuration
from services.meta.meta_service_factory import get_service_info
print(get_service_info())

# Reconfigure scenario
DevMetaService.use_mock("rate_limited")
```

### Issue: Missing Mock Data

**Problem**: Empty responses or missing fields
**Solution**: Check mock data generation methods and ensure all required fields are included

## Integration with Real Meta API

### Development → Staging Transition

```python
# 1. Test with mock data
DevMetaService.use_mock("success")
result = await test_oauth_flow()

# 2. Test with real API (staging credentials)
os.environ["META_APP_ID"] = "staging_app_id"
os.environ["META_APP_SECRET"] = "staging_app_secret"
DevMetaService.use_real()
result = await test_oauth_flow()

# 3. Deploy to staging with real API
```

### Production Deployment

```bash
# Production environment variables
META_APP_ID=production_app_id
META_APP_SECRET=production_app_secret
ENVIRONMENT=production
FORCE_MOCK_META=false  # Ensure real API is used
```

## Support and Maintenance

### Monitoring Mock Usage

```python
# Add logging to track mock usage
import logging

logger = logging.getLogger(__name__)

# In service factory
if config.is_mock_mode:
    logger.info(f"Using mock Meta API service (scenario: {config.mock_scenario})")
else:
    logger.info("Using real Meta API service")
```

### Updating Mock Data

- **Regular Updates**: Keep mock data current with Meta API changes
- **Version Compatibility**: Ensure mock responses match API version
- **Field Updates**: Add new fields when Meta API is updated
- **Scenario Updates**: Add new error scenarios as needed

---

**Next Steps**: After development is complete with mock data, follow the META_ENVIRONMENT_SETUP.md guide to configure real Meta API access for production deployment.

**Support**: For questions about the mock data system, contact dev@wethinkbig.io

**Last Updated**: August 7, 2024  
**Version**: 1.0