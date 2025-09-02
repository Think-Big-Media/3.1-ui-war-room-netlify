"""
Database Query Optimizer Service
Provides optimized queries with Redis caching for high-traffic endpoints.
"""
import asyncio
import logging
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime, timedelta
from functools import wraps

from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import and_, or_, func, text
from sqlalchemy.sql import ClauseElement

from models import (
    User,
    Organization,
    Document,
    Contact,
    Event,
    Volunteer,
    Donation,
)
from models.automation import (
    CrisisAlert,
    NotificationDelivery,
    AutomationWorkflow,
)
from .cache_service import cache_service
from core.config import settings

logger = logging.getLogger(__name__)


def cached_query(cache_key_template: str, ttl: int = 300, db: int = 0):
    """
    Decorator for caching database query results.

    Args:
        cache_key_template: Template for cache key with placeholders
        ttl: Cache TTL in seconds
        db: Redis database number
    """

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from template and arguments
            cache_key = cache_key_template.format(*args, **kwargs)

            # Try to get from cache first
            cached_result = await cache_service.get(cache_key, db=db)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result

            # Cache miss - execute query
            logger.debug(f"Cache miss for {cache_key}, executing query")
            result = await func(*args, **kwargs)

            # Cache the result
            if result is not None:
                await cache_service.set(cache_key, result, ttl=ttl, db=db)

            return result

        return wrapper

    return decorator


