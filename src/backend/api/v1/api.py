"""
Main API router that combines all endpoint routers.
"""
from fastapi import APIRouter
from api.v1.endpoints import (
    analytics,
    monitoring,
    alerts,
    # ad_insights,  # TODO: Fix imports for meta/google clients
    websocket_ad_monitor,
    timeout_stats,
    google_ads_auth,
    google_ads,
    meta_auth,  # New Meta Business Suite auth endpoints
    admin_auth,  # Admin authentication endpoints
    admin_dashboard,  # Admin dashboard endpoints
    health,  # Health check endpoints with API validation
    oauth,  # OAuth authentication endpoints
)
from api.v1 import platform_admin
from api import checkpoints

api_router = APIRouter()

# Include health check router first (no auth required)
api_router.include_router(health.router, prefix="", tags=["health"])

# Include routers
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

api_router.include_router(
    platform_admin.router, prefix="/platform/admin", tags=["platform-admin"]
)

api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])

api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])

api_router.include_router(
    checkpoints.router, prefix="/checkpoints", tags=["checkpoints"]
)

api_router.include_router(
    meta_auth.router, prefix="", tags=["meta-auth"]
)

# api_router.include_router(ad_insights.router, prefix="/v1", tags=["ad-insights"])  # TODO: Fix imports

api_router.include_router(
    websocket_ad_monitor.router, prefix="/v1", tags=["websocket-ad-monitor"]
)

api_router.include_router(
    timeout_stats.router, prefix="/timeout", tags=["timeout-monitoring"]
)

api_router.include_router(
    google_ads_auth.router, prefix="", tags=["google-ads-auth"]
)

api_router.include_router(
    google_ads.router, prefix="", tags=["google-ads"]
)

# Admin routes - Secure administration endpoints
api_router.include_router(
    admin_auth.router, prefix="/admin", tags=["admin-auth"]
)

api_router.include_router(
    admin_dashboard.router, prefix="/admin", tags=["admin-dashboard"]
)

# OAuth authentication routes
api_router.include_router(
    oauth.router, prefix="/auth/oauth", tags=["oauth"]
)

# Note: WebSocket routes are added directly to the app, not through the API router
# See main.py for WebSocket route registration
