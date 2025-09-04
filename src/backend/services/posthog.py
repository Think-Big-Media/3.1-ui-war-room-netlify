"""
PostHog integration for product analytics and feature flags.
Handles event tracking, user identification, and feature flag evaluation.
"""
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager

import posthog
from posthog import Posthog
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.platform_admin import PlatformAnalyticsEvent
import logging

logger = logging.getLogger(__name__)


class PostHogService:
    """PostHog analytics and feature flag service."""

    def __init__(self):
        self.client: Optional[Posthog] = None
        self.enabled = settings.POSTHOG_ENABLED
        self.api_key = settings.POSTHOG_API_KEY
        self.host = settings.POSTHOG_HOST
        self._event_queue: List[Dict[str, Any]] = []
        self._queue_lock = asyncio.Lock()
        self._flush_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Initialize PostHog client."""
        if not self.enabled or not self.api_key:
            logger.info("PostHog is disabled or API key not provided")
            return

        try:
            # Initialize PostHog client
            posthog.project_api_key = self.api_key
            posthog.host = self.host

            # Enable debug mode in development
            if settings.DEBUG:
                posthog.debug = True

            # Set up async flushing
            self._flush_task = asyncio.create_task(self._periodic_flush())

            logger.info(f"PostHog initialized with host: {self.host}")

        except Exception as e:
            logger.error(f"Failed to initialize PostHog: {e}")
            self.enabled = False

    async def shutdown(self):
        """Shutdown PostHog and flush remaining events."""
        if self._flush_task:
            self._flush_task.cancel()

        await self.flush()

        if self.enabled:
            posthog.shutdown()

    async def identify(
        self,
        user_id: str,
        properties: Optional[Dict[str, Any]] = None,
        org_id: Optional[str] = None,
    ):
        """Identify a user for analytics."""
        if not self.enabled:
            return

        try:
            props = properties or {}
            if org_id:
                props["org_id"] = org_id

            # Add timestamp
            props["identified_at"] = datetime.utcnow().isoformat()

            # Queue for async processing
            await self._queue_event(
                {"type": "identify", "distinct_id": user_id, "properties": props}
            )

        except Exception as e:
            logger.error(f"PostHog identify error: {e}")

    async def track(
        self,
        user_id: Optional[str],
        event_name: str,
        properties: Optional[Dict[str, Any]] = None,
        org_id: Optional[str] = None,
        save_to_db: bool = True,
        db: Optional[AsyncSession] = None,
    ):
        """Track a user event."""
        if not self.enabled and not save_to_db:
            return

        try:
            # Build event properties
            event_props = properties or {}
            if org_id:
                event_props["org_id"] = org_id

            # Add context
            event_props["timestamp"] = datetime.utcnow().isoformat()
            event_props["platform"] = "war_room"

            # Queue for PostHog
            if self.enabled:
                await self._queue_event(
                    {
                        "type": "capture",
                        "distinct_id": user_id or "anonymous",
                        "event": event_name,
                        "properties": event_props,
                    }
                )

            # Save to database
            if save_to_db and db:
                await self._save_event_to_db(
                    db, user_id, event_name, event_props, org_id
                )

        except Exception as e:
            logger.error(f"PostHog track error: {e}")

    async def track_page_view(
        self,
        user_id: Optional[str],
        page_url: str,
        page_title: Optional[str] = None,
        referrer: Optional[str] = None,
        org_id: Optional[str] = None,
    ):
        """Track a page view event."""
        properties = {"$current_url": page_url, "$referrer": referrer}

        if page_title:
            properties["$title"] = page_title

        await self.track(user_id, "$pageview", properties, org_id)

    async def track_feature_usage(
        self,
        user_id: str,
        feature_name: str,
        action: str,
        metadata: Optional[Dict[str, Any]] = None,
        org_id: Optional[str] = None,
    ):
        """Track feature usage for product analytics."""
        properties = {
            "feature": feature_name,
            "action": action,
            "metadata": metadata or {},
        }

        await self.track(
            user_id, f"feature_{feature_name}_{action}", properties, org_id
        )

    async def track_api_call(
        self,
        user_id: Optional[str],
        endpoint: str,
        method: str,
        status_code: int,
        response_time_ms: float,
        org_id: Optional[str] = None,
    ):
        """Track API usage metrics."""
        properties = {
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "response_time_ms": response_time_ms,
            "success": 200 <= status_code < 300,
        }

        await self.track(
            user_id,
            "api_call",
            properties,
            org_id,
            save_to_db=True,  # Always save API metrics
        )

    async def is_feature_enabled(
        self,
        feature_flag: str,
        user_id: Optional[str] = None,
        properties: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Check if a feature flag is enabled."""
        if not self.enabled:
            # Default to True in development
            return settings.DEBUG

        try:
            return posthog.feature_enabled(
                feature_flag,
                user_id or "anonymous",
                default=False,
                person_properties=properties,
            )
        except Exception as e:
            logger.error(f"PostHog feature flag error: {e}")
            return False

    async def get_feature_flag_payload(
        self, feature_flag: str, user_id: Optional[str] = None
    ) -> Optional[Any]:
        """Get feature flag payload data."""
        if not self.enabled:
            return None

        try:
            return posthog.get_feature_flag_payload(
                feature_flag, user_id or "anonymous"
            )
        except Exception as e:
            logger.error(f"PostHog feature flag payload error: {e}")
            return None

    async def _queue_event(self, event: Dict[str, Any]):
        """Queue an event for batch processing."""
        async with self._queue_lock:
            self._event_queue.append(event)

            # Flush if queue is getting large
            if len(self._event_queue) >= 100:
                await self.flush()

    async def flush(self):
        """Flush all queued events to PostHog."""
        if not self.enabled or not self._event_queue:
            return

        async with self._queue_lock:
            events_to_send = self._event_queue[:]
            self._event_queue.clear()

        try:
            # Process events
            for event in events_to_send:
                event_type = event.pop("type")

                if event_type == "identify":
                    posthog.identify(**event)
                elif event_type == "capture":
                    posthog.capture(**event)

            # Flush to PostHog
            posthog.flush()

        except Exception as e:
            logger.error(f"PostHog flush error: {e}")
            # Re-queue failed events
            async with self._queue_lock:
                self._event_queue.extend(events_to_send)

    async def _periodic_flush(self):
        """Periodically flush events to PostHog."""
        while True:
            try:
                await asyncio.sleep(10)  # Flush every 10 seconds
                await self.flush()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Periodic flush error: {e}")

    async def _save_event_to_db(
        self,
        db: AsyncSession,
        user_id: Optional[str],
        event_name: str,
        properties: Dict[str, Any],
        org_id: Optional[str],
    ):
        """Save event to database for internal analytics."""
        try:
            # Determine event type
            event_type = "custom"
            if event_name.startswith("$"):
                event_type = "system"
            elif event_name.startswith("feature_"):
                event_type = "feature"
            elif event_name == "api_call":
                event_type = "api"

            event = PlatformAnalyticsEvent(
                event_type=event_type,
                event_name=event_name,
                user_id=user_id,
                org_id=org_id,
                properties=properties,
                timestamp=datetime.utcnow(),
            )

            db.add(event)
            await db.commit()

        except Exception as e:
            logger.error(f"Failed to save event to database: {e}")
            await db.rollback()

    # Convenience methods for common events

    async def track_signup(self, user_id: str, org_id: str, signup_method: str = "web"):
        """Track user signup event."""
        await self.track(
            user_id,
            "user_signed_up",
            {"signup_method": signup_method, "org_id": org_id},
        )

    async def track_login(
        self, user_id: str, org_id: str, login_method: str = "password"
    ):
        """Track user login event."""
        await self.track(
            user_id, "user_logged_in", {"login_method": login_method, "org_id": org_id}
        )

    async def track_error(
        self,
        error_type: str,
        error_message: str,
        user_id: Optional[str] = None,
        org_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Track error events."""
        properties = {
            "error_type": error_type,
            "error_message": error_message,
            "metadata": metadata or {},
        }

        await self.track(user_id, "error_occurred", properties, org_id)


# Global PostHog service instance
posthog_service = PostHogService()


# Middleware for automatic tracking
class PostHogMiddleware:
    """Middleware for automatic API tracking."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = datetime.utcnow()

            # Capture response status
            status_code = None

            async def send_wrapper(message):
                nonlocal status_code
                if message["type"] == "http.response.start":
                    status_code = message["status"]
                await send(message)

            try:
                await self.app(scope, receive, send_wrapper)
            finally:
                # Track API call
                if status_code:
                    response_time = (
                        datetime.utcnow() - start_time
                    ).total_seconds() * 1000

                    # Extract user info from request if available
                    user_id = scope.get("user_id")
                    org_id = scope.get("org_id")

                    await posthog_service.track_api_call(
                        user_id=user_id,
                        endpoint=scope["path"],
                        method=scope["method"],
                        status_code=status_code,
                        response_time_ms=response_time,
                        org_id=org_id,
                    )
        else:
            await self.app(scope, receive, send)
