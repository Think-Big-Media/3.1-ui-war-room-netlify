"""
Health check endpoints with API connection validation.
"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from datetime import datetime
import os
import httpx
import logging
from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


async def check_facebook_connection() -> Dict[str, Any]:
    """Check Facebook API connection and credentials."""
    try:
        # Check if credentials exist
        app_id = os.getenv("FACEBOOK_APP_ID") or settings.FACEBOOK_APP_ID
        app_secret = os.getenv("FACEBOOK_APP_SECRET") or settings.FACEBOOK_APP_SECRET
        access_token = os.getenv("FACEBOOK_ACCESS_TOKEN") or settings.FACEBOOK_ACCESS_TOKEN
        
        if not app_id or not app_secret:
            return {
                "status": "error",
                "message": "Missing Facebook credentials",
                "configured": False
            }
        
        # Test the API connection with a simple call
        async with httpx.AsyncClient() as client:
            # Use the debug token endpoint to verify the access token
            response = await client.get(
                f"https://graph.facebook.com/v19.0/debug_token",
                params={
                    "input_token": access_token,
                    "access_token": f"{app_id}|{app_secret}"
                },
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "healthy",
                    "configured": True,
                    "app_id": app_id[:10] + "...",  # Partially masked for security
                    "token_valid": data.get("data", {}).get("is_valid", False),
                    "scopes": data.get("data", {}).get("scopes", [])
                }
            else:
                return {
                    "status": "error",
                    "configured": True,
                    "message": f"API returned {response.status_code}",
                    "details": response.text[:200]
                }
                
    except httpx.TimeoutException:
        return {
            "status": "timeout",
            "configured": True,
            "message": "Facebook API request timed out"
        }
    except Exception as e:
        logger.error(f"Facebook health check failed: {str(e)}")
        return {
            "status": "error",
            "configured": False,
            "message": str(e)[:200]
        }


async def check_google_connection() -> Dict[str, Any]:
    """Check Google Ads API connection and credentials."""
    try:
        # Check if credentials exist
        client_id = os.getenv("GOOGLE_ADS_CLIENT_ID") or settings.GOOGLE_ADS_CLIENT_ID
        client_secret = os.getenv("GOOGLE_ADS_CLIENT_SECRET") or settings.GOOGLE_ADS_CLIENT_SECRET
        developer_token = os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN") or settings.GOOGLE_ADS_DEVELOPER_TOKEN
        refresh_token = os.getenv("GOOGLE_ADS_REFRESH_TOKEN") or getattr(settings, "GOOGLE_ADS_REFRESH_TOKEN", None)
        
        if not client_id or not client_secret or not developer_token:
            return {
                "status": "error",
                "message": "Missing Google Ads credentials",
                "configured": False,
                "missing": {
                    "client_id": not bool(client_id),
                    "client_secret": not bool(client_secret),
                    "developer_token": not bool(developer_token),
                    "refresh_token": not bool(refresh_token)
                }
            }
        
        # If we have a refresh token, try to get an access token
        if refresh_token:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token"
                    },
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "configured": True,
                        "client_id": client_id[:20] + "...",  # Partially masked
                        "developer_token": developer_token[:10] + "...",
                        "auth_status": "authenticated",
                        "token_type": response.json().get("token_type")
                    }
                else:
                    return {
                        "status": "error",
                        "configured": True,
                        "message": "Failed to refresh token",
                        "details": response.text[:200]
                    }
        else:
            return {
                "status": "warning",
                "configured": True,
                "message": "Credentials present but no refresh token",
                "client_id": client_id[:20] + "...",
                "developer_token": developer_token[:10] + "...",
                "auth_status": "needs_authorization"
            }
            
    except httpx.TimeoutException:
        return {
            "status": "timeout",
            "configured": True,
            "message": "Google API request timed out"
        }
    except Exception as e:
        logger.error(f"Google Ads health check failed: {str(e)}")
        return {
            "status": "error",
            "configured": False,
            "message": str(e)[:200]
        }


async def check_database_connection() -> Dict[str, Any]:
    """Check database connection."""
    try:
        from core.database import SessionLocal
        
        db = SessionLocal()
        # Simple query to test connection
        result = db.execute("SELECT 1")
        db.close()
        
        return {
            "status": "healthy",
            "configured": True,
            "database_url": settings.DATABASE_URL.split("@")[1] if "@" in settings.DATABASE_URL else "configured"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "error",
            "configured": False,
            "message": str(e)[:200]
        }


async def check_redis_connection() -> Dict[str, Any]:
    """Check Redis connection."""
    try:
        from core.redis import redis_client
        
        if redis_client:
            # Ping Redis to check connection
            await redis_client.ping()
            return {
                "status": "healthy",
                "configured": True
            }
        else:
            return {
                "status": "warning",
                "configured": False,
                "message": "Redis not configured"
            }
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
        return {
            "status": "error",
            "configured": False,
            "message": str(e)[:200]
        }


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Comprehensive health check endpoint.
    Returns the status of all critical services and API connections.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": getattr(settings, "VERSION", "1.0.0"),
        "environment": os.getenv("RENDER_ENV", "development"),
        "services": {
            "database": await check_database_connection(),
            "redis": await check_redis_connection(),
            "facebook_api": await check_facebook_connection(),
            "google_ads_api": await check_google_connection()
        }
    }
    
    # Determine overall health status
    service_statuses = [service["status"] for service in health_status["services"].values()]
    
    if any(status == "error" for status in service_statuses):
        health_status["status"] = "unhealthy"
    elif any(status == "warning" for status in service_statuses):
        health_status["status"] = "degraded"
    
    # Add summary
    health_status["summary"] = {
        "healthy_services": sum(1 for s in service_statuses if s == "healthy"),
        "warning_services": sum(1 for s in service_statuses if s == "warning"),
        "error_services": sum(1 for s in service_statuses if s == "error"),
        "total_services": len(service_statuses)
    }
    
    return health_status


@router.get("/health/simple")
async def simple_health_check() -> Dict[str, Any]:
    """
    Simple health check endpoint for basic monitoring.
    Returns 200 if the service is running.
    """
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/apis")
async def api_health_check() -> Dict[str, Any]:
    """
    Check only external API connections.
    Useful for debugging API integration issues.
    """
    return {
        "status": "checking",
        "timestamp": datetime.utcnow().isoformat(),
        "apis": {
            "facebook": await check_facebook_connection(),
            "google_ads": await check_google_connection()
        }
    }


@router.get("/health/facebook")
async def facebook_health_check() -> Dict[str, Any]:
    """
    Detailed Facebook API health check.
    """
    result = await check_facebook_connection()
    result["timestamp"] = datetime.utcnow().isoformat()
    
    # Add more detailed checks if healthy
    if result["status"] == "healthy" and result.get("token_valid"):
        try:
            async with httpx.AsyncClient() as client:
                # Try to get ad accounts
                access_token = os.getenv("FACEBOOK_ACCESS_TOKEN") or settings.FACEBOOK_ACCESS_TOKEN
                response = await client.get(
                    f"https://graph.facebook.com/v19.0/me/adaccounts",
                    params={
                        "access_token": access_token,
                        "fields": "id,name,account_status",
                        "limit": 1
                    },
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result["ad_accounts"] = {
                        "accessible": True,
                        "count": len(data.get("data", []))
                    }
                else:
                    result["ad_accounts"] = {
                        "accessible": False,
                        "error": response.text[:100]
                    }
        except Exception as e:
            result["ad_accounts"] = {
                "accessible": False,
                "error": str(e)[:100]
            }
    
    return result


@router.get("/health/google")
async def google_health_check() -> Dict[str, Any]:
    """
    Detailed Google Ads API health check.
    """
    result = await check_google_connection()
    result["timestamp"] = datetime.utcnow().isoformat()
    
    # Add environment variable status
    result["env_vars"] = {
        "GOOGLE_ADS_CLIENT_ID": bool(os.getenv("GOOGLE_ADS_CLIENT_ID")),
        "GOOGLE_ADS_CLIENT_SECRET": bool(os.getenv("GOOGLE_ADS_CLIENT_SECRET")),
        "GOOGLE_ADS_DEVELOPER_TOKEN": bool(os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN")),
        "GOOGLE_ADS_REFRESH_TOKEN": bool(os.getenv("GOOGLE_ADS_REFRESH_TOKEN")),
        "GOOGLE_ADS_CUSTOMER_ID": bool(os.getenv("GOOGLE_ADS_CUSTOMER_ID"))
    }
    
    return result


@router.get("/health/ready")
async def readiness_check() -> Dict[str, Any]:
    """
    Kubernetes-style readiness probe.
    Returns 200 if the service is ready to accept traffic.
    Returns 503 if any critical service is down.
    """
    health = await health_check()
    
    if health["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail="Service not ready")
    
    return {
        "ready": True,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/live")
async def liveness_check() -> Dict[str, Any]:
    """
    Kubernetes-style liveness probe.
    Returns 200 if the service is alive.
    """
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat()
    }