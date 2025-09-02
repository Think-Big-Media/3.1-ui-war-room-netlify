"""
Tests for Google Ads API service and authentication.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta

from services.googleAds.google_ads_service import google_ads_service
from services.googleAds.google_ads_auth_service import google_ads_auth_service
from models.google_ads_auth import GoogleAdsAuth


class TestGoogleAdsAuthService:
    """Test Google Ads authentication service."""
    
    def test_get_authorization_url(self):
        """Test OAuth2 authorization URL generation."""
        # Mock the configuration
        with patch.object(google_ads_auth_service, 'client_id', 'test_client_id'):
            auth_url = google_ads_auth_service.get_authorization_url('test_org_id')
            
            assert 'accounts.google.com/o/oauth2/v2/auth' in auth_url
            assert 'client_id=test_client_id' in auth_url
            assert 'org_id=test_org_id' in auth_url
            assert 'adwords' in auth_url
    
    def test_get_authorization_url_no_config(self):
        """Test authorization URL generation without config."""
        with patch.object(google_ads_auth_service, 'client_id', None):
            with pytest.raises(ValueError, match="Google Ads OAuth2 not configured"):
                google_ads_auth_service.get_authorization_url('test_org_id')
    
    @pytest.mark.asyncio
    async def test_handle_callback_success(self):
        """Test successful OAuth2 callback handling."""
        with patch.object(google_ads_auth_service, '_exchange_code_for_tokens') as mock_exchange:
            with patch.object(google_ads_auth_service, '_store_tokens') as mock_store:
                mock_exchange.return_value = {
                    'access_token': 'test_token',
                    'refresh_token': 'test_refresh',
                    'expires_at': datetime.utcnow() + timedelta(hours=1)
                }
                
                result = await google_ads_auth_service.handle_callback(
                    'test_code', 
                    'org_id=test_org'
                )
                
                assert result['success'] is True
                assert result['org_id'] == 'test_org'
                mock_exchange.assert_called_once_with('test_code')
                mock_store.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_handle_callback_missing_state(self):
        """Test callback with missing state parameter."""
        result = await google_ads_auth_service.handle_callback('test_code', '')
        
        assert result['success'] is False
        assert 'Missing organization ID' in result['error']
    
    def test_auth_record_token_expiry(self):
        """Test token expiry checking."""
        # Create auth record with expired token
        auth_record = GoogleAdsAuth(
            org_id='test_org',
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=datetime.utcnow() - timedelta(minutes=10),
            client_id='test_client',
            client_secret='test_secret'
        )
        
        assert auth_record.is_token_expired() is True
        assert auth_record.needs_refresh() is True
        
        # Create auth record with valid token
        auth_record_valid = GoogleAdsAuth(
            org_id='test_org',
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            client_id='test_client',
            client_secret='test_secret'
        )
        
        assert auth_record_valid.is_token_expired() is False


class TestGoogleAdsService:
    """Test Google Ads data service."""
    
    @pytest.mark.asyncio
    async def test_get_accessible_customers_no_client(self):
        """Test getting customers when client is unavailable."""
        with patch.object(google_ads_service, '_get_client', return_value=None):
            customers = await google_ads_service.get_accessible_customers('test_org')
            
            # Should return mock data
            assert len(customers) > 0
            assert customers[0]['customer_id'] == '1234567890'
            assert customers[0]['descriptive_name'] == 'Demo Campaign Account'
    
    @pytest.mark.asyncio
    async def test_get_campaigns_no_client(self):
        """Test getting campaigns when client is unavailable."""
        with patch.object(google_ads_service, '_get_client', return_value=None):
            campaigns = await google_ads_service.get_campaigns('test_org', '1234567890')
            
            # Should return mock data
            assert len(campaigns) > 0
            assert campaigns[0]['id'] == '987654321'
            assert campaigns[0]['name'] == 'Demo Campaign'
    
    @pytest.mark.asyncio
    async def test_get_performance_metrics_no_client(self):
        """Test getting metrics when client is unavailable."""
        date_range = {
            'start_date': '2024-01-01',
            'end_date': '2024-01-31'
        }
        
        with patch.object(google_ads_service, '_get_client', return_value=None):
            metrics = await google_ads_service.get_performance_metrics(
                'test_org', 
                '1234567890', 
                date_range
            )
            
            # Should return mock data
            assert len(metrics) > 0
            assert metrics[0]['campaign_id'] == '987654321'
            assert 'impressions' in metrics[0]
            assert 'clicks' in metrics[0]
    
    @pytest.mark.asyncio
    async def test_search_stream_no_client(self):
        """Test search stream when client is unavailable."""
        query = "SELECT campaign.name FROM campaign"
        
        with patch.object(google_ads_service, '_get_client', return_value=None):
            results = await google_ads_service.search_stream(
                'test_org',
                '1234567890',
                query
            )
            
            # Should return mock data
            assert len(results) > 0
            assert 'message' in results[0]
            assert results[0]['query'] == query
    
    @pytest.mark.asyncio
    async def test_retry_with_backoff_success(self):
        """Test retry logic with successful execution."""
        async def mock_func():
            return "success"
        
        result = await google_ads_service._retry_with_backoff(mock_func)
        assert result == "success"
    
    @pytest.mark.asyncio
    async def test_retry_with_backoff_max_retries(self):
        """Test retry logic reaching maximum attempts."""
        call_count = 0
        
        async def mock_func():
            nonlocal call_count
            call_count += 1
            raise Exception("Test error")
        
        with pytest.raises(Exception, match="Failed after 4 attempts"):
            await google_ads_service._retry_with_backoff(mock_func, max_retries=3)
        
        assert call_count == 4  # Initial attempt + 3 retries


class TestMockData:
    """Test mock data generation."""
    
    def test_mock_customers(self):
        """Test mock customer data structure."""
        customers = google_ads_service._get_mock_customers()
        
        assert len(customers) > 0
        customer = customers[0]
        
        required_fields = ['customer_id', 'descriptive_name', 'currency_code', 'time_zone', 'is_manager']
        for field in required_fields:
            assert field in customer
    
    def test_mock_campaigns(self):
        """Test mock campaign data structure."""
        campaigns = google_ads_service._get_mock_campaigns('1234567890')
        
        assert len(campaigns) > 0
        campaign = campaigns[0]
        
        required_fields = ['id', 'name', 'status', 'advertising_channel_type']
        for field in required_fields:
            assert field in campaign
    
    def test_mock_metrics(self):
        """Test mock metrics data structure."""
        date_range = {'start_date': '2024-01-01', 'end_date': '2024-01-31'}
        metrics = google_ads_service._get_mock_metrics('1234567890', date_range)
        
        assert len(metrics) > 0
        metric = metrics[0]
        
        required_fields = ['date', 'campaign_id', 'impressions', 'clicks', 'cost']
        for field in required_fields:
            assert field in metric


@pytest.fixture
def mock_auth_record():
    """Create a mock authentication record."""
    return GoogleAdsAuth(
        id=1,
        org_id='test_org_id',
        access_token='test_access_token',
        refresh_token='test_refresh_token',
        token_expires_at=datetime.utcnow() + timedelta(hours=1),
        customer_id='1234567890',
        client_id='test_client_id',
        client_secret='test_client_secret',
        is_active=True,
        scopes=['https://www.googleapis.com/auth/adwords'],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestAuthRecordMethods:
    """Test authentication record methods."""
    
    def test_to_dict(self, mock_auth_record):
        """Test conversion to dictionary."""
        result = mock_auth_record.to_dict()
        
        expected_fields = [
            'id', 'org_id', 'customer_id', 'is_active', 
            'token_expires_at', 'scopes', 'created_at', 'updated_at'
        ]
        
        for field in expected_fields:
            assert field in result
        
        # Sensitive fields should not be included
        sensitive_fields = ['access_token', 'refresh_token', 'client_secret']
        for field in sensitive_fields:
            assert field not in result
    
    def test_repr(self, mock_auth_record):
        """Test string representation."""
        result = repr(mock_auth_record)
        assert 'GoogleAdsAuth' in result
        assert 'test_org_id' in result
        assert '1234567890' in result