"""
Performance monitoring endpoints for War Room backend.
Provides real-time metrics for database, cache, and application performance.
Includes Crisis Monitoring and Mentionlytics integration.
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
import time
import asyncio
from datetime import datetime, timedelta
import json
import os

from core.database import database_manager, get_db
from services.cache_service import cache_service
from core.config import settings
from core.deps import get_current_user
from models.user import User

# Import monitoring system (using relative imports since we're in backend)
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../..", "lib"))

try:
    from lib.monitoring.unifiedMonitor import createUnifiedMonitor
    from lib.monitoring.crisisDetector import createCrisisDetector
    from lib.monitoring.alertService import createAlertService
    from lib.monitoring.types import MonitoringEvent, CrisisAlert

    MONITORING_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Monitoring system not available - {e}")
    MONITORING_AVAILABLE = False


router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint.

    Returns:
        Health status of all services
    """
    start_time = time.time()

    # Check database connectivity
    db_healthy = True
    db_latency = 0
    try:
        db_start = time.time()
        async with database_manager.get_session() as session:
            await session.execute("SELECT 1")
        db_latency = (time.time() - db_start) * 1000  # Convert to ms
    except Exception as e:
        db_healthy = False
        db_latency = -1

    # Check cache connectivity
    cache_healthy = True
    cache_latency = 0
    try:
        cache_start = time.time()
        await cache_service.get("health_check")
        cache_latency = (time.time() - cache_start) * 1000  # Convert to ms
    except Exception as e:
        cache_healthy = False
        cache_latency = -1

    total_latency = (time.time() - start_time) * 1000

    return {
        "status": "healthy" if db_healthy and cache_healthy else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": {"healthy": db_healthy, "latency_ms": round(db_latency, 2)},
            "cache": {"healthy": cache_healthy, "latency_ms": round(cache_latency, 2)},
        },
        "total_latency_ms": round(total_latency, 2),
    }


@router.get("/metrics")
async def get_metrics(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get detailed performance metrics.

    Returns:
        Performance metrics for database, cache, and application
    """
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform admins can access metrics"
        )

    # Get database pool metrics
    db_metrics = await database_manager.get_pool_status()

    # Get cache metrics
    cache_metrics = {}
    if cache_service.is_connected:
        try:
            # Get Redis info
            client = cache_service.clients.get(0)
            if client:
                info = await client.info()
                cache_metrics = {
                    "connected_clients": info.get("connected_clients", 0),
                    "used_memory": info.get("used_memory", 0),
                    "used_memory_human": info.get("used_memory_human", "0B"),
                    "keyspace_hits": info.get("keyspace_hits", 0),
                    "keyspace_misses": info.get("keyspace_misses", 0),
                    "expired_keys": info.get("expired_keys", 0),
                    "evicted_keys": info.get("evicted_keys", 0),
                }

                # Calculate hit rate
                hits = cache_metrics.get("keyspace_hits", 0)
                misses = cache_metrics.get("keyspace_misses", 0)
                total = hits + misses
                cache_metrics["hit_rate"] = (
                    round(hits / total * 100, 2) if total > 0 else 0
                )

        except Exception as e:
            cache_metrics = {"error": str(e)}

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "pool_status": db_metrics,
            "configuration": {
                "pool_size": settings.DB_POOL_SIZE,
                "max_overflow": settings.DB_MAX_OVERFLOW,
                "pool_recycle": settings.DB_POOL_RECYCLE,
                "pool_timeout": settings.DB_POOL_TIMEOUT,
            },
        },
        "cache": {
            "connected": cache_service.is_connected,
            "metrics": cache_metrics,
            "configuration": {
                "max_connections": settings.REDIS_MAX_CONNECTIONS,
                "analytics_cache_ttl": settings.ANALYTICS_CACHE_TTL,
                "user_activity_cache_ttl": settings.USER_ACTIVITY_CACHE_TTL,
            },
        },
        "application": {
            "debug_mode": settings.DEBUG,
            "environment": settings.APP_NAME,
            "version": settings.APP_VERSION,
        },
    }


@router.get("/performance-test")
async def performance_test(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Run performance tests on database and cache.

    Returns:
        Performance test results
    """
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform admins can run performance tests"
        )

    results = {}

    # Test database performance
    try:
        db_start = time.time()

        # Simple query test
        simple_query_start = time.time()
        await db.execute("SELECT 1")
        simple_query_time = (time.time() - simple_query_start) * 1000

        # Complex query test (if organizations table exists)
        complex_query_start = time.time()
        try:
            await db.execute("SELECT COUNT(*) FROM organizations")
            complex_query_time = (time.time() - complex_query_start) * 1000
        except:
            complex_query_time = -1

        results["database"] = {
            "simple_query_ms": round(simple_query_time, 2),
            "complex_query_ms": round(complex_query_time, 2)
            if complex_query_time > 0
            else "N/A",
            "total_test_time_ms": round((time.time() - db_start) * 1000, 2),
        }
    except Exception as e:
        results["database"] = {"error": str(e)}

    # Test cache performance
    try:
        cache_start = time.time()

        # Cache write test
        write_start = time.time()
        await cache_service.set("perf_test", {"test": "data"}, ttl=60)
        write_time = (time.time() - write_start) * 1000

        # Cache read test
        read_start = time.time()
        cached_data = await cache_service.get("perf_test")
        read_time = (time.time() - read_start) * 1000

        # Cache delete test
        delete_start = time.time()
        await cache_service.delete("perf_test")
        delete_time = (time.time() - delete_start) * 1000

        results["cache"] = {
            "write_ms": round(write_time, 2),
            "read_ms": round(read_time, 2),
            "delete_ms": round(delete_time, 2),
            "total_test_time_ms": round((time.time() - cache_start) * 1000, 2),
            "data_retrieved": cached_data is not None,
        }
    except Exception as e:
        results["cache"] = {"error": str(e)}

    return {"timestamp": datetime.utcnow().isoformat(), "results": results}


