"""
Metrics collector service for system monitoring.
Collects metrics from various sources and triggers alerts.
"""
import asyncio
import psutil
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

from core.database import database_manager
from services.cache_service import cache_service
from services.alert_service import alert_service
from core.websocket import manager as ws_manager
from core.config import settings

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collects and aggregates system metrics."""

    def __init__(self):
        self.collection_interval = 30  # seconds
        self._running = False
        self._metrics_history: Dict[str, list] = {
            "system": [],
            "database": [],
            "cache": [],
            "api": [],
            "websocket": [],
        }
        self._api_request_counts = {"total": 0, "errors": 0, "success": 0}

    async def start(self):
        """Start collecting metrics."""
        self._running = True
        logger.info("Metrics collector started")

        # Start collection tasks
        asyncio.create_task(self._collect_metrics_loop())
        asyncio.create_task(self._aggregate_metrics_loop())

    async def stop(self):
        """Stop collecting metrics."""
        self._running = False
        logger.info("Metrics collector stopped")

    def record_api_request(self, status_code: int, duration_ms: float):
        """
        Record an API request for metrics.

        Args:
            status_code: HTTP status code
            duration_ms: Request duration in milliseconds
        """
        self._api_request_counts["total"] += 1

        if status_code >= 400:
            self._api_request_counts["errors"] += 1
        else:
            self._api_request_counts["success"] += 1

        # Store in cache for aggregation
        asyncio.create_task(self._cache_api_metric(status_code, duration_ms))

    async def _cache_api_metric(self, status_code: int, duration_ms: float):
        """Cache API metric for aggregation."""
        timestamp = datetime.utcnow()
        key = f"metrics:api:{timestamp.timestamp()}"

        await cache_service.set(
            key,
            {
                "status_code": status_code,
                "duration_ms": duration_ms,
                "timestamp": timestamp.isoformat(),
            },
            ttl=3600,  # 1 hour
        )

    async def _collect_metrics_loop(self):
        """Main metrics collection loop."""
        while self._running:
            try:
                metrics = await self._collect_current_metrics()

                # Store metrics
                await self._store_metrics(metrics)

                # Check for alerts
                await alert_service.check_metrics(metrics)

                # Broadcast to WebSocket clients
                await self._broadcast_metrics(metrics)

            except Exception as e:
                logger.error(f"Error collecting metrics: {e}")

            await asyncio.sleep(self.collection_interval)

    async def _collect_current_metrics(self) -> Dict[str, Any]:
        """Collect current system metrics."""
        metrics = {
            "timestamp": datetime.utcnow().isoformat(),
            "system": await self._get_system_metrics(),
            "database": await self._get_database_metrics(),
            "cache": await self._get_cache_metrics(),
            "api": await self._get_api_metrics(),
            "websocket": self._get_websocket_metrics(),
        }

        return metrics

    async def _get_system_metrics(self) -> Dict[str, Any]:
        """Get system-level metrics."""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()

            # Memory metrics
            memory = psutil.virtual_memory()

            # Disk metrics
            disk = psutil.disk_usage("/")

            # Process metrics
            process = psutil.Process()
            process_memory = process.memory_info()

            return {
                "cpu": {
                    "percent": cpu_percent,
                    "count": cpu_count,
                    "per_cpu": psutil.cpu_percent(percpu=True),
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used,
                },
                "memory_percent": memory.percent,  # For alert rules
                "disk": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": disk.percent,
                },
                "process": {
                    "memory_rss": process_memory.rss,
                    "memory_vms": process_memory.vms,
                    "cpu_percent": process.cpu_percent(),
                    "num_threads": process.num_threads(),
                },
            }
        except Exception as e:
            logger.error(f"Error getting system metrics: {e}")
            return {}

    async def _get_database_metrics(self) -> Dict[str, Any]:
        """Get database metrics."""
        try:
            # Get pool status
            pool_status = await database_manager.get_pool_status()

            # Run performance query
            query_start = time.time()
            async with database_manager.get_session() as session:
                await session.execute("SELECT 1")
            query_time = (time.time() - query_start) * 1000

            # Get connection stats
            active_connections = pool_status.get("size", 0) - pool_status.get(
                "available", 0
            )

            return {
                "pool": pool_status,
                "query_time_ms": round(query_time, 2),
                "avg_query_time_ms": query_time,  # For alert rules
                "active_connections": active_connections,
                "available_connections": pool_status.get("available", 0),
                "total_connections": pool_status.get("size", 0),
            }
        except Exception as e:
            logger.error(f"Error getting database metrics: {e}")
            return {}

    async def _get_cache_metrics(self) -> Dict[str, Any]:
        """Get cache metrics."""
        try:
            if not cache_service.is_connected:
                return {"connected": False}

            # Get Redis info
            client = cache_service.clients.get(0)
            if not client:
                return {"connected": False}

            info = await client.info()

            # Calculate hit rate
            hits = info.get("keyspace_hits", 0)
            misses = info.get("keyspace_misses", 0)
            total = hits + misses
            hit_rate = (hits / total * 100) if total > 0 else 0

            # Get memory info
            memory_used = info.get("used_memory", 0)
            memory_peak = info.get("used_memory_peak", 0)

            return {
                "connected": True,
                "memory": {
                    "used": memory_used,
                    "peak": memory_peak,
                    "human": info.get("used_memory_human", "0B"),
                },
                "stats": {
                    "keyspace_hits": hits,
                    "keyspace_misses": misses,
                    "hit_rate": round(hit_rate, 2),
                    "total_commands": info.get("total_commands_processed", 0),
                    "connected_clients": info.get("connected_clients", 0),
                    "expired_keys": info.get("expired_keys", 0),
                    "evicted_keys": info.get("evicted_keys", 0),
                },
                "hit_rate": hit_rate,  # For alert rules
            }
        except Exception as e:
            logger.error(f"Error getting cache metrics: {e}")
            return {"connected": False}

    async def _get_api_metrics(self) -> Dict[str, Any]:
        """Get API metrics."""
        try:
            total = self._api_request_counts["total"]
            errors = self._api_request_counts["errors"]
            success = self._api_request_counts["success"]

            error_rate = (errors / total * 100) if total > 0 else 0

            # Get recent request metrics from cache
            recent_requests = []
            now = datetime.utcnow()

            # Scan last 5 minutes of requests
            for i in range(300):  # 5 minutes in seconds
                timestamp = now - timedelta(seconds=i)
                key = f"metrics:api:{timestamp.timestamp()}"
                metric = await cache_service.get(key)
                if metric:
                    recent_requests.append(metric)

            # Calculate average response time
            if recent_requests:
                avg_duration = sum(r["duration_ms"] for r in recent_requests) / len(
                    recent_requests
                )
                recent_errors = sum(
                    1 for r in recent_requests if r["status_code"] >= 400
                )
                recent_error_rate = (
                    (recent_errors / len(recent_requests) * 100)
                    if recent_requests
                    else 0
                )
            else:
                avg_duration = 0
                recent_error_rate = 0

            return {
                "total_requests": total,
                "errors": errors,
                "success": success,
                "error_rate": round(error_rate, 2),
                "recent": {
                    "count": len(recent_requests),
                    "avg_duration_ms": round(avg_duration, 2),
                    "error_rate": round(recent_error_rate, 2),
                },
            }
        except Exception as e:
            logger.error(f"Error getting API metrics: {e}")
            return {}

    def _get_websocket_metrics(self) -> Dict[str, Any]:
        """Get WebSocket metrics."""
        try:
            active_connections = len(ws_manager.active_connections)

            return {
                "active_connections": active_connections,
                "connection_types": ws_manager.get_connection_stats(),
            }
        except Exception as e:
            logger.error(f"Error getting WebSocket metrics: {e}")
            return {}

    async def _store_metrics(self, metrics: Dict[str, Any]):
        """Store metrics for historical analysis."""
        # Store in cache with TTL
        timestamp = metrics["timestamp"]

        # Store complete metrics
        await cache_service.set(
            f"metrics:snapshot:{timestamp}", metrics, ttl=86400  # 24 hours
        )

        # Store individual metric types for easier querying
        for metric_type in ["system", "database", "cache", "api", "websocket"]:
            if metric_type in metrics:
                await cache_service.set(
                    f"metrics:{metric_type}:{timestamp}",
                    metrics[metric_type],
                    ttl=86400,
                )

        # Update current metrics cache
        await cache_service.set("metrics:current", metrics, ttl=60)  # 1 minute

    async def _broadcast_metrics(self, metrics: Dict[str, Any]):
        """Broadcast metrics to WebSocket clients."""
        try:
            await ws_manager.broadcast({"type": "metrics_update", "data": metrics})
        except Exception as e:
            logger.error(f"Error broadcasting metrics: {e}")

    async def _aggregate_metrics_loop(self):
        """Aggregate metrics for reporting."""
        while self._running:
            try:
                await self._aggregate_hourly_metrics()
            except Exception as e:
                logger.error(f"Error aggregating metrics: {e}")

            # Run every hour
            await asyncio.sleep(3600)

    async def _aggregate_hourly_metrics(self):
        """Aggregate metrics for the past hour."""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)

        aggregated = {
            "period": {"start": hour_ago.isoformat(), "end": now.isoformat()},
            "system": {},
            "database": {},
            "cache": {},
            "api": {},
            "websocket": {},
        }

        # TODO: Implement aggregation logic
        # This would calculate averages, min/max, percentiles, etc.

        # Store aggregated metrics
        await cache_service.set(
            f"metrics:hourly:{now.hour}", aggregated, ttl=604800  # 7 days
        )

    async def get_metrics_history(
        self, metric_type: str, hours: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Get historical metrics.

        Args:
            metric_type: Type of metric (system, database, etc.)
            hours: Hours of history to retrieve

        Returns:
            List of historical metrics
        """
        metrics = []
        now = datetime.utcnow()

        # Get metrics for each minute in the time range
        for i in range(hours * 60):
            timestamp = now - timedelta(minutes=i)
            key = f"metrics:{metric_type}:{timestamp.isoformat()}"

            metric = await cache_service.get(key)
            if metric:
                metrics.append({"timestamp": timestamp.isoformat(), "data": metric})

        return sorted(metrics, key=lambda x: x["timestamp"])


# Global metrics collector instance
metrics_collector = MetricsCollector()
