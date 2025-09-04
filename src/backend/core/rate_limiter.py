"""
Advanced Rate Limiting Service
Implements multiple rate limiting strategies with Redis backend.
"""
import asyncio
import time
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .config import settings
from services.cache_service import cache_service

logger = logging.getLogger(__name__)


class RateLimitStrategy(Enum):
    """Rate limiting strategies."""

    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    LEAKY_BUCKET = "leaky_bucket"


@dataclass
class RateLimit:
    """Rate limit configuration."""

    requests: int  # Number of requests allowed
    window: int  # Time window in seconds
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW
    burst_requests: Optional[int] = None  # Additional burst capacity
    burst_window: Optional[int] = None  # Burst window in seconds


class RateLimiter:
    """
    Advanced rate limiter with multiple strategies.
    Uses Redis for distributed rate limiting across multiple instances.
    """

    def __init__(self):
        self.redis_db = 2  # Use sessions database for rate limiting

    async def is_allowed(
        self, identifier: str, rate_limit: RateLimit, cost: int = 1
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if request is allowed under rate limit.

        Args:
            identifier: Unique identifier (IP, user_id, API key, etc.)
            rate_limit: Rate limit configuration
            cost: Cost of this request (default 1)

        Returns:
            (allowed, metadata) tuple with rate limit information
        """
        if rate_limit.strategy == RateLimitStrategy.SLIDING_WINDOW:
            return await self._sliding_window_check(identifier, rate_limit, cost)
        elif rate_limit.strategy == RateLimitStrategy.FIXED_WINDOW:
            return await self._fixed_window_check(identifier, rate_limit, cost)
        elif rate_limit.strategy == RateLimitStrategy.TOKEN_BUCKET:
            return await self._token_bucket_check(identifier, rate_limit, cost)
        elif rate_limit.strategy == RateLimitStrategy.LEAKY_BUCKET:
            return await self._leaky_bucket_check(identifier, rate_limit, cost)
        else:
            # Default to sliding window
            return await self._sliding_window_check(identifier, rate_limit, cost)

    async def _sliding_window_check(
        self, identifier: str, rate_limit: RateLimit, cost: int
    ) -> Tuple[bool, Dict[str, Any]]:
        """Sliding window rate limiting implementation."""
        current_time = time.time()
        window_start = current_time - rate_limit.window

        # Redis key for this identifier
        key = f"rate_limit:sliding:{identifier}"

        try:
            # Use Redis sorted set to track requests in time window
            pipe = await cache_service.clients[self.redis_db].pipeline()

            # Remove old entries outside window
            pipe.zremrangebyscore(key, 0, window_start)

            # Count current requests in window
            pipe.zcard(key)

            # Add current request with score as timestamp
            request_id = f"{current_time}:{cost}"
            pipe.zadd(key, {request_id: current_time})

            # Set expiration
            pipe.expire(key, rate_limit.window + 60)

            results = await pipe.execute()
            current_count = results[1] if len(results) > 1 else 0

            # Check if request would exceed limit
            if current_count + cost > rate_limit.requests:
                # Remove the request we just added
                await cache_service.clients[self.redis_db].zrem(key, request_id)

                # Calculate reset time
                oldest_request = await cache_service.clients[self.redis_db].zrange(
                    key, 0, 0, withscores=True
                )
                reset_time = (
                    int(oldest_request[0][1] + rate_limit.window)
                    if oldest_request
                    else int(current_time + rate_limit.window)
                )

                return False, {
                    "allowed": False,
                    "limit": rate_limit.requests,
                    "remaining": max(0, rate_limit.requests - current_count),
                    "reset_time": reset_time,
                    "retry_after": max(1, reset_time - int(current_time)),
                    "strategy": "sliding_window",
                }

            # Request allowed
            remaining = max(0, rate_limit.requests - (current_count + cost))
            reset_time = int(current_time + rate_limit.window)

            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": remaining,
                "reset_time": reset_time,
                "retry_after": 0,
                "strategy": "sliding_window",
            }

        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open - allow request if rate limiter is down
            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": rate_limit.requests,
                "reset_time": int(current_time + rate_limit.window),
                "retry_after": 0,
                "strategy": "sliding_window",
                "error": str(e),
            }

    async def _fixed_window_check(
        self, identifier: str, rate_limit: RateLimit, cost: int
    ) -> Tuple[bool, Dict[str, Any]]:
        """Fixed window rate limiting implementation."""
        current_time = int(time.time())
        window_start = (current_time // rate_limit.window) * rate_limit.window

        key = f"rate_limit:fixed:{identifier}:{window_start}"

        try:
            # Increment counter atomically
            current_count = await cache_service.clients[self.redis_db].incrby(key, cost)

            # Set expiration on first increment
            if current_count == cost:
                await cache_service.clients[self.redis_db].expire(
                    key, rate_limit.window + 60
                )

            if current_count > rate_limit.requests:
                # Rollback increment
                await cache_service.clients[self.redis_db].decrby(key, cost)

                reset_time = window_start + rate_limit.window

                return False, {
                    "allowed": False,
                    "limit": rate_limit.requests,
                    "remaining": 0,
                    "reset_time": reset_time,
                    "retry_after": max(1, reset_time - current_time),
                    "strategy": "fixed_window",
                }

            remaining = max(0, rate_limit.requests - current_count)
            reset_time = window_start + rate_limit.window

            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": remaining,
                "reset_time": reset_time,
                "retry_after": 0,
                "strategy": "fixed_window",
            }

        except Exception as e:
            logger.error(f"Fixed window rate limit check failed: {e}")
            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": rate_limit.requests,
                "reset_time": current_time + rate_limit.window,
                "retry_after": 0,
                "strategy": "fixed_window",
                "error": str(e),
            }

    async def _token_bucket_check(
        self, identifier: str, rate_limit: RateLimit, cost: int
    ) -> Tuple[bool, Dict[str, Any]]:
        """Token bucket rate limiting implementation."""
        current_time = time.time()
        key = f"rate_limit:bucket:{identifier}"

        try:
            # Get current bucket state
            bucket_data = await cache_service.get(key, db=self.redis_db)

            if bucket_data:
                tokens = bucket_data.get("tokens", rate_limit.requests)
                last_refill = bucket_data.get("last_refill", current_time)
            else:
                tokens = rate_limit.requests
                last_refill = current_time

            # Calculate token refill
            time_passed = current_time - last_refill
            refill_rate = rate_limit.requests / rate_limit.window  # tokens per second
            tokens_to_add = time_passed * refill_rate

            # Update token count (cap at max capacity)
            tokens = min(rate_limit.requests, tokens + tokens_to_add)

            # Check if enough tokens available
            if tokens < cost:
                # Not enough tokens
                await cache_service.set(
                    key,
                    {"tokens": tokens, "last_refill": current_time},
                    ttl=rate_limit.window * 2,
                    db=self.redis_db,
                )

                # Calculate when enough tokens will be available
                tokens_needed = cost - tokens
                wait_time = int(tokens_needed / refill_rate) + 1

                return False, {
                    "allowed": False,
                    "limit": rate_limit.requests,
                    "remaining": int(tokens),
                    "reset_time": int(current_time + wait_time),
                    "retry_after": wait_time,
                    "strategy": "token_bucket",
                }

            # Consume tokens
            tokens -= cost

            await cache_service.set(
                key,
                {"tokens": tokens, "last_refill": current_time},
                ttl=rate_limit.window * 2,
                db=self.redis_db,
            )

            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": int(tokens),
                "reset_time": int(current_time + rate_limit.window),
                "retry_after": 0,
                "strategy": "token_bucket",
            }

        except Exception as e:
            logger.error(f"Token bucket rate limit check failed: {e}")
            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": rate_limit.requests,
                "reset_time": int(current_time + rate_limit.window),
                "retry_after": 0,
                "strategy": "token_bucket",
                "error": str(e),
            }

    async def _leaky_bucket_check(
        self, identifier: str, rate_limit: RateLimit, cost: int
    ) -> Tuple[bool, Dict[str, Any]]:
        """Leaky bucket rate limiting implementation."""
        current_time = time.time()
        key = f"rate_limit:leaky:{identifier}"

        try:
            # Get current bucket state
            bucket_data = await cache_service.get(key, db=self.redis_db)

            if bucket_data:
                level = bucket_data.get("level", 0)
                last_leak = bucket_data.get("last_leak", current_time)
            else:
                level = 0
                last_leak = current_time

            # Calculate leakage
            time_passed = current_time - last_leak
            leak_rate = rate_limit.requests / rate_limit.window  # requests per second
            leaked = time_passed * leak_rate

            # Update bucket level
            level = max(0, level - leaked)

            # Check if request fits in bucket
            if level + cost > rate_limit.requests:
                # Bucket overflow
                await cache_service.set(
                    key,
                    {"level": level, "last_leak": current_time},
                    ttl=rate_limit.window * 2,
                    db=self.redis_db,
                )

                # Calculate wait time for bucket to have space
                excess = (level + cost) - rate_limit.requests
                wait_time = int(excess / leak_rate) + 1

                return False, {
                    "allowed": False,
                    "limit": rate_limit.requests,
                    "remaining": int(rate_limit.requests - level),
                    "reset_time": int(current_time + wait_time),
                    "retry_after": wait_time,
                    "strategy": "leaky_bucket",
                }

            # Add request to bucket
            level += cost

            await cache_service.set(
                key,
                {"level": level, "last_leak": current_time},
                ttl=rate_limit.window * 2,
                db=self.redis_db,
            )

            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": int(rate_limit.requests - level),
                "reset_time": int(current_time + rate_limit.window),
                "retry_after": 0,
                "strategy": "leaky_bucket",
            }

        except Exception as e:
            logger.error(f"Leaky bucket rate limit check failed: {e}")
            return True, {
                "allowed": True,
                "limit": rate_limit.requests,
                "remaining": rate_limit.requests,
                "reset_time": int(current_time + rate_limit.window),
                "retry_after": 0,
                "strategy": "leaky_bucket",
                "error": str(e),
            }

    async def reset_limit(self, identifier: str, strategy: RateLimitStrategy):
        """Reset rate limit for identifier."""
        patterns = [
            f"rate_limit:sliding:{identifier}",
            f"rate_limit:fixed:{identifier}:*",
            f"rate_limit:bucket:{identifier}",
            f"rate_limit:leaky:{identifier}",
        ]

        for pattern in patterns:
            await cache_service.clear_pattern(pattern, db=self.redis_db)

    async def get_current_usage(
        self, identifier: str, rate_limit: RateLimit
    ) -> Dict[str, Any]:
        """Get current rate limit usage for identifier."""
        if rate_limit.strategy == RateLimitStrategy.SLIDING_WINDOW:
            key = f"rate_limit:sliding:{identifier}"
            current_time = time.time()
            window_start = current_time - rate_limit.window

            try:
                # Remove old entries and count current
                await cache_service.clients[self.redis_db].zremrangebyscore(
                    key, 0, window_start
                )
                current_count = await cache_service.clients[self.redis_db].zcard(key)

                return {
                    "current_usage": current_count,
                    "limit": rate_limit.requests,
                    "remaining": max(0, rate_limit.requests - current_count),
                    "window_start": window_start,
                    "window_end": current_time,
                }
            except Exception as e:
                logger.error(f"Failed to get current usage: {e}")
                return {
                    "current_usage": 0,
                    "limit": rate_limit.requests,
                    "remaining": rate_limit.requests,
                    "error": str(e),
                }

        # For other strategies, return basic info
        return {
            "current_usage": 0,
            "limit": rate_limit.requests,
            "remaining": rate_limit.requests,
        }


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for automatic rate limiting.
    Applies different rate limits based on endpoint patterns and user context.
    """

    def __init__(self, app, rate_limits: Optional[Dict[str, RateLimit]] = None):
        super().__init__(app)
        self.rate_limiter = RateLimiter()
        self.rate_limits = rate_limits or self._default_rate_limits()

    def _default_rate_limits(self) -> Dict[str, RateLimit]:
        """Default rate limit configurations."""
        return {
            # Authentication endpoints - strict limits
            "auth": RateLimit(
                requests=5,
                window=300,  # 5 requests per 5 minutes
                strategy=RateLimitStrategy.SLIDING_WINDOW,
            ),
            # API endpoints - moderate limits
            "api": RateLimit(
                requests=100,
                window=60,  # 100 requests per minute
                strategy=RateLimitStrategy.SLIDING_WINDOW,
            ),
            # Search endpoints - higher limits with burst
            "search": RateLimit(
                requests=50,
                window=60,  # 50 requests per minute
                strategy=RateLimitStrategy.TOKEN_BUCKET,
                burst_requests=20,
                burst_window=10,
            ),
            # WebSocket connections - connection limits
            "websocket": RateLimit(
                requests=10,
                window=60,  # 10 connections per minute
                strategy=RateLimitStrategy.LEAKY_BUCKET,
            ),
            # File uploads - stricter limits
            "upload": RateLimit(
                requests=10,
                window=300,  # 10 uploads per 5 minutes
                strategy=RateLimitStrategy.FIXED_WINDOW,
            ),
            # Admin endpoints - very strict
            "admin": RateLimit(
                requests=20,
                window=300,  # 20 requests per 5 minutes
                strategy=RateLimitStrategy.SLIDING_WINDOW,
            ),
            # Public endpoints - generous but with protection
            "public": RateLimit(
                requests=200,
                window=60,  # 200 requests per minute
                strategy=RateLimitStrategy.SLIDING_WINDOW,
            ),
        }

    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch with rate limiting."""
        # Skip rate limiting for health checks and static files
        if self._should_skip_rate_limiting(request):
            return await call_next(request)

        # Determine rate limit category
        category = self._get_rate_limit_category(request)
        if not category:
            return await call_next(request)

        rate_limit = self.rate_limits.get(category)
        if not rate_limit:
            return await call_next(request)

        # Generate identifier for rate limiting
        identifier = await self._get_rate_limit_identifier(request)

        # Check rate limit
        allowed, metadata = await self.rate_limiter.is_allowed(
            identifier, rate_limit, cost=self._get_request_cost(request)
        )

        if not allowed:
            # Rate limit exceeded
            response = JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {metadata['limit']} per {rate_limit.window} seconds",
                    "retry_after": metadata["retry_after"],
                    "limit": metadata["limit"],
                    "remaining": metadata["remaining"],
                    "reset_time": metadata["reset_time"],
                },
            )

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(metadata["limit"])
            response.headers["X-RateLimit-Remaining"] = str(metadata["remaining"])
            response.headers["X-RateLimit-Reset"] = str(metadata["reset_time"])
            response.headers["Retry-After"] = str(metadata["retry_after"])

            return response

        # Request allowed - proceed and add rate limit headers
        response = await call_next(request)

        # Add rate limit info headers
        response.headers["X-RateLimit-Limit"] = str(metadata["limit"])
        response.headers["X-RateLimit-Remaining"] = str(metadata["remaining"])
        response.headers["X-RateLimit-Reset"] = str(metadata["reset_time"])

        return response

    def _should_skip_rate_limiting(self, request: Request) -> bool:
        """Check if request should skip rate limiting."""
        skip_paths = [
            "/health",
            "/metrics",
            "/favicon.ico",
            "/static/",
            "/.well-known/",
        ]

        path = request.url.path
        return any(path.startswith(skip_path) for skip_path in skip_paths)

    def _get_rate_limit_category(self, request: Request) -> Optional[str]:
        """Determine rate limit category for request."""
        path = request.url.path

        # Authentication endpoints
        if path.startswith("/api/v1/auth/"):
            return "auth"

        # Admin endpoints
        if path.startswith("/api/v1/admin/") or path.startswith(
            "/api/v1/platform-admin/"
        ):
            return "admin"

        # Upload endpoints
        if "upload" in path or request.method == "POST" and "documents" in path:
            return "upload"

        # Search endpoints
        if "search" in path:
            return "search"

        # WebSocket endpoints
        if path.startswith("/ws/"):
            return "websocket"

        # API endpoints
        if path.startswith("/api/v1/"):
            return "api"

        # Public endpoints
        if (
            path.startswith("/api/")
            or path.startswith("/docs")
            or path.startswith("/openapi")
        ):
            return "public"

        return None

    async def _get_rate_limit_identifier(self, request: Request) -> str:
        """Generate rate limit identifier for request."""
        # Try to get user ID from request (set by auth middleware)
        if hasattr(request.state, "current_user") and request.state.current_user:
            user_id = getattr(request.state.current_user, "id", None)
            if user_id:
                return f"user:{user_id}"

        # Try to get API key from headers
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"api_key:{api_key[:8]}..."  # Only first 8 chars for privacy

        # Fall back to IP address
        # Try to get real IP from reverse proxy headers
        real_ip = (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.headers.get("X-Real-IP")
            or request.client.host
            if request.client
            else "unknown"
        )

        return f"ip:{real_ip}"

    def _get_request_cost(self, request: Request) -> int:
        """Calculate cost of request for rate limiting."""
        # Different endpoints have different costs
        path = request.url.path

        # Expensive operations cost more
        if "search" in path or "analytics" in path:
            return 2
        elif request.method in ["POST", "PUT", "DELETE"]:
            return 2
        elif "upload" in path:
            return 5
        else:
            return 1


# Utility functions for manual rate limiting
async def check_rate_limit(
    identifier: str, rate_limit: RateLimit, cost: int = 1
) -> Tuple[bool, Dict[str, Any]]:
    """Helper function to check rate limit manually."""
    limiter = RateLimiter()
    return await limiter.is_allowed(identifier, rate_limit, cost)


def rate_limit_decorator(
    requests: int,
    window: int,
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW,
    identifier_func: Optional[callable] = None,
):
    """
    Decorator for applying rate limits to specific endpoints.

    Args:
        requests: Number of requests allowed
        window: Time window in seconds
        strategy: Rate limiting strategy
        identifier_func: Custom function to generate identifier
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            # This would be implemented for specific use cases
            # For now, rely on middleware for automatic rate limiting
            return await func(*args, **kwargs)

        return wrapper

    return decorator


# Export main components
__all__ = [
    "RateLimit",
    "RateLimitStrategy",
    "RateLimiter",
    "RateLimitMiddleware",
    "check_rate_limit",
    "rate_limit_decorator",
]
