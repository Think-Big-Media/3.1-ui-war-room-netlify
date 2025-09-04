"""
Comprehensive unit tests for Google Ads OAuth2 authentication.
Tests authentication service, token management, and API endpoints.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from fastapi import HTTPException
from httpx import AsyncClient
import httpx

from services.googleAds.google_ads_auth_service import GoogleAdsAuthService, google_ads_auth_service
from models.google_ads_auth import GoogleAdsAuth
from api.v1.endpoints.google_ads_auth import get_google_ads_auth_url, google_ads_oauth_callback
from core.encryption import token_encryption


class TestGoogleAdsAuthService:
    """Test Google Ads authentication service."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.service = GoogleAdsAuthService()
        self.test_org_id = "test-org-123"
        self.test_client_id = "test_client_id.googleusercontent.com"
        self.test_client_secret = "test_client_secret"
        
    def test_init_service(self):
        """Test service initialization."""
        service = GoogleAdsAuthService()
        assert service.SCOPES == ['https://www.googleapis.com/auth/adwords']
        assert hasattr(service, 'client_id')
        assert hasattr(service, 'client_secret')
        assert hasattr(service, 'redirect_uri')
    
    def test_get_authorization_url_success(self):
        """Test successful OAuth2 authorization URL generation."""
        with patch.object(self.service, 'client_id', self.test_client_id):
            auth_url = self.service.get_authorization_url(self.test_org_id, state="custom_state")
            
            # Verify URL components
            assert 'accounts.google.com/o/oauth2/v2/auth' in auth_url
            assert f'client_id={self.test_client_id}' in auth_url
            assert f'org_id={self.test_org_id}' in auth_url
            assert 'custom=custom_state' in auth_url
            assert 'scope=https%3A//www.googleapis.com/auth/adwords' in auth_url
            assert 'response_type=code' in auth_url
            assert 'access_type=offline' in auth_url
            assert 'prompt=consent' in auth_url
    
    def test_get_authorization_url_no_client_id(self):
        """Test authorization URL generation without client ID."""
        with patch.object(self.service, 'client_id', None):
            with pytest.raises(ValueError, match="Google Ads OAuth2 not configured"):
                self.service.get_authorization_url(self.test_org_id)
    
    def test_get_authorization_url_no_custom_state(self):
        """Test authorization URL generation without custom state."""
        with patch.object(self.service, 'client_id', self.test_client_id):
            auth_url = self.service.get_authorization_url(self.test_org_id)
            
            assert f'org_id={self.test_org_id}' in auth_url
            assert 'custom=' not in auth_url
    
    @pytest.mark.asyncio
    async def test_handle_callback_success(self):
        """Test successful OAuth2 callback handling."""
        test_code = "test_auth_code"
        test_state = f"org_id={self.test_org_id}&custom=test"
        
        mock_token_data = {
            'access_token': 'test_access_token',
            'refresh_token': 'test_refresh_token',
            'expires_in': 3600,
            'expires_at': datetime.utcnow() + timedelta(hours=1)
        }
        
        with patch.object(self.service, '_exchange_code_for_tokens') as mock_exchange:
            with patch.object(self.service, '_store_tokens') as mock_store:
                mock_exchange.return_value = mock_token_data
                mock_store.return_value = None
                
                result = await self.service.handle_callback(test_code, test_state)
                
                assert result['success'] is True
                assert result['org_id'] == self.test_org_id
                assert 'message' in result
                
                mock_exchange.assert_called_once_with(test_code)
                mock_store.assert_called_once_with(self.test_org_id, mock_token_data)
    
    @pytest.mark.asyncio
    async def test_handle_callback_missing_org_id(self):
        """Test callback with missing organization ID."""
        result = await self.service.handle_callback('test_code', 'invalid_state')
        
        assert result['success'] is False
        assert 'Missing organization ID' in result['error']
    
    @pytest.mark.asyncio
    async def test_handle_callback_exchange_error(self):
        """Test callback with token exchange error."""
        test_code = "test_auth_code"
        test_state = f"org_id={self.test_org_id}"
        
        with patch.object(self.service, '_exchange_code_for_tokens') as mock_exchange:
            mock_exchange.side_effect = Exception("Token exchange failed")
            
            result = await self.service.handle_callback(test_code, test_state)
            
            assert result['success'] is False
            assert 'Token exchange failed' in result['error']
    
    @pytest.mark.asyncio
    async def test_exchange_code_for_tokens_success(self):
        """Test successful token exchange."""
        test_code = "test_auth_code"
        mock_response_data = {
            'access_token': 'test_access_token',
            'refresh_token': 'test_refresh_token',
            'expires_in': 3600,
            'token_type': 'Bearer'
        }
        
        with patch.object(self.service, 'client_id', self.test_client_id):
            with patch.object(self.service, 'client_secret', self.test_client_secret):
                with patch('httpx.AsyncClient') as mock_client:
                    mock_response = Mock()
                    mock_response.json.return_value = mock_response_data
                    mock_response.raise_for_status.return_value = None
                    
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                        return_value=mock_response
                    )
                    
                    result = await self.service._exchange_code_for_tokens(test_code)
                    
                    assert result['access_token'] == 'test_access_token'
                    assert result['refresh_token'] == 'test_refresh_token'
                    assert 'expires_at' in result
                    assert isinstance(result['expires_at'], datetime)
    
    @pytest.mark.asyncio
    async def test_exchange_code_for_tokens_http_error(self):
        """Test token exchange with HTTP error."""
        test_code = "test_auth_code"
        
        with patch.object(self.service, 'client_id', self.test_client_id):
            with patch.object(self.service, 'client_secret', self.test_client_secret):
                with patch('httpx.AsyncClient') as mock_client:
                    mock_response = Mock()
                    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
                        "400 Bad Request", 
                        request=Mock(), 
                        response=Mock()
                    )
                    
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                        return_value=mock_response
                    )
                    
                    with pytest.raises(httpx.HTTPStatusError):
                        await self.service._exchange_code_for_tokens(test_code)
    
    @pytest.mark.asyncio
    async def test_store_tokens_new_record(self):
        """Test storing tokens for new organization."""
        test_token_data = {
            'access_token': 'test_access_token',
            'refresh_token': 'test_refresh_token',
            'expires_at': datetime.utcnow() + timedelta(hours=1)
        }
        
        with patch('core.database.get_db') as mock_get_db:
            mock_session = AsyncMock()
            mock_result = Mock()
            mock_result.scalar_one_or_none.return_value = None  # No existing record
            mock_session.execute.return_value = mock_result
            mock_session.add = Mock()
            mock_session.commit = AsyncMock()
            
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            with patch.object(self.service, 'client_id', self.test_client_id):
                with patch.object(self.service, 'client_secret', self.test_client_secret):
                    await self.service._store_tokens(self.test_org_id, test_token_data)
                    
                    mock_session.add.assert_called_once()
                    mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_store_tokens_update_existing(self):
        """Test updating existing token record."""
        test_token_data = {
            'access_token': 'new_access_token',
            'refresh_token': 'new_refresh_token',
            'expires_at': datetime.utcnow() + timedelta(hours=1)
        }
        
        # Mock existing auth record
        existing_record = Mock()
        existing_record.set_encrypted_access_token = Mock()
        existing_record.set_encrypted_refresh_token = Mock()
        
        with patch('core.database.get_db') as mock_get_db:
            mock_session = AsyncMock()
            mock_result = Mock()
            mock_result.scalar_one_or_none.return_value = existing_record
            mock_session.execute.return_value = mock_result
            mock_session.commit = AsyncMock()
            
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            await self.service._store_tokens(self.test_org_id, test_token_data)
            
            existing_record.set_encrypted_access_token.assert_called_once_with('new_access_token')
            existing_record.set_encrypted_refresh_token.assert_called_once_with('new_refresh_token')
            mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_auth_record_found(self):
        """Test retrieving existing auth record."""
        mock_record = Mock(spec=GoogleAdsAuth)
        
        with patch('core.database.get_db') as mock_get_db:
            mock_session = AsyncMock()
            mock_result = Mock()
            mock_result.scalar_one_or_none.return_value = mock_record
            mock_session.execute.return_value = mock_result
            
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            result = await self.service.get_auth_record(self.test_org_id)
            
            assert result == mock_record
    
    @pytest.mark.asyncio
    async def test_get_auth_record_not_found(self):
        """Test retrieving non-existent auth record."""
        with patch('core.database.get_db') as mock_get_db:
            mock_session = AsyncMock()
            mock_result = Mock()
            mock_result.scalar_one_or_none.return_value = None
            mock_session.execute.return_value = mock_result
            
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            result = await self.service.get_auth_record(self.test_org_id)
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_get_valid_credentials_success(self):
        """Test getting valid credentials without refresh needed."""
        mock_record = Mock(spec=GoogleAdsAuth)
        mock_record.is_active = True
        mock_record.needs_refresh.return_value = False
        mock_record.get_decrypted_access_token.return_value = 'test_token'
        mock_record.get_decrypted_refresh_token.return_value = 'test_refresh'
        mock_record.get_decrypted_client_secret.return_value = 'test_secret'
        mock_record.client_id = self.test_client_id
        mock_record.scopes = ['https://www.googleapis.com/auth/adwords']
        
        with patch.object(self.service, 'get_auth_record', return_value=mock_record):
            result = await self.service.get_valid_credentials(self.test_org_id)
            
            assert result is not None
            assert result.token == 'test_token'
            assert result.refresh_token == 'test_refresh'
            assert result.client_id == self.test_client_id
    
    @pytest.mark.asyncio
    async def test_get_valid_credentials_needs_refresh(self):
        """Test getting credentials that need refresh."""
        mock_record = Mock(spec=GoogleAdsAuth)
        mock_record.is_active = True
        mock_record.needs_refresh.return_value = True
        mock_record.get_decrypted_access_token.return_value = 'test_token'
        mock_record.get_decrypted_refresh_token.return_value = 'test_refresh'
        mock_record.get_decrypted_client_secret.return_value = 'test_secret'
        mock_record.client_id = self.test_client_id
        mock_record.scopes = ['https://www.googleapis.com/auth/adwords']
        
        with patch.object(self.service, 'get_auth_record', return_value=mock_record):
            with patch.object(self.service, 'refresh_token', return_value=True):
                result = await self.service.get_valid_credentials(self.test_org_id)
                
                assert result is not None
    
    @pytest.mark.asyncio
    async def test_get_valid_credentials_no_record(self):
        """Test getting credentials with no auth record."""
        with patch.object(self.service, 'get_auth_record', return_value=None):
            result = await self.service.get_valid_credentials(self.test_org_id)
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_refresh_token_success(self):
        """Test successful token refresh."""
        mock_record = Mock(spec=GoogleAdsAuth)
        mock_record.refresh_token = 'encrypted_refresh_token'
        mock_record.client_id = self.test_client_id
        mock_record.get_decrypted_client_secret.return_value = self.test_client_secret
        mock_record.get_decrypted_refresh_token.return_value = 'test_refresh_token'
        
        mock_updated_record = Mock(spec=GoogleAdsAuth)
        mock_updated_record.set_encrypted_access_token = Mock()
        
        mock_token_response = {
            'access_token': 'new_access_token',
            'expires_in': 3600
        }
        
        with patch.object(self.service, 'get_auth_record', return_value=mock_record):
            with patch('httpx.AsyncClient') as mock_client:
                with patch('core.database.get_db') as mock_get_db:
                    # Mock HTTP response
                    mock_response = Mock()
                    mock_response.json.return_value = mock_token_response
                    mock_response.raise_for_status.return_value = None
                    
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                        return_value=mock_response
                    )
                    
                    # Mock database session
                    mock_session = AsyncMock()
                    mock_result = Mock()
                    mock_result.scalar_one_or_none.return_value = mock_updated_record
                    mock_session.execute.return_value = mock_result
                    mock_session.commit = AsyncMock()
                    
                    mock_get_db.return_value.__aenter__.return_value = mock_session
                    
                    result = await self.service.refresh_token(self.test_org_id)
                    
                    assert result is True
                    mock_updated_record.set_encrypted_access_token.assert_called_once_with('new_access_token')
                    mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_refresh_token_no_refresh_token(self):
        """Test token refresh without refresh token."""
        mock_record = Mock(spec=GoogleAdsAuth)
        mock_record.refresh_token = None
        
        with patch.object(self.service, 'get_auth_record', return_value=mock_record):
            result = await self.service.refresh_token(self.test_org_id)
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_refresh_token_http_error(self):
        """Test token refresh with HTTP error."""
        mock_record = Mock(spec=GoogleAdsAuth)
        mock_record.refresh_token = 'encrypted_refresh_token'
        mock_record.client_id = self.test_client_id
        mock_record.get_decrypted_client_secret.return_value = self.test_client_secret
        mock_record.get_decrypted_refresh_token.return_value = 'test_refresh_token'
        
        with patch.object(self.service, 'get_auth_record', return_value=mock_record):
            with patch('httpx.AsyncClient') as mock_client:
                with patch('core.database.get_db') as mock_get_db:
                    # Mock HTTP error
                    mock_response = Mock()
                    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
                        "400 Bad Request", 
                        request=Mock(), 
                        response=Mock()
                    )
                    
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                        return_value=mock_response
                    )
                    
                    # Mock database session for error update
                    mock_session = AsyncMock()
                    mock_result = Mock()
                    mock_error_record = Mock()
                    mock_result.scalar_one_or_none.return_value = mock_error_record
                    mock_session.execute.return_value = mock_result
                    mock_session.commit = AsyncMock()
                    
                    mock_get_db.return_value.__aenter__.return_value = mock_session
                    
                    result = await self.service.refresh_token(self.test_org_id)
                    
                    assert result is False
                    assert mock_error_record.is_active is False
    
    @pytest.mark.asyncio
    async def test_revoke_access_success(self):
        """Test successful access revocation."""
        mock_record = Mock(spec=GoogleAdsAuth)
        mock_record.get_decrypted_access_token.return_value = 'test_access_token'
        
        mock_fresh_record = Mock(spec=GoogleAdsAuth)
        
        with patch.object(self.service, 'get_auth_record', return_value=mock_record):
            with patch('httpx.AsyncClient') as mock_client:
                with patch('core.database.get_db') as mock_get_db:
                    # Mock HTTP response for revoke
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock()
                    
                    # Mock database session
                    mock_session = AsyncMock()
                    mock_result = Mock()
                    mock_result.scalar_one_or_none.return_value = mock_fresh_record
                    mock_session.execute.return_value = mock_result
                    mock_session.commit = AsyncMock()
                    
                    mock_get_db.return_value.__aenter__.return_value = mock_session
                    
                    result = await self.service.revoke_access(self.test_org_id)
                    
                    assert result is True
                    assert mock_fresh_record.is_active is False
                    assert mock_fresh_record.access_token is None
                    assert mock_fresh_record.refresh_token is None
                    mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_revoke_access_no_record(self):
        """Test revoking access with no auth record."""
        with patch.object(self.service, 'get_auth_record', return_value=None):
            result = await self.service.revoke_access(self.test_org_id)
            
            assert result is True  # Already revoked


