"""
Admin Dashboard Endpoints

Provides protected endpoints for administrative dashboard functionality:
- System statistics and monitoring
- User management
- Configuration management
- Security monitoring
- Audit logs
"""
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel, Field

from core.database import get_db
from core.config import settings
from models.admin_user import AdminUser
from models.user import User
# from models.analytics import CampaignAnalytics  # Commented out - model doesn't exist
from models.automation import AutomationWorkflow
from services.admin_auth_service import AdminAuthService, get_admin_auth_service
from api.v1.endpoints.admin_auth import get_current_admin
from middleware.admin_auth import (
    AdminPermissionChecker, 
    require_admin_auth,
    require_superadmin_auth,
    check_admin_rate_limit
)

# Configure logging
logger = logging.getLogger(__name__)

# Router setup
router = APIRouter()

# Response Models
class SystemStatsResponse(BaseModel):
    """Response model for system statistics."""
    total_users: int
    active_users: int
    total_campaigns: int
    active_campaigns: int
    total_automation_rules: int
    active_automation_rules: int
    system_uptime: str
    database_status: str
    redis_status: str
    last_updated: str


class UserListResponse(BaseModel):
    """Response model for user list."""
    id: str
    email: str
    full_name: str = None
    role: str
    is_active: bool
    is_verified: bool
    last_login_at: str = None
    created_at: str = None
    org_id: str = None


class ConfigResponse(BaseModel):
    """Response model for system configuration."""
    app_name: str
    app_version: str
    environment: str
    debug_mode: bool
    features: Dict[str, bool]
    rate_limits: Dict[str, str]
    security_settings: Dict[str, Any]


class AdminActivityResponse(BaseModel):
    """Response model for admin activity."""
    id: str
    admin_username: str
    action: str
    resource: str = None
    details: Dict[str, Any] = None
    ip_address: str = None
    timestamp: str
    status: str = "success"


class HealthCheckResponse(BaseModel):
    """Response model for system health check."""
    status: str
    timestamp: str
    components: Dict[str, Dict[str, Any]]
    overall_health: str


# Helper functions
def get_system_uptime() -> str:
    """Get system uptime string."""
    # This would normally track actual application start time
    # For now, return a placeholder
    return "24h 15m 30s"


def check_database_status(db: Session) -> str:
    """
    Check database connectivity status.
    
    Args:
        db: Database session
        
    Returns:
        Status string: "healthy", "degraded", or "unhealthy"
    """
    try:
        # Simple connectivity check
        db.execute("SELECT 1")
        return "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return "unhealthy"


def check_redis_status() -> str:
    """
    Check Redis connectivity status.
    
    Returns:
        Status string: "healthy", "degraded", or "unhealthy"
    """
    try:
        # TODO: Implement Redis connectivity check
        # For now, return healthy
        return "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {str(e)}")
        return "unhealthy"


