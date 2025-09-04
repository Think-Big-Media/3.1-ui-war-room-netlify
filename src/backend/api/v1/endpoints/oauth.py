"""
OAuth authentication endpoints for Google and Facebook login.
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from core.config import settings
from core.deps import get_db
from core.auth_cookies import cookie_auth
from services.oauth_service import oauth_service
from schemas.user import UserResponse

router = APIRouter()


@router.get("/google/login")
async def google_login() -> Any:
    """Initiate Google OAuth login flow."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE_URL}/api/v1/auth/oauth/google/callback"
    
    try:
        auth_url, state = oauth_service.get_authorization_url('google', redirect_uri)
        return RedirectResponse(url=auth_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google OAuth: {str(e)}"
        )


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    state: str = Query(None),
    response: Response = Response(),
    db: Session = Depends(get_db)
) -> Any:
    """Handle Google OAuth callback."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured"
        )
    
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE_URL}/api/v1/auth/oauth/google/callback"
    
    try:
        # Handle OAuth callback and get/create user
        user = await oauth_service.handle_callback(
            provider='google',
            code=code,
            redirect_uri=redirect_uri,
            db=db
        )
        
        # Set authentication cookies
        cookie_auth.set_auth_cookies(response, str(user.id))
        
        # Redirect to frontend dashboard
        return RedirectResponse(url=f"{settings.OAUTH_REDIRECT_BASE_URL}/dashboard")
        
    except Exception as e:
        # Redirect to login with error
        return RedirectResponse(
            url=f"{settings.OAUTH_REDIRECT_BASE_URL}/login?error=oauth_failed&message={str(e)}"
        )


@router.get("/facebook/login")
async def facebook_login() -> Any:
    """Initiate Facebook OAuth login flow."""
    if not settings.FACEBOOK_APP_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Facebook OAuth not configured"
        )
    
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE_URL}/api/v1/auth/oauth/facebook/callback"
    
    try:
        auth_url, state = oauth_service.get_authorization_url('facebook', redirect_uri)
        return RedirectResponse(url=auth_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Facebook OAuth: {str(e)}"
        )


@router.get("/facebook/callback")
async def facebook_callback(
    code: str = Query(...),
    state: str = Query(None),
    response: Response = Response(),
    db: Session = Depends(get_db)
) -> Any:
    """Handle Facebook OAuth callback."""
    if not settings.FACEBOOK_APP_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Facebook OAuth not configured"
        )
    
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE_URL}/api/v1/auth/oauth/facebook/callback"
    
    try:
        # Handle OAuth callback and get/create user
        user = await oauth_service.handle_callback(
            provider='facebook',
            code=code,
            redirect_uri=redirect_uri,
            db=db
        )
        
        # Set authentication cookies
        cookie_auth.set_auth_cookies(response, str(user.id))
        
        # Redirect to frontend dashboard
        return RedirectResponse(url=f"{settings.OAUTH_REDIRECT_BASE_URL}/dashboard")
        
    except Exception as e:
        # Redirect to login with error
        return RedirectResponse(
            url=f"{settings.OAUTH_REDIRECT_BASE_URL}/login?error=oauth_failed&message={str(e)}"
        )