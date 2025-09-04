"""
Sentry error tracking initialization and configuration.
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

from .config import settings


def init_sentry():
    """Initialize Sentry error tracking if DSN is configured."""
    if not settings.SENTRY_DSN:
        logging.info("Sentry DSN not configured, skipping initialization")
        return

    # Configure logging integration
    logging_integration = LoggingIntegration(
        level=logging.INFO,  # Capture info and above as breadcrumbs
        event_level=logging.ERROR,  # Send errors as events
    )

    # Initialize Sentry
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.SENTRY_ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        profiles_sample_rate=settings.SENTRY_PROFILES_SAMPLE_RATE,
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
                failed_request_status_codes={403, range(500, 599)},
            ),
            StarletteIntegration(
                transaction_style="endpoint",
            ),
            SqlalchemyIntegration(),
            RedisIntegration(),
            logging_integration,
        ],
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send personally identifiable information
        before_send=before_send_filter,
        release=f"{settings.APP_NAME}@{settings.APP_VERSION}",
        # Performance monitoring
        enable_tracing=True,
        # Session tracking
        auto_session_tracking=True,
        # Breadcrumbs
        max_breadcrumbs=100,
        # Request bodies
        request_bodies="medium",
        # Sampling
        sample_rate=1.0,  # Capture 100% of errors
    )

    logging.info(f"Sentry initialized for environment: {settings.SENTRY_ENVIRONMENT}")


def before_send_filter(event, hint):
    """
    Filter sensitive data before sending to Sentry.
    """
    # Filter out sensitive headers
    if "request" in event and "headers" in event["request"]:
        headers = event["request"]["headers"]
        sensitive_headers = [
            "authorization",
            "cookie",
            "x-api-key",
            "x-csrf-token",
        ]
        for header in sensitive_headers:
            if header in headers:
                headers[header] = "[Filtered]"

    # Filter out sensitive query parameters
    if "request" in event and "query_string" in event["request"]:
        query_string = event["request"]["query_string"]
        if "token=" in query_string or "api_key=" in query_string:
            event["request"]["query_string"] = "[Filtered]"

    # Filter out sensitive data in extra context
    if "extra" in event:
        for key in list(event["extra"].keys()):
            if any(
                sensitive in key.lower()
                for sensitive in ["password", "secret", "token", "key", "auth"]
            ):
                event["extra"][key] = "[Filtered]"

    # Don't send events in development unless explicitly enabled
    if settings.DEBUG and settings.SENTRY_ENVIRONMENT == "development":
        return None  # Drop the event

    return event


def capture_message(message: str, level: str = "info", **kwargs):
    """
    Capture a message to Sentry with additional context.
    """
    if settings.SENTRY_DSN:
        sentry_sdk.capture_message(message, level=level, **kwargs)


def capture_exception(exception: Exception, **kwargs):
    """
    Capture an exception to Sentry with additional context.
    """
    if settings.SENTRY_DSN:
        sentry_sdk.capture_exception(exception, **kwargs)