class QueryOptimizer:
    """
    Database query optimizer with intelligent caching.
    Provides optimized queries for common patterns and high-traffic endpoints.
    """

    def __init__(self, db: Session):
        self.db = db

    # Organization-level optimized queries

    @cached_query("org_dashboard:{}", ttl=settings.ANALYTICS_CACHE_TTL)
    async def get_organization_dashboard_data(self, org_id: str) -> Dict[str, Any]:
        """
        Get all dashboard data for an organization in optimized queries.
        Uses eager loading to prevent N+1 queries.
        """
        try:
            # Single optimized query with joins for dashboard metrics
            dashboard_query = text(
                """
                SELECT 
                    'campaigns' as metric_type,
                    COUNT(DISTINCT c.id) as count,
                    SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active_count,
                    SUM(c.total_budget) as total_budget,
                    SUM(c.amount_spent) as total_spent
                FROM campaigns c
                WHERE c.organization_id = :org_id AND c.deleted_at IS NULL
                UNION ALL
                SELECT 
                    'volunteers' as metric_type,
                    COUNT(DISTINCT v.id) as count,
                    SUM(CASE WHEN v.status = 'active' THEN 1 ELSE 0 END) as active_count,
                    SUM(v.hours_contributed) as total_hours,
                    0 as total_spent
                FROM volunteers v
                WHERE v.organization_id = :org_id AND v.deleted_at IS NULL
                UNION ALL
                SELECT 
                    'donations' as metric_type,
                    COUNT(DISTINCT d.id) as count,
                    SUM(CASE WHEN d.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                    SUM(d.amount) as total_amount,
                    0 as total_spent
                FROM donations d
                WHERE d.organization_id = :org_id AND d.deleted_at IS NULL
                UNION ALL
                SELECT 
                    'events' as metric_type,
                    COUNT(DISTINCT e.id) as count,
                    SUM(CASE WHEN e.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
                    0 as total_budget,
                    0 as total_spent
                FROM events e
                WHERE e.organization_id = :org_id AND e.deleted_at IS NULL
            """
            )

            result = self.db.execute(dashboard_query, {"org_id": org_id}).fetchall()

            # Format results
            dashboard_data = {}
            for row in result:
                dashboard_data[row.metric_type] = {
                    "count": row.count,
                    "active_count": getattr(row, "active_count", 0),
                    "total_budget": getattr(row, "total_budget", 0),
                    "total_spent": getattr(row, "total_spent", 0),
                    "total_amount": getattr(row, "total_amount", 0),
                    "total_hours": getattr(row, "total_hours", 0),
                    "scheduled_count": getattr(row, "scheduled_count", 0),
                    "completed_count": getattr(row, "completed_count", 0),
                }

            # Get recent activities in a separate optimized query
            recent_activities = await self._get_recent_activities_optimized(org_id)
            dashboard_data["recent_activities"] = recent_activities

            return dashboard_data

        except Exception as e:
            logger.error(f"Error getting dashboard data for org {org_id}: {e}")
            return {}

    @cached_query("org_campaigns:{}", ttl=180)
    async def get_organization_campaigns_optimized(
        self, org_id: str, limit: int = 50, status_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get organization campaigns with optimized loading.
        Uses selectinload to prevent N+1 queries on related data.
        """
        try:
            query = (
                self.db.query(Campaign)
                .filter(
                    and_(
                        Campaign.organization_id == org_id,
                        Campaign.deleted_at.is_(None),
                    )
                )
                .options(
                    # Eager load related data to prevent N+1 queries
                    selectinload(Campaign.events),
                    selectinload(Campaign.volunteers),
                    joinedload(Campaign.organization),
                )
            )

            if status_filter:
                query = query.filter(Campaign.status == status_filter)

            campaigns = query.order_by(Campaign.created_at.desc()).limit(limit).all()

            # Convert to dict with computed fields
            campaign_data = []
            for campaign in campaigns:
                campaign_dict = {
                    "id": campaign.id,
                    "name": campaign.name,
                    "status": campaign.status,
                    "budget": campaign.total_budget,
                    "spent": campaign.amount_spent,
                    "start_date": campaign.start_date.isoformat()
                    if campaign.start_date
                    else None,
                    "end_date": campaign.end_date.isoformat()
                    if campaign.end_date
                    else None,
                    "volunteer_count": len(campaign.volunteers)
                    if campaign.volunteers
                    else 0,
                    "event_count": len(campaign.events) if campaign.events else 0,
                    "efficiency_score": self._calculate_campaign_efficiency(campaign),
                    "created_at": campaign.created_at.isoformat(),
                    "updated_at": campaign.updated_at.isoformat(),
                }
                campaign_data.append(campaign_dict)

            return campaign_data

        except Exception as e:
            logger.error(f"Error getting campaigns for org {org_id}: {e}")
            return []

    @cached_query("org_alerts:{}", ttl=60)
    async def get_organization_alerts_optimized(
        self, org_id: str, severity_filter: Optional[str] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get organization alerts with optimized queries.
        """
        try:
            query = self.db.query(CrisisAlert).filter(
                and_(
                    CrisisAlert.organization_id == org_id,
                    CrisisAlert.is_resolved == False,
                    CrisisAlert.deleted_at.is_(None),
                )
            )

            if severity_filter:
                query = query.filter(CrisisAlert.severity == severity_filter)

            alerts = query.order_by(CrisisAlert.created_at.desc()).limit(limit).all()

            alert_data = []
            for alert in alerts:
                alert_dict = {
                    "id": alert.id,
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "title": alert.title,
                    "description": alert.description,
                    "source": alert.source,
                    "source_id": alert.source_id,
                    "crisis_score": alert.crisis_score,
                    "is_resolved": alert.is_resolved,
                    "created_at": alert.created_at.isoformat(),
                }
                alert_data.append(alert_dict)

            return alert_data

        except Exception as e:
            logger.error(f"Error getting alerts for org {org_id}: {e}")
            return []

    @cached_query("user_dashboard:{}", ttl=300)
    async def get_user_dashboard_optimized(self, user_id: str) -> Dict[str, Any]:
        """
        Get user dashboard data with optimized queries.
        """
        try:
            # Get user with organization in single query
            user = (
                self.db.query(User)
                .options(joinedload(User.organization))
                .filter(User.id == user_id)
                .first()
            )

            if not user:
                return {}

            # Get user's activity summary
            activity_query = text(
                """
                SELECT 
                    'documents' as activity_type,
                    COUNT(*) as count,
                    MAX(created_at) as last_activity
                FROM documents
                WHERE created_by = :user_id AND deleted_at IS NULL
                UNION ALL
                SELECT 
                    'events' as activity_type,
                    COUNT(*) as count,
                    MAX(created_at) as last_activity
                FROM events
                WHERE created_by = :user_id AND deleted_at IS NULL
                UNION ALL
                SELECT 
                    'campaigns' as activity_type,
                    COUNT(*) as count,
                    MAX(created_at) as last_activity
                FROM campaigns
                WHERE created_by = :user_id AND deleted_at IS NULL
            """
            )

            activities = self.db.execute(
                activity_query, {"user_id": user_id}
            ).fetchall()

            activity_data = {}
            for activity in activities:
                activity_data[activity.activity_type] = {
                    "count": activity.count,
                    "last_activity": activity.last_activity.isoformat()
                    if activity.last_activity
                    else None,
                }

            return {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat(),
                    "last_login": user.last_login.isoformat()
                    if user.last_login
                    else None,
                },
                "organization": {
                    "id": user.organization.id,
                    "name": user.organization.name,
                    "type": user.organization.organization_type,
                }
                if user.organization
                else None,
                "activity_summary": activity_data,
            }

        except Exception as e:
            logger.error(f"Error getting user dashboard for {user_id}: {e}")
            return {}

    # Document search optimization

    @cached_query("doc_search:{}:{}:{}", ttl=120)
    async def search_documents_optimized(
        self, org_id: str, search_query: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Optimized document search with full-text search and caching.
        """
        try:
            # Use PostgreSQL full-text search for better performance
            search_vector_query = text(
                """
                SELECT 
                    d.id,
                    d.title,
                    d.original_filename,
                    d.description,
                    d.document_type,
                    d.file_size,
                    d.processing_status,
                    d.created_at,
                    ts_rank(
                        to_tsvector('english', COALESCE(d.title, '') || ' ' || 
                                               COALESCE(d.description, '') || ' ' || 
                                               COALESCE(d.search_keywords, ''))
                        , plainto_tsquery('english', :search_query)
                    ) as rank
                FROM documents d
                WHERE d.organization_id = :org_id 
                    AND d.deleted_at IS NULL
                    AND to_tsvector('english', COALESCE(d.title, '') || ' ' || 
                                                COALESCE(d.description, '') || ' ' || 
                                                COALESCE(d.search_keywords, ''))
                        @@ plainto_tsquery('english', :search_query)
                ORDER BY rank DESC, d.created_at DESC
                LIMIT :limit
            """
            )

            results = self.db.execute(
                search_vector_query,
                {"org_id": org_id, "search_query": search_query, "limit": limit},
            ).fetchall()

            documents = []
            for row in results:
                documents.append(
                    {
                        "id": row.id,
                        "title": row.title,
                        "original_filename": row.original_filename,
                        "description": row.description,
                        "document_type": row.document_type,
                        "file_size": row.file_size,
                        "processing_status": row.processing_status,
                        "created_at": row.created_at.isoformat(),
                        "relevance_score": float(row.rank),
                    }
                )

            return documents

        except Exception as e:
            logger.error(f"Error searching documents for org {org_id}: {e}")
            return []

    # Analytics optimization

    @cached_query("analytics_summary:{}:{}", ttl=settings.ANALYTICS_CACHE_TTL)
    async def get_analytics_summary_optimized(
        self, org_id: str, date_range: str = "30d"
    ) -> Dict[str, Any]:
        """
        Get analytics summary with optimized aggregation queries.
        """
        try:
            # Calculate date range
            days = int(date_range.replace("d", ""))
            start_date = datetime.utcnow() - timedelta(days=days)

            # Single optimized aggregation query
            analytics_query = text(
                """
                WITH date_series AS (
                    SELECT generate_series(
                        :start_date::date,
                        CURRENT_DATE,
                        '1 day'::interval
                    )::date as date
                ),
                daily_metrics AS (
                    SELECT 
                        d.date,
                        COALESCE(SUM(don.amount), 0) as daily_donations,
                        COALESCE(COUNT(DISTINCT don.id), 0) as donation_count,
                        COALESCE(COUNT(DISTINCT v.id), 0) as new_volunteers,
                        COALESCE(COUNT(DISTINCT e.id), 0) as events_created,
                        COALESCE(COUNT(DISTINCT doc.id), 0) as documents_uploaded
                    FROM date_series d
                    LEFT JOIN donations don ON don.created_at::date = d.date 
                        AND don.organization_id = :org_id AND don.deleted_at IS NULL
                    LEFT JOIN volunteers v ON v.created_at::date = d.date 
                        AND v.organization_id = :org_id AND v.deleted_at IS NULL
                    LEFT JOIN events e ON e.created_at::date = d.date 
                        AND e.organization_id = :org_id AND e.deleted_at IS NULL
                    LEFT JOIN documents doc ON doc.created_at::date = d.date 
                        AND doc.organization_id = :org_id AND doc.deleted_at IS NULL
                    GROUP BY d.date
                    ORDER BY d.date
                )
                SELECT 
                    json_agg(
                        json_build_object(
                            'date', date,
                            'donations', daily_donations,
                            'donation_count', donation_count,
                            'volunteers', new_volunteers,
                            'events', events_created,
                            'documents', documents_uploaded
                        ) ORDER BY date
                    ) as daily_data,
                    SUM(daily_donations) as total_donations,
                    SUM(donation_count) as total_donation_count,
                    SUM(new_volunteers) as total_volunteers,
                    SUM(events_created) as total_events,
                    SUM(documents_uploaded) as total_documents
                FROM daily_metrics
            """
            )

            result = self.db.execute(
                analytics_query, {"org_id": org_id, "start_date": start_date}
            ).fetchone()

            return {
                "daily_data": result.daily_data or [],
                "summary": {
                    "total_donations": float(result.total_donations or 0),
                    "total_donation_count": int(result.total_donation_count or 0),
                    "total_volunteers": int(result.total_volunteers or 0),
                    "total_events": int(result.total_events or 0),
                    "total_documents": int(result.total_documents or 0),
                },
                "date_range": date_range,
                "start_date": start_date.isoformat(),
                "end_date": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error getting analytics summary for org {org_id}: {e}")
            return {}

    # Helper methods

    async def _get_recent_activities_optimized(
        self, org_id: str
    ) -> List[Dict[str, Any]]:
        """Get recent activities across all entity types."""
        try:
            # Union query for recent activities across multiple tables
            activity_query = text(
                """
                (
                    SELECT 
                        'donation' as activity_type,
                        id,
                        amount::text as activity_value,
                        donor_name as activity_subject,
                        created_at,
                        status
                    FROM donations
                    WHERE organization_id = :org_id AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 5
                ) UNION ALL (
                    SELECT 
                        'volunteer' as activity_type,
                        id,
                        hours_contributed::text as activity_value,
                        first_name || ' ' || last_name as activity_subject,
                        created_at,
                        status
                    FROM volunteers
                    WHERE organization_id = :org_id AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 5
                ) UNION ALL (
                    SELECT 
                        'event' as activity_type,
                        id,
                        expected_attendees::text as activity_value,
                        name as activity_subject,
                        created_at,
                        status
                    FROM events
                    WHERE organization_id = :org_id AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 5
                ) UNION ALL (
                    SELECT 
                        'document' as activity_type,
                        id,
                        file_size::text as activity_value,
                        title as activity_subject,
                        created_at,
                        processing_status as status
                    FROM documents
                    WHERE organization_id = :org_id AND deleted_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 5
                )
                ORDER BY created_at DESC
                LIMIT 20
            """
            )

            activities = self.db.execute(activity_query, {"org_id": org_id}).fetchall()

            activity_data = []
            for activity in activities:
                activity_data.append(
                    {
                        "type": activity.activity_type,
                        "id": activity.id,
                        "subject": activity.activity_subject,
                        "value": activity.activity_value,
                        "status": activity.status,
                        "created_at": activity.created_at.isoformat(),
                    }
                )

            return activity_data

        except Exception as e:
            logger.error(f"Error getting recent activities for org {org_id}: {e}")
            return []

    def _calculate_campaign_efficiency(self, campaign) -> float:
        """Calculate campaign efficiency score."""
        if not campaign.total_budget or campaign.total_budget == 0:
            return 0.0

        spend_efficiency = min(campaign.amount_spent / campaign.total_budget, 1.0)
        volunteer_bonus = min(len(campaign.volunteers or []) * 0.1, 0.5)
        event_bonus = min(len(campaign.events or []) * 0.05, 0.3)

        return min(spend_efficiency + volunteer_bonus + event_bonus, 1.0)

    # Cache invalidation methods

    async def invalidate_organization_cache(self, org_id: str):
        """Invalidate all cached data for an organization."""
        patterns = [
            f"org_dashboard:{org_id}",
            f"org_campaigns:{org_id}",
            f"org_alerts:{org_id}",
            f"analytics_summary:{org_id}:*",
            f"doc_search:{org_id}:*",
        ]

        for pattern in patterns:
            await cache_service.clear_pattern(pattern)

        logger.info(f"Invalidated cache for organization {org_id}")

    async def invalidate_user_cache(self, user_id: str):
        """Invalidate cached data for a user."""
        await cache_service.delete(f"user_dashboard:{user_id}")
        logger.info(f"Invalidated cache for user {user_id}")


# Create database indexes for better performance
async def create_performance_indexes(db: Session):
    """
    Create database indexes for better query performance.
    This should be run during deployment or database migrations.
    """
    indexes = [
        # Composite indexes for common query patterns
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_org_status ON campaigns(organization_id, status) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_org_type ON documents(organization_id, document_type) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteers_org_status ON volunteers(organization_id, status) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_org_date ON donations(organization_id, created_at DESC) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_org_date ON events(organization_id, created_at DESC) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_org_severity ON crisis_alerts(organization_id, severity, is_resolved) WHERE deleted_at IS NULL;",
        # Full-text search indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_fts ON documents USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(search_keywords, ''))) WHERE deleted_at IS NULL;",
        # Time-based indexes for analytics
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_created_date ON donations(created_at::date, organization_id) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_volunteers_created_date ON volunteers(created_at::date, organization_id) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_created_date ON events(created_at::date, organization_id) WHERE deleted_at IS NULL;",
        # User activity indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_creator ON documents(created_by, created_at DESC) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_creator ON campaigns(created_by, created_at DESC) WHERE deleted_at IS NULL;",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_creator ON events(created_by, created_at DESC) WHERE deleted_at IS NULL;",
    ]

    try:
        for index_sql in indexes:
            try:
                db.execute(text(index_sql))
                logger.info(f"Created index: {index_sql[:50]}...")
            except Exception as e:
                # Index might already exist
                logger.warning(f"Index creation warning: {e}")

        db.commit()
        logger.info("Performance indexes created successfully")

    except Exception as e:
        logger.error(f"Error creating performance indexes: {e}")
        db.rollback()
        raise
