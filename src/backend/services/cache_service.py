"""
Redis cache service for analytics and application data.
Provides multi-database support for different cache purposes.
"""
from typing import Any, Dict, Optional, Union, Callable
import json
import asyncio
from datetime import timedelta
import pickle
import logging

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool

from core.config import settings


logger = logging.getLogger(__name__)


class CacheService:
    """
    Redis cache service with multiple database support.

    Databases:
    - 0: Default cache (analytics, API responses)
    - 1: Real-time data (WebSocket updates)
    - 2: Sessions and auth tokens
    - 3: Feature flags and config
    """

    def __init__(self):
        self.pools: Dict[int, ConnectionPool] = {}
        self.clients: Dict[int, redis.Redis] = {}
        self._initialized = False

    async def initialize(self):
        """Initialize Redis connection pools."""
        try:
            # Create connection pools for each database
            for db_name, db_num in settings.REDIS_DATABASES.items():
                pool = redis.ConnectionPool(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=db_num,
                    decode_responses=True,
                    max_connections=settings.REDIS_MAX_CONNECTIONS,
                )
                self.pools[db_num] = pool
                self.clients[db_num] = redis.Redis(connection_pool=pool)

            # Test connection
            await self.clients[0].ping()
            self._initialized = True
            logger.info("Cache service initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize cache service: {e}")
            self._initialized = False
            raise

    async def close(self):
        """Close all Redis connections."""
        for client in self.clients.values():
            await client.close()
        for pool in self.pools.values():
            await pool.disconnect()
        self._initialized = False
        logger.info("Cache service closed")

    @property
    def is_connected(self) -> bool:
        """Check if cache service is connected."""
        return self._initialized

    async def get(
        self, key: str, db: int = 0, decode_json: bool = True
    ) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key
            db: Database number
            decode_json: Whether to decode JSON values

        Returns:
            Cached value or None
        """
        if not self._initialized:
            return None

        try:
            client = self.clients.get(db, self.clients[0])
            value = await client.get(key)

            if value and decode_json:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value

            return value

        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        db: int = 0,
        encode_json: bool = True,
    ) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            db: Database number
            encode_json: Whether to encode as JSON

        Returns:
            Success status
        """
        if not self._initialized:
            return False

        try:
            client = self.clients.get(db, self.clients[0])

            if encode_json and not isinstance(value, str):
                value = json.dumps(value)

            if ttl:
                await client.setex(key, ttl, value)
            else:
                await client.set(key, value)

            return True

        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, key: str, db: int = 0) -> bool:
        """Delete key from cache."""
        if not self._initialized:
            return False

        try:
            client = self.clients.get(db, self.clients[0])
            await client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    async def exists(self, key: str, db: int = 0) -> bool:
        """Check if key exists in cache."""
        if not self._initialized:
            return False

        try:
            client = self.clients.get(db, self.clients[0])
            return await client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False

    async def increment(self, key: str, amount: int = 1, db: int = 0) -> Optional[int]:
        """Increment counter in cache."""
        if not self._initialized:
            return None

        try:
            client = self.clients.get(db, self.clients[0])
            return await client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Cache increment error: {e}")
            return None

    async def expire(self, key: str, ttl: int, db: int = 0) -> bool:
        """Set expiration on existing key."""
        if not self._initialized:
            return False

        try:
            client = self.clients.get(db, self.clients[0])
            return await client.expire(key, ttl)
        except Exception as e:
            logger.error(f"Cache expire error: {e}")
            return False

    async def get_pattern(self, pattern: str, db: int = 0) -> Dict[str, Any]:
        """Get all keys matching pattern."""
        if not self._initialized:
            return {}

        try:
            client = self.clients.get(db, self.clients[0])
            keys = await client.keys(pattern)

            if not keys:
                return {}

            # Get all values
            pipeline = client.pipeline()
            for key in keys:
                pipeline.get(key)

            values = await pipeline.execute()

            # Decode and return
            result = {}
            for key, value in zip(keys, values):
                if value:
                    try:
                        result[key] = json.loads(value)
                    except:
                        result[key] = value

            return result

        except Exception as e:
            logger.error(f"Cache get_pattern error: {e}")
            return {}

    async def clear_pattern(self, pattern: str, db: int = 0) -> int:
        """Delete all keys matching pattern."""
        if not self._initialized:
            return 0

        try:
            client = self.clients.get(db, self.clients[0])
            keys = await client.keys(pattern)

            if keys:
                return await client.delete(*keys)

            return 0

        except Exception as e:
            logger.error(f"Cache clear_pattern error: {e}")
            return 0

    async def cache_result(
        self,
        cache_key: str,
        func: Callable,
        ttl: int = 300,
        db: int = 0,
        force_refresh: bool = False,
    ) -> Any:
        """
        Cache function result with automatic refresh.

        Args:
            cache_key: Cache key
            func: Async function to call if cache miss
            ttl: Time to live in seconds
            db: Database number
            force_refresh: Force cache refresh

        Returns:
            Function result
        """
        if not force_refresh:
            cached = await self.get(cache_key, db=db)
            if cached is not None:
                return cached

        # Call function
        result = await func()

        # Cache result
        await self.set(cache_key, result, ttl=ttl, db=db)

        return result

    async def cache_aside(
        self,
        cache_key: str,
        func: Callable,
        ttl: int = 300,
        db: int = 0,
        refresh_threshold: float = 0.8,
    ) -> Any:
        """
        Cache-aside pattern with proactive refresh.

        Args:
            cache_key: Cache key
            func: Async function to call
            ttl: Time to live in seconds
            db: Database number
            refresh_threshold: Refresh when TTL is below this percentage

        Returns:
            Function result
        """
        try:
            # Get cached value and TTL
            client = self.clients.get(db, self.clients[0])
            cached_value = await self.get(cache_key, db=db)

            if cached_value is not None:
                # Check TTL for proactive refresh
                remaining_ttl = await client.ttl(cache_key)
                if remaining_ttl > 0:
                    ttl_percentage = remaining_ttl / ttl
                    if ttl_percentage < refresh_threshold:
                        # Refresh cache in background
                        asyncio.create_task(
                            self._refresh_cache_background(cache_key, func, ttl, db)
                        )

                return cached_value

            # Cache miss - compute and cache
            result = await func()
            await self.set(cache_key, result, ttl=ttl, db=db)
            return result

        except Exception as e:
            logger.error(f"Cache aside error: {e}")
            # Fallback to direct function call
            return await func()

    async def _refresh_cache_background(
        self, cache_key: str, func: Callable, ttl: int, db: int
    ):
        """Background cache refresh task."""
        try:
            result = await func()
            await self.set(cache_key, result, ttl=ttl, db=db)
        except Exception as e:
            logger.error(f"Background cache refresh error: {e}")

    async def cache_with_lock(
        self,
        cache_key: str,
        func: Callable,
        ttl: int = 300,
        db: int = 0,
        lock_timeout: int = 10,
    ) -> Any:
        """
        Cache with distributed lock to prevent cache stampede.

        Args:
            cache_key: Cache key
            func: Async function to call
            ttl: Time to live in seconds
            db: Database number
            lock_timeout: Lock timeout in seconds

        Returns:
            Function result
        """
        # Check cache first
        cached = await self.get(cache_key, db=db)
        if cached is not None:
            return cached

        # Try to acquire lock
        lock_key = f"lock:{cache_key}"
        client = self.clients.get(db, self.clients[0])

        try:
            # Acquire lock with timeout
            lock_acquired = await client.set(
                lock_key, "locked", ex=lock_timeout, nx=True
            )

            if lock_acquired:
                # We got the lock - compute result
                try:
                    result = await func()
                    await self.set(cache_key, result, ttl=ttl, db=db)
                    return result
                finally:
                    # Release lock
                    await client.delete(lock_key)
            else:
                # Lock not acquired - wait and retry
                await asyncio.sleep(0.1)
                # Check cache again (might be populated by lock holder)
                cached = await self.get(cache_key, db=db)
                if cached is not None:
                    return cached

                # Still no cache - compute directly
                return await func()

        except Exception as e:
            logger.error(f"Cache with lock error: {e}")
            return await func()

    async def warm_cache(self, cache_entries: Dict[str, Dict], db: int = 0) -> int:
        """
        Warm cache with multiple entries.

        Args:
            cache_entries: Dict of {cache_key: {value, ttl}}
            db: Database number

        Returns:
            Number of entries cached
        """
        if not self._initialized:
            return 0

        try:
            client = self.clients.get(db, self.clients[0])
            pipeline = client.pipeline()

            count = 0
            for cache_key, entry in cache_entries.items():
                value = entry.get("value")
                ttl = entry.get("ttl", 300)

                if value is not None:
                    if isinstance(value, dict) or isinstance(value, list):
                        value = json.dumps(value)

                    pipeline.setex(cache_key, ttl, value)
                    count += 1

            await pipeline.execute()
            return count

        except Exception as e:
            logger.error(f"Cache warm error: {e}")
            return 0

    # Analytics-specific cache methods

    async def get_analytics_cache(
        self, org_id: str, metric_type: str, date_range: str
    ) -> Optional[Dict]:
        """Get cached analytics data."""
        key = f"analytics:{org_id}:{metric_type}:{date_range}"
        return await self.get(key)

    async def set_analytics_cache(
        self, org_id: str, metric_type: str, date_range: str, data: Dict, ttl: int = 300
    ):
        """Set analytics data in cache."""
        key = f"analytics:{org_id}:{metric_type}:{date_range}"
        await self.set(key, data, ttl=ttl)

    async def invalidate_analytics_cache(self, org_id: str):
        """Invalidate all analytics cache for an organization."""
        pattern = f"analytics:{org_id}:*"
        return await self.clear_pattern(pattern)

    # Real-time cache methods

    async def publish_update(self, channel: str, message: Dict):
        """Publish message to Redis channel."""
        if not self._initialized:
            return

        try:
            client = self.clients.get(1, self.clients[0])  # Use real-time DB
            await client.publish(channel, json.dumps(message))
        except Exception as e:
            logger.error(f"Cache publish error: {e}")

    async def subscribe(self, *channels: str):
        """Subscribe to Redis channels."""
        if not self._initialized:
            return None

        try:
            client = self.clients.get(1, self.clients[0])  # Use real-time DB
            pubsub = client.pubsub()
            await pubsub.subscribe(*channels)
            return pubsub
        except Exception as e:
            logger.error(f"Cache subscribe error: {e}")
            return None


# Singleton instance
cache_service = CacheService()
