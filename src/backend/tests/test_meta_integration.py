"""
Comprehensive testing framework for Meta Business API integration.
Tests OAuth flow, API endpoints, and data handling.
"""

import pytest
import asyncio
import json
import os
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from main import app
from app.api.endpoints.meta_auth import (
    handle_oauth_callback,
    refresh_token,
    get_auth_status,
    get_ad_accounts
)
from core.redis import redis_client
from models.user import User


# Test client - will be setup in test fixtures

# Test configuration
TEST_CONFIG = {
    "META_APP_ID": "test_app_id_123456",
    "META_APP_SECRET": "test_app_secret_abcdef",
    "META_API_VERSION": "v18.0",
    "API_BASE_URL": "http://localhost:8000",
}

# Mock responses
MOCK_TOKEN_RESPONSE = {
    "access_token": "EAABwzLixnjYBAJxzK...",
    "token_type": "bearer",
    "expires_in": 5184000
}

MOCK_AD_ACCOUNTS_RESPONSE = {
    "data": [
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
    "paging": {
        "cursors": {
            "before": "MAZDZD",
            "after": "MjQZD"
        }
    }
}

MOCK_CAMPAIGN_INSIGHTS = {
    "data": [
        {
            "campaign_name": "Test Campaign",
            "impressions": "10000",
            "clicks": "500",
            "spend": "100.00",
            "cpm": "10.00",
            "ctr": "5.0",
            "reach": "8000",
            "frequency": "1.25",
            "date_start": "2024-08-01",
            "date_stop": "2024-08-07"
        }
    ]
}


class TestMetaOAuthFlow:
    """Test Meta OAuth2 authentication flow."""

    @pytest.fixture
    def mock_user(self):
        """Create mock user for testing."""
        return User(
            id="test_user_123",
            email="test@example.com",
            full_name="Test User",
            org_id="test_org_456"
        )

    @pytest.mark.asyncio
    async def test_generate_auth_url(self):
        """Test OAuth authorization URL generation."""
        from app.api.endpoints.meta_auth import generate_auth_url
        
        with patch.dict(os.environ, TEST_CONFIG):
            auth_url = generate_auth_url("test_state_789")
            
            parsed_url = urlparse(auth_url)
            query_params = parse_qs(parsed_url.query)
            
            assert parsed_url.netloc == "www.facebook.com"
            assert parsed_url.path == "/v18.0/dialog/oauth"
            assert query_params["client_id"][0] == TEST_CONFIG["META_APP_ID"]
            assert query_params["response_type"][0] == "code"
            assert query_params["state"][0] == "test_state_789"
            assert "ads_read" in query_params["scope"][0]
            assert "business_management" in query_params["scope"][0]

    @pytest.mark.asyncio
    async def test_oauth_callback_success(self, mock_user):
        """Test successful OAuth callback handling."""
        callback_data = {
            "code": "test_auth_code_123",
            "redirect_uri": "http://localhost:8000/api/v1/meta/auth/callback"
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            # Mock token exchange response
            mock_token_response = AsyncMock()
            mock_token_response.status_code = 200
            mock_token_response.json.return_value = MOCK_TOKEN_RESPONSE
            
            # Mock ad accounts response
            mock_accounts_response = AsyncMock()
            mock_accounts_response.status_code = 200
            mock_accounts_response.json.return_value = MOCK_AD_ACCOUNTS_RESPONSE
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get.side_effect = [mock_token_response, mock_accounts_response]
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Mock Redis storage
            with patch.object(redis_client, 'setex') as mock_redis:
                response = await handle_oauth_callback(callback_data, mock_user)
                
                assert response.access_token == MOCK_TOKEN_RESPONSE["access_token"]
                assert response.account_id == "123456789"
                assert response.user_id == mock_user.id
                mock_redis.assert_called_once()

    @pytest.mark.asyncio
    async def test_oauth_callback_invalid_code(self, mock_user):
        """Test OAuth callback with invalid authorization code."""
        callback_data = {
            "code": "invalid_code",
            "redirect_uri": "http://localhost:8000/api/v1/meta/auth/callback"
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            # Mock error response
            mock_response = AsyncMock()
            mock_response.status_code = 400
            mock_response.json.return_value = {
                "error": {
                    "message": "Invalid authorization code",
                    "type": "OAuthException",
                    "code": 100
                }
            }
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            with pytest.raises(Exception) as exc_info:
                await handle_oauth_callback(callback_data, mock_user)
            
            assert "Invalid authorization code" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_token_refresh_success(self, mock_user):
        """Test successful token refresh."""
        # Mock stored token data
        stored_token_data = {
            "access_token": "old_token_123",
            "account_id": "123456789",
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }
        
        with patch.object(redis_client, 'get') as mock_get:
            mock_get.return_value = json.dumps(stored_token_data)
            
            with patch('httpx.AsyncClient') as mock_client:
                # Mock refresh response
                mock_response = AsyncMock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "access_token": "new_token_456",
                    "expires_in": 5184000
                }
                
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance
                
                with patch.object(redis_client, 'setex') as mock_setex:
                    response = await refresh_token(mock_user)
                    
                    assert response.access_token == "new_token_456"
                    assert response.account_id == "123456789"
                    mock_setex.assert_called_once()

    @pytest.mark.asyncio
    async def test_auth_status_authenticated(self, mock_user):
        """Test auth status when user is authenticated."""
        stored_token_data = {
            "access_token": "valid_token",
            "account_id": "123456789",
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }
        
        with patch.object(redis_client, 'get') as mock_get:
            mock_get.return_value = json.dumps(stored_token_data)
            
            response = await get_auth_status(mock_user)
            
            assert response["authenticated"] is True
            assert response["account_id"] == "123456789"

    @pytest.mark.asyncio
    async def test_auth_status_not_authenticated(self, mock_user):
        """Test auth status when user is not authenticated."""
        with patch.object(redis_client, 'get') as mock_get:
            mock_get.return_value = None
            
            response = await get_auth_status(mock_user)
            
            assert response["authenticated"] is False
            assert response["account_id"] is None


class TestMetaAPIEndpoints:
    """Test Meta API data retrieval endpoints."""

    @pytest.fixture
    def authenticated_user_token(self):
        """Mock authenticated user token data."""
        return {
            "access_token": "valid_meta_token",
            "account_id": "123456789",
            "expires_at": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }

    @pytest.mark.asyncio
    async def test_get_ad_accounts_success(self, mock_user, authenticated_user_token):
        """Test successful ad accounts retrieval."""
        with patch.object(redis_client, 'get') as mock_get:
            mock_get.return_value = json.dumps(authenticated_user_token)
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_response = AsyncMock()
                mock_response.status_code = 200
                mock_response.json.return_value = MOCK_AD_ACCOUNTS_RESPONSE
                
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance
                
                response = await get_ad_accounts(mock_user)
                
                assert len(response["accounts"]) == 1
                assert response["accounts"][0]["name"] == "Test Campaign Account"
                assert response["selected_account_id"] == "123456789"

    @pytest.mark.asyncio
    async def test_get_ad_accounts_unauthenticated(self, mock_user):
        """Test ad accounts retrieval for unauthenticated user."""
        with patch.object(redis_client, 'get') as mock_get:
            mock_get.return_value = None
            
            with pytest.raises(Exception) as exc_info:
                await get_ad_accounts(mock_user)
            
            assert "Not authenticated" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_api_rate_limiting(self, mock_user, authenticated_user_token):
        """Test API rate limiting handling."""
        with patch.object(redis_client, 'get') as mock_get:
            mock_get.return_value = json.dumps(authenticated_user_token)
            
            with patch('httpx.AsyncClient') as mock_client:
                # Mock rate limit response
                mock_response = AsyncMock()
                mock_response.status_code = 429
                mock_response.headers = {
                    'x-business-use-case-usage': json.dumps({
                        "123456789": {"call_count": 100, "total_cputime": 100}
                    })
                }
                mock_response.json.return_value = {
                    "error": {
                        "message": "Application request limit reached",
                        "type": "OAuthException",
                        "code": 4
                    }
                }
                
                mock_client_instance = AsyncMock()
                mock_client_instance.get.return_value = mock_response
                mock_client.return_value.__aenter__.return_value = mock_client_instance
                
                with pytest.raises(Exception) as exc_info:
                    await get_ad_accounts(mock_user)
                
                assert "rate limit" in str(exc_info.value).lower()


class TestDataSecurity:
    """Test data security and encryption."""

    def test_token_encryption(self):
        """Test token encryption and decryption."""
        from services.meta_service import TokenEncryption
        
        encryption_service = TokenEncryption()
        test_token = "EAABwzLixnjYBAJxzK..."
        
        # Encrypt token
        encrypted_token = encryption_service.encrypt_token(test_token)
        assert encrypted_token != test_token
        assert isinstance(encrypted_token, bytes)
        
        # Decrypt token
        decrypted_token = encryption_service.decrypt_token(encrypted_token)
        assert decrypted_token == test_token

    @pytest.mark.asyncio
    async def test_secure_token_storage(self, mock_user):
        """Test secure token storage in Redis."""
        from services.meta_service import store_encrypted_token
        
        token_data = {
            "access_token": "test_token_123",
            "expires_in": 3600,
            "account_id": "123456789"
        }
        
        with patch.object(redis_client, 'setex') as mock_setex:
            await store_encrypted_token(mock_user.id, token_data)
            
            # Verify Redis was called with encrypted data
            mock_setex.assert_called_once()
            call_args = mock_setex.call_args
            
            # Verify the stored data is encrypted (not plain JSON)
            stored_data = call_args[0][2]
            assert stored_data != json.dumps(token_data)

    def test_webhook_signature_verification(self):
        """Test Meta webhook signature verification."""
        from app.api.endpoints.meta_auth import verify_webhook_signature
        
        test_payload = b'{"user_id": "123456", "algorithm": "HMAC-SHA256"}'
        test_secret = "test_webhook_secret"
        
        # Generate valid signature
        import hmac
        import hashlib
        expected_signature = hmac.new(
            test_secret.encode(),
            test_payload,
            hashlib.sha256
        ).hexdigest()
        
        # Test valid signature
        assert verify_webhook_signature(
            test_payload, 
            f"sha256={expected_signature}",
            test_secret
        )
        
        # Test invalid signature
        assert not verify_webhook_signature(
            test_payload,
            "sha256=invalid_signature",
            test_secret
        )


class TestErrorHandling:
    """Test error handling and recovery."""

    @pytest.mark.asyncio
    async def test_network_error_handling(self, mock_user):
        """Test network error handling."""
        with patch('httpx.AsyncClient') as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.get.side_effect = httpx.NetworkError("Network error")
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            with pytest.raises(Exception) as exc_info:
                await get_ad_accounts(mock_user)
            
            assert "Network error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_invalid_token_recovery(self, mock_user):
        """Test automatic token refresh on invalid token error."""
        stored_token_data = {
            "access_token": "expired_token",
            "account_id": "123456789",
            "expires_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()
        }
        
        with patch.object(redis_client, 'get') as mock_get:
            mock_get.return_value = json.dumps(stored_token_data)
            
            with patch('httpx.AsyncClient') as mock_client:
                # First call returns invalid token error
                mock_error_response = AsyncMock()
                mock_error_response.status_code = 401
                mock_error_response.json.return_value = {
                    "error": {"code": 190, "message": "Invalid OAuth access token"}
                }
                
                # Second call (after refresh) returns success
                mock_success_response = AsyncMock()
                mock_success_response.status_code = 200
                mock_success_response.json.return_value = MOCK_AD_ACCOUNTS_RESPONSE
                
                mock_client_instance = AsyncMock()
                mock_client_instance.get.side_effect = [mock_error_response, mock_success_response]
                mock_client.return_value.__aenter__.return_value = mock_client_instance
                
                # Mock token refresh
                with patch('app.api.endpoints.meta_auth.refresh_token') as mock_refresh:
                    mock_refresh.return_value = Mock(access_token="new_token")
                    
                    response = await get_ad_accounts(mock_user)
                    
                    # Should successfully return accounts after refresh
                    assert len(response["accounts"]) == 1
                    mock_refresh.assert_called_once()


class TestIntegrationFlow:
    """End-to-end integration tests."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_complete_oauth_flow(self):
        """Test complete OAuth flow integration."""
        # This test requires actual Meta test credentials
        if not all(key in os.environ for key in ['META_TEST_APP_ID', 'META_TEST_APP_SECRET']):
            pytest.skip("Meta test credentials not available")
        
        # Test OAuth URL generation
        auth_url = f"https://www.facebook.com/v18.0/dialog/oauth"
        params = {
            'client_id': os.environ['META_TEST_APP_ID'],
            'redirect_uri': 'http://localhost:8000/callback',
            'scope': 'ads_read,business_management',
            'response_type': 'code'
        }
        
        # Verify OAuth URL is accessible
        async with httpx.AsyncClient() as client:
            response = await client.get(auth_url, params=params)
            assert response.status_code == 200

    @pytest.mark.integration
    def test_privacy_policy_accessible(self):
        """Test that privacy policy is accessible at required URL."""
        response = client.get("/privacy")
        assert response.status_code == 200
        assert "War Room Privacy Policy" in response.text

    @pytest.mark.integration
    def test_terms_of_service_accessible(self):
        """Test that terms of service is accessible."""
        response = client.get("/terms")
        assert response.status_code == 200
        assert "War Room Terms of Service" in response.text


# Performance and load tests
class TestPerformance:
    """Test performance and scalability."""

    @pytest.mark.performance
    @pytest.mark.asyncio
    async def test_concurrent_oauth_callbacks(self):
        """Test handling multiple concurrent OAuth callbacks."""
        # Create multiple mock users
        mock_users = [
            User(id=f"user_{i}", email=f"test{i}@example.com", org_id=f"org_{i}")
            for i in range(10)
        ]
        
        callback_data = {
            "code": "test_code",
            "redirect_uri": "http://localhost:8000/callback"
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = MOCK_TOKEN_RESPONSE
            
            mock_accounts_response = AsyncMock()
            mock_accounts_response.status_code = 200
            mock_accounts_response.json.return_value = MOCK_AD_ACCOUNTS_RESPONSE
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get.side_effect = [mock_response, mock_accounts_response] * 10
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            with patch.object(redis_client, 'setex'):
                # Execute concurrent callbacks
                tasks = [
                    handle_oauth_callback(callback_data, user)
                    for user in mock_users
                ]
                
                start_time = datetime.utcnow()
                results = await asyncio.gather(*tasks, return_exceptions=True)
                end_time = datetime.utcnow()
                
                # All should succeed
                for result in results:
                    assert not isinstance(result, Exception)
                
                # Should complete within reasonable time (2 seconds)
                duration = (end_time - start_time).total_seconds()
                assert duration < 2.0


# Test utilities
class MetaTestClient:
    """Utility class for Meta API testing."""
    
    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret
        self.base_url = "https://graph.facebook.com/v18.0"
    
    async def test_app_access(self) -> bool:
        """Test if app credentials are valid."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/{self.app_id}",
                    params={'access_token': f"{self.app_id}|{self.app_secret}"}
                )
                return response.status_code == 200
            except:
                return False
    
    def generate_test_user_token(self) -> str:
        """Generate test user token for development."""
        # This would integrate with Meta's test user API
        # For now, return placeholder
        return "test_user_token_placeholder"


# Pytest configuration
def pytest_configure(config):
    """Configure pytest for Meta integration tests."""
    # Mark slow tests
    config.addinivalue_line(
        "markers", 
        "integration: mark test as integration test (may require network access)"
    )
    config.addinivalue_line(
        "markers",
        "performance: mark test as performance test"
    )


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])