# Dashboard Endpoints
@router.get("/dashboard", response_model=SystemStatsResponse)
async def get_dashboard_stats(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get system dashboard statistics.
    
    Args:
        request: Request object
        current_admin: Current authenticated admin
        db: Database session
        
    Returns:
        System statistics and health information
    """
    try:
        # Check rate limiting
        check_admin_rate_limit(request, current_admin)
        
        # Get user statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        
        # Get campaign statistics (if analytics table exists)
        total_campaigns = 0
        active_campaigns = 0
        try:
            # total_campaigns = db.query(CampaignAnalytics).count()
            # active_campaigns = (
            #     db.query(CampaignAnalytics)
            #     .filter(CampaignAnalytics.status == "active")
            #     .count()
            # )
            total_campaigns = 0  # Placeholder
            active_campaigns = 0  # Placeholder
        except Exception:
            # Table might not exist yet
            pass
        
        # Get automation statistics (if automation table exists)
        total_automation_rules = 0
        active_automation_rules = 0
        try:
            total_automation_rules = db.query(AutomationWorkflow).count()
            active_automation_rules = (
                db.query(AutomationWorkflow)
                .filter(AutomationWorkflow.is_active == True)
                .count()
            )
        except Exception:
            # Table might not exist yet
            pass
        
        # Check system health
        database_status = check_database_status(db)
        redis_status = check_redis_status()
        
        logger.info(f"Dashboard accessed by admin: {current_admin.username}")
        
        return SystemStatsResponse(
            total_users=total_users,
            active_users=active_users,
            total_campaigns=total_campaigns,
            active_campaigns=active_campaigns,
            total_automation_rules=total_automation_rules,
            active_automation_rules=active_automation_rules,
            system_uptime=get_system_uptime(),
            database_status=database_status,
            redis_status=redis_status,
            last_updated=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving dashboard statistics"
        )


@router.get("/users", response_model=List[UserListResponse])
async def get_users_list(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    search: Optional[str] = Query(None, description="Search term for email or name"),
    active_only: bool = Query(False, description="Return only active users")
):
    """
    Get paginated list of users.
    
    Args:
        request: Request object
        current_admin: Current authenticated admin
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        search: Search term for filtering
        active_only: Whether to return only active users
        
    Returns:
        List of users with basic information
    """
    try:
        # Check rate limiting
        check_admin_rate_limit(request, current_admin)
        
        # Build query
        query = db.query(User)
        
        # Apply filters
        if active_only:
            query = query.filter(User.is_active == True)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (User.email.ilike(search_term)) |
                (User.full_name.ilike(search_term))
            )
        
        # Apply pagination
        users = (
            query
            .order_by(desc(User.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Convert to response format
        users_response = []
        for user in users:
            users_response.append(UserListResponse(
                id=str(user.id),
                email=user.email,
                full_name=user.full_name,
                role=user.role,
                is_active=user.is_active,
                is_verified=user.is_verified,
                last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
                created_at=user.created_at.isoformat() if user.created_at else None,
                org_id=str(user.org_id) if user.org_id else None
            ))
        
        logger.info(
            f"User list accessed by admin: {current_admin.username} "
            f"(returned {len(users_response)} users)"
        )
        
        return users_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Users list error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving users list"
        )


@router.get("/config", response_model=ConfigResponse)
async def get_system_config(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Get system configuration.
    
    Args:
        request: Request object
        current_admin: Current authenticated admin
        
    Returns:
        System configuration information
    """
    try:
        # Check rate limiting
        check_admin_rate_limit(request, current_admin)
        
        # Only superadmins can view full configuration
        AdminPermissionChecker.require_superadmin(current_admin)
        
        logger.info(f"System config accessed by superadmin: {current_admin.username}")
        
        return ConfigResponse(
            app_name=settings.APP_NAME,
            app_version=settings.APP_VERSION,
            environment=settings.ENVIRONMENT,
            debug_mode=settings.DEBUG,
            features={
                "real_time_updates": settings.ENABLE_REAL_TIME_UPDATES,
                "export_feature": settings.ENABLE_EXPORT_FEATURE,
                "advanced_analytics": settings.ENABLE_ADVANCED_ANALYTICS,
                "posthog_analytics": settings.POSTHOG_ENABLED
            },
            rate_limits={
                "analytics": settings.RATE_LIMIT_ANALYTICS,
                "export": settings.RATE_LIMIT_EXPORT,
                "websocket": settings.RATE_LIMIT_WEBSOCKET
            },
            security_settings={
                "jwt_algorithm": settings.JWT_ALGORITHM,
                "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
                "cors_origins": settings.BACKEND_CORS_ORIGINS,
                "sentry_enabled": bool(settings.SENTRY_DSN)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"System config error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving system configuration"
        )


@router.post("/config")
async def update_system_config(
    request: Request,
    config_updates: Dict[str, Any],
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Update system configuration.
    
    Args:
        request: Request object
        config_updates: Configuration updates to apply
        current_admin: Current authenticated admin
        
    Returns:
        Success message
    """
    try:
        # Check rate limiting
        check_admin_rate_limit(request, current_admin)
        
        # Only superadmins can update configuration
        AdminPermissionChecker.require_superadmin(current_admin)
        
        # Log configuration change attempt
        logger.warning(
            f"System config update attempted by superadmin: {current_admin.username} "
            f"Updates: {list(config_updates.keys())}"
        )
        
        # TODO: Implement secure configuration updates
        # This would typically update configuration in a secure manner
        # For now, we'll just log the attempt
        
        return {
            "success": True,
            "message": "Configuration update logged (implementation pending)",
            "updated_keys": list(config_updates.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Config update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating system configuration"
        )


@router.get("/health", response_model=HealthCheckResponse)
async def get_system_health(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive system health check.
    
    Args:
        request: Request object
        current_admin: Current authenticated admin
        db: Database session
        
    Returns:
        System health status
    """
    try:
        # Check rate limiting
        check_admin_rate_limit(request, current_admin)
        
        # Check component health
        components = {}
        
        # Database health
        db_status = check_database_status(db)
        components["database"] = {
            "status": db_status,
            "response_time_ms": 0,  # TODO: Measure actual response time
            "last_checked": datetime.utcnow().isoformat()
        }
        
        # Redis health
        redis_status = check_redis_status()
        components["redis"] = {
            "status": redis_status,
            "response_time_ms": 0,  # TODO: Measure actual response time
            "last_checked": datetime.utcnow().isoformat()
        }
        
        # Determine overall health
        statuses = [comp["status"] for comp in components.values()]
        if all(status == "healthy" for status in statuses):
            overall_health = "healthy"
        elif any(status == "unhealthy" for status in statuses):
            overall_health = "unhealthy"
        else:
            overall_health = "degraded"
        
        logger.info(f"Health check accessed by admin: {current_admin.username}")
        
        return HealthCheckResponse(
            status="ok",
            timestamp=datetime.utcnow().isoformat(),
            components=components,
            overall_health=overall_health
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error performing health check"
        )


@router.get("/activity", response_model=List[AdminActivityResponse])
async def get_admin_activity(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
    hours: int = Query(24, ge=1, le=168, description="Hours of activity to retrieve")
):
    """
    Get recent admin activity logs.
    
    Args:
        request: Request object
        current_admin: Current authenticated admin
        db: Database session
        hours: Number of hours of activity to retrieve
        
    Returns:
        List of recent admin activities
    """
    try:
        # Check rate limiting
        check_admin_rate_limit(request, current_admin)
        
        # Only superadmins can view all admin activity
        AdminPermissionChecker.require_superadmin(current_admin)
        
        # TODO: Implement actual admin activity logging and retrieval
        # This would query an admin_activity_logs table
        # For now, return placeholder data
        
        activities = [
            AdminActivityResponse(
                id="1",
                admin_username=current_admin.username,
                action="dashboard_access",
                resource="system_stats",
                details={"ip_address": request.client.host},
                ip_address=request.client.host,
                timestamp=datetime.utcnow().isoformat(),
                status="success"
            )
        ]
        
        logger.info(
            f"Admin activity accessed by superadmin: {current_admin.username} "
            f"(last {hours} hours)"
        )
        
        return activities
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin activity error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving admin activity"
        )


@router.get("/admins", response_model=List[Dict[str, Any]])
async def get_admin_users(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get list of admin users (superadmin only).
    
    Args:
        request: Request object
        current_admin: Current authenticated admin
        db: Database session
        
    Returns:
        List of admin users
    """
    try:
        # Check rate limiting
        check_admin_rate_limit(request, current_admin)
        
        # Only superadmins can view admin list
        AdminPermissionChecker.require_superadmin(current_admin)
        
        # Get all admin users
        admins = db.query(AdminUser).order_by(desc(AdminUser.created_at)).all()
        
        # Convert to response format
        admin_list = []
        for admin in admins:
            admin_data = admin.to_dict(include_sensitive=False)
            admin_list.append(admin_data)
        
        logger.info(
            f"Admin users list accessed by superadmin: {current_admin.username} "
            f"(returned {len(admin_list)} admins)"
        )
        
        return admin_list
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin users list error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving admin users"
        )