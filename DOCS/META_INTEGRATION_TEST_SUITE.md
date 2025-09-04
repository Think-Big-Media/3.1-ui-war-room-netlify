# Meta Integration Test Suite

This comprehensive test suite validates the Meta Business API integration before app review submission.

## Prerequisites

- [ ] Meta app created and configured
- [ ] Development environment set up
- [ ] Test user account with ad permissions
- [ ] All environment variables configured

## Automated Test Suite

### Running All Tests

```bash
# Run all Meta integration tests
cd src/backend
pytest tests/test_meta_integration.py -v

# Run with coverage
pytest tests/test_meta_integration.py --cov=app.api.endpoints.meta_auth --cov-report=html

# Run only integration tests (requires network access)
pytest tests/test_meta_integration.py -m "integration" -v

# Run performance tests
pytest tests/test_meta_integration.py -m "performance" -v
```

### Test Categories

#### 1. OAuth Flow Tests
```bash
pytest tests/test_meta_integration.py::TestMetaOAuthFlow -v
```
- ✅ Authorization URL generation
- ✅ Successful OAuth callback handling
- ✅ Invalid authorization code handling
- ✅ Token refresh functionality
- ✅ Authentication status checking

#### 2. API Endpoint Tests
```bash
pytest tests/test_meta_integration.py::TestMetaAPIEndpoints -v
```
- ✅ Ad accounts retrieval
- ✅ Unauthenticated access handling
- ✅ Rate limiting compliance
- ✅ Error response handling

#### 3. Security Tests
```bash
pytest tests/test_meta_integration.py::TestDataSecurity -v
```
- ✅ Token encryption/decryption
- ✅ Secure Redis storage
- ✅ Webhook signature verification

#### 4. Error Handling Tests
```bash
pytest tests/test_meta_integration.py::TestErrorHandling -v
```
- ✅ Network error recovery
- ✅ Invalid token automatic refresh
- ✅ API error response handling

## Manual Test Procedures

### 1. OAuth Flow Manual Test

#### Test Steps:
1. **Start development server**:
   ```bash
   cd src/backend
   uvicorn main:app --reload --port 8000
   ```

2. **Access OAuth URL**:
   ```
   http://localhost:8000/api/v1/meta/auth/redirect
   ```

3. **Verify authorization page**:
   - Facebook login page appears
   - App name "War Room Analytics" is displayed
   - Requested permissions are listed correctly
   - Privacy Policy link works

4. **Complete authorization**:
   - Log in with test user account
   - Grant requested permissions
   - Verify redirect to callback URL
   - Check for success response

#### Expected Results:
- ✅ OAuth URL generates correctly
- ✅ Facebook authorization page loads
- ✅ Callback receives authorization code
- ✅ Access token is retrieved and stored
- ✅ User ad accounts are fetched

### 2. API Data Retrieval Test

#### Test Ad Accounts Endpoint:
```bash
# With authentication token
curl -X GET "http://localhost:8000/api/v1/meta/accounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "accounts": [
    {
      "id": "act_123456789",
      "name": "Test Campaign Account",
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

#### Test Campaign Data:
```bash
curl -X GET "http://localhost:8000/api/v1/meta/campaigns" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -G -d "account_id=act_123456789"
```

### 3. Security Validation Test

#### Test Token Security:
```python
# Run in Python shell
from services.meta_service import TokenEncryption

encryption = TokenEncryption()
test_token = "EAABwzLixnjYBAJxzK..."

# Test encryption
encrypted = encryption.encrypt_token(test_token)
print(f"Encrypted: {encrypted}")

# Test decryption
decrypted = encryption.decrypt_token(encrypted)
print(f"Decrypted matches: {decrypted == test_token}")
```

#### Test Webhook Signature:
```bash
# Send test webhook
curl -X POST "http://localhost:8000/api/v1/webhooks/meta/deauth" \
  -H "X-Hub-Signature-256: sha256=calculated_signature" \
  -d '{"user_id": "123456", "algorithm": "HMAC-SHA256"}'
```

### 4. Error Handling Test

#### Test Rate Limiting:
```bash
# Send rapid requests to trigger rate limiting
for i in {1..100}; do
  curl -X GET "http://localhost:8000/api/v1/meta/accounts" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" &
done
wait
```

#### Test Invalid Token Handling:
```python
# Manually expire token in Redis and test API call
import redis
r = redis.Redis()
r.delete("meta_token:user_id")

# Then make API call - should handle gracefully
```

### 5. Privacy Compliance Test

#### Test Data Export:
```bash
curl -X GET "http://localhost:8000/api/v1/user/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Test Account Deletion:
```bash
curl -X DELETE "http://localhost:8000/api/v1/meta/auth/disconnect" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Verify Data Deletion:
```python
# Check Redis for remaining tokens
import redis
r = redis.Redis()
keys = r.keys("meta_token:*")
print(f"Remaining tokens: {len(keys)}")
```

## Load Testing

### Concurrent User Test
```python
import asyncio
import aiohttp
import time

