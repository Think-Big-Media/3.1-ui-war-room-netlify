"""
Google Ads OAuth2 authentication service.
Handles token management, refresh, and secure storage.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from urllib.parse import urlencode, parse_qs

import httpx
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials

from core.config import settings
from core.database import get_db
from core.encryption import token_encryption
from models.google_ads_auth import GoogleAdsAuth
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)


class GoogleAdsAuthService:
    """Service for handling Google Ads OAuth2 authentication."""
    
    # Google Ads required scopes
    SCOPES = [
        'https://www.googleapis.com/auth/adwords'
    ]
    
    def __init__(self):
        """Initialize the authentication service."""
        self.client_id = settings.GOOGLE_ADS_CLIENT_ID
        self.client_secret = settings.GOOGLE_ADS_CLIENT_SECRET
        self.redirect_uri = f"{settings.API_BASE_URL}/api/v1/auth/google-ads/callback"
        
        if not self.client_id or not self.client_secret:
            logger.warning("Google Ads OAuth2 credentials not configured")
    
    def get_authorization_url(self, org_id: str, state: Optional[str] = None) -> str:
        """
        Generate OAuth2 authorization URL.
        
        Args:
            org_id: Organization ID for state parameter
            state: Optional additional state information
            
        Returns:
            Authorization URL for user redirection
        """
        if not self.client_id:
            raise ValueError("Google Ads OAuth2 not configured")
        
        # Create state parameter with organization ID
        state_data = {"org_id": org_id}
        if state:
            state_data["custom"] = state
            
        state_param = f"org_id={org_id}"
        if state:
            state_param += f"&custom={state}"
        
        # Build authorization URL
        auth_params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.SCOPES),
            'response_type': 'code',
            'access_type': 'offline',  # Get refresh token
            'prompt': 'consent',  # Force consent to get refresh token
            'state': state_param,
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(auth_params)}"
        
        logger.info(f"Generated Google Ads authorization URL for org {org_id}")
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
            
            # Exchange code for tokens
            token_data = await self._exchange_code_for_tokens(code)
            
            # Store tokens in database
            await self._store_tokens(org_id, token_data)
            
            logger.info(f"Successfully stored Google Ads tokens for org {org_id}")
            
            return {
                "success": True,
                "org_id": org_id,
                "message": "Google Ads authentication successful"
            }
            
        except Exception as e:
            logger.error(f"Google Ads callback error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Authentication failed"
            }
    
    async def _exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens."""
        token_url = "https://oauth2.googleapis.com/token"
        
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': self.redirect_uri,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            
            # Calculate expiry time
            expires_in = token_data.get('expires_in', 3600)
            token_data['expires_at'] = datetime.utcnow() + timedelta(seconds=expires_in)
            
            return token_data
    
    async def _store_tokens(self, org_id: str, token_data: Dict[str, Any]) -> None:
        """Store OAuth2 tokens in database."""
        async with get_db() as db:
            # Check if auth record exists
            result = await db.execute(
                select(GoogleAdsAuth).where(GoogleAdsAuth.org_id == org_id)
            )
            auth_record = result.scalar_one_or_none()
            
            if auth_record:
                # Update existing record with encrypted tokens
                auth_record.set_encrypted_access_token(token_data['access_token'])
                if token_data.get('refresh_token'):
                    auth_record.set_encrypted_refresh_token(token_data['refresh_token'])
                auth_record.token_expires_at = token_data['expires_at']
                auth_record.last_refreshed_at = datetime.utcnow()
                auth_record.is_active = True
                auth_record.last_error = None
                auth_record.scopes = self.SCOPES
            else:
                # Create new record with encrypted tokens
                auth_record = GoogleAdsAuth(
                    org_id=org_id,
                    token_expires_at=token_data['expires_at'],
                    client_id=self.client_id,
                    is_active=True,
                    scopes=self.SCOPES,
                    last_refreshed_at=datetime.utcnow()
                )
                # Set encrypted tokens and secrets
                auth_record.set_encrypted_access_token(token_data['access_token'])
                if token_data.get('refresh_token'):
                    auth_record.set_encrypted_refresh_token(token_data['refresh_token'])
                auth_record.set_encrypted_client_secret(self.client_secret)
                db.add(auth_record)
            
            await db.commit()
    
    async def get_auth_record(self, org_id: str) -> Optional[GoogleAdsAuth]:
        """Get authentication record for organization."""
        async with get_db() as db:
            result = await db.execute(
                select(GoogleAdsAuth).where(GoogleAdsAuth.org_id == org_id)
            )
            return result.scalar_one_or_none()
    
    async def get_valid_credentials(self, org_id: str) -> Optional[Credentials]:
        """
        Get valid OAuth2 credentials for organization.
        Automatically refreshes if needed.
        """
        auth_record = await self.get_auth_record(org_id)
        if not auth_record or not auth_record.is_active:
            return None
        
        # Check if token needs refresh
        if auth_record.needs_refresh():
            success = await self.refresh_token(org_id)
            if not success:
                logger.error(f"Failed to refresh token for org {org_id}")
                return None
            # Get updated record
            auth_record = await self.get_auth_record(org_id)
        
        # Create credentials object with decrypted tokens
        credentials = Credentials(
            token=auth_record.get_decrypted_access_token(),
            refresh_token=auth_record.get_decrypted_refresh_token(),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=auth_record.client_id,
            client_secret=auth_record.get_decrypted_client_secret(),
            scopes=auth_record.scopes
        )
        
        return credentials
    
    async def refresh_token(self, org_id: str) -> bool:
        """
        Refresh access token using refresh token.
        
        Args:
            org_id: Organization ID
            
        Returns:
            True if refresh successful, False otherwise
        """
        try:
            auth_record = await self.get_auth_record(org_id)
            if not auth_record or not auth_record.refresh_token:
                logger.error(f"No refresh token available for org {org_id}")
                return False
            
            # Make refresh request
            refresh_url = "https://oauth2.googleapis.com/token"
            data = {
                'client_id': auth_record.client_id,
                'client_secret': auth_record.get_decrypted_client_secret(),
                'refresh_token': auth_record.get_decrypted_refresh_token(),
                'grant_type': 'refresh_token',
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(refresh_url, data=data)
                response.raise_for_status()
                
                token_data = response.json()
                
                # Update database with encrypted tokens
                async with get_db() as db:
                    # Get fresh auth record from this session
                    result = await db.execute(
                        select(GoogleAdsAuth).where(GoogleAdsAuth.org_id == org_id)
                    )
                    auth_record = result.scalar_one_or_none()
                    
                    if auth_record:
                        auth_record.set_encrypted_access_token(token_data['access_token'])
                        expires_in = token_data.get('expires_in', 3600)
                        auth_record.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                        auth_record.last_refreshed_at = datetime.utcnow()
                        auth_record.last_error = None
                        
                        # Update refresh token if provided
                        if 'refresh_token' in token_data:
                            auth_record.set_encrypted_refresh_token(token_data['refresh_token'])
                        
                        await db.commit()
                
                logger.info(f"Successfully refreshed Google Ads token for org {org_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to refresh Google Ads token for org {org_id}: {str(e)}")
            
            # Update error in database
            try:
                async with get_db() as db:
                    result = await db.execute(
                        select(GoogleAdsAuth).where(GoogleAdsAuth.org_id == org_id)
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
        Revoke Google Ads access for organization.
        
        Args:
            org_id: Organization ID
            
        Returns:
            True if revocation successful, False otherwise
        """
        try:
            auth_record = await self.get_auth_record(org_id)
            if not auth_record:
                return True  # Already revoked
            
            # Revoke tokens with Google
            access_token = auth_record.get_decrypted_access_token()
            if access_token:
                revoke_url = f"https://oauth2.googleapis.com/revoke?token={access_token}"
                async with httpx.AsyncClient() as client:
                    await client.post(revoke_url)
            
            # Deactivate in database
            async with get_db() as db:
                # Get fresh auth record from this session
                result = await db.execute(
                    select(GoogleAdsAuth).where(GoogleAdsAuth.org_id == org_id)
                )
                fresh_auth_record = result.scalar_one_or_none()
                
                if fresh_auth_record:
                    fresh_auth_record.is_active = False
                    fresh_auth_record.access_token = None
                    fresh_auth_record.refresh_token = None
                    await db.commit()
            
            logger.info(f"Successfully revoked Google Ads access for org {org_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke Google Ads access for org {org_id}: {str(e)}")
            return False


# Global instance
google_ads_auth_service = GoogleAdsAuthService()