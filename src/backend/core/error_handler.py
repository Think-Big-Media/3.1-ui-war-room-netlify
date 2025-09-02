"""
Secure Error Handler
Sanitizes error messages to prevent information leakage
"""

import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class SecureErrorHandler:
    """
    Handles errors securely by sanitizing messages and logging details server-side.
    """

    # Safe error messages that don't reveal implementation details
    SAFE_ERROR_MESSAGES = {
        400: "Invalid request. Please check your input and try again.",
        401: "Authentication required. Please log in.",
        403: "Access denied. You don't have permission to perform this action.",
        404: "The requested resource was not found.",
        405: "Method not allowed for this endpoint.",
        409: "Request conflict. The resource may already exist.",
        410: "The requested resource is no longer available.",
        413: "Request too large. Please reduce the size and try again.",
        415: "Unsupported media type.",
        422: "Invalid input data. Please check your request.",
        429: "Too many requests. Please try again later.",
        500: "An unexpected error occurred. Please try again later.",
        502: "Service temporarily unavailable. Please try again later.",
        503: "Service under maintenance. Please try again later.",
        504: "Request timeout. Please try again.",
    }

    @classmethod
    def get_safe_error_message(cls, status_code: int) -> str:
        """Get a safe error message for the given status code."""
        return cls.SAFE_ERROR_MESSAGES.get(
            status_code, "An error occurred. Please try again later."
        )

    @classmethod
    def sanitize_error_detail(cls, error: Any) -> str:
        """
        Sanitize error details to prevent information leakage.

        Args:
            error: The error object or message

        Returns:
            Safe error detail string
        """
        error_str = str(error)

        # List of sensitive patterns to remove
        sensitive_patterns = [
            # File paths
            r"(/[^\s]+)+\.(py|js|ts|jsx|tsx)",
            r"[A-Z]:\\[^\s]+",
            r"\\\\[^\s]+",
            # Stack traces
            r'File "[^"]+", line \d+',
            r"at \S+:\d+:\d+",
            r"Traceback \(most recent call last\)",
            # Database errors
            r"(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\s+[^\s]+",
            r'column "[^"]+"',
            r'table "[^"]+"',
            r'relation "[^"]+"',
            # System information
            r"(PostgreSQL|MySQL|MongoDB|Redis)\s+\d+\.\d+",
            r"Python/\d+\.\d+",
            r"node/\d+\.\d+",
            # IP addresses
            r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b",
            # Credentials
            r"(password|token|key|secret|api_key)[\s=:]+[^\s]+",
            # Internal function/class names
            r"[a-zA-Z_][a-zA-Z0-9_]*\(\)",
            r"class\s+[a-zA-Z_][a-zA-Z0-9_]*",
        ]

        # Apply sanitization
        import re

        sanitized = error_str
        for pattern in sensitive_patterns:
            sanitized = re.sub(pattern, "[REDACTED]", sanitized, flags=re.IGNORECASE)

        # Additional safety: truncate very long errors
        if len(sanitized) > 200:
            sanitized = sanitized[:200] + "..."

        return sanitized

    @classmethod
    def create_error_response(
        cls,
        request: Request,
        status_code: int,
        detail: Optional[str] = None,
        error_id: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> JSONResponse:
        """
        Create a secure error response.

        Args:
            request: The request object
            status_code: HTTP status code
            detail: Error detail (will be sanitized)
            error_id: Unique error ID for tracking
            headers: Additional response headers

        Returns:
            JSONResponse with sanitized error
        """
        # Generate error ID if not provided
        if not error_id:
            import uuid

            error_id = str(uuid.uuid4())

        # Get safe error message
        safe_message = cls.get_safe_error_message(status_code)

        # Sanitize detail if provided
        safe_detail = None
        if detail and status_code < 500:  # Only include detail for client errors
            safe_detail = cls.sanitize_error_detail(detail)

        # Log the full error server-side
        logger.error(
            f"Error {error_id}: {status_code} - {detail}",
            extra={
                "error_id": error_id,
                "status_code": status_code,
                "path": request.url.path,
                "method": request.method,
                "client": request.client.host if request.client else "unknown",
                "detail": detail,
            },
        )

        # Build response
        response_data = {
            "error": {
                "message": safe_message,
                "status_code": status_code,
                "error_id": error_id,
            }
        }

        # Add sanitized detail for client errors
        if safe_detail and status_code < 500:
            response_data["error"]["detail"] = safe_detail

        # Add timestamp
        from datetime import datetime

        response_data["error"]["timestamp"] = datetime.utcnow().isoformat()

        return JSONResponse(
            status_code=status_code, content=response_data, headers=headers
        )


async def secure_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global exception handler that sanitizes all errors.

    Args:
        request: The request that caused the exception
        exc: The exception that was raised

    Returns:
        Sanitized error response
    """
    # Handle Starlette HTTP exceptions
    if isinstance(exc, StarletteHTTPException):
        return SecureErrorHandler.create_error_response(
            request=request,
            status_code=exc.status_code,
            detail=exc.detail,
            headers=getattr(exc, "headers", None),
        )

    # Handle all other exceptions as 500 errors
    # Log full traceback server-side
    logger.exception(
        "Unhandled exception",
        extra={
            "path": request.url.path,
            "method": request.method,
            "exception": str(exc),
            "traceback": traceback.format_exc(),
        },
    )

    return SecureErrorHandler.create_error_response(
        request=request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=str(exc),  # Will be hidden for 500 errors
    )


def sanitize_validation_error(error: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize Pydantic validation errors to remove sensitive information.

    Args:
        error: Pydantic error dictionary

    Returns:
        Sanitized error dictionary
    """
    safe_error = {
        "type": error.get("type", "validation_error"),
        "loc": error.get("loc", []),
        "msg": error.get("msg", "Invalid value"),
    }

    # Sanitize location to only show field names, not values
    if safe_error["loc"]:
        safe_error["loc"] = [str(loc) for loc in safe_error["loc"][:3]]  # Limit depth

    # Sanitize message to remove any potential sensitive data
    if "actual value" in safe_error["msg"].lower():
        safe_error["msg"] = "Invalid value provided"

    return safe_error
