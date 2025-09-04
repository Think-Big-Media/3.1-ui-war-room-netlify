"""
Google Ads OAuth2 authentication endpoints.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.deps import get_current_user
from core.database import get_db
from models.user import User
from services.googleAds.google_ads_auth_service import google_ads_auth_service

logger = logging.getLogger(__name__)

router = APIRouter()


class AuthUrlRequest(BaseModel):
    """Request model for generating auth URL."""
    state: str = None


class AuthStatus(BaseModel):
    """Response model for auth status."""
    is_authenticated: bool
    customer_id: str = None
    scopes: list = []
    expires_at: str = None
    error: str = None


@router.post("/auth/google-ads/redirect")
async def get_google_ads_auth_url(
    request: AuthUrlRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Generate Google Ads OAuth2 authorization URL.
    
    Returns authorization URL for user to complete OAuth flow.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400, 
                detail="User must be associated with an organization"
            )
        
        auth_url = google_ads_auth_service.get_authorization_url(
            org_id=current_user.org_id,
            state=request.state
        )
        
        logger.info(f"Generated Google Ads auth URL for org {current_user.org_id}")
        
        return {
            "authorization_url": auth_url,
            "message": "Redirect user to this URL to authorize Google Ads access"
        }
        
    except ValueError as e:
        logger.error(f"Google Ads auth URL generation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error generating Google Ads auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate authorization URL")


@router.get("/auth/google-ads/callback")
async def google_ads_oauth_callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None
):
    """
    Handle Google Ads OAuth2 callback.
    
    This endpoint receives the authorization code from Google and exchanges it
    for access and refresh tokens.
    """
    try:
        # Check for OAuth error
        if error:
            logger.error(f"OAuth2 error in callback: {error}")
            # Redirect to frontend with error
            frontend_url = f"{request.base_url._replace(scheme='https' if request.url.scheme == 'https' else 'http')}?error={error}"
            return RedirectResponse(url=frontend_url)
        
        if not code or not state:
            logger.error("Missing code or state in OAuth callback")
            raise HTTPException(status_code=400, detail="Missing authorization code or state")
        
        # Handle the callback
        result = await google_ads_auth_service.handle_callback(code, state)
        
        if result["success"]:
            logger.info(f"Google Ads OAuth successful for org {result['org_id']}")
            # Redirect to frontend success page
            frontend_url = f"{request.base_url._replace(scheme='https' if request.url.scheme == 'https' else 'http')}?success=true&org_id={result['org_id']}"
            return RedirectResponse(url=frontend_url)
        else:
            logger.error(f"OAuth callback failed: {result.get('error', 'Unknown error')}")
            # Redirect to frontend with error
            frontend_url = f"{request.base_url._replace(scheme='https' if request.url.scheme == 'https' else 'http')}?error={result.get('error', 'Authentication failed')}"
            return RedirectResponse(url=frontend_url)
            
    except Exception as e:
        logger.error(f"Unexpected error in OAuth callback: {str(e)}")
        # Redirect to frontend with error
        frontend_url = f"{request.base_url._replace(scheme='https' if request.url.scheme == 'https' else 'http')}?error=Authentication failed"
        return RedirectResponse(url=frontend_url)


@router.get("/auth/google-ads/status")
async def get_google_ads_auth_status(
    current_user: User = Depends(get_current_user)
) -> AuthStatus:
    """
    Get current Google Ads authentication status for user's organization.
    """
    try:
        if not current_user.org_id:
            return AuthStatus(
                is_authenticated=False,
                error="User must be associated with an organization"
            )
        
        auth_record = await google_ads_auth_service.get_auth_record(current_user.org_id)
        
        if not auth_record or not auth_record.is_active:
            return AuthStatus(
                is_authenticated=False,
                error="Google Ads not connected"
            )
        
        return AuthStatus(
            is_authenticated=True,
            customer_id=auth_record.customer_id,
            scopes=auth_record.scopes or [],
            expires_at=auth_record.token_expires_at.isoformat() if auth_record.token_expires_at else None
        )
        
    except Exception as e:
        logger.error(f"Error getting Google Ads auth status: {str(e)}")
        return AuthStatus(
            is_authenticated=False,
            error="Failed to check authentication status"
        )


@router.post("/auth/google-ads/refresh")
async def refresh_google_ads_token(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Manually refresh Google Ads access token.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        success = await google_ads_auth_service.refresh_token(current_user.org_id)
        
        if success:
            logger.info(f"Successfully refreshed Google Ads token for org {current_user.org_id}")
            return {
                "success": True,
                "message": "Token refreshed successfully"
            }
        else:
            logger.error(f"Failed to refresh Google Ads token for org {current_user.org_id}")
            raise HTTPException(
                status_code=400,
                detail="Failed to refresh token"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error refreshing token: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to refresh token"
        )


@router.post("/auth/google-ads/revoke")
async def revoke_google_ads_access(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Revoke Google Ads access for user's organization.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        success = await google_ads_auth_service.revoke_access(current_user.org_id)
        
        if success:
            logger.info(f"Successfully revoked Google Ads access for org {current_user.org_id}")
            return {
                "success": True,
                "message": "Google Ads access revoked successfully"
            }
        else:
            logger.error(f"Failed to revoke Google Ads access for org {current_user.org_id}")
            raise HTTPException(
                status_code=400,
                detail="Failed to revoke access"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error revoking access: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to revoke access"
        )