"""
Cache Integration Service
Integrates Redis caching with FastAPI application lifecycle.
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from .cache_middleware import CacheMiddleware
from services.cache_service import cache_service
from services.query_optimizer import create_performance_indexes
from .database import SessionLocal
from .config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def cache_lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    FastAPI lifespan context manager for cache initialization and cleanup.
    """
    logger.info("Initializing cache service...")

    try:
        # Initialize cache service
        await cache_service.initialize()

        # Create database performance indexes
        if settings.DEBUG:
            logger.info("Creating database performance indexes...")
            db = SessionLocal()
            try:
                await create_performance_indexes(db)
                logger.info("Database indexes created successfully")
            except Exception as e:
                logger.warning(f"Index creation failed (might already exist): {e}")
            finally:
                db.close()

        # Warm up cache with critical data
        await warm_critical_cache()

        logger.info("Cache service initialized successfully")

        yield

    except Exception as e:
        logger.error(f"Cache service initialization failed: {e}")
        yield

    finally:
        # Cleanup
        logger.info("Closing cache service...")
        await cache_service.close()


async def warm_critical_cache():
    """
    Pre-warm cache with critical data that's frequently accessed.
    """
    try:
        # This would pre-populate cache with commonly accessed data
        # For now, just log that warming is starting
        logger.info("Starting cache warming process...")

        # Example: Pre-cache organization configurations
        # organizations = await get_all_active_organizations()
        # for org in organizations:
        #     await cache_service.warm_cache({
        #         f"org_config:{org.id}": {
        #             "value": org.to_dict(),
        #             "ttl": 3600
        #         }
        #     })

        logger.info("Cache warming completed")

    except Exception as e:
        logger.error(f"Cache warming failed: {e}")


def setup_cache_middleware(app: FastAPI):
    """
    Setup cache middleware with custom configuration.
    """
    # Define cache configuration for different endpoint patterns
    cache_config = {
        "dashboard": {
            "patterns": [
                "/api/v1/analytics/dashboard",
                "/api/v1/analytics/metrics/overview",
                "/api/v1/dashboard",
            ],
            "ttl": settings.ANALYTICS_CACHE_TTL,
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": True,
        },
        "documents": {
            "patterns": ["/api/v1/documents", "/api/v1/documents/search"],
            "ttl": 180,  # 3 minutes
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": True,
            "vary_by_params": ["q", "type", "limit", "page"],
        },
        "campaigns": {
            "patterns": ["/api/v1/campaigns", "/api/v1/campaigns/active"],
            "ttl": 300,  # 5 minutes
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": True,
            "vary_by_params": ["status", "limit", "page"],
        },
        "volunteers": {
            "patterns": ["/api/v1/volunteers", "/api/v1/volunteers/active"],
            "ttl": 240,  # 4 minutes
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": True,
            "vary_by_params": ["status", "limit", "page"],
        },
        "events": {
            "patterns": ["/api/v1/events", "/api/v1/events/upcoming"],
            "ttl": 180,  # 3 minutes
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": True,
            "vary_by_params": ["status", "date_from", "date_to", "limit"],
        },
        "alerts": {
            "patterns": ["/api/v1/alerts", "/api/v1/monitoring/alerts"],
            "ttl": 60,  # 1 minute for real-time alerts
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": True,
            "vary_by_params": ["severity", "status"],
        },
        "reports": {
            "patterns": [
                "/api/v1/analytics/charts",
                "/api/v1/analytics/reports",
                "/api/v1/reports",
            ],
            "ttl": 600,  # 10 minutes for reports
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": True,
            "vary_by_params": ["date_range", "metric_type"],
        },
        "reference_data": {
            "patterns": [
                "/api/v1/organizations",
                "/api/v1/users/profile",
                "/api/v1/config",
            ],
            "ttl": 1800,  # 30 minutes for relatively static data
            "db": 0,
            "vary_by_user": True,
            "vary_by_org": False,
        },
    }

    # Add cache middleware
    app.add_middleware(CacheMiddleware, cache_config=cache_config)

    logger.info("Cache middleware configured successfully")


