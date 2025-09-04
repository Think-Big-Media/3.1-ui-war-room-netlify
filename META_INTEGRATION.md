# Meta Business Suite OAuth2 Integration Guide

[![Meta Integration](https://img.shields.io/badge/Meta-Business%20Suite-1877F2)](https://developers.facebook.com/docs/facebook-login/web/)
[![OAuth2](https://img.shields.io/badge/OAuth2-Implemented-success)](https://oauth.net/2/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://war-room-oa9t.onrender.com)

**Complete Meta Business Suite integration for War Room platform with OAuth2 authentication, campaign management, and real-time data synchronization.**

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Meta App Setup](#meta-app-setup)
- [OAuth2 Configuration](#oauth2-configuration)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [OAuth2 Flow](#oauth2-flow)
- [Frontend Integration](#frontend-integration)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Testing Guide](#testing-guide)
- [Production Deployment](#production-deployment)

## Overview

The Meta Business Suite integration provides comprehensive Facebook and Instagram advertising campaign management capabilities within the War Room platform. This integration includes:

- **🔐 Secure OAuth2 Authentication** - Complete OAuth2 flow with encrypted token storage
- **📊 Campaign Management** - Create, monitor, and analyze Meta advertising campaigns
- **🎯 Ad Account Integration** - Multi-account access and management
- **📈 Real-time Analytics** - Live campaign performance metrics and insights
- **🔄 Automatic Token Refresh** - Seamless token management and renewal
- **🛡️ Security Features** - Rate limiting, circuit breakers, and comprehensive error handling

### Architecture Overview

```
Frontend (React/TypeScript)
    ↓
Backend API (FastAPI/Python)
    ↓
Meta Business API
    ↓
Facebook/Instagram Ad Platforms
```

## Prerequisites

### Meta Developer Account Requirements

1. **Meta Developer Account**
   - Active Facebook developer account
   - Verified business identity
   - App development experience

2. **Business Manager Setup**
   - Meta Business Manager account
   - Verified business information
   - Administrative access to ad accounts

3. **App Review Preparation**
   - Privacy Policy URL
   - Terms of Service URL
   - App logo and screenshots
   - Business verification documents

### Technical Requirements

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy
- **Database**: PostgreSQL with UUID support
- **Frontend**: React 18+, TypeScript, Tailwind CSS
- **Security**: HTTPS/SSL certificates required
- **Environment**: Production domain for OAuth callbacks

## Meta App Setup

### Step 1: Create Meta App

1. **Navigate to Meta Developers**
   ```
   https://developers.facebook.com/apps/
   ```

2. **Create New App**
   - Click "Create App"
   - Select "Business" type
   - Provide app details:
     - App Name: "War Room Analytics"
     - App Contact Email: admin@warroom.app
     - Business Manager Account: Select your account

3. **Configure App Settings**
   - **App Domain**: `war-room-oa9t.onrender.com`
   - **Privacy Policy URL**: `https://war-room-oa9t.onrender.com/privacy`
   - **Terms of Service URL**: `https://war-room-oa9t.onrender.com/terms`

### Step 2: Add Facebook Login Product

1. **Add Product**
   - Go to "Add a Product"
   - Select "Facebook Login"
   - Click "Set Up"

2. **Configure OAuth Settings**
   - **Valid OAuth Redirect URIs**:
     ```
     https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback
     https://localhost:8000/api/v1/auth/meta/callback  # Development only
     ```
   - **Client OAuth Settings**:
     - Client OAuth Login: ✅ Enabled
     - Web OAuth Login: ✅ Enabled
     - Force Web OAuth Reauthentication: ✅ Enabled

### Step 3: Add Marketing API Product

1. **Add Marketing API**
   - Go to "Add a Product"
   - Select "Marketing API"
   - Complete setup wizard

2. **Configure Permissions**
   - Request the following permissions:
     - `ads_management`: Manage advertising campaigns
     - `ads_read`: Read advertising data
     - `business_management`: Access Business Manager data
     - `pages_show_list`: List managed pages
     - `pages_read_engagement`: Read page engagement data

### Step 4: App Review Process

1. **Submit for Review**
   - Provide detailed use case descriptions
   - Upload app screenshots and demo videos
   - Complete business verification
   - Submit privacy policy and terms of service

2. **Required Documentation**
   - Detailed explanation of data usage
   - Privacy policy compliance documentation
   - Security measures documentation
   - Business verification documents

## OAuth2 Configuration

### Configuration Steps

1. **Collect App Credentials**
   ```bash
   # From Meta App Dashboard > Settings > Basic
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   ```

2. **Set OAuth Endpoints**
   ```bash
   # OAuth URLs
   META_OAUTH_AUTHORIZE_URL=https://www.facebook.com/v19.0/dialog/oauth
   META_OAUTH_TOKEN_URL=https://graph.facebook.com/v19.0/oauth/access_token
   META_API_BASE_URL=https://graph.facebook.com/v19.0
   ```

3. **Configure Scopes**
   ```bash
   # Required OAuth scopes
   META_OAUTH_SCOPES=ads_management,ads_read,business_management,pages_show_list,pages_read_engagement
   ```

## Environment Variables

### Backend Configuration (.env)

```bash
# Meta OAuth2 Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_OAUTH_SCOPES=ads_management,ads_read,business_management,pages_show_list,pages_read_engagement

# OAuth URLs
META_OAUTH_AUTHORIZE_URL=https://www.facebook.com/v19.0/dialog/oauth
META_OAUTH_TOKEN_URL=https://graph.facebook.com/v19.0/oauth/access_token
META_API_BASE_URL=https://graph.facebook.com/v19.0

# Redirect URIs
META_OAUTH_REDIRECT_URI=https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback

# Security Settings
META_TOKEN_ENCRYPTION_KEY=your_encryption_key_32_chars
META_API_RATE_LIMIT_PER_MINUTE=200
META_API_CIRCUIT_BREAKER_THRESHOLD=5

# Database Configuration (if not already configured)
DATABASE_URL=postgresql://user:password@localhost:5432/warroom_db
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Frontend Configuration (.env)

```bash
# API Configuration
VITE_API_BASE_URL=https://war-room-oa9t.onrender.com/api/v1
VITE_APP_URL=https://war-room-oa9t.onrender.com

# Meta Configuration
VITE_META_APP_ID=your_meta_app_id

# Development Only
VITE_ENABLE_META_MOCK=false
```

### Production Environment Variables

Set these in your deployment platform (Render, Vercel, etc.):

```bash
# Production Meta Configuration
META_APP_ID=production_app_id
META_APP_SECRET=production_app_secret
META_OAUTH_REDIRECT_URI=https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback

# Security
META_TOKEN_ENCRYPTION_KEY=32_char_production_key
META_API_RATE_LIMIT_PER_MINUTE=100

# Database
DATABASE_URL=postgresql://prod_user:prod_password@prod_host:5432/warroom_prod
```

## API Endpoints

### Authentication Endpoints

#### POST /api/v1/auth/meta/redirect
Generate Meta OAuth2 authorization URL.

**Request:**
```json
{
  "state": "optional-state-parameter"
}
```

**Response:**
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

#### GET /api/v1/auth/meta/callback
Handle OAuth2 authorization callback.

**Query Parameters:**
- `code`: Authorization code from Meta
- `state`: State parameter for security
- `error`: Error code (if authorization failed)
- `error_description`: Human-readable error description

**Success Response:**
- Redirect to frontend with success parameters
- Sets secure authentication cookies
- Creates/updates Meta auth record

**Error Response:**
- Redirect to frontend with error parameters

#### GET /api/v1/auth/meta/status
Get current Meta authentication status.

**Response:**
```json
{
  "is_authenticated": true,
  "ad_account_id": "act_123456789",
  "business_id": "123456789012345",
  "scopes": [
    "ads_management",
    "ads_read",
    "business_management"
  ],
  "expires_at": "2025-09-08T12:00:00Z",
  "page_count": 3
}
```

**cURL Example:**
```bash
curl -X GET "https://war-room-oa9t.onrender.com/api/v1/auth/meta/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### POST /api/v1/auth/meta/refresh
Manually refresh Meta access token.

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**cURL Example:**
```bash
curl -X POST "https://war-room-oa9t.onrender.com/api/v1/auth/meta/refresh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### POST /api/v1/auth/meta/revoke
Revoke Meta Business Suite access.

**Response:**
```json
{
  "success": true,
  "message": "Meta Business Suite access revoked successfully"
}
```

**cURL Example:**
```bash
curl -X POST "https://war-room-oa9t.onrender.com/api/v1/auth/meta/revoke" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Account Management Endpoints

#### GET /api/v1/auth/meta/accounts
Get available Meta ad accounts.

**Response:**
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
      "permissions": ["ADVERTISE", "ANALYZE"]
    }
  ],
  "count": 1
}
```

**cURL Example:**
```bash
curl -X GET "https://war-room-oa9t.onrender.com/api/v1/auth/meta/accounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### POST /api/v1/auth/meta/select-account/{account_id}
Select primary ad account for organization.

**Response:**
```json
{
  "success": true,
  "message": "Selected ad account act_123456789 as primary account",
  "account_id": "act_123456789"
}
```

**cURL Example:**
```bash
curl -X POST "https://war-room-oa9t.onrender.com/api/v1/auth/meta/select-account/act_123456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Page Management Endpoints

#### GET /api/v1/auth/meta/pages/{page_id}/token
Get page access token status.

**Response:**
```json
{
  "success": true,
  "has_token": true,
  "page_id": "123456789012345"
}
```

**cURL Example:**
```bash
curl -X GET "https://war-room-oa9t.onrender.com/api/v1/auth/meta/pages/123456789012345/token" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## OAuth2 Flow

### Complete OAuth2 Implementation

#### Step 1: Initiate Authorization

```javascript
// Frontend - Start OAuth flow
const startMetaOAuth = async () => {
  try {
    const response = await fetch('/api/v1/auth/meta/redirect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        state: 'meta-integration-' + Date.now()
      })
    });
    
    const data = await response.json();
    
    // Redirect user to Meta authorization URL
    window.location.href = data.authorization_url;
  } catch (error) {
    console.error('Failed to start OAuth flow:', error);
  }
};
```

#### Step 2: Handle Authorization Response

```python
# Backend - OAuth callback handler
@router.get("/auth/meta/callback")
async def meta_oauth_callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None
):
    if error:
        # Handle OAuth error
        return RedirectResponse(
            url=f"{frontend_url}?error={error}"
        )
    
    # Exchange code for access token
    token_data = await exchange_code_for_token(code)
    
    # Store encrypted tokens in database
    await save_meta_auth_record(
        org_id=org_id,
        access_token=encrypt_token(token_data['access_token']),
        refresh_token=encrypt_token(token_data.get('refresh_token')),
        expires_at=token_data['expires_at']
    )
    
    return RedirectResponse(
        url=f"{frontend_url}?success=true"
    )
```

#### Step 3: Token Management

```python
# Backend - Automatic token refresh
async def refresh_meta_token(org_id: str) -> bool:
    try:
        # Get current auth record
        auth_record = await get_meta_auth_record(org_id)
        
        if not auth_record or not auth_record.refresh_token:
            return False
        
        # Request new access token
        refresh_data = await request_token_refresh(
            decrypt_token(auth_record.refresh_token)
        )
        
        # Update auth record
        auth_record.access_token = encrypt_token(refresh_data['access_token'])
        auth_record.token_expires_at = refresh_data['expires_at']
        await save_auth_record(auth_record)
        
        return True
        
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        return False
```

## Frontend Integration

### React Component Integration

```typescript
// MetaIntegration.tsx
import React, { useState, useEffect } from 'react';
import { metaAuthService } from '../services/metaAuthService';

const MetaIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = await metaAuthService.getAuthStatus();
      setIsConnected(status.is_authenticated);
      
      if (status.is_authenticated) {
        await loadCampaigns();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      await metaAuthService.startOAuthFlow('meta-integration');
    } catch (error) {
      console.error('OAuth flow failed:', error);
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const campaigns = await metaAuthService.getAllCampaigns();
      setCampaigns(campaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  return (
    <div className="meta-integration">
      {/* Connection UI */}
      {!isConnected ? (
        <button 
          onClick={handleConnect} 
          disabled={loading}
          className="connect-button"
        >
          {loading ? 'Connecting...' : 'Connect to Facebook'}
        </button>
      ) : (
        <div className="connected-state">
          <h3>Meta Business Suite Connected</h3>
          {/* Campaign list UI */}
        </div>
      )}
    </div>
  );
};
```

### Service Layer Implementation

```typescript
// metaAuthService.ts
export class MetaAuthService {
  private baseUrl = process.env.VITE_API_BASE_URL;

  async getAuthStatus(): Promise<AuthStatus> {
    const response = await fetch(`${this.baseUrl}/auth/meta/status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check auth status');
    }

    return response.json();
  }

  async startOAuthFlow(state: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/meta/redirect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ state }),
    });

    if (!response.ok) {
      throw new Error('Failed to start OAuth flow');
    }

    const data = await response.json();
    window.location.href = data.authorization_url;
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    const response = await fetch(`${this.baseUrl}/meta/campaigns`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    return response.json();
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export const metaAuthService = new MetaAuthService();
```

## Security Considerations

### Token Security

1. **Encryption at Rest**
   ```python
   # All tokens are encrypted before database storage
   from cryptography.fernet import Fernet
   
   def encrypt_token(token: str, key: str) -> str:
       fernet = Fernet(key.encode())
       return fernet.encrypt(token.encode()).decode()
   
   def decrypt_token(encrypted_token: str, key: str) -> str:
       fernet = Fernet(key.encode())
       return fernet.decrypt(encrypted_token.encode()).decode()
   ```

2. **Secure Storage**
   - Tokens encrypted with Fernet symmetric encryption
   - Encryption keys stored in environment variables
   - Database fields use encrypted string types
   - No tokens exposed in logs or error messages

### API Security

1. **Rate Limiting**
   ```python
   # API rate limiting configuration
   META_API_RATE_LIMITS = {
       'default': '100/minute',
       'burst': '20/second',
       'campaigns': '50/minute',
       'insights': '30/minute'
   }
   ```

2. **Circuit Breaker Pattern**
   ```python
   class MetaAPICircuitBreaker:
       def __init__(self, failure_threshold=5, reset_timeout=60):
           self.failure_threshold = failure_threshold
           self.reset_timeout = reset_timeout
           self.failure_count = 0
           self.last_failure_time = None
           self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
   ```

3. **Request Validation**
   - All API requests validated using Pydantic models
   - SQL injection prevention with parameterized queries
   - Cross-site scripting (XSS) protection
   - CSRF protection for state parameters

### Privacy Protection

1. **Data Minimization**
   - Only request necessary OAuth scopes
   - Store minimal required user data
   - Implement data retention policies
   - Provide data deletion capabilities

2. **GDPR Compliance**
   - User consent management
   - Data processing transparency
   - Right to access stored data
   - Right to data portability
   - Right to deletion

## Troubleshooting

### Common Issues

#### OAuth Flow Issues

**Problem:** Authorization callback returns error
```
Error: invalid_request
Description: The redirect_uri parameter is invalid
```

**Solution:**
1. Verify redirect URI in Meta App settings matches exactly
2. Ensure HTTPS is used in production
3. Check for trailing slashes in URLs

```bash
# Correct redirect URI format
https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback
```

#### Token Refresh Issues

**Problem:** Token refresh fails with 400 error
```
Error: invalid_grant
Description: The provided refresh token is invalid
```

**Solutions:**
1. Check token encryption/decryption process
2. Verify refresh token hasn't expired (60 days max)
3. Ensure token stored correctly in database

```python
# Debug token refresh
async def debug_token_refresh(org_id: str):
    auth_record = await get_meta_auth_record(org_id)
    logger.info(f"Auth record exists: {auth_record is not None}")
    logger.info(f"Has refresh token: {auth_record.refresh_token is not None}")
    logger.info(f"Token expires at: {auth_record.token_expires_at}")
```

#### Campaign Data Issues

**Problem:** No campaigns returned from API
```
Response: {"campaigns": [], "count": 0}
```

**Solutions:**
1. Verify ad account permissions
2. Check campaign status filters
3. Confirm ad account selection

```python
# Debug campaign access
async def debug_campaign_access(org_id: str):
    accounts = await get_ad_accounts(org_id)
    for account in accounts:
        logger.info(f"Account: {account['id']}, Status: {account['status']}")
        campaigns = await get_campaigns(account['id'])
        logger.info(f"Campaigns found: {len(campaigns)}")
```

### Error Codes Reference

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `META_AUTH_001` | OAuth authorization failed | Check app configuration and redirect URIs |
| `META_AUTH_002` | Token refresh failed | Verify refresh token validity and permissions |
| `META_AUTH_003` | Invalid access token | Re-authenticate user through OAuth flow |
| `META_API_001` | Rate limit exceeded | Implement exponential backoff retry logic |
| `META_API_002` | API permissions insufficient | Check app permissions and user consent |
| `META_API_003` | Account access denied | Verify ad account permissions and status |

### Debug Mode Setup

```bash
# Enable debug logging
export META_DEBUG_MODE=true
export META_LOG_LEVEL=DEBUG

# Backend debug logging
export FASTAPI_DEBUG=true
export LOG_SQL_QUERIES=true

# Frontend debug mode
export VITE_DEBUG_META=true
export VITE_LOG_LEVEL=debug
```

### Health Check Endpoint

```python
@router.get("/meta/health")
async def meta_health_check():
    """Meta API integration health check"""
    try:
        # Test Meta API connectivity
        response = await test_meta_api_connection()
        
        return {
            "status": "healthy",
            "meta_api": "accessible",
            "response_time_ms": response.elapsed.total_seconds() * 1000,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "meta_api": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
```

## Testing Guide

### Unit Tests

```python
# test_meta_auth.py
import pytest
from unittest.mock import Mock, patch
from services.meta.meta_auth_service import meta_auth_service

@pytest.mark.asyncio
async def test_oauth_flow():
    """Test Meta OAuth flow"""
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value.json.return_value = {
            'access_token': 'test_token',
            'expires_in': 3600
        }
        
        result = await meta_auth_service.handle_callback(
            code='test_code',
            state='test_state'
        )
        
        assert result['success'] is True
        assert 'access_token' in result

@pytest.mark.asyncio
async def test_token_refresh():
    """Test token refresh functionality"""
    # Mock auth record
    mock_auth = Mock()
    mock_auth.refresh_token = 'encrypted_refresh_token'
    
    with patch('services.meta.meta_auth_service.get_auth_record', return_value=mock_auth):
        result = await meta_auth_service.refresh_token('org_123')
        assert result is True
```

### Integration Tests

```python
# test_meta_integration.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_meta_auth_status():
    """Test Meta auth status endpoint"""
    response = client.get(
        "/api/v1/auth/meta/status",
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'is_authenticated' in data

def test_meta_oauth_redirect():
    """Test OAuth redirect endpoint"""
    response = client.post(
        "/api/v1/auth/meta/redirect",
        json={"state": "test_state"},
        headers={"Authorization": "Bearer test_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert 'authorization_url' in data
    assert 'facebook.com' in data['authorization_url']
```

### End-to-End Tests

```javascript
// e2e/meta-integration.spec.js
const { test, expect } = require('@playwright/test');

test('Meta OAuth flow', async ({ page, context }) => {
  // Navigate to settings page
  await page.goto('/settings');
  
  // Find Meta integration section
  await page.click('[data-testid="meta-connect-button"]');
  
  // Should redirect to Meta authorization
  await page.waitForURL('**/facebook.com/**');
  
  // Mock successful authorization
  await context.route('**/auth/meta/callback**', async route => {
    await route.fulfill({
      status: 302,
      headers: {
        'Location': '/?success=true&org_id=test_org'
      }
    });
  });
  
  // Complete OAuth flow
  await page.goto('/?success=true&org_id=test_org');
  
  // Verify connection success
  await expect(page.locator('[data-testid="meta-connected"]')).toBeVisible();
});
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Meta App approved for production use
- [ ] Valid SSL certificates configured
- [ ] Environment variables set correctly
- [ ] Database migrations completed
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Error tracking enabled (Sentry)
- [ ] Load balancing configured
- [ ] Backup and disaster recovery tested

### Deployment Commands

```bash
# 1. Update environment variables
export META_APP_ID=production_app_id
export META_APP_SECRET=production_secret
export META_OAUTH_REDIRECT_URI=https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback

# 2. Run database migrations
alembic upgrade head

# 3. Install dependencies
pip install -r requirements.txt
npm install

# 4. Build frontend
npm run build

# 5. Start production server
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Monitoring Setup

```yaml
# monitoring/meta-integration.yml
alerts:
  - name: MetaAuthFailures
    condition: meta_auth_failures > 5
    duration: 5m
    severity: warning
    
  - name: MetaAPIRateLimit
    condition: meta_api_rate_limit_exceeded > 10
    duration: 2m
    severity: critical
    
  - name: MetaTokenExpiry
    condition: meta_tokens_expiring_soon > 0
    duration: 1h
    severity: warning
```

### Performance Optimization

1. **Caching Strategy**
   ```python
   # Cache campaign data for 5 minutes
   @cache(expire=300)
   async def get_campaigns(account_id: str):
       return await fetch_campaigns_from_meta(account_id)
   ```

2. **Connection Pooling**
   ```python
   # HTTP client with connection pooling
   http_client = httpx.AsyncClient(
       limits=httpx.Limits(max_keepalive_connections=20),
       timeout=30.0
   )
   ```

3. **Background Tasks**
   ```python
   # Async token refresh
   from fastapi import BackgroundTasks
   
   @router.post("/auth/meta/refresh")
   async def refresh_token(background_tasks: BackgroundTasks):
       background_tasks.add_task(refresh_all_tokens)
       return {"message": "Token refresh queued"}
   ```

---

## Support and Resources

### Documentation Links
- [Meta Business API Documentation](https://developers.facebook.com/docs/marketing-api/)
- [Facebook Login for Business](https://developers.facebook.com/docs/facebook-login/overview)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

### Getting Help
- **GitHub Issues**: [Submit bug reports and feature requests](https://github.com/Think-Big-Media/1.0-war-room/issues)
- **API Status**: [https://war-room-oa9t.onrender.com/health](https://war-room-oa9t.onrender.com/health)
- **Meta Developer Support**: [https://developers.facebook.com/support/](https://developers.facebook.com/support/)

### Additional Resources
- **Test Integration Guide**: [test_meta_integration.md](./test_meta_integration.md)
- **API Documentation**: [API_DOCS.md](./archive/API_DOCS.md)
- **Security Best Practices**: [DOCS/SECURITY_ASSESSMENT.md](./DOCS/SECURITY_ASSESSMENT.md)

---

*Meta Business Suite Integration Guide v1.0 | Last Updated: August 2025 | For War Room Platform*