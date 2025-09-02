"""
Redis Caching Middleware for FastAPI
Provides automatic caching for API endpoints with cache invalidation.
"""
import json
import hashlib
import logging
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from core.config import settings
from services.cache_service import cache_service

logger = logging.getLogger(__name__)


class CacheMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for automatic API response caching.

    Features:
    - Automatic cache key generation based on URL, query params, and user
    - Configurable TTL per endpoint pattern
    - Cache invalidation patterns
    - Conditional caching based on response status and size
    """

    def __init__(self, app, cache_config: Optional[Dict] = None):
        super().__init__(app)
        self.cache_config = cache_config or self._default_cache_config()
        self.cached_endpoints = self._build_endpoint_patterns()

    def _default_cache_config(self) -> Dict[str, Any]:
        """Default cache configuration for different endpoint patterns."""
        return {
            # Dashboard endpoints - high frequency, moderate TTL
            "dashboard": {
                "patterns": ["/api/v1/dashboard", "/api/v1/analytics"],
                "ttl": 300,  # 5 minutes
                "db": 0,
                "vary_by_user": True,
                "vary_by_org": True,
            },
            # List endpoints - high frequency, short TTL
            "lists": {
                "patterns": [
                    "/api/v1/campaigns",
                    "/api/v1/documents",
                    "/api/v1/volunteers",
                ],
                "ttl": 180,  # 3 minutes
                "db": 0,
                "vary_by_user": True,
                "vary_by_org": True,
                "vary_by_params": ["page", "limit", "status", "type"],
            },
            # Search endpoints - moderate frequency, short TTL
            "search": {
                "patterns": ["/api/v1/documents/search", "/api/v1/search"],
                "ttl": 120,  # 2 minutes
                "db": 0,
                "vary_by_user": True,
                "vary_by_org": True,
                "vary_by_params": ["q", "limit", "type"],
            },
            # Analytics endpoints - moderate frequency, longer TTL
            "analytics": {
                "patterns": ["/api/v1/analytics", "/api/v1/reports"],
                "ttl": 600,  # 10 minutes
                "db": 0,
                "vary_by_user": True,
                "vary_by_org": True,
                "vary_by_params": ["date_range", "metric"],
            },
            # Static/reference data - low frequency, long TTL
            "reference": {
                "patterns": ["/api/v1/organizations", "/api/v1/users/profile"],
                "ttl": 1800,  # 30 minutes
                "db": 0,
                "vary_by_user": True,
                "vary_by_org": False,
            },
        }

    def _build_endpoint_patterns(self) -> Dict[str, Dict]:
        """Build a lookup map of URL patterns to cache configurations."""
        patterns = {}
        for config_name, config in self.cache_config.items():
            for pattern in config["patterns"]:
                patterns[pattern] = {"config_name": config_name, **config}
        return patterns

    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch method."""
        # Skip caching for non-GET requests
        if request.method != "GET":
            return await call_next(request)

        # Check if this endpoint should be cached
        cache_config = self._get_endpoint_cache_config(request.url.path)
        if not cache_config:
            return await call_next(request)

        # Generate cache key
        cache_key = await self._generate_cache_key(request, cache_config)
        if not cache_key:
            return await call_next(request)

        # Try to get cached response
        try:
            cached_response = await cache_service.get(
                cache_key, db=cache_config.get("db", 0)
            )

            if cached_response:
                logger.debug(f"Cache hit for {cache_key}")
                return JSONResponse(
                    content=cached_response["content"],
                    status_code=cached_response["status_code"],
                    headers={
                        **cached_response.get("headers", {}),
                        "X-Cache": "HIT",
                        "X-Cache-Key": cache_key[:50],  # Truncated for security
                    },
                )

        except Exception as e:
            logger.warning(f"Cache retrieval error: {e}")

        # Cache miss - execute request
        logger.debug(f"Cache miss for {cache_key}")
        response = await call_next(request)

        # Cache the response if conditions are met
        if self._should_cache_response(response, cache_config):
            await self._cache_response(response, cache_key, cache_config)

        # Add cache headers
        response.headers["X-Cache"] = "MISS"
        response.headers["X-Cache-Key"] = cache_key[:50]

        return response

    def _get_endpoint_cache_config(self, path: str) -> Optional[Dict]:
        """Get cache configuration for a specific endpoint path."""
        for pattern, config in self.cached_endpoints.items():
            if path.startswith(pattern):
                return config
        return None

    async def _generate_cache_key(
        self, request: Request, cache_config: Dict
    ) -> Optional[str]:
        """Generate cache key based on request and configuration."""
        try:
            key_parts = ["api_cache", request.url.path]

            # Add organization ID if required
            if cache_config.get("vary_by_org", True):
                org_id = await self._get_organization_id(request)
                if org_id:
                    key_parts.append(f"org:{org_id}")

            # Add user ID if required
            if cache_config.get("vary_by_user", True):
                user_id = await self._get_user_id(request)
                if user_id:
                    key_parts.append(f"user:{user_id}")

            # Add specific query parameters if configured
            vary_by_params = cache_config.get("vary_by_params", [])
            if vary_by_params:
                param_parts = []
                for param in vary_by_params:
                    value = request.query_params.get(param)
                    if value:
                        param_parts.append(f"{param}:{value}")

                if param_parts:
                    key_parts.extend(sorted(param_parts))

            # Create hash of the key for consistent length
            key_string = ":".join(key_parts)
            key_hash = hashlib.md5(key_string.encode()).hexdigest()

            return f"cache:{key_hash}"

        except Exception as e:
            logger.error(f"Error generating cache key: {e}")
            return None

    async def _get_organization_id(self, request: Request) -> Optional[str]:
        """Extract organization ID from request context."""
        try:
            # Try to get from request state (set by auth middleware)
            if hasattr(request.state, "current_user"):
                user = request.state.current_user
                if hasattr(user, "organization_id"):
                    return user.organization_id

            # Try to get from JWT token
            authorization = request.headers.get("Authorization")
            if authorization and authorization.startswith("Bearer "):
                # This would need JWT decoding logic
                # For now, return None to skip org-based caching
                pass

            return None

        except Exception:
            return None

    async def _get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from request context."""
        try:
            # Try to get from request state (set by auth middleware)
            if hasattr(request.state, "current_user"):
                user = request.state.current_user
                if hasattr(user, "id"):
                    return user.id

            return None

        except Exception:
            return None

    def _should_cache_response(self, response: Response, cache_config: Dict) -> bool:
        """Determine if response should be cached."""
        # Only cache successful responses
        if response.status_code not in [200]:
            return False

        # Check response size (don't cache very large responses)
        content_length = response.headers.get("content-length")
        if content_length and int(content_length) > 1024 * 1024:  # 1MB limit
            return False

        # Check content type
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("application/json"):
            return False

        return True

    async def _cache_response(
        self, response: Response, cache_key: str, cache_config: Dict
    ):
        """Cache the response data."""
        try:
            # Read response body
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk

            # Parse JSON content
            content = json.loads(response_body.decode())

            # Prepare cache data
            cache_data = {
                "content": content,
                "status_code": response.status_code,
                "headers": {
                    "content-type": response.headers.get("content-type"),
                    "cache-control": response.headers.get("cache-control"),
                },
                "cached_at": datetime.utcnow().isoformat(),
            }

            # Store in cache
            await cache_service.set(
                cache_key,
                cache_data,
                ttl=cache_config.get("ttl", 300),
                db=cache_config.get("db", 0),
            )

            logger.debug(f"Cached response for {cache_key}")

            # Recreate response with original body
            response._content = response_body

        except Exception as e:
            logger.error(f"Error caching response: {e}")


class CacheInvalidator:
    """
    Cache invalidation service for maintaining cache consistency.
    """

    @staticmethod
    async def invalidate_organization_cache(org_id: str):
        """Invalidate all cached API responses for an organization."""
        patterns = [
            f"cache:*:org:{org_id}*",
            f"api_cache:*:org:{org_id}*",
        ]

        for pattern in patterns:
            await cache_service.clear_pattern(pattern)

        logger.info(f"Invalidated API cache for organization {org_id}")

    @staticmethod
    async def invalidate_user_cache(user_id: str):
        """Invalidate all cached API responses for a user."""
        patterns = [
            f"cache:*:user:{user_id}*",
            f"api_cache:*:user:{user_id}*",
        ]

        for pattern in patterns:
            await cache_service.clear_pattern(pattern)

        logger.info(f"Invalidated API cache for user {user_id}")

    @staticmethod
    async def invalidate_endpoint_cache(
        endpoint_pattern: str, org_id: Optional[str] = None
    ):
        """Invalidate cache for specific endpoint pattern."""
        if org_id:
            pattern = f"cache:*:{endpoint_pattern}*:org:{org_id}*"
        else:
            pattern = f"cache:*:{endpoint_pattern}*"

        await cache_service.clear_pattern(pattern)
        logger.info(f"Invalidated cache for endpoint pattern {endpoint_pattern}")

    @staticmethod
    async def invalidate_by_tags(tags: List[str]):
        """Invalidate cache entries by tags (future enhancement)."""
        # This would require implementing tag-based cache keys
        # For now, log the request
        logger.info(f"Tag-based invalidation requested for: {tags}")


# Decorator for manual cache control
def cache_response(ttl: int = 300, db: int = 0, vary_by: Optional[List[str]] = None):
    """
    Decorator for manually controlling endpoint caching.

    Args:
        ttl: Time to live in seconds
        db: Redis database number
        vary_by: List of request attributes to vary cache by
    """

    def decorator(func):
        # Add cache metadata to function
        func._cache_config = {
            "ttl": ttl,
            "db": db,
            "vary_by": vary_by or [],
            "manual_cache": True,
        }
        return func

    return decorator


# Example usage:
# @cache_response(ttl=600, vary_by=["org_id", "date_range"])
# async def get_analytics_dashboard(org_id: str, date_range: str):
#     return {"analytics": "data"}
