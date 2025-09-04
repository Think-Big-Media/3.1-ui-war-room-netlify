"""
Meta Business Suite OAuth2 authentication service.
Handles token management, refresh, and secure storage following Google Ads pattern.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode, parse_qs

import httpx

from core.config import settings
from core.database import get_db
from core.encryption import token_encryption
from models.meta_auth import MetaAuth
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)


class MetaAuthService:
    """Service for handling Meta Business Suite OAuth2 authentication."""
    
    # Meta Business Suite required scopes
    SCOPES = [
        'ads_read',                    # Read ad account data
        'ads_management',              # Manage ad campaigns and accounts
        'business_management',         # Access business manager
        'pages_show_list',            # Show which Facebook Pages can be used for ads
        'pages_read_engagement',       # Read page insights and organic post performance
        'pages_manage_ads',           # Create and manage page ads
        'pages_manage_metadata',      # Manage page information
        'catalog_management',         # Manage catalogs for merchandise and fundraising
        'leads_retrieval',           # Retrieve lead ads data for voter sign-ups
        'read_insights'               # Read insights data
    ]
    
    # Meta API endpoints
    OAUTH_BASE_URL = "https://www.facebook.com"
    GRAPH_BASE_URL = "https://graph.facebook.com"
    
    def __init__(self):
        """Initialize the authentication service."""
        self.app_id = settings.META_APP_ID
        self.app_secret = settings.META_APP_SECRET
        self.api_version = getattr(settings, 'META_API_VERSION', 'v18.0')
        self.redirect_uri = f"{settings.API_BASE_URL}/api/v1/auth/meta/callback"
        
        if not self.app_id or not self.app_secret:
            logger.warning("Meta OAuth2 credentials not configured")
    
    def get_authorization_url(self, org_id: str, state: Optional[str] = None) -> str:
        """
        Generate Meta OAuth2 authorization URL.
        
        Args:
            org_id: Organization ID for state parameter
            state: Optional additional state information
            
        Returns:
            Authorization URL for user redirection
        """
        if not self.app_id:
            raise ValueError("Meta OAuth2 not configured")
        
        # Create state parameter with organization ID
        state_param = f"org_id={org_id}"
        if state:
            state_param += f"&custom={state}"
        
        # Build authorization URL
        auth_params = {
            'client_id': self.app_id,
            'redirect_uri': self.redirect_uri,
            'scope': ','.join(self.SCOPES),
            'response_type': 'code',
            'state': state_param,
            'auth_type': 'rerequest',  # Force permission dialog to show
        }
        
        auth_url = f"{self.OAUTH_BASE_URL}/v18.0/dialog/oauth?{urlencode(auth_params)}"
        
        logger.info(f"Generated Meta authorization URL for org {org_id}")
        return auth_url
    
    async def handle_callback(self, code: str, state: str) -> Dict[str, Any]:
        """
        Handle OAuth2 callback and exchange code for tokens.
        
        Args:
            code: Authorization code from callback
            state: State parameter containing org_id
            
        Returns:
            Dictionary with success status and data
        """
        try:
            # Parse state parameter
            state_params = parse_qs(state)
            org_id = state_params.get('org_id', [None])[0]
            
            if not org_id:
                raise ValueError("Missing organization ID in state parameter")
            
            # Exchange code for short-lived access token
            token_data = await self._exchange_code_for_tokens(code)
            
            # Exchange short-lived token for long-lived token
            long_lived_token = await self._get_long_lived_token(token_data['access_token'])
            
            # Get user's ad accounts and business information
            user_data = await self._get_user_business_data(long_lived_token['access_token'])
            
            # Store tokens in database with business data
            await self._store_tokens(org_id, long_lived_token, user_data)
            
            logger.info(f"Successfully stored Meta tokens for org {org_id}")
            
            return {
                "success": True,
                "org_id": org_id,
                "message": "Meta Business Suite authentication successful",
                "ad_accounts": len(user_data.get('ad_accounts', [])),
                "business_id": user_data.get('business_id')
            }
            
        except Exception as e:
            logger.error(f"Meta callback error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Authentication failed"
            }
    
    async def _exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        token_url = f"{self.GRAPH_BASE_URL}/v18.0/oauth/access_token"
        
        params = {
            'client_id': self.app_id,
            'client_secret': self.app_secret,
            'redirect_uri': self.redirect_uri,
            'code': code,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(token_url, params=params)
            response.raise_for_status()
            
            token_data = response.json()
            
            # Calculate expiry time (Meta typically returns expires_in seconds)
            expires_in = token_data.get('expires_in', 3600)
            token_data['expires_at'] = datetime.utcnow() + timedelta(seconds=expires_in)
            
            return token_data
    
    async def _get_long_lived_token(self, short_lived_token: str) -> Dict[str, Any]:
        """Exchange short-lived token for long-lived token (60 days)."""
        token_url = f"{self.GRAPH_BASE_URL}/v18.0/oauth/access_token"
        
        params = {
            'grant_type': 'fb_exchange_token',
            'client_id': self.app_id,
            'client_secret': self.app_secret,
            'fb_exchange_token': short_lived_token,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(token_url, params=params)
            response.raise_for_status()
            
            token_data = response.json()
            
            # Long-lived tokens typically expire in ~60 days
            expires_in = token_data.get('expires_in', 5184000)  # 60 days default
            token_data['expires_at'] = datetime.utcnow() + timedelta(seconds=expires_in)
            
            return token_data
    
    async def _get_user_business_data(self, access_token: str) -> Dict[str, Any]:
        """Get user's business accounts and permissions."""
        user_data = {}
        
        async with httpx.AsyncClient() as client:
            # Get ad accounts
            ad_accounts_response = await client.get(
                f"{self.GRAPH_BASE_URL}/v18.0/me/adaccounts",
                params={
                    'access_token': access_token,
                    'fields': 'id,name,account_id,account_status,currency,timezone_name,business'
                }
            )
            
            if ad_accounts_response.status_code == 200:
                user_data['ad_accounts'] = ad_accounts_response.json().get('data', [])
                
                # Get primary business ID from first ad account
                if user_data['ad_accounts']:
                    business_data = user_data['ad_accounts'][0].get('business')
                    if business_data:
                        user_data['business_id'] = business_data.get('id')
            
            # Get pages with manage permissions
            pages_response = await client.get(
                f"{self.GRAPH_BASE_URL}/v18.0/me/accounts",
                params={
                    'access_token': access_token,
                    'fields': 'id,name,access_token,category,tasks'
                }
            )
            
            if pages_response.status_code == 200:
                pages_data = pages_response.json().get('data', [])
                user_data['pages'] = pages_data
                
                # Extract page tokens for storage
                page_tokens = {}
                for page in pages_data:
                    if page.get('access_token'):
                        page_tokens[page['id']] = {
                            'token': page['access_token'],
                            'name': page.get('name', ''),
                            'permissions': page.get('tasks', [])
                        }
                user_data['page_tokens'] = page_tokens
            
            return user_data
    
    async def _store_tokens(self, org_id: str, token_data: Dict[str, Any], user_data: Dict[str, Any]) -> None:
        """Store OAuth2 tokens in database with encryption."""
        async with get_db() as db:
            # Check if auth record exists
            result = await db.execute(
                select(MetaAuth).where(MetaAuth.org_id == org_id)
            )
            auth_record = result.scalar_one_or_none()
            
            # Select primary ad account (first active one)
            ad_accounts = user_data.get('ad_accounts', [])
            primary_account = None
            if ad_accounts:
                # Prefer active accounts (account_status = 1)
                active_accounts = [acc for acc in ad_accounts if acc.get('account_status') == 1]
                primary_account = active_accounts[0] if active_accounts else ad_accounts[0]
            
            if auth_record:
                # Update existing record
                auth_record.set_encrypted_access_token(token_data['access_token'])
                auth_record.token_expires_at = token_data['expires_at']
                auth_record.last_refreshed_at = datetime.utcnow()
                auth_record.is_active = True
                auth_record.last_error = None
                auth_record.scopes = self.SCOPES
                
                if primary_account:
                    auth_record.ad_account_id = primary_account.get('account_id')
                
                if user_data.get('business_id'):
                    auth_record.business_id = user_data['business_id']
                
                # Update page access tokens
                if user_data.get('page_tokens'):
                    auth_record.page_access_tokens = {}
                    for page_id, page_data in user_data['page_tokens'].items():
                        auth_record.set_page_access_token(
                            page_id,
                            page_data['token'],
                            permissions=page_data.get('permissions')
                        )
            else:
                # Create new record
                auth_record = MetaAuth(
                    org_id=org_id,
                    token_expires_at=token_data['expires_at'],
                    app_id=self.app_id,
                    is_active=True,
                    scopes=self.SCOPES,
                    last_refreshed_at=datetime.utcnow(),
                    ad_account_id=primary_account.get('account_id') if primary_account else None,
                    business_id=user_data.get('business_id')
                )
                
                # Set encrypted tokens and secrets
                auth_record.set_encrypted_access_token(token_data['access_token'])
                auth_record.set_encrypted_app_secret(self.app_secret)
                
                # Store page access tokens
                if user_data.get('page_tokens'):
                    for page_id, page_data in user_data['page_tokens'].items():
                        auth_record.set_page_access_token(
                            page_id,
                            page_data['token'],
                            permissions=page_data.get('permissions')
                        )
                
                db.add(auth_record)
            
            await db.commit()
    
    async def get_auth_record(self, org_id: str) -> Optional[MetaAuth]:
        """Get authentication record for organization."""
        async with get_db() as db:
            result = await db.execute(
                select(MetaAuth).where(MetaAuth.org_id == org_id)
            )
            return result.scalar_one_or_none()
    
    async def get_valid_access_token(self, org_id: str) -> Optional[str]:
        """
        Get valid access token for organization.
        Attempts to refresh if token is close to expiry.
        """
        auth_record = await self.get_auth_record(org_id)
        if not auth_record or not auth_record.is_active:
            return None
        
        # Check if token needs refresh (Meta tokens are long-lived)
        if auth_record.is_token_expired():
            success = await self.refresh_token(org_id)
            if not success:
                logger.error(f"Failed to refresh token for org {org_id}")
                return None
            # Get updated record
            auth_record = await self.get_auth_record(org_id)
        
        return auth_record.get_decrypted_access_token()
    
    async def refresh_token(self, org_id: str) -> bool:
        """
        Refresh access token. For Meta, this typically means getting a new long-lived token.
        
        Args:
            org_id: Organization ID
            
        Returns:
            True if refresh successful, False otherwise
        """
        try:
            auth_record = await self.get_auth_record(org_id)
            if not auth_record or not auth_record.access_token:
                logger.error(f"No access token available for org {org_id}")
                return False
            
            current_token = auth_record.get_decrypted_access_token()
            
            # Try to extend the existing token
            new_token_data = await self._get_long_lived_token(current_token)
            
            # Update database
            async with get_db() as db:
                # Get fresh auth record from this session
                result = await db.execute(
                    select(MetaAuth).where(MetaAuth.org_id == org_id)
                )
                fresh_auth_record = result.scalar_one_or_none()
                
                if fresh_auth_record:
                    fresh_auth_record.set_encrypted_access_token(new_token_data['access_token'])
                    fresh_auth_record.token_expires_at = new_token_data['expires_at']
                    fresh_auth_record.last_refreshed_at = datetime.utcnow()
                    fresh_auth_record.last_error = None
                    fresh_auth_record.is_active = True
                    
                    await db.commit()
            
            logger.info(f"Successfully refreshed Meta token for org {org_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to refresh Meta token for org {org_id}: {str(e)}")
            
            # Update error in database
            try:
                async with get_db() as db:
                    result = await db.execute(
                        select(MetaAuth).where(MetaAuth.org_id == org_id)
                    )
                    auth_record = result.scalar_one_or_none()
                    
                    if auth_record:
                        auth_record.last_error = str(e)
                        auth_record.is_active = False
                        await db.commit()
            except Exception as db_error:
                logger.error(f"Failed to update error status: {str(db_error)}")
            
            return False
    
    async def revoke_access(self, org_id: str) -> bool:
        """
        Revoke Meta access for organization.
        
        Args:
            org_id: Organization ID
            
        Returns:
            True if revocation successful, False otherwise
        """
        try:
            auth_record = await self.get_auth_record(org_id)
            if not auth_record:
                return True  # Already revoked
            
            # Revoke tokens with Meta
            access_token = auth_record.get_decrypted_access_token()
            if access_token:
                # Meta doesn't have a standard token revocation endpoint
                # Instead, we'll remove app permissions
                try:
                    async with httpx.AsyncClient() as client:
                        revoke_url = f"{self.GRAPH_BASE_URL}/v18.0/me/permissions"
                        await client.delete(revoke_url, params={'access_token': access_token})
                except Exception as revoke_error:
                    logger.warning(f"Failed to revoke permissions: {str(revoke_error)}")
            
            # Deactivate in database
            async with get_db() as db:
                result = await db.execute(
                    select(MetaAuth).where(MetaAuth.org_id == org_id)
                )
                fresh_auth_record = result.scalar_one_or_none()
                
                if fresh_auth_record:
                    fresh_auth_record.is_active = False
                    fresh_auth_record.access_token = None
                    fresh_auth_record.refresh_token = None
                    fresh_auth_record.page_access_tokens = {}
                    await db.commit()
            
            logger.info(f"Successfully revoked Meta access for org {org_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke Meta access for org {org_id}: {str(e)}")
            return False
    
    async def get_ad_accounts(self, org_id: str) -> List[Dict[str, Any]]:
        """Get ad accounts for organization."""
        access_token = await self.get_valid_access_token(org_id)
        if not access_token:
            raise ValueError("No valid access token available")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.GRAPH_BASE_URL}/v18.0/me/adaccounts",
                params={
                    'access_token': access_token,
                    'fields': 'id,name,account_id,account_status,currency,timezone_name,amount_spent,balance'
                }
            )
            response.raise_for_status()
            
            return response.json().get('data', [])
    
    async def get_page_access_token(self, org_id: str, page_id: str) -> Optional[str]:
        """Get page access token for specific page."""
        auth_record = await self.get_auth_record(org_id)
        if not auth_record:
            return None
        
        page_token_data = auth_record.get_page_access_token(page_id)
        return page_token_data.get('token') if page_token_data else None


# Global instance
meta_auth_service = MetaAuthService()