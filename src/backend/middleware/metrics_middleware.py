"""
Middleware for collecting API request metrics.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
from typing import Callable

from services.metrics_collector import metrics_collector


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track API request metrics.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics endpoints to avoid recursion
        if request.url.path.startswith(
            "/api/v1/monitoring"
        ) or request.url.path.startswith("/api/v1/alerts"):
            return await call_next(request)

        # Start timing
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Record metric
        metrics_collector.record_api_request(
            status_code=response.status_code, duration_ms=duration_ms
        )

        # Add timing header
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        return response
