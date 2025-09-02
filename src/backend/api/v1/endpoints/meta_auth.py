"""
Meta Business Suite OAuth2 authentication endpoints.
Following the same patterns as Google Ads authentication.
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
from services.meta.meta_auth_service import meta_auth_service

logger = logging.getLogger(__name__)

router = APIRouter()


class AuthUrlRequest(BaseModel):
    """Request model for generating auth URL."""
    state: str = None


class AuthStatus(BaseModel):
    """Response model for auth status."""
    is_authenticated: bool
    ad_account_id: str = None
    business_id: str = None
    scopes: list = []
    expires_at: str = None
    page_count: int = 0
    error: str = None


@router.post("/auth/meta/redirect")
async def get_meta_auth_url(
    request: AuthUrlRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Generate Meta Business Suite OAuth2 authorization URL.
    
    Returns authorization URL for user to complete OAuth flow.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400, 
                detail="User must be associated with an organization"
            )
        
        auth_url = meta_auth_service.get_authorization_url(
            org_id=current_user.org_id,
            state=request.state
        )
        
        logger.info(f"Generated Meta auth URL for org {current_user.org_id}")
        
        return {
            "authorization_url": auth_url,
            "message": "Redirect user to this URL to authorize Meta Business Suite access"
        }
        
    except ValueError as e:
        logger.error(f"Meta auth URL generation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error generating Meta auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate authorization URL")


@router.get("/auth/meta/callback")
async def meta_oauth_callback(
    request: Request,
    code: str = None,
    state: str = None,
    error: str = None,
    error_reason: str = None,
    error_description: str = None
):
    """
    Handle Meta Business Suite OAuth2 callback.
    
    This endpoint receives the authorization code from Meta and exchanges it
    for access and refresh tokens.
    """
    try:
        # Check for OAuth error
        if error:
            error_msg = error_description or error_reason or error
            logger.error(f"OAuth2 error in callback: {error_msg}")
            # Redirect to frontend with error
            frontend_url = f"{request.base_url._replace(scheme='https' if request.url.scheme == 'https' else 'http')}?error={error_msg}"
            return RedirectResponse(url=frontend_url)
        
        if not code or not state:
            logger.error("Missing code or state in OAuth callback")
            raise HTTPException(status_code=400, detail="Missing authorization code or state")
        
        # Handle the callback
        result = await meta_auth_service.handle_callback(code, state)
        
        if result["success"]:
            logger.info(f"Meta OAuth successful for org {result['org_id']}")
            # Redirect to frontend success page
            query_params = f"success=true&org_id={result['org_id']}&ad_accounts={result.get('ad_accounts', 0)}"
            if result.get('business_id'):
                query_params += f"&business_id={result['business_id']}"
            
            frontend_url = f"{request.base_url._replace(scheme='https' if request.url.scheme == 'https' else 'http')}?{query_params}"
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


@router.get("/auth/meta/status")
async def get_meta_auth_status(
    current_user: User = Depends(get_current_user)
) -> AuthStatus:
    """
    Get current Meta Business Suite authentication status for user's organization.
    """
    try:
        if not current_user.org_id:
            return AuthStatus(
                is_authenticated=False,
                error="User must be associated with an organization"
            )
        
        auth_record = await meta_auth_service.get_auth_record(current_user.org_id)
        
        if not auth_record or not auth_record.is_active:
            return AuthStatus(
                is_authenticated=False,
                error="Meta Business Suite not connected"
            )
        
        return AuthStatus(
            is_authenticated=True,
            ad_account_id=auth_record.ad_account_id,
            business_id=auth_record.business_id,
            scopes=auth_record.scopes or [],
            expires_at=auth_record.token_expires_at.isoformat() if auth_record.token_expires_at else None,
            page_count=len(auth_record.page_access_tokens) if auth_record.page_access_tokens else 0
        )
        
    except Exception as e:
        logger.error(f"Error getting Meta auth status: {str(e)}")
        return AuthStatus(
            is_authenticated=False,
            error="Failed to check authentication status"
        )


@router.post("/auth/meta/refresh")
async def refresh_meta_token(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Manually refresh Meta Business Suite access token.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        success = await meta_auth_service.refresh_token(current_user.org_id)
        
        if success:
            logger.info(f"Successfully refreshed Meta token for org {current_user.org_id}")
            return {
                "success": True,
                "message": "Token refreshed successfully"
            }
        else:
            logger.error(f"Failed to refresh Meta token for org {current_user.org_id}")
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


@router.post("/auth/meta/revoke")
async def revoke_meta_access(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Revoke Meta Business Suite access for user's organization.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        success = await meta_auth_service.revoke_access(current_user.org_id)
        
        if success:
            logger.info(f"Successfully revoked Meta access for org {current_user.org_id}")
            return {
                "success": True,
                "message": "Meta Business Suite access revoked successfully"
            }
        else:
            logger.error(f"Failed to revoke Meta access for org {current_user.org_id}")
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


@router.get("/auth/meta/accounts")
async def get_meta_ad_accounts(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get Meta ad accounts for user's organization.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        ad_accounts = await meta_auth_service.get_ad_accounts(current_user.org_id)
        
        return {
            "success": True,
            "ad_accounts": ad_accounts,
            "count": len(ad_accounts)
        }
        
    except ValueError as e:
        logger.error(f"Failed to get Meta ad accounts: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error getting ad accounts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve ad accounts"
        )


@router.post("/auth/meta/select-account/{account_id}")
async def select_meta_ad_account(
    account_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Select a specific Meta ad account as the primary account for the organization.
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        # Get auth record and verify account exists
        auth_record = await meta_auth_service.get_auth_record(current_user.org_id)
        if not auth_record:
            raise HTTPException(status_code=401, detail="Meta not connected")
        
        # Verify user has access to this account
        ad_accounts = await meta_auth_service.get_ad_accounts(current_user.org_id)
        account_found = any(acc.get('account_id') == account_id for acc in ad_accounts)
        
        if not account_found:
            raise HTTPException(
                status_code=403,
                detail="No access to this ad account or account not found"
            )
        
        # Update the primary account ID
        from core.database import get_db
        from sqlalchemy import select
        from models.meta_auth import MetaAuth
        
        async with get_db() as db:
            result = await db.execute(
                select(MetaAuth).where(MetaAuth.org_id == current_user.org_id)
            )
            meta_auth = result.scalar_one_or_none()
            
            if meta_auth:
                meta_auth.ad_account_id = account_id
                await db.commit()
        
        logger.info(f"Selected ad account {account_id} for org {current_user.org_id}")
        
        return {
            "success": True,
            "message": f"Selected ad account {account_id} as primary account",
            "account_id": account_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error selecting ad account: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to select ad account"
        )


@router.get("/auth/meta/pages/{page_id}/token")
async def get_page_access_token(
    page_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get page access token for specific page (for managing page posts, etc.).
    """
    try:
        if not current_user.org_id:
            raise HTTPException(
                status_code=400,
                detail="User must be associated with an organization"
            )
        
        page_token = await meta_auth_service.get_page_access_token(current_user.org_id, page_id)
        
        if not page_token:
            raise HTTPException(
                status_code=404,
                detail="Page token not found or page not accessible"
            )
        
        return {
            "success": True,
            "has_token": True,
            "page_id": page_id
            # Note: We don't return the actual token for security reasons
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting page token: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve page token"
        )