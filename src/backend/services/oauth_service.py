"""
OAuth service for handling social authentication.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import httpx

from core.config import settings
from models.user import User
from models.oauth_provider import OAuthProvider
from core.security import get_password_hash


class OAuthService:
    """Service for handling OAuth authentication."""
    
    def __init__(self):
        """Initialize OAuth service."""
        pass
    
    def get_authorization_url(self, provider: str, redirect_uri: str) -> tuple:
        """Get OAuth authorization URL for provider."""
        if provider == 'google':
            if not settings.GOOGLE_CLIENT_ID:
                raise ValueError("Google OAuth not configured")
            
            params = {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': 'openid email profile',
                'access_type': 'offline',
                'state': str(uuid.uuid4())
            }
            
            from urllib.parse import urlencode
            auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
            return auth_url, params['state']
            
        elif provider == 'facebook':
            if not settings.FACEBOOK_APP_ID:
                raise ValueError("Facebook OAuth not configured")
            
            params = {
                'client_id': settings.FACEBOOK_APP_ID,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': 'email,public_profile',
                'state': str(uuid.uuid4())
            }
            
            from urllib.parse import urlencode
            auth_url = f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode(params)}"
            return auth_url, params['state']
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def handle_callback(
        self,
        provider: str,
        code: str,
        redirect_uri: str,
        db: Session
    ) -> User:
        """Handle OAuth callback and create/update user."""
        # Exchange code for token
        token = await self._exchange_code_for_token(provider, code, redirect_uri)
        
        # Get user info from provider
        user_info = await self._get_user_info(provider, token['access_token'])
        
        # Find or create user
        user = await self._find_or_create_user(
            db=db,
            provider=provider,
            user_info=user_info,
            token=token
        )
        
        return user
    
    async def _exchange_code_for_token(self, provider: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        if provider == 'google':
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://oauth2.googleapis.com/token',
                    data={
                        'code': code,
                        'client_id': settings.GOOGLE_CLIENT_ID,
                        'client_secret': settings.GOOGLE_CLIENT_SECRET,
                        'redirect_uri': redirect_uri,
                        'grant_type': 'authorization_code'
                    }
                )
                response.raise_for_status()
                return response.json()
        
        elif provider == 'facebook':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://graph.facebook.com/v18.0/oauth/access_token',
                    params={
                        'code': code,
                        'client_id': settings.FACEBOOK_APP_ID,
                        'client_secret': settings.FACEBOOK_APP_SECRET,
                        'redirect_uri': redirect_uri
                    }
                )
                response.raise_for_status()
                return response.json()
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def _get_user_info(self, provider: str, access_token: str) -> Dict[str, Any]:
        """Get user information from OAuth provider."""
        if provider == 'google':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                response.raise_for_status()
                return response.json()
        
        elif provider == 'facebook':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://graph.facebook.com/v18.0/me',
                    params={
                        'fields': 'id,email,name,picture',
                        'access_token': access_token
                    }
                )
                response.raise_for_status()
                return response.json()
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def _find_or_create_user(
        self,
        db: Session,
        provider: str,
        user_info: Dict[str, Any],
        token: Dict[str, Any]
    ) -> User:
        """Find existing user or create new one from OAuth info."""
        # Extract user details based on provider
        if provider == 'google':
            provider_user_id = user_info['id']
            email = user_info.get('email')
            name = user_info.get('name')
            picture = user_info.get('picture')
        elif provider == 'facebook':
            provider_user_id = user_info['id']
            email = user_info.get('email')
            name = user_info.get('name')
            picture = user_info.get('picture', {}).get('data', {}).get('url')
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        # Check if OAuth provider account exists
        oauth_account = db.query(OAuthProvider).filter(
            OAuthProvider.provider == provider,
            OAuthProvider.provider_user_id == provider_user_id
        ).first()
        
        if oauth_account:
            # Update tokens and last used
            oauth_account.access_token = token['access_token']
            oauth_account.refresh_token = token.get('refresh_token')
            if 'expires_in' in token:
                oauth_account.token_expires_at = datetime.utcnow() + timedelta(seconds=token['expires_in'])
            oauth_account.last_used_at = datetime.utcnow()
            db.commit()
            return oauth_account.user
        
        # Check if user exists with this email
        user = None
        if email:
            user = db.query(User).filter(User.email == email).first()
        
        # Create new user if doesn't exist
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=email or f"{provider_user_id}@{provider}.local",
                full_name=name or f"{provider.title()} User",
                hashed_password=get_password_hash(str(uuid.uuid4())),  # Random password
                is_active=True,
                is_verified=True,  # OAuth users are pre-verified
                verified_at=datetime.utcnow(),
                org_id=str(uuid.uuid4())  # Create default org
            )
            db.add(user)
            db.flush()
        
        # Create OAuth provider link
        oauth_account = OAuthProvider(
            id=str(uuid.uuid4()),
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            name=name,
            picture=picture,
            access_token=token['access_token'],
            refresh_token=token.get('refresh_token'),
            token_expires_at=datetime.utcnow() + timedelta(seconds=token.get('expires_in', 3600)),
            provider_data=user_info,
            last_used_at=datetime.utcnow()
        )
        db.add(oauth_account)
        db.commit()
        
        return user


# Singleton instance
oauth_service = OAuthService()