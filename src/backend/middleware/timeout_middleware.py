"""
Request Timeout Middleware
Enforces server-side timeouts for all API requests
"""

import asyncio
import time
import logging
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class TimeoutConfig:
    """Centralized timeout configuration matching frontend"""

    # Default timeout (30 seconds)
    DEFAULT = 30.0

    # Fast endpoints (health checks, auth)
    FAST = {
        "/health": 5.0,
        "/api/v1/health": 5.0,
        "/api/v1/auth/me": 10.0,
        "/api/v1/auth/login": 10.0,
        "/api/v1/auth/refresh": 10.0,
        "/api/v1/users/me": 10.0,
    }

    # Standard endpoints (most operations)
    STANDARD = {
        "/api/v1/campaigns": 20.0,
        "/api/v1/events": 20.0,
        "/api/v1/volunteers": 20.0,
        "/api/v1/analytics": 25.0,
        "/api/v1/dashboard": 25.0,
    }

    # Slow endpoints (reports, heavy operations)
    SLOW = {
        "/api/v1/reports": 60.0,
        "/api/v1/export": 60.0,
        "/api/v1/import": 120.0,
        "/api/v1/upload": 120.0,
        "/api/v1/documents/analyze": 90.0,
    }

    # External API proxies
    EXTERNAL = {
        "/api/v1/meta": 45.0,
        "/api/v1/google": 45.0,
        "/api/v1/monitoring": 30.0,
    }

    @classmethod
    def get_timeout(cls, path: str) -> float:
        """Get timeout for a specific path"""
        # Check exact matches first
        for config in [cls.FAST, cls.STANDARD, cls.SLOW, cls.EXTERNAL]:
            if path in config:
                return config[path]

        # Check path prefixes
        for prefix, timeout in cls.EXTERNAL.items():
            if path.startswith(prefix):
                return timeout

        for prefix, timeout in cls.SLOW.items():
            if path.startswith(prefix):
                return timeout

        for prefix, timeout in cls.STANDARD.items():
            if path.startswith(prefix):
                return timeout

        for prefix, timeout in cls.FAST.items():
            if path.startswith(prefix):
                return timeout

        # Default timeout
        return cls.DEFAULT


class TimeoutMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce request timeouts
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.timeout_stats = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with timeout"""
        # Skip timeout for WebSocket connections
        if request.url.path.startswith("/ws/"):
            return await call_next(request)

        # Get timeout for this endpoint
        timeout = TimeoutConfig.get_timeout(request.url.path)

        # Track request start time
        start_time = time.time()

        try:
            # Execute request with timeout
            response = await asyncio.wait_for(call_next(request), timeout=timeout)

            # Track successful request time
            duration = time.time() - start_time
            self._track_request(request.url.path, duration, "success")

            # Warn if request took more than 80% of timeout
            if duration > timeout * 0.8:
                logger.warning(
                    f"Request to {request.url.path} took {duration:.2f}s "
                    f"(timeout: {timeout}s)"
                )

            # Add response headers
            response.headers["X-Request-Duration"] = f"{duration:.3f}"
            response.headers["X-Timeout-Limit"] = str(timeout)

            return response

        except asyncio.TimeoutError:
            # Track timeout
            duration = time.time() - start_time
            self._track_request(request.url.path, duration, "timeout")

            logger.error(
                f"Request timeout: {request.method} {request.url.path} "
                f"exceeded {timeout}s limit"
            )

            # Return timeout error response
            return JSONResponse(
                status_code=504,
                content={
                    "detail": "Request timeout",
                    "path": request.url.path,
                    "timeout": timeout,
                    "duration": duration,
                },
                headers={
                    "X-Request-Duration": f"{duration:.3f}",
                    "X-Timeout-Limit": str(timeout),
                    "X-Timeout-Error": "true",
                },
            )

        except Exception as e:
            # Track error
            duration = time.time() - start_time
            self._track_request(request.url.path, duration, "error")

            logger.error(
                f"Request error: {request.method} {request.url.path} - {str(e)}"
            )

            # Re-raise the exception to be handled by error middleware
            raise

    def _track_request(self, path: str, duration: float, status: str):
        """Track request statistics"""
        if path not in self.timeout_stats:
            self.timeout_stats[path] = {
                "count": 0,
                "timeouts": 0,
                "errors": 0,
                "total_duration": 0,
                "max_duration": 0,
                "min_duration": float("inf"),
            }

        stats = self.timeout_stats[path]
        stats["count"] += 1
        stats["total_duration"] += duration
        stats["max_duration"] = max(stats["max_duration"], duration)
        stats["min_duration"] = min(stats["min_duration"], duration)

        if status == "timeout":
            stats["timeouts"] += 1
        elif status == "error":
            stats["errors"] += 1

    def get_stats(self, path: Optional[str] = None) -> dict:
        """Get timeout statistics"""
        if path:
            stats = self.timeout_stats.get(path, {})
            if stats and stats["count"] > 0:
                stats["avg_duration"] = stats["total_duration"] / stats["count"]
                stats["timeout_rate"] = stats["timeouts"] / stats["count"]
                stats["error_rate"] = stats["errors"] / stats["count"]
            return stats

        # Return all stats
        all_stats = {}
        for path, stats in self.timeout_stats.items():
            if stats["count"] > 0:
                all_stats[path] = {
                    **stats,
                    "avg_duration": stats["total_duration"] / stats["count"],
                    "timeout_rate": stats["timeouts"] / stats["count"],
                    "error_rate": stats["errors"] / stats["count"],
                }

        return all_stats

    def get_slow_endpoints(self, threshold: float = 10.0) -> list:
        """Get endpoints with average duration above threshold"""
        slow_endpoints = []

        for path, stats in self.timeout_stats.items():
            if stats["count"] > 0:
                avg_duration = stats["total_duration"] / stats["count"]
                if avg_duration > threshold:
                    slow_endpoints.append(
                        {
                            "path": path,
                            "avg_duration": avg_duration,
                            "max_duration": stats["max_duration"],
                            "timeout_rate": stats["timeouts"] / stats["count"],
                            "count": stats["count"],
                        }
                    )

        # Sort by average duration descending
        slow_endpoints.sort(key=lambda x: x["avg_duration"], reverse=True)

        return slow_endpoints


# Global instance for accessing stats
timeout_middleware = None


def setup_timeout_middleware(app):
    """Setup timeout middleware on app"""
    global timeout_middleware
    timeout_middleware = TimeoutMiddleware(app)
    app.add_middleware(TimeoutMiddleware)
    return timeout_middleware
