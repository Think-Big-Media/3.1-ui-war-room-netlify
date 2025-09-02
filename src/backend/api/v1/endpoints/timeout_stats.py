"""
Timeout Statistics API Endpoint
Provides insights into request timeout behavior
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from api.v1.endpoints.auth import get_current_active_user
from models.user import User
from middleware.timeout_middleware import timeout_middleware

router = APIRouter()


@router.get("/timeout-stats")
async def get_timeout_stats(
    path: Optional[str] = None, current_user: User = Depends(get_current_active_user)
):
    """
    Get timeout statistics for API endpoints

    Args:
        path: Optional specific endpoint path to get stats for

    Returns:
        Timeout statistics including average duration, timeout rate, etc.
    """
    if not timeout_middleware:
        raise HTTPException(status_code=503, detail="Timeout monitoring not available")

    stats = timeout_middleware.get_stats(path)

    if path and not stats:
        raise HTTPException(
            status_code=404, detail=f"No statistics found for path: {path}"
        )

    return {
        "stats": stats,
        "path": path,
        "total_endpoints": len(timeout_middleware.timeout_stats) if not path else None,
    }


@router.get("/slow-endpoints")
async def get_slow_endpoints(
    threshold: float = 10.0, current_user: User = Depends(get_current_active_user)
):
    """
    Get endpoints with average response time above threshold

    Args:
        threshold: Response time threshold in seconds (default: 10s)

    Returns:
        List of slow endpoints with their statistics
    """
    if not timeout_middleware:
        raise HTTPException(status_code=503, detail="Timeout monitoring not available")

    slow_endpoints = timeout_middleware.get_slow_endpoints(threshold)

    return {
        "threshold": threshold,
        "count": len(slow_endpoints),
        "endpoints": slow_endpoints,
    }


@router.get("/timeout-config")
async def get_timeout_configuration(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the current timeout configuration for all endpoints

    Returns:
        Timeout configuration by endpoint category
    """
    from middleware.timeout_middleware import TimeoutConfig

    return {
        "default": TimeoutConfig.DEFAULT,
        "fast": TimeoutConfig.FAST,
        "standard": TimeoutConfig.STANDARD,
        "slow": TimeoutConfig.SLOW,
        "external": TimeoutConfig.EXTERNAL,
    }


@router.post("/test-timeout/{duration}")
async def test_timeout_endpoint(
    duration: int, current_user: User = Depends(get_current_active_user)
):
    """
    Test endpoint that sleeps for specified duration
    Useful for testing timeout behavior

    Args:
        duration: Sleep duration in seconds

    Returns:
        Success message if completed within timeout
    """
    import asyncio

    if duration > 120:
        raise HTTPException(
            status_code=400, detail="Test duration cannot exceed 120 seconds"
        )

    # Sleep for specified duration
    await asyncio.sleep(duration)

    return {
        "message": f"Successfully completed {duration} second delay",
        "duration": duration,
    }
