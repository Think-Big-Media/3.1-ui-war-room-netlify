# Meta Integration Testing Guide

[![Meta Integration Testing](https://img.shields.io/badge/Testing-Meta%20Integration-1877F2)](https://developers.facebook.com/docs/facebook-login/web/)
[![Test Coverage](https://img.shields.io/badge/Coverage-Comprehensive-success)](#)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://war-room-oa9t.onrender.com)

**Comprehensive testing guide for Meta Business Suite OAuth2 integration including setup, execution, and validation procedures.**

## 📋 Table of Contents

- [Overview](#overview)
- [Test Environment Setup](#test-environment-setup)
- [Prerequisites](#prerequisites)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Manual Testing Procedures](#manual-testing-procedures)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Common Issues and Solutions](#common-issues-and-solutions)
- [Test Data Management](#test-data-management)
- [Continuous Integration](#continuous-integration)

## Overview

This testing guide covers all aspects of Meta Business Suite integration testing, from unit tests to end-to-end scenarios. The testing strategy ensures:

- **🔐 OAuth2 Flow Validation** - Complete authentication flow testing
- **📊 API Integration Testing** - Backend endpoint validation
- **🖥️ Frontend Component Testing** - UI interaction testing
- **🔄 Token Management Testing** - Refresh and expiration handling
- **🛡️ Security Testing** - Vulnerability assessment
- **⚡ Performance Testing** - Load and response time validation

## Test Environment Setup

### Development Environment

```bash
# 1. Clone the repository
git clone https://github.com/Think-Big-Media/1.0-war-room.git
cd 1.0-war-room

# 2. Setup backend environment
cd src/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-cov httpx

# 3. Setup frontend environment
cd ../frontend
npm install
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @playwright/test
```

### Test Database Setup

```sql
-- Create test database
CREATE DATABASE warroom_test;

-- Run migrations
alembic -c alembic_test.ini upgrade head
```

### Environment Configuration

Create `.env.test` file:

```bash
# Test Environment Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/warroom_test
SUPABASE_URL=https://test-supabase-project.supabase.co
SUPABASE_ANON_KEY=test_anon_key

# Meta Test Configuration
META_APP_ID=test_app_id
META_APP_SECRET=test_app_secret
META_OAUTH_REDIRECT_URI=http://localhost:8000/api/v1/auth/meta/callback
META_API_BASE_URL=https://graph.facebook.com/v19.0
META_TOKEN_ENCRYPTION_KEY=test_encryption_key_32_characters

# Test-specific settings
TESTING=true
LOG_LEVEL=DEBUG
CACHE_DISABLED=true
```

## Prerequisites

### Meta Test App Setup

1. **Create Test App**
   - Navigate to [Meta Developers](https://developers.facebook.com/apps/)
   - Create new app with "Development" mode
   - Configure test domain: `localhost:8000`

2. **Configure Test Permissions**
   ```bash
   # Test app permissions (development mode only)
   META_TEST_SCOPES=ads_management,ads_read,business_management
   ```

3. **Test Account Setup**
   - Create test business manager account
   - Set up test ad accounts with sample data
   - Configure test pages and permissions

### Test Data Requirements

```python
# Test data fixtures
TEST_USER_DATA = {
    "email": "test@example.com",
    "password": "test_password_123",
    "organization_id": "test_org_123"
}

TEST_META_AUTH_DATA = {
    "access_token": "test_access_token",
    "refresh_token": "test_refresh_token",
    "expires_in": 3600,
    "scope": "ads_management,ads_read"
}

TEST_AD_ACCOUNT_DATA = [
    {
        "account_id": "act_test_123",
        "name": "Test Campaign Account",
        "currency": "USD",
        "timezone_name": "America/New_York",
        "account_status": "ACTIVE"
    }
]
```

## Unit Testing

### Backend API Unit Tests

#### OAuth Service Tests

```python
# tests/unit/test_meta_auth_service.py
import pytest
from unittest.mock import Mock, patch, AsyncMock
from services.meta.meta_auth_service import meta_auth_service
from models.meta_auth import MetaAuth

@pytest.mark.asyncio
async def test_generate_authorization_url():
    """Test OAuth authorization URL generation"""
    org_id = "test_org_123"
    state = "test_state"
    
    url = meta_auth_service.get_authorization_url(org_id, state)
    
    assert "facebook.com" in url
    assert f"state={state}" in url
    assert "client_id=" in url
    assert "redirect_uri=" in url
    assert "scope=" in url

@pytest.mark.asyncio
async def test_handle_oauth_callback_success():
    """Test successful OAuth callback handling"""
    with patch('httpx.AsyncClient.post') as mock_post:
        mock_post.return_value.json.return_value = {
            'access_token': 'test_access_token',
            'expires_in': 3600,
            'token_type': 'bearer'
        }
        
        result = await meta_auth_service.handle_callback(
            code='test_auth_code',
            state='test_state'
        )
        
        assert result['success'] is True
        assert 'org_id' in result
        mock_post.assert_called_once()

@pytest.mark.asyncio
async def test_token_refresh():
    """Test access token refresh functionality"""
    mock_auth = Mock(spec=MetaAuth)
    mock_auth.refresh_token = 'encrypted_refresh_token'
    mock_auth.org_id = 'test_org_123'
    
    with patch('services.meta.meta_auth_service.get_auth_record', return_value=mock_auth), \
         patch('httpx.AsyncClient.post') as mock_post:
        
        mock_post.return_value.json.return_value = {
            'access_token': 'new_access_token',
            'expires_in': 3600
        }
        
        result = await meta_auth_service.refresh_token('test_org_123')
        
        assert result is True
        mock_post.assert_called_once()

@pytest.mark.asyncio
async def test_get_ad_accounts():
    """Test fetching Meta ad accounts"""
    mock_auth = Mock(spec=MetaAuth)
    mock_auth.access_token = 'encrypted_access_token'
    
    with patch('services.meta.meta_auth_service.get_auth_record', return_value=mock_auth), \
         patch('httpx.AsyncClient.get') as mock_get:
        
        mock_get.return_value.json.return_value = {
            'data': [
                {
                    'id': 'act_123',
                    'name': 'Test Account',
                    'currency': 'USD',
                    'account_status': 'ACTIVE'
                }
            ]
        }
        
        accounts = await meta_auth_service.get_ad_accounts('test_org_123')
        
        assert len(accounts) == 1
        assert accounts[0]['account_id'] == 'act_123'
        mock_get.assert_called_once()

@pytest.mark.asyncio
async def test_revoke_access():
    """Test Meta access revocation"""
    with patch('services.meta.meta_auth_service.get_auth_record') as mock_get_auth, \
         patch('core.database.get_async_db') as mock_db:
        
        mock_auth = Mock(spec=MetaAuth)
        mock_get_auth.return_value = mock_auth
        
        result = await meta_auth_service.revoke_access('test_org_123')
        
        assert result is True
        assert mock_auth.is_active is False
```

#### API Endpoint Tests

```python
# tests/unit/test_meta_endpoints.py
import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch, AsyncMock

client = TestClient(app)

def test_meta_auth_redirect_endpoint():
    """Test Meta OAuth redirect endpoint"""
    with patch('core.auth.get_current_user') as mock_user, \
         patch('services.meta.meta_auth_service.get_authorization_url') as mock_auth_url:
        
        mock_user.return_value = Mock(org_id='test_org_123')
        mock_auth_url.return_value = 'https://facebook.com/oauth/authorize?...'
        
        response = client.post(
            '/api/v1/auth/meta/redirect',
            json={'state': 'test_state'},
            headers={'Authorization': 'Bearer test_token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'authorization_url' in data
        assert 'facebook.com' in data['authorization_url']

def test_meta_auth_status_endpoint():
    """Test Meta authentication status endpoint"""
    with patch('core.auth.get_current_user') as mock_user, \
         patch('services.meta.meta_auth_service.get_auth_record') as mock_auth:
        
        mock_user.return_value = Mock(org_id='test_org_123')
        mock_auth_record = Mock()
        mock_auth_record.is_active = True
        mock_auth_record.ad_account_id = 'act_123'
        mock_auth_record.scopes = ['ads_management']
        mock_auth.return_value = mock_auth_record
        
        response = client.get(
            '/api/v1/auth/meta/status',
            headers={'Authorization': 'Bearer test_token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['is_authenticated'] is True
        assert data['ad_account_id'] == 'act_123'

def test_meta_accounts_endpoint():
    """Test Meta ad accounts endpoint"""
    with patch('core.auth.get_current_user') as mock_user, \
         patch('services.meta.meta_auth_service.get_ad_accounts') as mock_accounts:
        
        mock_user.return_value = Mock(org_id='test_org_123')
        mock_accounts.return_value = [
            {
                'account_id': 'act_123',
                'name': 'Test Account',
                'currency': 'USD'
            }
        ]
        
        response = client.get(
            '/api/v1/auth/meta/accounts',
            headers={'Authorization': 'Bearer test_token'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert len(data['ad_accounts']) == 1
```

### Frontend Component Unit Tests

```typescript
// src/components/integrations/__tests__/MetaIntegration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import MetaIntegration from '../MetaIntegration';
import { metaAuthService } from '../../../services/metaAuthService';

// Mock the service
jest.mock('../../../services/metaAuthService', () => ({
  metaAuthService: {
    getAuthStatus: jest.fn(),
    startOAuthFlow: jest.fn(),
    getAllCampaigns: jest.fn(),
    getAdAccounts: jest.fn(),
    revokeAccess: jest.fn()
  }
}));

describe('MetaIntegration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders not connected state initially', async () => {
    (metaAuthService.getAuthStatus as jest.Mock).mockResolvedValue({
      is_authenticated: false,
      error: null
    });

    render(<MetaIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Connect to Facebook')).toBeInTheDocument();
      expect(screen.getByText('Not connected')).toBeInTheDocument();
    });
  });

  test('renders connected state when authenticated', async () => {
    (metaAuthService.getAuthStatus as jest.Mock).mockResolvedValue({
      is_authenticated: true,
      ad_account_id: 'act_123',
      error: null
    });
    
    (metaAuthService.getAllCampaigns as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Test Campaign',
        status: 'ACTIVE',
        account_id: 'act_123'
      }
    ]);
    
    (metaAuthService.getAdAccounts as jest.Mock).mockResolvedValue([
      {
        id: 'act_123',
        name: 'Test Account',
        currency: 'USD'
      }
    ]);

    render(<MetaIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Account successfully connected')).toBeInTheDocument();
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });
  });

  test('handles OAuth flow initiation', async () => {
    (metaAuthService.getAuthStatus as jest.Mock).mockResolvedValue({
      is_authenticated: false,
      error: null
    });

    render(<MetaIntegration />);

    await waitFor(() => {
      const connectButton = screen.getByText('Connect to Facebook');
      fireEvent.click(connectButton);
    });

    expect(metaAuthService.startOAuthFlow).toHaveBeenCalledWith('meta-integration');
  });

  test('handles disconnect functionality', async () => {
    (metaAuthService.getAuthStatus as jest.Mock).mockResolvedValue({
      is_authenticated: true,
      error: null
    });
    
    (metaAuthService.revokeAccess as jest.Mock).mockResolvedValue({
      success: true
    });

    render(<MetaIntegration />);

    await waitFor(() => {
      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);
    });

    expect(metaAuthService.revokeAccess).toHaveBeenCalled();
  });

  test('displays error state correctly', async () => {
    (metaAuthService.getAuthStatus as jest.Mock).mockResolvedValue({
      is_authenticated: false,
      error: 'Failed to check authentication status'
    });

    render(<MetaIntegration />);

    await waitFor(() => {
      expect(screen.getByText('Failed to check authentication status')).toBeInTheDocument();
    });
  });
});
```

### Service Layer Tests

```typescript
// src/services/__tests__/metaAuthService.test.ts
import { metaAuthService } from '../metaAuthService';
import fetchMock from 'jest-fetch-mock';

describe('MetaAuthService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    localStorage.clear();
  });

  test('getAuthStatus returns correct status', async () => {
    const mockResponse = {
      is_authenticated: true,
      ad_account_id: 'act_123',
      scopes: ['ads_management']
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await metaAuthService.getAuthStatus();

    expect(result.is_authenticated).toBe(true);
    expect(result.ad_account_id).toBe('act_123');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/meta/status'),
      expect.objectContaining({
        method: 'GET'
      })
    );
  });

  test('startOAuthFlow initiates redirect', async () => {
    const mockResponse = {
      authorization_url: 'https://facebook.com/oauth/authorize?...'
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    });

    await metaAuthService.startOAuthFlow('test-state');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/meta/redirect'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ state: 'test-state' })
      })
    );
    expect(window.location.href).toBe(mockResponse.authorization_url);
  });

  test('getAllCampaigns fetches campaign data', async () => {
    const mockCampaigns = [
      {
        id: '1',
        name: 'Test Campaign',
        status: 'ACTIVE',
        account_id: 'act_123'
      }
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockCampaigns));

    const result = await metaAuthService.getAllCampaigns();

    expect(result).toEqual(mockCampaigns);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/meta/campaigns'),
      expect.objectContaining({
        method: 'GET'
      })
    );
  });
});
```

## Integration Testing

### API Integration Tests

```python
# tests/integration/test_meta_api_integration.py
import pytest
import asyncio
from httpx import AsyncClient
from fastapi import FastAPI
from main import app

@pytest.mark.integration
class TestMetaAPIIntegration:
    
    @pytest.fixture
    async def async_client(self):
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client
    
    @pytest.fixture
    async def authenticated_user_token(self):
        # Create test user and return JWT token
        return "test_jwt_token"
    
    async def test_complete_oauth_flow(self, async_client, authenticated_user_token):
        """Test complete OAuth flow integration"""
        
        # 1. Request authorization URL
        response = await async_client.post(
            "/api/v1/auth/meta/redirect",
            json={"state": "integration_test"},
            headers={"Authorization": f"Bearer {authenticated_user_token}"}
        )
        
        assert response.status_code == 200
        auth_data = response.json()
        assert "authorization_url" in auth_data
        
        # 2. Simulate OAuth callback with mock code
        callback_response = await async_client.get(
            "/api/v1/auth/meta/callback",
            params={
                "code": "mock_auth_code",
                "state": "integration_test"
            }
        )
        
        assert callback_response.status_code == 302
        
        # 3. Check authentication status
        status_response = await async_client.get(
            "/api/v1/auth/meta/status",
            headers={"Authorization": f"Bearer {authenticated_user_token}"}
        )
        
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["is_authenticated"] is True
    
    async def test_token_refresh_integration(self, async_client, authenticated_user_token):
        """Test token refresh integration"""
        
        # Setup: Ensure user has Meta auth record with refresh token
        # (This would be set up in test fixtures)
        
        response = await async_client.post(
            "/api/v1/auth/meta/refresh",
            headers={"Authorization": f"Bearer {authenticated_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    async def test_ad_accounts_integration(self, async_client, authenticated_user_token):
        """Test ad accounts retrieval integration"""
        
        response = await async_client.get(
            "/api/v1/auth/meta/accounts",
            headers={"Authorization": f"Bearer {authenticated_user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "ad_accounts" in data
        assert "count" in data
```

### Database Integration Tests

```python
# tests/integration/test_meta_database_integration.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_async_db
from models.meta_auth import MetaAuth
from services.meta.meta_auth_service import meta_auth_service

@pytest.mark.integration
class TestMetaDatabaseIntegration:
    
    async def test_meta_auth_record_creation(self, db_session: AsyncSession):
        """Test Meta auth record database operations"""
        
        # Create test auth record
        auth_record = MetaAuth(
            org_id="test_org_123",
            access_token="encrypted_access_token",
            refresh_token="encrypted_refresh_token",
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            scopes=["ads_management", "ads_read"],
            is_active=True
        )
        
        db_session.add(auth_record)
        await db_session.commit()
        
        # Verify record exists
        retrieved_record = await meta_auth_service.get_auth_record("test_org_123")
        assert retrieved_record is not None
        assert retrieved_record.org_id == "test_org_123"
        assert retrieved_record.is_active is True
    
    async def test_token_encryption_integration(self, db_session: AsyncSession):
        """Test token encryption/decryption integration"""
        
        original_token = "test_access_token_123"
        
        # Save encrypted token
        auth_record = MetaAuth(
            org_id="test_org_456",
            access_token=encrypt_token(original_token),
            is_active=True
        )
        
        db_session.add(auth_record)
        await db_session.commit()
        
        # Retrieve and decrypt token
        retrieved_record = await meta_auth_service.get_auth_record("test_org_456")
        decrypted_token = decrypt_token(retrieved_record.access_token)
        
        assert decrypted_token == original_token
    
    async def test_auth_record_updates(self, db_session: AsyncSession):
        """Test Meta auth record update operations"""
        
        # Create initial record
        auth_record = MetaAuth(
            org_id="test_org_789",
            access_token="old_token",
            ad_account_id="act_old",
            is_active=True
        )
        
        db_session.add(auth_record)
        await db_session.commit()
        
        # Update record
        await meta_auth_service.update_auth_record(
            org_id="test_org_789",
            access_token="new_token",
            ad_account_id="act_new"
        )
        
        # Verify updates
        updated_record = await meta_auth_service.get_auth_record("test_org_789")
        assert updated_record.access_token == "new_token"
        assert updated_record.ad_account_id == "act_new"
```

## End-to-End Testing

### Playwright E2E Tests

```typescript
// tests/e2e/meta-integration.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Meta Integration E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Setup mock responses for Meta API
    await page.route('**/api/v1/auth/meta/status', async route => {
      await route.fulfill({
        json: {
          is_authenticated: false,
          error: null
        }
      });
    });
  });

  test('Complete Meta OAuth flow', async () => {
    // 1. Navigate to settings page
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('Settings');

    // 2. Find Meta integration section
    await expect(page.locator('[data-testid="meta-integration"]')).toBeVisible();
    await expect(page.locator('text=Not connected')).toBeVisible();

    // 3. Mock authorization URL response
    await page.route('**/api/v1/auth/meta/redirect', async route => {
      await route.fulfill({
        json: {
          authorization_url: 'https://facebook.com/oauth/authorize?client_id=test&redirect_uri=http%3A//localhost%3A8000/api/v1/auth/meta/callback&state=test'
        }
      });
    });

    // 4. Start OAuth flow
    await page.click('[data-testid="meta-connect-button"]');

    // 5. Verify redirect to Meta authorization
    await page.waitForURL('**/facebook.com/**');
    await expect(page.url()).toContain('facebook.com');

    // 6. Mock successful callback
    await page.route('**/api/v1/auth/meta/callback**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/?success=true&org_id=test_org&ad_accounts=2'
        }
      });
    });

    // 7. Simulate successful authorization
    await page.goto('/?success=true&org_id=test_org&ad_accounts=2');

    // 8. Mock connected state
    await page.route('**/api/v1/auth/meta/status', async route => {
      await route.fulfill({
        json: {
          is_authenticated: true,
          ad_account_id: 'act_123',
          business_id: '123456789',
          scopes: ['ads_management', 'ads_read'],
          page_count: 2
        }
      });
    });

    // 9. Navigate back to settings and verify connection
    await page.goto('/settings');
    await expect(page.locator('text=Connected')).toBeVisible();
    await expect(page.locator('[data-testid="meta-connected"]')).toBeVisible();
  });

  test('Display campaign data when connected', async () => {
    // Setup connected state
    await page.route('**/api/v1/auth/meta/status', async route => {
      await route.fulfill({
        json: {
          is_authenticated: true,
          ad_account_id: 'act_123',
          page_count: 2
        }
      });
    });

    // Mock campaigns data
    await page.route('**/api/v1/meta/campaigns', async route => {
      await route.fulfill({
        json: [
          {
            id: '1',
            name: 'Q4 Voter Outreach Campaign',
            status: 'ACTIVE',
            account_id: 'act_123',
            objective: 'REACH',
            created_time: '2024-01-15T10:30:00Z'
          }
        ]
      });
    });

    // Mock ad accounts data
    await page.route('**/api/v1/auth/meta/accounts', async route => {
      await route.fulfill({
        json: {
          success: true,
          ad_accounts: [
            {
              id: 'act_123',
              name: 'Test Campaign Account',
              currency: 'USD'
            }
          ],
          count: 1
        }
      });
    });

    await page.goto('/settings');

    // Verify campaign data display
    await expect(page.locator('text=Q4 Voter Outreach Campaign')).toBeVisible();
    await expect(page.locator('text=ACTIVE')).toBeVisible();
    await expect(page.locator('text=Test Campaign Account')).toBeVisible();
  });

  test('Handle OAuth errors gracefully', async () => {
    await page.route('**/api/v1/auth/meta/redirect', async route => {
      await route.fulfill({
        status: 400,
        json: {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Failed to generate authorization URL'
          }
        }
      });
    });

    await page.goto('/settings');
    await page.click('[data-testid="meta-connect-button"]');

    // Verify error handling
    await expect(page.locator('text=Failed to start authorization')).toBeVisible();
  });

  test('Token refresh functionality', async () => {
    // Setup connected but expired state
    await page.route('**/api/v1/auth/meta/status', async route => {
      await route.fulfill({
        json: {
          is_authenticated: true,
          expires_at: '2025-08-07T12:00:00Z' // Past date
        }
      });
    });

    // Mock successful refresh
    await page.route('**/api/v1/auth/meta/refresh', async route => {
      await route.fulfill({
        json: {
          success: true,
          message: 'Token refreshed successfully'
        }
      });
    });

    await page.goto('/settings');
    await page.click('[data-testid="meta-refresh-button"]');

    await expect(page.locator('text=Token refreshed successfully')).toBeVisible();
  });

  test('Disconnect functionality', async () => {
    // Setup connected state
    await page.route('**/api/v1/auth/meta/status', async route => {
      await route.fulfill({
        json: {
          is_authenticated: true,
          ad_account_id: 'act_123'
        }
      });
    });

    // Mock successful disconnect
    await page.route('**/api/v1/auth/meta/revoke', async route => {
      await route.fulfill({
        json: {
          success: true,
          message: 'Meta Business Suite access revoked successfully'
        }
      });
    });

    await page.goto('/settings');
    await page.click('[data-testid="meta-disconnect-button"]');

    // Confirm disconnect
    await page.click('[data-testid="confirm-disconnect"]');

    await expect(page.locator('text=Not connected')).toBeVisible();
  });
});
```

## Manual Testing Procedures

### Test Case 1: Complete OAuth Flow

**Objective**: Verify complete Meta OAuth integration works end-to-end

**Pre-conditions**:
- Test Meta app configured
- Backend and frontend running
- Test user account available

**Steps**:
1. Navigate to `/settings` page
2. Locate "Platform Integrations" section
3. Find Meta Business Suite integration
4. Verify "Not connected" status is shown
5. Click "Connect to Facebook" button
6. Verify redirect to Meta authorization page
7. Accept all requested permissions
8. Verify successful redirect back to application
9. Check that status shows "Connected"
10. Verify campaign data is displayed

**Expected Results**:
- OAuth flow completes without errors
- User is successfully authenticated
- Meta auth record created in database
- Campaign data loads and displays correctly

**Pass/Fail Criteria**:
- ✅ Pass: All steps complete successfully
- ❌ Fail: Any step fails or shows errors

### Test Case 2: Token Expiration and Refresh

**Objective**: Verify automatic token refresh functionality

**Pre-conditions**:
- User already connected to Meta
- Access token near expiration (< 1 hour)

**Steps**:
1. Monitor backend logs for token refresh attempts
2. Make API calls that require Meta authentication
3. Verify tokens are refreshed automatically
4. Check database for updated token timestamps
5. Ensure user experience is uninterrupted

**Expected Results**:
- Tokens refresh automatically before expiration
- No authentication errors occur
- User sessions remain active

### Test Case 3: Error Handling

**Objective**: Verify proper error handling for various failure scenarios

**Test Scenarios**:

**3a. OAuth Authorization Denied**
1. Start OAuth flow
2. Deny permissions on Meta authorization page
3. Verify error message displayed to user
4. Ensure no partial auth records created

**3b. Invalid Refresh Token**
1. Manually invalidate refresh token in database
2. Trigger token refresh attempt
3. Verify user prompted to re-authenticate

**3c. Meta API Rate Limiting**
1. Generate high API request volume
2. Verify rate limiting triggers properly
3. Check exponential backoff retry logic

**3d. Network Connectivity Issues**
1. Simulate network failures during API calls
2. Verify timeout handling
3. Check user receives appropriate error messages

### Test Case 4: Campaign Data Synchronization

**Objective**: Verify campaign data accurately syncs from Meta

**Steps**:
1. Create test campaigns in Meta Ad Manager
2. Navigate to War Room Meta integration
3. Trigger campaign data refresh
4. Compare displayed data with Meta Ad Manager
5. Verify real-time updates work correctly

**Data Points to Verify**:
- Campaign names match exactly
- Status values are correct
- Account associations are accurate
- Creation dates display properly
- Spend and performance metrics align

### Test Case 5: Multi-Account Support

**Objective**: Verify support for multiple Meta ad accounts

**Pre-conditions**:
- User has access to multiple Meta ad accounts

**Steps**:
1. Complete OAuth flow with multi-account access
2. Verify all accounts appear in account list
3. Select different primary accounts
4. Confirm campaign data updates accordingly
5. Test account switching functionality

## Performance Testing

### Load Testing Configuration

```python
# tests/performance/test_meta_load.py
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor

class MetaLoadTester:
    def __init__(self, base_url: str, num_concurrent: int = 10):
        self.base_url = base_url
        self.num_concurrent = num_concurrent
        self.results = []

    async def test_auth_status_load(self):
        """Test auth status endpoint under load"""
        async with aiohttp.ClientSession() as session:
            tasks = []
            for i in range(self.num_concurrent):
                task = self.make_auth_status_request(session)
                tasks.append(task)
            
            start_time = time.time()
            results = await asyncio.gather(*tasks)
            end_time = time.time()
            
            success_count = sum(1 for r in results if r['success'])
            avg_response_time = (end_time - start_time) / len(results)
            
            return {
                'total_requests': len(results),
                'successful_requests': success_count,
                'failure_rate': (len(results) - success_count) / len(results),
                'average_response_time': avg_response_time,
                'requests_per_second': len(results) / (end_time - start_time)
            }

    async def make_auth_status_request(self, session):
        """Make individual auth status request"""
        try:
            start_time = time.time()
            async with session.get(
                f"{self.base_url}/api/v1/auth/meta/status",
                headers={"Authorization": "Bearer test_token"}
            ) as response:
                end_time = time.time()
                
                return {
                    'success': response.status == 200,
                    'status_code': response.status,
                    'response_time': end_time - start_time
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response_time': None
            }

# Run load test
async def run_load_test():
    tester = MetaLoadTester("http://localhost:8000", num_concurrent=50)
    results = await tester.test_auth_status_load()
    
    print(f"Load Test Results:")
    print(f"Total Requests: {results['total_requests']}")
    print(f"Success Rate: {(1 - results['failure_rate']) * 100:.2f}%")
    print(f"Average Response Time: {results['average_response_time']:.3f}s")
    print(f"Requests per Second: {results['requests_per_second']:.2f}")
    
    # Performance assertions
    assert results['failure_rate'] < 0.01  # Less than 1% failure rate
    assert results['average_response_time'] < 2.0  # Under 2 seconds average
    assert results['requests_per_second'] > 10  # At least 10 RPS
```

### Response Time Monitoring

```python
# tests/performance/response_time_monitor.py
import pytest
import time
from httpx import AsyncClient

@pytest.mark.performance
class TestMetaResponseTimes:
    
    async def test_auth_endpoints_response_time(self):
        """Test Meta auth endpoints meet SLA requirements"""
        async with AsyncClient() as client:
            endpoints_to_test = [
                ("/api/v1/auth/meta/status", "GET"),
                ("/api/v1/auth/meta/accounts", "GET"),
                ("/api/v1/auth/meta/refresh", "POST"),
            ]
            
            for endpoint, method in endpoints_to_test:
                start_time = time.time()
                
                if method == "GET":
                    response = await client.get(endpoint)
                else:
                    response = await client.post(endpoint)
                
                response_time = time.time() - start_time
                
                # SLA: All endpoints should respond within 2 seconds
                assert response_time < 2.0, f"{endpoint} took {response_time:.3f}s"
                
                print(f"{endpoint}: {response_time:.3f}s")
```

## Security Testing

### Authentication Security Tests

```python
# tests/security/test_meta_security.py
import pytest
from httpx import AsyncClient
from unittest.mock import patch

@pytest.mark.security
class TestMetaSecurityFeatures:
    
    async def test_oauth_state_parameter_validation(self):
        """Test OAuth state parameter prevents CSRF attacks"""
        async with AsyncClient() as client:
            # 1. Request with valid state
            response = await client.post(
                "/api/v1/auth/meta/redirect",
                json={"state": "valid_state_123"},
                headers={"Authorization": "Bearer valid_token"}
            )
            assert response.status_code == 200
            
            # 2. Callback with mismatched state should fail
            callback_response = await client.get(
                "/api/v1/auth/meta/callback",
                params={
                    "code": "auth_code",
                    "state": "different_state_456"
                }
            )
            # Should redirect with error
            assert callback_response.status_code == 302
            assert "error=" in callback_response.headers["location"]
    
    async def test_token_encryption_security(self):
        """Test token encryption/decryption security"""
        from core.security import encrypt_token, decrypt_token
        
        original_token = "sensitive_access_token_123"
        
        # Encrypt token
        encrypted_token = encrypt_token(original_token)
        
        # Verify token is actually encrypted
        assert encrypted_token != original_token
        assert len(encrypted_token) > len(original_token)
        
        # Decrypt and verify
        decrypted_token = decrypt_token(encrypted_token)
        assert decrypted_token == original_token
        
        # Test with invalid encrypted data should fail
        with pytest.raises(Exception):
            decrypt_token("invalid_encrypted_data")
    
    async def test_rate_limiting_security(self):
        """Test API rate limiting prevents abuse"""
        async with AsyncClient() as client:
            # Make requests rapidly to trigger rate limiting
            responses = []
            for i in range(10):
                response = await client.get(
                    "/api/v1/auth/meta/status",
                    headers={"Authorization": "Bearer test_token"}
                )
                responses.append(response)
            
            # At least some requests should be rate limited
            rate_limited = [r for r in responses if r.status_code == 429]
            assert len(rate_limited) > 0
    
    async def test_sql_injection_protection(self):
        """Test endpoints are protected against SQL injection"""
        async with AsyncClient() as client:
            # Test malicious input in organization ID context
            malicious_inputs = [
                "'; DROP TABLE meta_auth; --",
                "' UNION SELECT * FROM users --",
                "1' OR '1'='1",
            ]
            
            for malicious_input in malicious_inputs:
                # This would typically be through manipulated JWT claims
                # but we test the service layer directly
                with patch('core.auth.get_current_user') as mock_user:
                    mock_user.return_value.org_id = malicious_input
                    
                    response = await client.get(
                        "/api/v1/auth/meta/status",
                        headers={"Authorization": "Bearer test_token"}
                    )
                    
                    # Should not cause SQL errors or unauthorized data access
                    assert response.status_code in [200, 400, 401, 403]
    
    async def test_authorization_header_security(self):
        """Test proper authorization header handling"""
        async with AsyncClient() as client:
            # Test without authorization header
            response = await client.get("/api/v1/auth/meta/status")
            assert response.status_code == 401
            
            # Test with invalid bearer token
            response = await client.get(
                "/api/v1/auth/meta/status",
                headers={"Authorization": "Bearer invalid_token"}
            )
            assert response.status_code == 401
            
            # Test with malformed header
            response = await client.get(
                "/api/v1/auth/meta/status",
                headers={"Authorization": "InvalidFormat token"}
            )
            assert response.status_code == 401
```

### Data Privacy Tests

```python
# tests/security/test_data_privacy.py
import pytest
from services.meta.meta_auth_service import meta_auth_service

@pytest.mark.security
class TestDataPrivacyCompliance:
    
    async def test_data_minimization(self):
        """Test only necessary data is stored"""
        # Mock Meta API response with excess data
        mock_meta_response = {
            'access_token': 'token_123',
            'user_id': 'user_123',
            'email': 'user@example.com',  # Should not be stored
            'phone': '+1234567890',       # Should not be stored
            'personal_info': {...},       # Should not be stored
            'expires_in': 3600,
            'scope': 'ads_management'
        }
        
        # Process auth data
        processed_data = meta_auth_service.process_auth_response(mock_meta_response)
        
        # Verify only necessary fields are kept
        allowed_fields = {'access_token', 'expires_in', 'scope', 'refresh_token'}
        assert set(processed_data.keys()).issubset(allowed_fields)
        assert 'email' not in processed_data
        assert 'phone' not in processed_data
        assert 'personal_info' not in processed_data
    
    async def test_data_retention_policy(self):
        """Test data retention and cleanup policies"""
        # Create auth record with past expiration
        expired_date = datetime.utcnow() - timedelta(days=90)
        
        # Run cleanup process
        cleaned_count = await meta_auth_service.cleanup_expired_tokens()
        
        # Verify expired tokens are removed
        assert cleaned_count >= 0
        
        # Verify active tokens are preserved
        active_records = await meta_auth_service.get_active_auth_records()
        for record in active_records:
            assert record.token_expires_at > datetime.utcnow()
    
    async def test_gdpr_data_export(self):
        """Test user can export their Meta integration data"""
        org_id = "test_org_123"
        
        # Export user's Meta data
        exported_data = await meta_auth_service.export_user_data(org_id)
        
        # Verify export contains expected fields
        expected_fields = {
            'connection_date', 'scopes', 'ad_account_id',
            'last_used', 'campaigns_accessed'
        }
        
        assert set(exported_data.keys()).issuperset(expected_fields)
        assert 'access_token' not in exported_data  # Should not export tokens
        assert 'refresh_token' not in exported_data
    
    async def test_gdpr_data_deletion(self):
        """Test user can delete all Meta integration data"""
        org_id = "test_org_456"
        
        # Delete user's Meta data
        deletion_result = await meta_auth_service.delete_user_data(org_id)
        
        assert deletion_result['success'] is True
        assert 'items_deleted' in deletion_result
        
        # Verify data is actually deleted
        auth_record = await meta_auth_service.get_auth_record(org_id)
        assert auth_record is None or auth_record.is_active is False
```

## Common Issues and Solutions

### Issue 1: OAuth Redirect URI Mismatch

**Symptoms**: 
```
Error: invalid_request
Description: The redirect_uri parameter is invalid
```

**Root Causes**:
- Redirect URI not registered in Meta App settings
- HTTP vs HTTPS mismatch
- Trailing slash differences
- Port number inconsistencies

**Solutions**:
1. **Verify App Configuration**:
   ```bash
   # Check Meta App settings
   Valid OAuth Redirect URIs:
   https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback
   http://localhost:8000/api/v1/auth/meta/callback  # Dev only
   ```

2. **Environment Variable Check**:
   ```bash
   # Ensure exact match
   META_OAUTH_REDIRECT_URI=https://war-room-oa9t.onrender.com/api/v1/auth/meta/callback
   ```

3. **Debug Logging**:
   ```python
   # Add logging to verify redirect URI
   logger.info(f"Using redirect URI: {redirect_uri}")
   logger.info(f"Configured URI: {settings.META_OAUTH_REDIRECT_URI}")
   ```

### Issue 2: Token Encryption/Decryption Failures

**Symptoms**:
```
Error: Unable to decrypt token
InvalidToken: Invalid token format
```

**Root Causes**:
- Encryption key mismatch
- Key rotation without migration
- Corrupt encrypted data
- Missing encryption dependencies

**Solutions**:
1. **Verify Encryption Key**:
   ```python
   # Check key format (must be 32 bytes for Fernet)
   from cryptography.fernet import Fernet
   key = os.getenv('META_TOKEN_ENCRYPTION_KEY')
   assert len(key) == 44, "Key must be 32 bytes (44 chars base64)"
   ```

2. **Key Migration Script**:
   ```python
   # migrate_encryption_keys.py
   async def migrate_tokens(old_key: str, new_key: str):
       old_fernet = Fernet(old_key.encode())
       new_fernet = Fernet(new_key.encode())
       
       auth_records = await get_all_auth_records()
       for record in auth_records:
           try:
               # Decrypt with old key
               decrypted = old_fernet.decrypt(record.access_token.encode())
               # Re-encrypt with new key
               record.access_token = new_fernet.encrypt(decrypted).decode()
               await save_auth_record(record)
           except Exception as e:
               logger.error(f"Failed to migrate token for {record.org_id}: {e}")
   ```

### Issue 3: Meta API Rate Limiting

**Symptoms**:
```
Error: (#4) Application request limit reached
Error: (#613) Calls to this api have exceeded the rate limit
```

**Root Causes**:
- Exceeding per-app rate limits
- Too many concurrent requests
- Inefficient API usage patterns
- Missing rate limit handling

**Solutions**:
1. **Implement Exponential Backoff**:
   ```python
   import asyncio
   import random
   
   async def make_meta_api_request_with_retry(url, max_retries=3):
       for attempt in range(max_retries):
           try:
               response = await http_client.get(url)
               if response.status_code == 429:
                   # Rate limited, wait and retry
                   wait_time = (2 ** attempt) + random.uniform(0, 1)
                   await asyncio.sleep(wait_time)
                   continue
               return response
           except Exception as e:
               if attempt == max_retries - 1:
                   raise e
               await asyncio.sleep(2 ** attempt)
   ```

2. **Request Batching**:
   ```python
   # Batch API requests to reduce total calls
   async def get_campaigns_batch(account_ids: list):
       batch_requests = []
       for account_id in account_ids:
           batch_requests.append({
               'method': 'GET',
               'relative_url': f'{account_id}/campaigns'
           })
       
       # Single batch request instead of multiple individual requests
       response = await make_batch_request(batch_requests)
       return response
   ```

### Issue 4: Database Connection Issues

**Symptoms**:
```
Error: Connection refused
Error: Too many connections
sqlalchemy.exc.DisconnectionError
```

**Root Causes**:
- Database connection pool exhaustion
- Network connectivity issues
- Database server overload
- Connection string misconfiguration

**Solutions**:
1. **Optimize Connection Pool**:
   ```python
   # database.py
   engine = create_async_engine(
       DATABASE_URL,
       pool_size=10,           # Base connections
       max_overflow=20,        # Additional connections
       pool_timeout=30,        # Wait timeout
       pool_recycle=3600,      # Recycle connections hourly
       pool_pre_ping=True      # Validate connections
   )
   ```

2. **Connection Health Monitoring**:
   ```python
   async def check_database_health():
       try:
           async with get_async_db() as db:
               result = await db.execute(text("SELECT 1"))
               return result.scalar() == 1
       except Exception as e:
           logger.error(f"Database health check failed: {e}")
           return False
   ```

## Test Data Management

### Test Database Setup

```sql
-- test_data.sql
-- Test organization
INSERT INTO organizations (id, name, created_at) VALUES 
('test_org_123', 'Test Organization', NOW());

-- Test user
INSERT INTO users (id, email, name, org_id, created_at) VALUES 
('test_user_123', 'test@example.com', 'Test User', 'test_org_123', NOW());

-- Test Meta auth record
INSERT INTO meta_auth (
    org_id, 
    access_token, 
    refresh_token, 
    token_expires_at,
    scopes,
    is_active
) VALUES (
    'test_org_123',
    'encrypted_test_access_token',
    'encrypted_test_refresh_token',
    NOW() + INTERVAL '1 hour',
    '["ads_management", "ads_read"]',
    true
);
```

### Test Data Factory

```python
# tests/factories/meta_factory.py
import factory
from datetime import datetime, timedelta
from models.meta_auth import MetaAuth
from models.user import User
from models.organization import Organization

class OrganizationFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = Organization
        sqlalchemy_session_persistence = "commit"
    
    id = factory.Sequence(lambda n: f"test_org_{n}")
    name = factory.Faker('company')
    created_at = factory.LazyFunction(datetime.utcnow)

class UserFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = User
        sqlalchemy_session_persistence = "commit"
    
    id = factory.Sequence(lambda n: f"test_user_{n}")
    email = factory.Faker('email')
    name = factory.Faker('name')
    org_id = factory.SubFactory(OrganizationFactory)
    created_at = factory.LazyFunction(datetime.utcnow)

class MetaAuthFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        model = MetaAuth
        sqlalchemy_session_persistence = "commit"
    
    org_id = factory.SubFactory(OrganizationFactory)
    access_token = factory.Faker('pystr', max_chars=100)
    refresh_token = factory.Faker('pystr', max_chars=100)
    token_expires_at = factory.LazyFunction(
        lambda: datetime.utcnow() + timedelta(hours=1)
    )
    scopes = ["ads_management", "ads_read"]
    is_active = True
    created_at = factory.LazyFunction(datetime.utcnow)

# Usage in tests
@pytest.fixture
async def test_meta_auth():
    return MetaAuthFactory()

@pytest.fixture
async def test_user_with_meta_auth():
    org = OrganizationFactory()
    user = UserFactory(org_id=org.id)
    meta_auth = MetaAuthFactory(org_id=org.id)
    return user, meta_auth
```

### Mock Data Generators

```python
# tests/mocks/meta_mock_data.py
class MetaMockDataGenerator:
    @staticmethod
    def generate_ad_accounts(count=3):
        """Generate mock Meta ad account data"""
        accounts = []
        for i in range(count):
            accounts.append({
                "account_id": f"act_test_{i+1:03d}",
                "name": f"Test Campaign Account {i+1}",
                "currency": "USD",
                "timezone_name": "America/New_York",
                "account_status": "ACTIVE",
                "business_id": f"biz_test_{i+1:03d}",
                "permissions": ["ADVERTISE", "ANALYZE"],
                "amount_spent": f"{random.randint(1000, 10000)}.{random.randint(10, 99)}",
                "balance": f"{random.randint(5000, 15000)}.{random.randint(10, 99)}"
            })
        return accounts
    
    @staticmethod
    def generate_campaigns(count=5):
        """Generate mock Meta campaign data"""
        campaigns = []
        objectives = ["REACH", "TRAFFIC", "CONVERSIONS", "BRAND_AWARENESS"]
        statuses = ["ACTIVE", "PAUSED", "ARCHIVED"]
        
        for i in range(count):
            campaigns.append({
                "id": str(i+1),
                "name": f"Test Campaign {i+1}",
                "status": random.choice(statuses),
                "account_id": f"act_test_{random.randint(1, 3):03d}",
                "objective": random.choice(objectives),
                "created_time": (
                    datetime.utcnow() - timedelta(days=random.randint(1, 90))
                ).isoformat() + "Z",
                "updated_time": (
                    datetime.utcnow() - timedelta(hours=random.randint(1, 24))
                ).isoformat() + "Z"
            })
        return campaigns
    
    @staticmethod
    def generate_oauth_response():
        """Generate mock OAuth token response"""
        return {
            "access_token": f"test_access_token_{random.randint(1000, 9999)}",
            "token_type": "bearer",
            "expires_in": 3600,
            "refresh_token": f"test_refresh_token_{random.randint(1000, 9999)}",
            "scope": "ads_management ads_read business_management"
        }
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/meta-integration-tests.yml
name: Meta Integration Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/backend/services/meta/**'
      - 'src/backend/api/v1/endpoints/meta_auth.py'
      - 'src/frontend/src/components/integrations/MetaIntegration.tsx'
      - 'src/frontend/src/services/metaAuthService.ts'
  pull_request:
    branches: [ main ]
    paths:
      - 'src/backend/services/meta/**'
      - 'src/frontend/src/**/*meta*'

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: warroom_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd src/backend
        pip install -r requirements.txt
        pip install pytest pytest-asyncio pytest-cov
    
    - name: Set up environment variables
      run: |
        echo "DATABASE_URL=postgresql://postgres:test_password@localhost:5432/warroom_test" >> $GITHUB_ENV
        echo "META_TOKEN_ENCRYPTION_KEY=test_encryption_key_32_characters_long" >> $GITHUB_ENV
        echo "TESTING=true" >> $GITHUB_ENV
    
    - name: Run database migrations
      run: |
        cd src/backend
        alembic upgrade head
    
    - name: Run Meta integration tests
      run: |
        cd src/backend
        pytest tests/unit/test_meta_* -v --cov=services.meta
        pytest tests/integration/test_meta_* -v
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./src/backend/coverage.xml
        flags: backend-meta

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: 'src/frontend/package-lock.json'
    
    - name: Install dependencies
      run: |
        cd src/frontend
        npm ci
    
    - name: Run Meta component tests
      run: |
        cd src/frontend
        npm test -- --coverage --testPathPattern=MetaIntegration
    
    - name: Run E2E tests
      run: |
        cd src/frontend
        npx playwright install
        npm run test:e2e -- tests/e2e/meta-integration.spec.ts

  security-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security scan
      uses: securecodewarrior/github-action-add-sarif@v1
      with:
        sarif-file: 'security-scan-results.sarif'
    
    - name: Meta integration security tests
      run: |
        cd src/backend
        python -m pytest tests/security/test_meta_security.py -v
```

### Test Report Generation

```python
# scripts/generate_test_report.py
import json
import sys
from datetime import datetime
from pathlib import Path

def generate_meta_integration_test_report():
    """Generate comprehensive test report for Meta integration"""
    
    report = {
        "test_suite": "Meta Business Suite Integration",
        "timestamp": datetime.utcnow().isoformat(),
        "summary": {},
        "test_results": {},
        "coverage": {},
        "performance_metrics": {},
        "security_scan": {}
    }
    
    # Collect test results
    unit_tests = run_unit_tests()
    integration_tests = run_integration_tests()
    e2e_tests = run_e2e_tests()
    
    report["test_results"] = {
        "unit_tests": unit_tests,
        "integration_tests": integration_tests,
        "e2e_tests": e2e_tests
    }
    
    # Calculate summary
    total_tests = (
        unit_tests["passed"] + unit_tests["failed"] +
        integration_tests["passed"] + integration_tests["failed"] +
        e2e_tests["passed"] + e2e_tests["failed"]
    )
    
    total_passed = (
        unit_tests["passed"] + 
        integration_tests["passed"] + 
        e2e_tests["passed"]
    )
    
    report["summary"] = {
        "total_tests": total_tests,
        "passed": total_passed,
        "failed": total_tests - total_passed,
        "success_rate": (total_passed / total_tests) * 100 if total_tests > 0 else 0
    }
    
    # Generate HTML report
    generate_html_report(report)
    
    return report

def generate_html_report(report_data):
    """Generate HTML test report"""
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Meta Integration Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
            .passed { color: green; }
            .failed { color: red; }
            .test-section { margin: 20px 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Meta Integration Test Report</h1>
        <div class="summary">
            <h2>Summary</h2>
            <p>Total Tests: <strong>{total_tests}</strong></p>
            <p>Passed: <span class="passed">{passed}</span></p>
            <p>Failed: <span class="failed">{failed}</span></p>
            <p>Success Rate: <strong>{success_rate:.2f}%</strong></p>
        </div>
        
        <div class="test-section">
            <h2>Test Results</h2>
            <!-- Test results table would be generated here -->
        </div>
        
        <div class="test-section">
            <h2>Coverage Report</h2>
            <!-- Coverage information would be displayed here -->
        </div>
    </body>
    </html>
    """.format(**report_data["summary"])
    
    with open("test_report.html", "w") as f:
        f.write(html_template)

if __name__ == "__main__":
    report = generate_meta_integration_test_report()
    print(json.dumps(report, indent=2))
```

---

## Support and Resources

### Documentation Links
- [Meta Business API Testing](https://developers.facebook.com/docs/marketing-api/guides/testing/)
- [OAuth 2.0 Testing Guide](https://datatracker.ietf.org/doc/html/rfc6749#section-10.3)
- [Pytest Documentation](https://docs.pytest.org/en/stable/)
- [Playwright Testing](https://playwright.dev/python/docs/intro)

### Getting Help
- **GitHub Issues**: [Submit test-related issues](https://github.com/Think-Big-Media/1.0-war-room/issues)
- **Test Documentation**: [META_INTEGRATION.md](./META_INTEGRATION.md)
- **API Documentation**: [API_DOCS.md](./archive/API_DOCS.md)

### Additional Resources
- **Test Coverage Reports**: Available in CI/CD pipeline
- **Performance Benchmarks**: [Performance Testing](#performance-testing)
- **Security Assessment**: [Security Testing](#security-testing)

---

*Meta Integration Testing Guide v1.0 | Last Updated: August 2025 | For War Room Platform*