def get_cache_stats():
    """
    Get cache statistics for monitoring.
    """
    return {
        "is_connected": cache_service.is_connected,
        "service_name": "Redis Cache Service",
        "databases": {
            "default": 0,
            "realtime": 1,
            "sessions": 2,
            "feature_flags": 3,
        },
        "config": {
            "analytics_cache_ttl": settings.ANALYTICS_CACHE_TTL,
            "user_activity_cache_ttl": settings.USER_ACTIVITY_CACHE_TTL,
        },
    }


class CacheHealthCheck:
    """
    Health check for cache service.
    """

    @staticmethod
    async def check_health():
        """
        Check cache service health.
        """
        try:
            if not cache_service.is_connected:
                return {
                    "status": "unhealthy",
                    "message": "Cache service not initialized",
                }

            # Test basic operations
            test_key = "health_check_test"
            test_value = {"timestamp": "test", "data": "cache_health_check"}

            # Test set operation
            set_success = await cache_service.set(test_key, test_value, ttl=10)
            if not set_success:
                return {"status": "unhealthy", "message": "Cache set operation failed"}

            # Test get operation
            retrieved_value = await cache_service.get(test_key)
            if retrieved_value != test_value:
                return {"status": "unhealthy", "message": "Cache get operation failed"}

            # Test delete operation
            delete_success = await cache_service.delete(test_key)
            if not delete_success:
                return {
                    "status": "unhealthy",
                    "message": "Cache delete operation failed",
                }

            return {
                "status": "healthy",
                "message": "All cache operations working correctly",
                "stats": get_cache_stats(),
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Cache health check failed: {str(e)}",
            }


# Cache invalidation helpers


async def invalidate_organization_cache(org_id: str):
    """
    Invalidate all cached data for an organization.
    Called when organization data is updated.
    """
    from .cache_middleware import CacheInvalidator
    from services.query_optimizer import QueryOptimizer

    # Invalidate API response cache
    await CacheInvalidator.invalidate_organization_cache(org_id)

    # Invalidate query optimizer cache
    db = SessionLocal()
    try:
        query_optimizer = QueryOptimizer(db)
        await query_optimizer.invalidate_organization_cache(org_id)
    finally:
        db.close()

    logger.info(f"Invalidated all cache for organization {org_id}")


async def invalidate_user_cache(user_id: str):
    """
    Invalidate all cached data for a user.
    Called when user data is updated.
    """
    from .cache_middleware import CacheInvalidator
    from services.query_optimizer import QueryOptimizer

    # Invalidate API response cache
    await CacheInvalidator.invalidate_user_cache(user_id)

    # Invalidate query optimizer cache
    db = SessionLocal()
    try:
        query_optimizer = QueryOptimizer(db)
        await query_optimizer.invalidate_user_cache(user_id)
    finally:
        db.close()

    logger.info(f"Invalidated all cache for user {user_id}")


async def invalidate_document_cache(org_id: str):
    """
    Invalidate document-related cache when documents are updated.
    """
    from .cache_middleware import CacheInvalidator

    # Invalidate document search cache
    await CacheInvalidator.invalidate_endpoint_cache("/api/v1/documents", org_id)
    await CacheInvalidator.invalidate_endpoint_cache("/api/v1/documents/search", org_id)

    logger.info(f"Invalidated document cache for organization {org_id}")


async def invalidate_campaign_cache(org_id: str):
    """
    Invalidate campaign-related cache when campaigns are updated.
    """
    from .cache_middleware import CacheInvalidator

    # Invalidate campaign and dashboard cache
    await CacheInvalidator.invalidate_endpoint_cache("/api/v1/campaigns", org_id)
    await CacheInvalidator.invalidate_endpoint_cache("/api/v1/analytics", org_id)

    logger.info(f"Invalidated campaign cache for organization {org_id}")


# Export main functions
__all__ = [
    "cache_lifespan",
    "setup_cache_middleware",
    "get_cache_stats",
    "CacheHealthCheck",
    "invalidate_organization_cache",
    "invalidate_user_cache",
    "invalidate_document_cache",
    "invalidate_campaign_cache",
]