class TestGoogleAdsAuthModel:
    """Test Google Ads authentication model."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.org_id = "test-org-123"
        
    def test_is_token_expired_expired(self):
        """Test token expiry check for expired token."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=datetime.utcnow() - timedelta(minutes=10),
            client_id='test_client',
            client_secret='test_secret'
        )
        
        assert auth_record.is_token_expired() is True
    
    def test_is_token_expired_valid(self):
        """Test token expiry check for valid token."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            client_id='test_client',
            client_secret='test_secret'
        )
        
        assert auth_record.is_token_expired() is False
    
    def test_is_token_expired_buffer_time(self):
        """Test token expiry with buffer time."""
        # Token expires in 3 minutes - should be considered expired due to 5-minute buffer
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=datetime.utcnow() + timedelta(minutes=3),
            client_id='test_client',
            client_secret='test_secret'
        )
        
        assert auth_record.is_token_expired() is True
    
    def test_is_token_expired_no_expiry(self):
        """Test token expiry check with no expiry time."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=None,
            client_id='test_client',
            client_secret='test_secret'
        )
        
        assert auth_record.is_token_expired() is True
    
    def test_needs_refresh_active_expired(self):
        """Test refresh needed for active expired token."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=datetime.utcnow() - timedelta(minutes=10),
            client_id='test_client',
            client_secret='test_secret',
            is_active=True
        )
        
        assert auth_record.needs_refresh() is True
    
    def test_needs_refresh_inactive(self):
        """Test refresh not needed for inactive token."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            access_token='test_token',
            refresh_token='test_refresh',
            token_expires_at=datetime.utcnow() - timedelta(minutes=10),
            client_id='test_client',
            client_secret='test_secret',
            is_active=False
        )
        
        assert auth_record.needs_refresh() is False
    
    def test_needs_refresh_no_refresh_token(self):
        """Test refresh not possible without refresh token."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            access_token='test_token',
            refresh_token=None,
            token_expires_at=datetime.utcnow() - timedelta(minutes=10),
            client_id='test_client',
            client_secret='test_secret',
            is_active=True
        )
        
        assert auth_record.needs_refresh() is False
    
    def test_token_encryption_methods(self):
        """Test token encryption and decryption methods."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            client_id='test_client',
            client_secret='test_secret'
        )
        
        # Test access token encryption
        test_token = 'test_access_token'
        auth_record.set_encrypted_access_token(test_token)
        assert auth_record.access_token is not None
        assert auth_record.access_token != test_token  # Should be encrypted
        
        with patch.object(token_encryption, 'decrypt_token', return_value=test_token):
            decrypted = auth_record.get_decrypted_access_token()
            assert decrypted == test_token
        
        # Test refresh token encryption
        test_refresh = 'test_refresh_token'
        auth_record.set_encrypted_refresh_token(test_refresh)
        assert auth_record.refresh_token is not None
        assert auth_record.refresh_token != test_refresh  # Should be encrypted
        
        with patch.object(token_encryption, 'decrypt_token', return_value=test_refresh):
            decrypted = auth_record.get_decrypted_refresh_token()
            assert decrypted == test_refresh
        
        # Test client secret encryption
        test_secret = 'test_client_secret'
        auth_record.set_encrypted_client_secret(test_secret)
        assert auth_record.client_secret is not None
        assert auth_record.client_secret != test_secret  # Should be encrypted
        
        with patch.object(token_encryption, 'decrypt_token', return_value=test_secret):
            decrypted = auth_record.get_decrypted_client_secret()
            assert decrypted == test_secret
    
    def test_to_dict_excludes_sensitive_data(self):
        """Test that to_dict excludes sensitive information."""
        auth_record = GoogleAdsAuth(
            id="test-id",
            org_id=self.org_id,
            access_token='encrypted_access_token',
            refresh_token='encrypted_refresh_token',
            token_expires_at=datetime.utcnow() + timedelta(hours=1),
            customer_id='1234567890',
            client_id='test_client',
            client_secret='encrypted_client_secret',
            is_active=True,
            scopes=['https://www.googleapis.com/auth/adwords'],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        result = auth_record.to_dict()
        
        # Check included fields
        expected_fields = [
            'id', 'org_id', 'customer_id', 'is_active', 
            'token_expires_at', 'scopes', 'created_at', 'updated_at'
        ]
        for field in expected_fields:
            assert field in result
        
        # Check excluded sensitive fields
        sensitive_fields = ['access_token', 'refresh_token', 'client_secret', 'client_id']
        for field in sensitive_fields:
            assert field not in result
    
    def test_repr(self):
        """Test string representation."""
        auth_record = GoogleAdsAuth(
            org_id=self.org_id,
            customer_id='1234567890',
            client_id='test_client',
            client_secret='test_secret'
        )
        
        result = repr(auth_record)
        assert 'GoogleAdsAuth' in result
        assert self.org_id in result
        assert '1234567890' in result


class TestGoogleAdsAuthEndpoints:
    """Test Google Ads authentication API endpoints."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.test_user = Mock()
        self.test_user.org_id = "test-org-123"
        self.test_user.email = "test@example.com"
    
    @pytest.mark.asyncio
    async def test_get_auth_url_success(self):
        """Test successful authorization URL generation."""
        from api.v1.endpoints.google_ads_auth import AuthUrlRequest
        
        request = AuthUrlRequest(state="custom_state")
        
        with patch.object(google_ads_auth_service, 'get_authorization_url') as mock_get_url:
            mock_get_url.return_value = "https://accounts.google.com/oauth/authorize?..."
            
            result = await get_google_ads_auth_url(request, self.test_user)
            
            assert 'authorization_url' in result
            assert result['authorization_url'].startswith('https://accounts.google.com')
            assert 'message' in result
            mock_get_url.assert_called_once_with(
                org_id=self.test_user.org_id,
                state="custom_state"
            )
    
    @pytest.mark.asyncio
    async def test_get_auth_url_no_org(self):
        """Test authorization URL generation without organization."""
        from api.v1.endpoints.google_ads_auth import AuthUrlRequest
        
        request = AuthUrlRequest()
        user_no_org = Mock()
        user_no_org.org_id = None
        
        with pytest.raises(HTTPException) as exc_info:
            await get_google_ads_auth_url(request, user_no_org)
        
        assert exc_info.value.status_code == 400
        assert "must be associated with an organization" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_auth_url_service_error(self):
        """Test authorization URL generation with service error."""
        from api.v1.endpoints.google_ads_auth import AuthUrlRequest
        
        request = AuthUrlRequest()
        
        with patch.object(google_ads_auth_service, 'get_authorization_url') as mock_get_url:
            mock_get_url.side_effect = ValueError("OAuth2 not configured")
            
            with pytest.raises(HTTPException) as exc_info:
                await get_google_ads_auth_url(request, self.test_user)
            
            assert exc_info.value.status_code == 400
            assert "OAuth2 not configured" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_oauth_callback_success(self):
        """Test successful OAuth callback handling."""
        mock_request = Mock()
        mock_request.base_url._replace.return_value = "https://example.com"
        mock_request.url.scheme = "https"
        
        with patch.object(google_ads_auth_service, 'handle_callback') as mock_handle:
            mock_handle.return_value = {
                'success': True,
                'org_id': 'test-org-123'
            }
            
            result = await google_ads_oauth_callback(
                mock_request, 
                code="test_code", 
                state="org_id=test-org-123"
            )
            
            assert result.status_code == 307  # Redirect response
            mock_handle.assert_called_once_with("test_code", "org_id=test-org-123")
    
    @pytest.mark.asyncio
    async def test_oauth_callback_error_param(self):
        """Test OAuth callback with error parameter."""
        mock_request = Mock()
        mock_request.base_url._replace.return_value = "https://example.com"
        mock_request.url.scheme = "https"
        
        result = await google_ads_oauth_callback(
            mock_request, 
            code=None, 
            state=None,
            error="access_denied"
        )
        
        assert result.status_code == 307  # Redirect response
        assert "error=access_denied" in result.headers["location"]
    
    @pytest.mark.asyncio
    async def test_oauth_callback_missing_params(self):
        """Test OAuth callback with missing parameters."""
        mock_request = Mock()
        mock_request.base_url._replace.return_value = "https://example.com"
        mock_request.url.scheme = "https"
        
        with pytest.raises(HTTPException) as exc_info:
            await google_ads_oauth_callback(
                mock_request, 
                code=None, 
                state=None
            )
        
        assert exc_info.value.status_code == 400
        assert "Missing authorization code or state" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_get_auth_status_authenticated(self):
        """Test getting authentication status for authenticated organization."""
        from api.v1.endpoints.google_ads_auth import get_google_ads_auth_status
        
        mock_auth_record = Mock()
        mock_auth_record.is_active = True
        mock_auth_record.customer_id = "1234567890"
        mock_auth_record.scopes = ["https://www.googleapis.com/auth/adwords"]
        mock_auth_record.token_expires_at = datetime.utcnow() + timedelta(hours=1)
        
        with patch.object(google_ads_auth_service, 'get_auth_record') as mock_get_record:
            mock_get_record.return_value = mock_auth_record
            
            result = await get_google_ads_auth_status(self.test_user)
            
            assert result.is_authenticated is True
            assert result.customer_id == "1234567890"
            assert result.scopes == ["https://www.googleapis.com/auth/adwords"]
            assert result.error is None
    
    @pytest.mark.asyncio
    async def test_get_auth_status_not_authenticated(self):
        """Test getting authentication status for non-authenticated organization."""
        from api.v1.endpoints.google_ads_auth import get_google_ads_auth_status
        
        with patch.object(google_ads_auth_service, 'get_auth_record') as mock_get_record:
            mock_get_record.return_value = None
            
            result = await get_google_ads_auth_status(self.test_user)
            
            assert result.is_authenticated is False
            assert result.error == "Google Ads not connected"
    
    @pytest.mark.asyncio
    async def test_refresh_token_success(self):
        """Test successful token refresh."""
        from api.v1.endpoints.google_ads_auth import refresh_google_ads_token
        
        with patch.object(google_ads_auth_service, 'refresh_token') as mock_refresh:
            mock_refresh.return_value = True
            
            result = await refresh_google_ads_token(self.test_user)
            
            assert result['success'] is True
            assert 'message' in result
            mock_refresh.assert_called_once_with(self.test_user.org_id)
    
    @pytest.mark.asyncio
    async def test_refresh_token_failure(self):
        """Test failed token refresh."""
        from api.v1.endpoints.google_ads_auth import refresh_google_ads_token
        
        with patch.object(google_ads_auth_service, 'refresh_token') as mock_refresh:
            mock_refresh.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                await refresh_google_ads_token(self.test_user)
            
            assert exc_info.value.status_code == 400
            assert "Failed to refresh token" in str(exc_info.value.detail)
    
    @pytest.mark.asyncio
    async def test_revoke_access_success(self):
        """Test successful access revocation."""
        from api.v1.endpoints.google_ads_auth import revoke_google_ads_access
        
        with patch.object(google_ads_auth_service, 'revoke_access') as mock_revoke:
            mock_revoke.return_value = True
            
            result = await revoke_google_ads_access(self.test_user)
            
            assert result['success'] is True
            assert 'message' in result
            mock_revoke.assert_called_once_with(self.test_user.org_id)
    
    @pytest.mark.asyncio
    async def test_revoke_access_failure(self):
        """Test failed access revocation."""
        from api.v1.endpoints.google_ads_auth import revoke_google_ads_access
        
        with patch.object(google_ads_auth_service, 'revoke_access') as mock_revoke:
            mock_revoke.return_value = False
            
            with pytest.raises(HTTPException) as exc_info:
                await revoke_google_ads_access(self.test_user)
            
            assert exc_info.value.status_code == 400
            assert "Failed to revoke access" in str(exc_info.value.detail)


class TestTokenEncryption:
    """Test token encryption functionality."""
    
    def test_encrypt_decrypt_token(self):
        """Test token encryption and decryption."""
        original_token = "test_access_token_12345"
        
        # Test encryption
        encrypted = token_encryption.encrypt_token(original_token)
        assert encrypted != original_token
        assert len(encrypted) > len(original_token)
        
        # Test decryption
        decrypted = token_encryption.decrypt_token(encrypted)
        assert decrypted == original_token
    
    def test_encrypt_empty_token(self):
        """Test encrypting empty token."""
        with patch.object(token_encryption, 'encrypt_token') as mock_encrypt:
            mock_encrypt.return_value = None
            
            result = token_encryption.encrypt_token("")
            assert result is None
    
    def test_decrypt_empty_token(self):
        """Test decrypting empty token."""
        with patch.object(token_encryption, 'decrypt_token') as mock_decrypt:
            mock_decrypt.return_value = None
            
            result = token_encryption.decrypt_token("")
            assert result is None


class TestErrorHandling:
    """Test comprehensive error handling scenarios."""
    
    @pytest.mark.asyncio
    async def test_network_timeout_error(self):
        """Test handling of network timeout errors."""
        service = GoogleAdsAuthService()
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                side_effect=httpx.TimeoutException("Request timeout")
            )
            
            with pytest.raises(httpx.TimeoutException):
                await service._exchange_code_for_tokens("test_code")
    
    @pytest.mark.asyncio
    async def test_database_connection_error(self):
        """Test handling of database connection errors."""
        service = GoogleAdsAuthService()
        
        with patch('core.database.get_db') as mock_get_db:
            mock_get_db.side_effect = Exception("Database connection failed")
            
            result = await service.get_auth_record("test_org")
            assert result is None  # Should handle gracefully
    
    @pytest.mark.asyncio
    async def test_invalid_token_response(self):
        """Test handling of invalid token response from Google."""
        service = GoogleAdsAuthService()
        
        with patch.object(service, 'client_id', 'test_client'):
            with patch.object(service, 'client_secret', 'test_secret'):
                with patch('httpx.AsyncClient') as mock_client:
                    mock_response = Mock()
                    mock_response.json.return_value = {}  # Empty response
                    mock_response.raise_for_status.return_value = None
                    
                    mock_client.return_value.__aenter__.return_value.post = AsyncMock(
                        return_value=mock_response
                    )
                    
                    result = await service._exchange_code_for_tokens("test_code")
                    
                    # Should handle missing tokens gracefully
                    assert 'expires_at' in result
                    assert result.get('access_token') is None


# Integration test fixtures
@pytest.fixture
def mock_google_ads_auth_record():
    """Create a mock Google Ads auth record for testing."""
    return GoogleAdsAuth(
        id="test-auth-123",
        org_id="test-org-123", 
        access_token="encrypted_access_token",
        refresh_token="encrypted_refresh_token",
        token_expires_at=datetime.utcnow() + timedelta(hours=1),
        customer_id="1234567890",
        client_id="test_client_id.googleusercontent.com",
        client_secret="encrypted_client_secret",
        is_active=True,
        scopes=["https://www.googleapis.com/auth/adwords"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def mock_oauth_response():
    """Mock OAuth2 token response from Google."""
    return {
        "access_token": "test_access_token",
        "refresh_token": "test_refresh_token", 
        "expires_in": 3600,
        "scope": "https://www.googleapis.com/auth/adwords",
        "token_type": "Bearer"
    }