async def test_concurrent_oauth():
    """Test concurrent OAuth flows."""
    
    async def oauth_flow(session, user_id):
        # Simulate OAuth flow for user
        start_time = time.time()
        
        try:
            async with session.post(
                "http://localhost:8000/api/v1/meta/auth/callback",
                json={
                    "code": f"test_code_{user_id}",
                    "redirect_uri": "http://localhost:8000/callback"
                },
                headers={"Authorization": f"Bearer test_token_{user_id}"}
            ) as response:
                result = await response.json()
                end_time = time.time()
                return {
                    "user_id": user_id,
                    "success": response.status == 200,
                    "duration": end_time - start_time,
                    "response": result
                }
        except Exception as e:
            return {
                "user_id": user_id,
                "success": False,
                "error": str(e)
            }
    
    # Test with 50 concurrent users
    async with aiohttp.ClientSession() as session:
        tasks = [oauth_flow(session, i) for i in range(50)]
        results = await asyncio.gather(*tasks)
        
        success_count = sum(1 for r in results if r["success"])
        avg_duration = sum(r.get("duration", 0) for r in results) / len(results)
        
        print(f"Success rate: {success_count}/50 ({success_count/50*100:.1f}%)")
        print(f"Average duration: {avg_duration:.2f} seconds")
        
        return results

# Run the test
results = asyncio.run(test_concurrent_oauth())
```

## Pre-Submission Checklist

### Environment Validation

#### Development Environment:
- [ ] OAuth flow works with localhost redirect
- [ ] All API endpoints return expected data
- [ ] Error handling works correctly
- [ ] Token encryption/decryption functional
- [ ] Webhook signature verification works

#### Staging Environment:
- [ ] OAuth flow works with staging URL
- [ ] HTTPS redirect URIs configured
- [ ] Environment variables properly set
- [ ] Database connections functional
- [ ] Redis token storage working

#### Production Environment:
- [ ] Meta app switched to "Live" mode
- [ ] Production redirect URIs configured
- [ ] All environment variables set
- [ ] SSL certificates valid
- [ ] Privacy Policy and Terms accessible

### Security Validation

#### Data Protection:
- [ ] All tokens encrypted in storage
- [ ] HTTPS enforced for all endpoints
- [ ] No sensitive data in logs
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints

#### Privacy Compliance:
- [ ] User consent flow implemented
- [ ] Data export functionality works
- [ ] Account deletion removes all data
- [ ] Privacy policy accessible and accurate
- [ ] GDPR compliance verified

### Functional Testing

#### Core Features:
- [ ] User can connect Meta account
- [ ] Ad accounts display correctly
- [ ] Campaign data retrieves successfully
- [ ] Analytics dashboard populates
- [ ] User can disconnect account

#### Edge Cases:
- [ ] No ad accounts scenario handled
- [ ] Expired token refresh works
- [ ] Network errors handled gracefully
- [ ] Invalid permissions handled
- [ ] Rate limiting responses appropriate

## Test Results Documentation

### Test Report Template

```markdown
# Meta Integration Test Results

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Development/Staging/Production]

## Test Summary
- **Total Tests**: 47
- **Passed**: 46
- **Failed**: 1
- **Skipped**: 0

## Failed Tests
### test_concurrent_oauth_callbacks
- **Issue**: Timeout after 30 seconds
- **Root Cause**: Database connection pool exhausted
- **Resolution**: Increased connection pool size
- **Status**: Fixed and retested ✅

## Performance Results
- **OAuth Flow**: Average 0.8 seconds
- **API Calls**: Average 0.3 seconds
- **Concurrent Users**: 50 users, 98% success rate

## Security Validation
- ✅ Token encryption working
- ✅ HTTPS enforced
- ✅ Rate limiting functional
- ✅ Input validation passed

## Recommendations
1. Monitor OAuth flow performance in production
2. Set up alerts for rate limit threshold (90%)
3. Regular token cleanup job for expired tokens
```

### Continuous Testing Setup

#### GitHub Actions Integration:
```yaml
name: Meta Integration Tests
on:
  pull_request:
    paths:
      - 'src/backend/app/api/endpoints/meta_auth.py'
      - 'src/backend/tests/test_meta_integration.py'

jobs:
  test-meta-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd src/backend
          pip install -r requirements.txt
      
      - name: Run Meta integration tests
        env:
          META_APP_ID: ${{ secrets.META_TEST_APP_ID }}
          META_APP_SECRET: ${{ secrets.META_TEST_APP_SECRET }}
        run: |
          cd src/backend
          pytest tests/test_meta_integration.py -v --tb=short
```

## Troubleshooting Guide

### Common Issues

#### "Invalid Redirect URI" Error:
1. Check OAuth redirect URI matches exactly
2. Verify HTTPS in production
3. Check for trailing slashes
4. Validate domain in Meta app settings

#### "Insufficient Permissions" Error:
1. Verify app has required permissions approved
2. Check user granted all requested permissions
3. Ensure app is in correct mode (development vs live)
4. Validate token scopes

#### "Rate Limit Exceeded" Error:
1. Check current usage in App Dashboard
2. Implement exponential backoff
3. Use batch requests where possible
4. Monitor usage patterns

#### Token Refresh Failures:
1. Verify refresh token not expired
2. Check app credentials are correct
3. Ensure user hasn't revoked permissions
4. Validate token storage/retrieval

---

**Next Steps**: After all tests pass, proceed with Meta app review submission.

**Support**: For issues with tests, contact dev@wethinkbig.io

**Last Updated**: August 7, 2024