"""
Platform administration API endpoints.
For War Room team to manage organizations, users, and platform features.
"""
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from core.deps import get_db, get_current_user, require_platform_admin
from core.audit import audit_action
from models.user import User
from models.organization import Organization
from models.platform_admin import (
    FeatureFlag,
    PlatformAuditLog,
    PlatformUsageMetrics,
    PlatformAnalyticsEvent,
)
from services.posthog import posthog_service
from schemas.platform_admin import (
    OrganizationCreateRequest,
    OrganizationUpdateRequest,
    OrganizationResponse,
    PlatformUserResponse,
    FeatureFlagRequest,
    FeatureFlagResponse,
    PlatformMetricsResponse,
    AuditLogResponse,
    AnalyticsQueryRequest,
)


router = APIRouter(prefix="/platform/admin", tags=["platform-admin"])


# Organization Management


@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """List all organizations with filtering and search."""
    query = select(Organization)

    if search:
        query = query.filter(
            or_(
                Organization.name.ilike(f"%{search}%"),
                Organization.slug.ilike(f"%{search}%"),
            )
        )

    if status:
        query = query.filter(Organization.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Get paginated results
    query = query.offset(offset).limit(limit).order_by(Organization.created_at.desc())
    result = await db.execute(query)
    orgs = result.scalars().all()

    # Track admin action
    await posthog_service.track(
        admin.id,
        "platform_admin_list_organizations",
        {"search": search, "status": status, "count": len(orgs)},
    )

    return [OrganizationResponse.from_orm(org) for org in orgs]


@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    request: OrganizationCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Create a new organization."""
    # Check if slug already exists
    existing = await db.execute(
        select(Organization).filter(Organization.slug == request.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization slug already exists",
        )

    # Create organization
    org = Organization(**request.dict(exclude={"admin_email"}))
    db.add(org)
    await db.commit()
    await db.refresh(org)

    # Create admin user if email provided
    if request.admin_email:
        # Create user logic here
        pass

    # Audit log
    await audit_action(
        db,
        admin_user=admin,
        action="organization.create",
        entity_type="organization",
        entity_id=org.id,
        changes={"created": request.dict()},
        target_org_id=org.id,
    )

    # Track event
    await posthog_service.track(
        admin.id,
        "platform_admin_created_org",
        {"org_id": str(org.id), "org_name": org.name},
    )

    return OrganizationResponse.from_orm(org)


@router.patch("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    request: OrganizationUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Update organization settings."""
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    # Track changes
    changes = {}
    for field, value in request.dict(exclude_unset=True).items():
        if getattr(org, field) != value:
            changes[field] = {"from": getattr(org, field), "to": value}
            setattr(org, field, value)

    if changes:
        await db.commit()
        await db.refresh(org)

        # Audit log
        await audit_action(
            db,
            admin_user=admin,
            action="organization.update",
            entity_type="organization",
            entity_id=org.id,
            changes=changes,
            target_org_id=org.id,
        )

    return OrganizationResponse.from_orm(org)


@router.delete("/organizations/{org_id}")
async def delete_organization(
    org_id: UUID,
    confirm: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Delete an organization (requires confirmation)."""
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation required to delete organization",
        )

    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )

    # Soft delete
    org.deleted_at = datetime.utcnow()
    org.status = "deleted"
    await db.commit()

    # Audit log
    await audit_action(
        db,
        admin_user=admin,
        action="organization.delete",
        entity_type="organization",
        entity_id=org.id,
        target_org_id=org.id,
    )

    return {"message": "Organization deleted successfully"}


# User Management


@router.get("/users", response_model=List[PlatformUserResponse])
async def list_all_users(
    org_id: Optional[UUID] = None,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """List users across all organizations."""
    query = select(User)

    if org_id:
        query = query.filter(User.org_id == org_id)

    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
            )
        )

    if role:
        query = query.filter(User.role == role)

    if status:
        query = query.filter(User.status == status)

    query = query.offset(offset).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return [PlatformUserResponse.from_orm(user) for user in users]


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: UUID,
    reason: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Suspend a user account."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.status = "suspended"
    user.suspended_at = datetime.utcnow()
    user.suspension_reason = reason
    await db.commit()

    # Audit log
    await audit_action(
        db,
        admin_user=admin,
        action="user.suspend",
        entity_type="user",
        entity_id=user.id,
        changes={"reason": reason},
        target_user_id=user.id,
        target_org_id=user.org_id,
    )

    return {"message": "User suspended successfully"}


# Feature Flags


@router.get("/feature-flags", response_model=List[FeatureFlagResponse])
async def list_feature_flags(
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_platform_admin)
):
    """List all feature flags."""
    result = await db.execute(
        select(FeatureFlag).order_by(FeatureFlag.created_at.desc())
    )
    flags = result.scalars().all()

    return [FeatureFlagResponse.from_orm(flag) for flag in flags]


@router.post("/feature-flags", response_model=FeatureFlagResponse)
async def create_feature_flag(
    request: FeatureFlagRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Create a new feature flag."""
    flag = FeatureFlag(**request.dict(), created_by=admin.id)
    db.add(flag)
    await db.commit()
    await db.refresh(flag)

    # Audit log
    await audit_action(
        db,
        admin_user=admin,
        action="feature_flag.create",
        entity_type="feature_flag",
        entity_id=flag.id,
        changes={"created": request.dict()},
    )

    return FeatureFlagResponse.from_orm(flag)


@router.patch("/feature-flags/{flag_id}", response_model=FeatureFlagResponse)
async def update_feature_flag(
    flag_id: UUID,
    request: FeatureFlagRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Update a feature flag."""
    flag = await db.get(FeatureFlag, flag_id)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Feature flag not found"
        )

    # Track changes
    changes = {}
    for field, value in request.dict(exclude_unset=True).items():
        if getattr(flag, field) != value:
            changes[field] = {"from": getattr(flag, field), "to": value}
            setattr(flag, field, value)

    if changes:
        flag.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(flag)

        # Audit log
        await audit_action(
            db,
            admin_user=admin,
            action="feature_flag.update",
            entity_type="feature_flag",
            entity_id=flag.id,
            changes=changes,
        )

    return FeatureFlagResponse.from_orm(flag)


# Platform Metrics


@router.get("/metrics/overview", response_model=PlatformMetricsResponse)
async def get_platform_metrics(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Get platform-wide metrics and usage statistics."""
    if not date_from:
        date_from = date.today() - timedelta(days=30)
    if not date_to:
        date_to = date.today()

    # Get organization metrics
    org_metrics = await db.execute(
        select(
            func.count(Organization.id).label("total_orgs"),
            func.count(Organization.id)
            .filter(Organization.status == "active")
            .label("active_orgs"),
            func.count(Organization.id)
            .filter(Organization.created_at >= date_from)
            .label("new_orgs"),
        )
    )
    org_data = org_metrics.one()

    # Get user metrics
    user_metrics = await db.execute(
        select(
            func.count(User.id).label("total_users"),
            func.count(User.id).filter(User.status == "active").label("active_users"),
            func.count(User.id)
            .filter(User.role == "platform_admin")
            .label("platform_admins"),
        )
    )
    user_data = user_metrics.one()

    # Get usage metrics
    usage_metrics = await db.execute(
        select(
            func.sum(PlatformUsageMetrics.api_calls).label("total_api_calls"),
            func.sum(PlatformUsageMetrics.ai_tokens_used).label("total_ai_tokens"),
            func.sum(PlatformUsageMetrics.events_created).label("total_events"),
            func.avg(PlatformUsageMetrics.active_users).label("avg_active_users"),
        ).filter(
            and_(
                PlatformUsageMetrics.metric_date >= date_from,
                PlatformUsageMetrics.metric_date <= date_to,
            )
        )
    )
    usage_data = usage_metrics.one()

    # Get top organizations by usage
    top_orgs_query = (
        select(
            Organization.id,
            Organization.name,
            func.sum(PlatformUsageMetrics.api_calls).label("api_calls"),
            func.sum(PlatformUsageMetrics.ai_tokens_used).label("ai_tokens"),
        )
        .join(PlatformUsageMetrics)
        .filter(
            and_(
                PlatformUsageMetrics.metric_date >= date_from,
                PlatformUsageMetrics.metric_date <= date_to,
            )
        )
        .group_by(Organization.id, Organization.name)
        .order_by(func.sum(PlatformUsageMetrics.api_calls).desc())
        .limit(10)
    )

    top_orgs_result = await db.execute(top_orgs_query)
    top_orgs = [
        {
            "org_id": str(row.id),
            "org_name": row.name,
            "api_calls": row.api_calls or 0,
            "ai_tokens": row.ai_tokens or 0,
        }
        for row in top_orgs_result
    ]

    return PlatformMetricsResponse(
        date_range={"from": date_from.isoformat(), "to": date_to.isoformat()},
        organizations={
            "total": org_data.total_orgs,
            "active": org_data.active_orgs,
            "new": org_data.new_orgs,
        },
        users={
            "total": user_data.total_users,
            "active": user_data.active_users,
            "platform_admins": user_data.platform_admins,
        },
        usage={
            "total_api_calls": usage_data.total_api_calls or 0,
            "total_ai_tokens": usage_data.total_ai_tokens or 0,
            "total_events": usage_data.total_events or 0,
            "avg_active_users": float(usage_data.avg_active_users or 0),
        },
        top_organizations=top_orgs,
    )


@router.post("/metrics/analytics/query")
async def query_analytics(
    request: AnalyticsQueryRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Query platform analytics events."""
    query = select(PlatformAnalyticsEvent)

    # Apply filters
    if request.event_types:
        query = query.filter(PlatformAnalyticsEvent.event_type.in_(request.event_types))

    if request.event_names:
        query = query.filter(PlatformAnalyticsEvent.event_name.in_(request.event_names))

    if request.org_id:
        query = query.filter(PlatformAnalyticsEvent.org_id == request.org_id)

    if request.user_id:
        query = query.filter(PlatformAnalyticsEvent.user_id == request.user_id)

    if request.date_from:
        query = query.filter(PlatformAnalyticsEvent.timestamp >= request.date_from)

    if request.date_to:
        query = query.filter(PlatformAnalyticsEvent.timestamp <= request.date_to)

    # Execute query
    if request.aggregate_by:
        # Aggregation logic here
        pass
    else:
        query = query.order_by(PlatformAnalyticsEvent.timestamp.desc())
        query = query.limit(request.limit).offset(request.offset)

        result = await db.execute(query)
        events = result.scalars().all()

        return {
            "events": [event.to_dict() for event in events],
            "total": len(events),
            "query": request.dict(),
        }


# Audit Log


@router.get("/audit-log", response_model=List[AuditLogResponse])
async def get_audit_log(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    admin_user_id: Optional[UUID] = None,
    target_org_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Get platform audit log entries."""
    query = select(PlatformAuditLog)

    if action:
        query = query.filter(PlatformAuditLog.action == action)

    if entity_type:
        query = query.filter(PlatformAuditLog.entity_type == entity_type)

    if admin_user_id:
        query = query.filter(PlatformAuditLog.admin_user_id == admin_user_id)

    if target_org_id:
        query = query.filter(PlatformAuditLog.target_org_id == target_org_id)

    if date_from:
        query = query.filter(PlatformAuditLog.timestamp >= date_from)

    if date_to:
        query = query.filter(PlatformAuditLog.timestamp <= date_to)

    query = query.order_by(PlatformAuditLog.timestamp.desc())
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    entries = result.scalars().all()

    return [AuditLogResponse.from_orm(entry) for entry in entries]


# Health Check


@router.get("/health")
async def platform_health_check(
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_platform_admin)
):
    """Check platform health and service status."""
    # Check database
    try:
        await db.execute(select(1))
        db_status = "healthy"
    except:
        db_status = "unhealthy"

    # Check Redis
    try:
        from services.cache_service import cache_service

        await cache_service.get("health_check")
        redis_status = "healthy"
    except:
        redis_status = "unhealthy"

    # Check PostHog
    posthog_status = "enabled" if posthog_service.enabled else "disabled"

    return {
        "status": "operational" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "redis": redis_status,
            "posthog": posthog_status,
        },
    }


# Include router in main app
def include_router(app):
    app.include_router(router, prefix="/api/v1")
