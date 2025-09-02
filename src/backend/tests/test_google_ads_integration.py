"""
Integration tests for Google Ads OAuth2 flow.
Tests the complete authentication flow with mocked external services.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from httpx import AsyncClient
from fastapi import FastAPI
import json

from services.googleAds.google_ads_auth_service import google_ads_auth_service
from services.googleAds.google_ads_service import google_ads_service
from models.google_ads_auth import GoogleAdsAuth
from models.user import User
from models.organization import Organization
from core.config import settings


class TestGoogleAdsOAuth2Integration:
    """Integration tests for complete Google Ads OAuth2 flow."""
    
    @pytest.mark.asyncio
    async def test_complete_oauth_flow_success(self, test_app, test_client, test_user, test_org, auth_headers):
        """Test complete OAuth2 authentication flow from start to finish."""
        
        # Step 1: Request authorization URL
        auth_url_response = await test_client.post(
            "/api/v1/auth/google-ads/redirect",
            json={"state": "test_integration"},
            headers=auth_headers
        )
        
        assert auth_url_response.status_code == 200
        auth_data = auth_url_response.json()
        assert "authorization_url" in auth_data
        assert "accounts.google.com/o/oauth2/v2/auth" in auth_data["authorization_url"]
        
        # Step 2: Mock the callback handling
        mock_token_response = {
            "access_token": "test_access_token_integration",
            "refresh_token": "test_refresh_token_integration", 
            "expires_in": 3600,
            "scope": "https://www.googleapis.com/auth/adwords",
            "token_type": "Bearer"
        }
        
        with patch('httpx.AsyncClient') as mock_client:
            # Mock token exchange
            mock_response = Mock()
            mock_response.json.return_value = mock_token_response
            mock_response.raise_for_status.return_value = None
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                return_value=mock_response
            )
            
            # Step 3: Handle OAuth callback
            callback_response = await test_client.get(
                f"/api/v1/auth/google-ads/callback?code=test_code&state=org_id={test_org.id}"
            )
            
            # Should redirect (status 307)
            assert callback_response.status_code == 307
        
        # Step 4: Check authentication status
        status_response = await test_client.get(
            "/api/v1/auth/google-ads/status",
            headers=auth_headers
        )
        
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["is_authenticated"] is True
        assert "expires_at" in status_data
    
    @pytest.mark.asyncio
    async def test_oauth_flow_with_token_refresh(self, test_app, test_client, test_user, test_org, auth_headers):
        """Test OAuth flow including token refresh scenario."""
        
        # Create an expired auth record
        expired_auth = GoogleAdsAuth(
            org_id=test_org.id,
            access_token="encrypted_old_token",
            refresh_token="encrypted_refresh_token",
            token_expires_at=datetime.utcnow() - timedelta(minutes=10),  # Expired
            client_id="test_client_id",
            client_secret="encrypted_client_secret",
            is_active=True,
            scopes=["https://www.googleapis.com/auth/adwords"]
        )
        
        with patch('services.googleAds.google_ads_auth_service.get_db') as mock_get_db:
            with patch('core.encryption.token_encryption.decrypt_token') as mock_decrypt:
                mock_decrypt.side_effect = lambda x: f"decrypted_{x}"
                
                # Mock database operations
                mock_session = AsyncMock()
                mock_result = Mock()
                mock_result.scalar_one_or_none.return_value = expired_auth
                mock_session.execute.return_value = mock_result
                mock_session.commit = AsyncMock()
                mock_get_db.return_value.__aenter__.return_value = mock_session
                
                # Mock refresh token request
                mock_refresh_response = {
                    "access_token": "new_refreshed_token",
                    "expires_in": 3600
                }
                
                with patch('httpx.AsyncClient') as mock_client:
                    mock_response = Mock()
                    mock_response.json.return_value = mock_refresh_response
                    mock_response.raise_for_status.return_value = None
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                        return_value=mock_response
                    )
                    
                    # Test manual refresh
                    refresh_response = await test_client.post(
                        "/api/v1/auth/google-ads/refresh",
                        headers=auth_headers
                    )
                    
                    assert refresh_response.status_code == 200
                    refresh_data = refresh_response.json()
                    assert refresh_data["success"] is True
    
    @pytest.mark.asyncio
    async def test_oauth_flow_revocation(self, test_app, test_client, test_user, test_org, auth_headers):
        """Test OAuth flow including access revocation."""
        
        # Create an active auth record
        active_auth = GoogleAdsAuth(
            org_id=test_org.id,
            access_token="encrypted_access_token", 
            refresh_token="encrypted_refresh_token",
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            client_id="test_client_id",
            client_secret="encrypted_client_secret",
            is_active=True,
            scopes=["https://www.googleapis.com/auth/adwords"]
        )
        
        with patch('services.googleAds.google_ads_auth_service.get_db') as mock_get_db:
            with patch('core.encryption.token_encryption.decrypt_token') as mock_decrypt:
                mock_decrypt.return_value = "decrypted_token"
                
                # Mock database operations
                mock_session = AsyncMock()
                mock_result = Mock()
                mock_result.scalar_one_or_none.return_value = active_auth
                mock_session.execute.return_value = mock_result
                mock_session.commit = AsyncMock()
                mock_get_db.return_value.__aenter__.return_value = mock_session
                
                with patch('httpx.AsyncClient') as mock_client:
                    # Mock revoke request to Google
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock()
                    
                    # Test revocation
                    revoke_response = await test_client.post(
                        "/api/v1/auth/google-ads/revoke",
                        headers=auth_headers
                    )
                    
                    assert revoke_response.status_code == 200
                    revoke_data = revoke_response.json()
                    assert revoke_data["success"] is True
                    
                    # Verify auth record was deactivated
                    assert active_auth.is_active is False
                    assert active_auth.access_token is None
                    assert active_auth.refresh_token is None


class TestGoogleAdsServiceIntegration:
    """Integration tests for Google Ads API service."""
    
    @pytest.mark.asyncio
    async def test_get_accessible_customers_integration(self, test_org):
        """Test getting accessible customers with mocked API."""
        
        mock_credentials = Mock()
        mock_credentials.token = "test_access_token"
        mock_credentials.refresh_token = "test_refresh_token"
        mock_credentials.client_id = "test_client_id"
        mock_credentials.client_secret = "test_client_secret"
        mock_credentials.scopes = ["https://www.googleapis.com/auth/adwords"]
        
        with patch.object(google_ads_auth_service, 'get_valid_credentials') as mock_get_creds:
            mock_get_creds.return_value = mock_credentials
            
            with patch('google.ads.googleads.client.GoogleAdsClient.load_from_dict') as mock_client:
                # Mock customer service
                mock_customer_service = Mock()
                mock_accessible_customers = Mock()
                mock_accessible_customers.resource_names = ["customers/1234567890", "customers/9876543210"]
                mock_customer_service.list_accessible_customers.return_value = mock_accessible_customers
                
                # Mock Google Ads service for customer details
                mock_ga_service = Mock()
                mock_search_response = [
                    Mock(customer=Mock(
                        id=1234567890,
                        descriptive_name="Test Campaign Account",
                        currency_code="USD", 
                        time_zone="America/New_York",
                        manager=False
                    )),
                    Mock(customer=Mock(
                        id=9876543210,
                        descriptive_name="Secondary Account",
                        currency_code="EUR",
                        time_zone="Europe/London", 
                        manager=True
                    ))
                ]
                mock_ga_service.search.return_value = mock_search_response
                
                mock_ads_client = Mock()
                mock_ads_client.get_service.side_effect = lambda service_name: (
                    mock_customer_service if service_name == "CustomerService" 
                    else mock_ga_service
                )
                mock_client.return_value = mock_ads_client
                
                # Test the service
                customers = await google_ads_service.get_accessible_customers(test_org.id)
                
                assert len(customers) == 2
                assert customers[0]["customer_id"] == "1234567890"
                assert customers[0]["descriptive_name"] == "Test Campaign Account"
                assert customers[1]["customer_id"] == "9876543210"
                assert customers[1]["is_manager"] is True
    
    @pytest.mark.asyncio
    async def test_get_campaigns_integration(self, test_org):
        """Test getting campaigns with mocked API."""
        
        mock_credentials = Mock()
        mock_credentials.token = "test_access_token"
        
        with patch.object(google_ads_auth_service, 'get_valid_credentials') as mock_get_creds:
            mock_get_creds.return_value = mock_credentials
            
            with patch('google.ads.googleads.client.GoogleAdsClient.load_from_dict') as mock_client:
                # Mock campaign search response
                mock_ga_service = Mock()
                mock_search_response = [
                    Mock(
                        campaign=Mock(
                            id=111111,
                            name="Search Campaign",
                            status=Mock(name="ENABLED"),
                            advertising_channel_type=Mock(name="SEARCH"),
                            start_date="2024-01-01",
                            end_date="",
                            optimization_goal_types=[Mock(name="MAXIMIZE_CLICKS")]
                        ),
                        campaign_budget=Mock(
                            amount_micros=50000000,  # $50
                            delivery_method=Mock(name="STANDARD")
                        )
                    ),
                    Mock(
                        campaign=Mock(
                            id=222222,
                            name="Display Campaign", 
                            status=Mock(name="PAUSED"),
                            advertising_channel_type=Mock(name="DISPLAY"),
                            start_date="2024-02-01",
                            end_date="2024-12-31",
                            optimization_goal_types=[Mock(name="MAXIMIZE_CONVERSIONS")]
                        ),
                        campaign_budget=Mock(
                            amount_micros=100000000,  # $100
                            delivery_method=Mock(name="ACCELERATED")
                        )
                    )
                ]
                mock_ga_service.search.return_value = mock_search_response
                
                mock_ads_client = Mock()
                mock_ads_client.get_service.return_value = mock_ga_service
                mock_client.return_value = mock_ads_client
                
                # Test the service
                campaigns = await google_ads_service.get_campaigns(
                    test_org.id, 
                    "1234567890",
                    page_size=10
                )
                
                assert len(campaigns) == 2
                assert campaigns[0]["id"] == "111111"
                assert campaigns[0]["name"] == "Search Campaign"
                assert campaigns[0]["status"] == "ENABLED"
                assert campaigns[0]["budget_amount_micros"] == 50000000
                
                assert campaigns[1]["id"] == "222222"
                assert campaigns[1]["name"] == "Display Campaign"
                assert campaigns[1]["status"] == "PAUSED"
    
    @pytest.mark.asyncio
    async def test_get_performance_metrics_integration(self, test_org):
        """Test getting performance metrics with mocked API."""
        
        mock_credentials = Mock()
        mock_credentials.token = "test_access_token"
        
        with patch.object(google_ads_auth_service, 'get_valid_credentials') as mock_get_creds:
            mock_get_creds.return_value = mock_credentials
            
            with patch('google.ads.googleads.client.GoogleAdsClient.load_from_dict') as mock_client:
                # Mock metrics search response
                mock_ga_service = Mock()
                mock_search_response = [
                    Mock(
                        segments=Mock(date="2024-01-01"),
                        campaign=Mock(id=111111, name="Search Campaign"),
                        metrics=Mock(
                            impressions=1000,
                            clicks=50,
                            cost_micros=75000000,  # $75
                            conversions=5.0,
                            conversion_value=250.0
                        )
                    ),
                    Mock(
                        segments=Mock(date="2024-01-02"),
                        campaign=Mock(id=111111, name="Search Campaign"),
                        metrics=Mock(
                            impressions=1200,
                            clicks=60,
                            cost_micros=90000000,  # $90
                            conversions=7.0,
                            conversion_value=350.0
                        )
                    )
                ]
                mock_ga_service.search.return_value = mock_search_response
                
                mock_ads_client = Mock()
                mock_ads_client.get_service.return_value = mock_ga_service
                mock_client.return_value = mock_ads_client
                
                # Test the service
                metrics = await google_ads_service.get_performance_metrics(
                    test_org.id,
                    "1234567890", 
                    date_range={
                        "start_date": "2024-01-01",
                        "end_date": "2024-01-02"
                    },
                    segments=["date", "campaign"],
                    metrics=["impressions", "clicks", "cost_micros", "conversions"]
                )
                
                assert len(metrics) == 2
                
                # First day metrics
                assert metrics[0]["date"] == "2024-01-01"
                assert metrics[0]["campaign_id"] == "111111"
                assert metrics[0]["impressions"] == 1000
                assert metrics[0]["clicks"] == 50
                assert metrics[0]["cost"] == 75.0  # Converted from micros
                assert metrics[0]["conversions"] == 5.0
                
                # Second day metrics
                assert metrics[1]["date"] == "2024-01-02" 
                assert metrics[1]["cost"] == 90.0
    
    @pytest.mark.asyncio
    async def test_search_stream_integration(self, test_org):
        """Test search stream with custom GAQL query."""
        
        mock_credentials = Mock()
        mock_credentials.token = "test_access_token"
        
        with patch.object(google_ads_auth_service, 'get_valid_credentials') as mock_get_creds:
            mock_get_creds.return_value = mock_credentials
            
            with patch('google.ads.googleads.client.GoogleAdsClient.load_from_dict') as mock_client:
                # Mock search stream response
                mock_ga_service = Mock()
                
                # Mock batch results
                mock_batch = Mock()
                mock_batch.results = [
                    Mock(
                        campaign=Mock(
                            name="Custom Query Campaign",
                            status=Mock(name="ENABLED")
                        ),
                        metrics=Mock(
                            impressions=5000,
                            clicks=250
                        )
                    )
                ]
                
                # Mock the batch iterator
                mock_ga_service.search_stream.return_value = [mock_batch]
                
                mock_ads_client = Mock()
                mock_ads_client.get_service.return_value = mock_ga_service
                mock_client.return_value = mock_ads_client
                
                # Test custom GAQL query
                query = """
                    SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks
                    FROM campaign 
                    WHERE campaign.status = 'ENABLED'
                    LIMIT 1
                """
                
                with patch.object(google_ads_service, '_row_to_dict') as mock_row_to_dict:
                    mock_row_to_dict.return_value = {
                        "campaign": {
                            "name": "Custom Query Campaign",
                            "status": "ENABLED"
                        },
                        "metrics": {
                            "impressions": 5000,
                            "clicks": 250
                        }
                    }
                    
                    results = await google_ads_service.search_stream(
                        test_org.id,
                        "1234567890",
                        query,
                        page_size=1
                    )
                    
                    assert len(results) == 1
                    assert results[0]["campaign"]["name"] == "Custom Query Campaign"
                    assert results[0]["metrics"]["impressions"] == 5000


class TestErrorScenarios:
    """Test error handling in integration scenarios."""
    
    @pytest.mark.asyncio
    async def test_oauth_callback_with_invalid_state(self, test_app, test_client):
        """Test OAuth callback with malformed state parameter."""
        
        callback_response = await test_client.get(
            "/api/v1/auth/google-ads/callback?code=test_code&state=invalid_state_format"
        )
        
        # Should redirect with error
        assert callback_response.status_code == 307
        assert "error=" in callback_response.headers["location"]
    
    @pytest.mark.asyncio
    async def test_oauth_callback_token_exchange_failure(self, test_app, test_client, test_org):
        """Test OAuth callback with token exchange failure."""
        
        with patch('httpx.AsyncClient') as mock_client:
            # Mock HTTP error during token exchange
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=Exception("Token exchange failed")
            )
            
            callback_response = await test_client.get(
                f"/api/v1/auth/google-ads/callback?code=test_code&state=org_id={test_org.id}"
            )
            
            # Should redirect with error
            assert callback_response.status_code == 307
            assert "error=" in callback_response.headers["location"]
    
    @pytest.mark.asyncio
    async def test_api_calls_without_authentication(self, test_org):
        """Test API calls when authentication is not available."""
        
        with patch.object(google_ads_auth_service, 'get_valid_credentials') as mock_get_creds:
            mock_get_creds.return_value = None  # No credentials available
            
            # Should return mock data when no credentials
            customers = await google_ads_service.get_accessible_customers(test_org.id)
            assert len(customers) > 0
            assert customers[0]["customer_id"] == "1234567890"  # Mock data
            
            campaigns = await google_ads_service.get_campaigns(test_org.id, "1234567890")
            assert len(campaigns) > 0
            assert campaigns[0]["id"] == "987654321"  # Mock data
    
    @pytest.mark.asyncio
    async def test_service_with_google_ads_api_error(self, test_org):
        """Test service behavior when Google Ads API returns errors."""
        
        mock_credentials = Mock()
        mock_credentials.token = "test_access_token"
        
        with patch.object(google_ads_auth_service, 'get_valid_credentials') as mock_get_creds:
            mock_get_creds.return_value = mock_credentials
            
            with patch('google.ads.googleads.client.GoogleAdsClient.load_from_dict') as mock_client:
                from google.ads.googleads.errors import GoogleAdsException
                
                # Mock Google Ads API exception
                mock_ga_service = Mock()
                mock_ga_service.search.side_effect = GoogleAdsException(
                    "API Error", Mock(), Mock(), []
                )
                
                mock_ads_client = Mock()
                mock_ads_client.get_service.return_value = mock_ga_service
                mock_client.return_value = mock_ads_client
                
                # Should fallback to mock data
                campaigns = await google_ads_service.get_campaigns(test_org.id, "1234567890")
                assert len(campaigns) > 0
                assert campaigns[0]["name"] == "Demo Campaign"  # Mock data


class TestConcurrentAccess:
    """Test concurrent access scenarios."""
    
    @pytest.mark.asyncio
    async def test_concurrent_token_refresh(self, test_org):
        """Test concurrent token refresh requests."""
        
        # Create an expired auth record
        expired_auth = GoogleAdsAuth(
            org_id=test_org.id,
            access_token="encrypted_old_token",
            refresh_token="encrypted_refresh_token",
            token_expires_at=datetime.utcnow() - timedelta(minutes=10),
            client_id="test_client_id",
            client_secret="encrypted_client_secret",
            is_active=True
        )
        
        mock_refresh_response = {
            "access_token": "new_concurrent_token",
            "expires_in": 3600
        }
        
        with patch('services.googleAds.google_ads_auth_service.get_db') as mock_get_db:
            with patch('core.encryption.token_encryption.decrypt_token') as mock_decrypt:
                with patch('httpx.AsyncClient') as mock_client:
                    mock_decrypt.side_effect = lambda x: f"decrypted_{x}"
                    
                    # Mock database operations
                    mock_session = AsyncMock()
                    mock_result = Mock()
                    mock_result.scalar_one_or_none.return_value = expired_auth
                    mock_session.execute.return_value = mock_result
                    mock_session.commit = AsyncMock()
                    mock_get_db.return_value.__aenter__.return_value = mock_session
                    
                    # Mock HTTP response
                    mock_response = Mock()
                    mock_response.json.return_value = mock_refresh_response
                    mock_response.raise_for_status.return_value = None
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                        return_value=mock_response
                    )
                    
                    # Run multiple concurrent refresh requests
                    tasks = [
                        google_ads_auth_service.refresh_token(test_org.id)
                        for _ in range(3)
                    ]
                    
                    results = await asyncio.gather(*tasks)
                    
                    # All should succeed (or handle gracefully)
                    assert all(isinstance(result, bool) for result in results)
    
    @pytest.mark.asyncio
    async def test_concurrent_api_calls(self, test_org):
        """Test concurrent API calls to Google Ads service."""
        
        mock_credentials = Mock()
        mock_credentials.token = "test_access_token"
        
        with patch.object(google_ads_auth_service, 'get_valid_credentials') as mock_get_creds:
            mock_get_creds.return_value = mock_credentials
            
            # Run multiple concurrent API calls
            tasks = [
                google_ads_service.get_accessible_customers(test_org.id),
                google_ads_service.get_campaigns(test_org.id, "1234567890"),
                google_ads_service.get_performance_metrics(
                    test_org.id, 
                    "1234567890",
                    {"start_date": "2024-01-01", "end_date": "2024-01-02"}
                )
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # All should complete without exception
            for result in results:
                assert not isinstance(result, Exception)
                assert isinstance(result, list)


class TestDatabaseOperations:
    """Test database operations in integration context."""
    
    @pytest.mark.asyncio
    async def test_auth_record_crud_operations(self, test_db_session, test_org):
        """Test CRUD operations on auth records."""
        
        # Create
        new_auth = GoogleAdsAuth(
            org_id=test_org.id,
            access_token="encrypted_access",
            refresh_token="encrypted_refresh", 
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            client_id="integration_test_client",
            client_secret="encrypted_secret",
            customer_id="9999999999",
            is_active=True,
            scopes=["https://www.googleapis.com/auth/adwords"]
        )
        
        test_db_session.add(new_auth)
        await test_db_session.commit()
        await test_db_session.refresh(new_auth)
        
        assert new_auth.id is not None
        
        # Read
        retrieved_auth = await google_ads_auth_service.get_auth_record(test_org.id)
        assert retrieved_auth is not None
        assert retrieved_auth.org_id == test_org.id
        assert retrieved_auth.customer_id == "9999999999"
        
        # Update
        with patch('core.database.get_db') as mock_get_db:
            mock_get_db.return_value.__aenter__.return_value = test_db_session
            
            retrieved_auth.customer_id = "8888888888"
            retrieved_auth.last_refreshed_at = datetime.utcnow()
            await test_db_session.commit()
            
            updated_auth = await google_ads_auth_service.get_auth_record(test_org.id)
            assert updated_auth.customer_id == "8888888888"
        
        # Soft delete (deactivate)
        retrieved_auth.is_active = False
        await test_db_session.commit()
        
        # Should still exist but be inactive
        deactivated_auth = await google_ads_auth_service.get_auth_record(test_org.id)
        assert deactivated_auth is not None
        assert deactivated_auth.is_active is False
    
    @pytest.mark.asyncio
    async def test_multiple_org_isolation(self, test_db_session):
        """Test that auth records are properly isolated by organization."""
        
        # Create two organizations
        org1 = Organization(
            id="org-1",
            name="Organization 1",
            email="org1@test.com",
            subscription_tier="professional"
        )
        org2 = Organization(
            id="org-2", 
            name="Organization 2",
            email="org2@test.com",
            subscription_tier="professional"
        )
        
        test_db_session.add_all([org1, org2])
        await test_db_session.commit()
        
        # Create auth records for both orgs
        auth1 = GoogleAdsAuth(
            org_id=org1.id,
            access_token="encrypted_access_1",
            refresh_token="encrypted_refresh_1",
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            client_id="client_1",
            client_secret="secret_1",
            customer_id="1111111111",
            is_active=True
        )
        
        auth2 = GoogleAdsAuth(
            org_id=org2.id,
            access_token="encrypted_access_2", 
            refresh_token="encrypted_refresh_2",
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            client_id="client_2",
            client_secret="secret_2",
            customer_id="2222222222",
            is_active=True
        )
        
        test_db_session.add_all([auth1, auth2])
        await test_db_session.commit()
        
        with patch('core.database.get_db') as mock_get_db:
            mock_get_db.return_value.__aenter__.return_value = test_db_session
            
            # Verify isolation
            auth_org1 = await google_ads_auth_service.get_auth_record(org1.id)
            auth_org2 = await google_ads_auth_service.get_auth_record(org2.id)
            
            assert auth_org1.customer_id == "1111111111"
            assert auth_org2.customer_id == "2222222222"
            assert auth_org1.org_id != auth_org2.org_id


@pytest.fixture
def mock_google_ads_client():
    """Mock Google Ads client for integration tests."""
    with patch('google.ads.googleads.client.GoogleAdsClient') as mock_client:
        yield mock_client


@pytest.fixture 
def mock_http_client():
    """Mock HTTP client for OAuth requests."""
    with patch('httpx.AsyncClient') as mock_client:
        yield mock_client