@router.post("/cache/warm")
async def warm_cache(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Warm up the cache with frequently accessed data.

    Returns:
        Cache warming results
    """
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform admins can warm cache"
        )

    try:
        # Prepare cache entries for warming
        cache_entries = {
            "system:status": {
                "value": {"warmed_at": datetime.utcnow().isoformat()},
                "ttl": 3600,
            },
            "system:config": {
                "value": {
                    "analytics_enabled": True,
                    "websocket_enabled": True,
                    "cache_enabled": True,
                },
                "ttl": 7200,
            },
        }

        # Add organization-specific cache entries if user has org_id
        if current_user.org_id:
            cache_entries[f"org:{current_user.org_id}:config"] = {
                "value": {"last_warmed": datetime.utcnow().isoformat()},
                "ttl": 1800,
            }

        # Warm the cache
        start_time = time.time()
        entries_cached = await cache_service.warm_cache(cache_entries)
        warm_time = (time.time() - start_time) * 1000

        return {
            "success": True,
            "entries_cached": entries_cached,
            "warm_time_ms": round(warm_time, 2),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


# Crisis Monitoring Endpoints
@router.get("/crisis/health")
async def crisis_monitoring_health():
    """
    Check health of crisis monitoring services (Mentionlytics).

    Returns:
        Health status of monitoring services
    """
    if not MONITORING_AVAILABLE:
        return {
            "status": "unavailable",
            "message": "Crisis monitoring system not installed",
            "timestamp": datetime.utcnow().isoformat(),
        }

    try:
        # Create monitor instance with environment variables
        monitor = createUnifiedMonitor(
            {
                "mentionlytics": {
                    "apiKey": os.getenv("MENTIONLYTICS_API_KEY", "test-key"),
                    "projectId": os.getenv("MENTIONLYTICS_PROJECT_ID", "test-project"),
                    "enabled": bool(os.getenv("MENTIONLYTICS_API_KEY")),
                },
                "config": {
                    "keywords": ["warroom", "campaign", "election"],
                    "languages": ["en"],
                    "platforms": ["twitter", "facebook", "news"],
                    "filters": {
                        "min_reach": 100,
                        "min_engagement": 10,
                        "exclude_keywords": ["test", "demo"],
                    },
                    "deduplication": {
                        "enabled": True,
                        "time_window_minutes": 30,
                        "similarity_threshold": 0.8,
                    },
                },
            }
        )

        # Get health status
        health_status = await monitor.getHealthStatus()

        return {
            "status": "healthy"
            if all(s["status"] == "healthy" for s in health_status)
            else "degraded",
            "services": health_status,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


@router.get("/crisis/events")
async def get_monitoring_events(
    limit: int = Query(default=100, le=500),
    since: Optional[str] = Query(default=None, description="ISO timestamp"),
):
    """
    Fetch recent monitoring events from all services.

    Args:
        limit: Maximum number of events to return
        since: Only return events after this timestamp

    Returns:
        List of monitoring events
    """
    if not MONITORING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Monitoring system not available")

    try:
        # Create monitor instance
        monitor = createUnifiedMonitor(
            {
                "mentionlytics": {
                    "apiKey": os.getenv("MENTIONLYTICS_API_KEY", "test-key"),
                    "projectId": os.getenv("MENTIONLYTICS_PROJECT_ID", "test-project"),
                    "enabled": bool(os.getenv("MENTIONLYTICS_API_KEY")),
                },
                "config": {
                    "keywords": ["warroom", "campaign", "election"],
                    "languages": ["en"],
                    "platforms": ["twitter", "facebook", "news"],
                    "filters": {
                        "min_reach": 100,
                        "min_engagement": 10,
                        "exclude_keywords": ["test", "demo"],
                    },
                    "deduplication": {
                        "enabled": True,
                        "time_window_minutes": 30,
                        "similarity_threshold": 0.8,
                    },
                },
            }
        )

        # Parse since parameter
        since_date = None
        if since:
            try:
                since_date = datetime.fromisoformat(since.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(
                    status_code=400, detail="Invalid since timestamp format"
                )

        # Fetch events
        events = await monitor.fetchAllEvents(since_date)

        # Limit results
        limited_events = events[:limit]

        return {
            "events": limited_events,
            "count": len(limited_events),
            "total_fetched": len(events),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching events: {str(e)}")


@router.post("/crisis/test-alert")
async def test_crisis_detection(current_user: User = Depends(get_current_user)):
    """
    Test crisis detection with mock data.

    Returns:
        Test alert results
    """
    if not MONITORING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Monitoring system not available")

    try:
        # Create crisis detector
        detector = createCrisisDetector(
            {
                "velocityMultiplier": 3,
                "sentimentThreshold": 0.5,
                "minimumMentions": 5,  # Lower for testing
                "keywords": ["crisis", "scandal", "outrage"],
                "excludeKeywords": ["crisis management"],
            }
        )

        # Generate mock events for testing
        mock_events = []
        base_time = datetime.utcnow()

        # Create volume spike scenario
        for i in range(20):
            mock_events.append(
                {
                    "id": f"test_event_{i}",
                    "source": "test",
                    "type": "social",
                    "timestamp": base_time - timedelta(minutes=i),
                    "title": f"Test event {i}",
                    "content": f"This is a test event with crisis keywords: scandal, outrage",
                    "url": f"https://example.com/post/{i}",
                    "author": {
                        "name": f"TestUser{i}",
                        "handle": f"@testuser{i}",
                        "followers": 1000 + i * 100,
                    },
                    "platform": "twitter",
                    "sentiment": {
                        "score": -0.7,  # Negative sentiment
                        "label": "negative",
                        "confidence": 0.9,
                    },
                    "metrics": {
                        "reach": 5000 + i * 1000,
                        "engagement": 100 + i * 10,
                        "likes": 50 + i * 5,
                        "shares": 25 + i * 2,
                    },
                    "keywords": ["crisis", "scandal", "outrage"],
                    "mentions": ["@warroom"],
                    "language": "en",
                }
            )

        # Analyze events for crises
        alerts = detector.analyzeEvents(mock_events)

        return {
            "success": True,
            "mock_events_generated": len(mock_events),
            "alerts_detected": len(alerts),
            "alerts": [
                {
                    "id": alert["id"],
                    "severity": alert["severity"],
                    "type": alert["type"],
                    "title": alert["title"],
                    "description": alert["description"],
                    "estimated_reach": alert["estimated_reach"],
                    "affected_keywords": alert["affected_keywords"],
                }
                for alert in alerts
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error in crisis detection test: {str(e)}"
        )


@router.get("/crisis/metrics")
async def get_monitoring_metrics():
    """
    Get monitoring pipeline metrics.

    Returns:
        Pipeline performance metrics
    """
    if not MONITORING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Monitoring system not available")

    try:
        # Create monitor instance
        monitor = createUnifiedMonitor(
            {
                "mentionlytics": {
                    "apiKey": os.getenv("MENTIONLYTICS_API_KEY", "test-key"),
                    "projectId": os.getenv("MENTIONLYTICS_PROJECT_ID", "test-project"),
                    "enabled": bool(os.getenv("MENTIONLYTICS_API_KEY")),
                },
                "config": {
                    "keywords": ["warroom", "campaign", "election"],
                    "languages": ["en"],
                    "platforms": ["twitter", "facebook", "news"],
                    "filters": {
                        "min_reach": 100,
                        "min_engagement": 10,
                        "exclude_keywords": ["test", "demo"],
                    },
                    "deduplication": {
                        "enabled": True,
                        "time_window_minutes": 30,
                        "similarity_threshold": 0.8,
                    },
                },
            }
        )

        # Get metrics
        metrics = monitor.getMetrics()

        return {
            "metrics": metrics,
            "configuration": {
                "monitoring_services": ["mentionlytics"],
                "polling_interval_ms": 60000,
                "crisis_detection_enabled": True,
                "real_time_alerts_enabled": True,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metrics: {str(e)}")


@router.post("/cache/clear")
async def clear_cache(
    pattern: str = "*", current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Clear cache entries matching pattern.

    Args:
        pattern: Pattern to match for cache clearing

    Returns:
        Cache clearing results
    """
    if current_user.role != "platform_admin":
        raise HTTPException(
            status_code=403, detail="Only platform admins can clear cache"
        )

    try:
        start_time = time.time()
        cleared_count = await cache_service.clear_pattern(pattern)
        clear_time = (time.time() - start_time) * 1000

        return {
            "success": True,
            "cleared_count": cleared_count,
            "pattern": pattern,
            "clear_time_ms": round(clear_time, 2),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "pattern": pattern,
            "timestamp": datetime.utcnow().isoformat(),
        }
