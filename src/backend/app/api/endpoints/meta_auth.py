"""Meta Business API Authentication Endpoints"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import os
import httpx
import secrets
import json
from datetime import datetime, timedelta

from core.config import settings
from core.deps import get_current_user
from models.user import User
from core.redis import redis_client

router = APIRouter()

# Meta OAuth configuration
META_APP_ID = os.getenv("META_APP_ID")
META_APP_SECRET = os.getenv("META_APP_SECRET")
META_API_VERSION = "v18.0"
META_OAUTH_BASE_URL = "https://www.facebook.com"
META_GRAPH_BASE_URL = "https://graph.facebook.com"


class OAuthCallbackRequest(BaseModel):
    code: str
    redirect_uri: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    account_id: Optional[str] = None
    user_id: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


@router.post("/auth/callback", response_model=TokenResponse)
async def handle_oauth_callback(
    request: OAuthCallbackRequest, current_user: User = Depends(get_current_user)
):
    """Exchange OAuth code for access token"""
    if not META_APP_ID or not META_APP_SECRET:
        raise HTTPException(
            status_code=500, detail="Meta API credentials not configured"
        )

    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            params = {
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "redirect_uri": request.redirect_uri,
                "code": request.code,
            }

            response = await client.get(
                f"{META_GRAPH_BASE_URL}/{META_API_VERSION}/oauth/access_token",
                params=params,
            )

            if response.status_code != 200:
                error_data = response.json()
                raise HTTPException(
                    status_code=400,
                    detail=error_data.get("error", {}).get(
                        "message", "Failed to exchange code"
                    ),
                )

            token_data = response.json()

            # Get user's ad accounts
            ad_accounts_response = await client.get(
                f"{META_GRAPH_BASE_URL}/{META_API_VERSION}/me/adaccounts",
                params={
                    "access_token": token_data["access_token"],
                    "fields": "id,name,account_id,account_status,currency",
                },
            )

            if ad_accounts_response.status_code == 200:
                ad_accounts = ad_accounts_response.json().get("data", [])
                # Use the first active ad account
                active_account = next(
                    (acc for acc in ad_accounts if acc.get("account_status") == 1),
                    ad_accounts[0] if ad_accounts else None,
                )

                if active_account:
                    account_id = active_account["account_id"]
                    # Store token in Redis with user association
                    await redis_client.setex(
                        f"meta_token:{current_user.id}",
                        token_data.get("expires_in", 3600),
                        json.dumps(
                            {
                                "access_token": token_data["access_token"],
                                "account_id": account_id,
                                "expires_at": (
                                    datetime.utcnow()
                                    + timedelta(
                                        seconds=token_data.get("expires_in", 3600)
                                    )
                                ).isoformat(),
                            }
                        ),
                    )

                    return TokenResponse(
                        access_token=token_data["access_token"],
                        expires_in=token_data.get("expires_in"),
                        account_id=account_id,
                        user_id=str(current_user.id),
                    )

            # No ad accounts found
            raise HTTPException(
                status_code=400, detail="No ad accounts found for this user"
            )

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Failed to authenticate: {str(e)}")


@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh Meta access token"""
    # Get current token from Redis
    stored_data = await redis_client.get(f"meta_token:{current_user.id}")
    if not stored_data:
        raise HTTPException(status_code=401, detail="No Meta token found")

    token_data = json.loads(stored_data)
    current_token = token_data["access_token"]

    try:
        # Exchange for long-lived token
        async with httpx.AsyncClient() as client:
            params = {
                "grant_type": "fb_exchange_token",
                "client_id": META_APP_ID,
                "client_secret": META_APP_SECRET,
                "fb_exchange_token": current_token,
            }

            response = await client.get(
                f"{META_GRAPH_BASE_URL}/{META_API_VERSION}/oauth/access_token",
                params=params,
            )

            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to refresh token")

            new_token_data = response.json()

            # Update stored token
            await redis_client.setex(
                f"meta_token:{current_user.id}",
                new_token_data.get("expires_in", 5184000),  # ~60 days
                json.dumps(
                    {
                        "access_token": new_token_data["access_token"],
                        "account_id": token_data["account_id"],
                        "expires_at": (
                            datetime.utcnow()
                            + timedelta(
                                seconds=new_token_data.get("expires_in", 5184000)
                            )
                        ).isoformat(),
                    }
                ),
            )

            return TokenResponse(
                access_token=new_token_data["access_token"],
                expires_in=new_token_data.get("expires_in"),
                account_id=token_data["account_id"],
                user_id=str(current_user.id),
            )

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")


@router.delete("/auth/disconnect")
async def disconnect_meta(current_user: User = Depends(get_current_user)):
    """Disconnect Meta account"""
    # Remove token from Redis
    await redis_client.delete(f"meta_token:{current_user.id}")

    return {"status": "success", "message": "Meta account disconnected"}


@router.get("/auth/status")
async def get_auth_status(current_user: User = Depends(get_current_user)):
    """Check Meta authentication status"""
    stored_data = await redis_client.get(f"meta_token:{current_user.id}")

    if not stored_data:
        return {"authenticated": False, "account_id": None, "expires_at": None}

    token_data = json.loads(stored_data)
    expires_at = datetime.fromisoformat(token_data["expires_at"])

    return {
        "authenticated": expires_at > datetime.utcnow(),
        "account_id": token_data["account_id"],
        "expires_at": token_data["expires_at"],
    }


@router.get("/accounts")
async def get_ad_accounts(current_user: User = Depends(get_current_user)):
    """Get user's Meta ad accounts"""
    stored_data = await redis_client.get(f"meta_token:{current_user.id}")
    if not stored_data:
        raise HTTPException(status_code=401, detail="Not authenticated with Meta")

    token_data = json.loads(stored_data)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{META_GRAPH_BASE_URL}/{META_API_VERSION}/me/adaccounts",
                params={
                    "access_token": token_data["access_token"],
                    "fields": "id,name,account_id,account_status,currency,timezone_name,amount_spent,balance",
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch ad accounts",
                )

            data = response.json()
            return {
                "accounts": data.get("data", []),
                "selected_account_id": token_data["account_id"],
            }

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")


@router.post("/accounts/{account_id}/select")
async def select_ad_account(
    account_id: str, current_user: User = Depends(get_current_user)
):
    """Select a different ad account"""
    stored_data = await redis_client.get(f"meta_token:{current_user.id}")
    if not stored_data:
        raise HTTPException(status_code=401, detail="Not authenticated with Meta")

    token_data = json.loads(stored_data)

    # Verify account exists and user has access
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{META_GRAPH_BASE_URL}/{META_API_VERSION}/act_{account_id}",
                params={
                    "access_token": token_data["access_token"],
                    "fields": "id,name,account_status",
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=403, detail="No access to this ad account"
                )

            # Update selected account
            token_data["account_id"] = account_id
            await redis_client.setex(
                f"meta_token:{current_user.id}", 86400, json.dumps(token_data)  # 1 day
            )

            return {"status": "success", "account_id": account_id}

    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
