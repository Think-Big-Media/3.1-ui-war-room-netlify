"""
Global error handler middleware for FastAPI.
Catches unhandled exceptions and reports them to Sentry.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import traceback
from typing import Callable

from core.sentry import capture_exception
from core.config import settings
from core.error_handler import SecureErrorHandler

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle unhandled exceptions and report them to Sentry.
    """

    async def dispatch(self, request: Request, call_next: Callable):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # Log the full traceback
            logger.error(
                f"Unhandled exception: {str(e)}\n"
                f"Path: {request.url.path}\n"
                f"Method: {request.method}\n"
                f"Traceback: {traceback.format_exc()}"
            )

            # Capture to Sentry with additional context
            capture_exception(
                e,
                extra={
                    "request_path": request.url.path,
                    "request_method": request.method,
                    "query_params": dict(request.query_params),
                    "client_host": request.client.host if request.client else None,
                },
            )

            # Return a secure error response
            return SecureErrorHandler.create_error_response(
                request=request,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e) if settings.DEBUG else None,
            )


async def validation_exception_handler(request: Request, exc: Exception):
    """
    Custom handler for validation exceptions.
    """
    logger.warning(
        f"Validation error: {str(exc)}\n"
        f"Path: {request.url.path}\n"
        f"Method: {request.method}"
    )

    # Also send validation errors to Sentry as warnings
    capture_exception(
        exc,
        level="warning",
        extra={
            "request_path": request.url.path,
            "request_method": request.method,
            "validation_errors": str(exc),
        },
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc), "type": "validation_error", "status_code": 422},
    )
