"""
Alert service for monitoring and notifications.
Sends alerts via multiple channels when issues are detected.
"""
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import logging
import aiohttp
from pydantic import BaseModel, Field

from core.config import settings
from core.sentry import capture_message
from services.cache_service import cache_service

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    """Alert severity levels."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Types of alerts."""

    SYSTEM_HEALTH = "system_health"
    DATABASE_PERFORMANCE = "database_performance"
    CACHE_PERFORMANCE = "cache_performance"
    API_ERROR_RATE = "api_error_rate"
    WEBSOCKET_CONNECTIONS = "websocket_connections"
    MEMORY_USAGE = "memory_usage"
    CUSTOM = "custom"


class Alert(BaseModel):
    """Alert model."""

    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    context: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False
    resolution_timestamp: Optional[datetime] = None


class AlertRule(BaseModel):
    """Alert rule configuration."""

    name: str
    type: AlertType
    condition: str  # e.g., "error_rate > 5%", "memory > 80%"
    threshold: float
    severity: AlertSeverity
    cooldown_minutes: int = 15  # Don't re-alert for this many minutes
    enabled: bool = True


class AlertService:
    """Service for managing alerts and notifications."""

    def __init__(self):
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.rules: List[AlertRule] = self._default_rules()
        self._notification_queue: asyncio.Queue = asyncio.Queue()
        self._running = False

    def _default_rules(self) -> List[AlertRule]:
        """Get default alert rules."""
        return [
            AlertRule(
                name="High Error Rate",
                type=AlertType.API_ERROR_RATE,
                condition="error_rate > 5%",
                threshold=5.0,
                severity=AlertSeverity.WARNING,
                cooldown_minutes=15,
            ),
            AlertRule(
                name="Critical Error Rate",
                type=AlertType.API_ERROR_RATE,
                condition="error_rate > 10%",
                threshold=10.0,
                severity=AlertSeverity.CRITICAL,
                cooldown_minutes=5,
            ),
            AlertRule(
                name="Database Slow Queries",
                type=AlertType.DATABASE_PERFORMANCE,
                condition="avg_query_time > 1000ms",
                threshold=1000,
                severity=AlertSeverity.WARNING,
                cooldown_minutes=30,
            ),
            AlertRule(
                name="Cache Hit Rate Low",
                type=AlertType.CACHE_PERFORMANCE,
                condition="hit_rate < 50%",
                threshold=50.0,
                severity=AlertSeverity.WARNING,
                cooldown_minutes=30,
            ),
            AlertRule(
                name="High Memory Usage",
                type=AlertType.MEMORY_USAGE,
                condition="memory_percent > 80%",
                threshold=80.0,
                severity=AlertSeverity.WARNING,
                cooldown_minutes=20,
            ),
            AlertRule(
                name="Critical Memory Usage",
                type=AlertType.MEMORY_USAGE,
                condition="memory_percent > 95%",
                threshold=95.0,
                severity=AlertSeverity.CRITICAL,
                cooldown_minutes=5,
            ),
        ]

    async def start(self):
        """Start the alert service."""
        self._running = True
        asyncio.create_task(self._process_notifications())
        logger.info("Alert service started")

    async def stop(self):
        """Stop the alert service."""
        self._running = False
        logger.info("Alert service stopped")

    async def create_alert(
        self,
        type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Alert:
        """
        Create and send an alert.

        Args:
            type: Type of alert
            severity: Severity level
            title: Alert title
            message: Detailed message
            context: Additional context data

        Returns:
            Created alert
        """
        alert = Alert(
            type=type,
            severity=severity,
            title=title,
            message=message,
            context=context or {},
        )

        # Check if similar alert already active
        alert_key = f"{type}:{title}"
        if alert_key in self.active_alerts:
            existing = self.active_alerts[alert_key]
            # Update existing alert if more severe
            if severity.value > existing.severity.value:
                alert.context["escalated"] = True
                self.active_alerts[alert_key] = alert
            else:
                return existing
        else:
            self.active_alerts[alert_key] = alert

        # Add to history
        self.alert_history.append(alert)

        # Queue for notification
        await self._notification_queue.put(alert)

        # Log to Sentry
        capture_message(
            f"Alert: {title}",
            level=severity.value,
            extra={"alert_type": type.value, "message": message, "context": context},
        )

        # Cache alert for dashboard
        await self._cache_alert(alert)

        return alert

    async def resolve_alert(self, alert_key: str) -> bool:
        """
        Resolve an active alert.

        Args:
            alert_key: Key of alert to resolve

        Returns:
            True if resolved, False if not found
        """
        if alert_key in self.active_alerts:
            alert = self.active_alerts[alert_key]
            alert.resolved = True
            alert.resolution_timestamp = datetime.utcnow()

            # Move to history
            del self.active_alerts[alert_key]

            # Notify resolution
            await self.create_alert(
                type=AlertType.SYSTEM_HEALTH,
                severity=AlertSeverity.INFO,
                title=f"Alert Resolved: {alert.title}",
                message=f"The alert '{alert.title}' has been resolved.",
                context={"original_alert": alert.dict()},
            )

            return True
        return False

    async def check_metrics(self, metrics: Dict[str, Any]):
        """
        Check metrics against alert rules.

        Args:
            metrics: Current system metrics
        """
        for rule in self.rules:
            if not rule.enabled:
                continue

            # Check if rule should trigger
            should_alert = await self._evaluate_rule(rule, metrics)

            if should_alert:
                # Check cooldown
                cooldown_key = f"cooldown:{rule.name}"
                if await cache_service.get(cooldown_key):
                    continue

                # Create alert
                await self.create_alert(
                    type=rule.type,
                    severity=rule.severity,
                    title=f"{rule.name} Alert",
                    message=f"Condition '{rule.condition}' has been met",
                    context={"rule": rule.dict(), "metrics": metrics},
                )

                # Set cooldown
                await cache_service.set(
                    cooldown_key, True, ttl=rule.cooldown_minutes * 60
                )

    async def _evaluate_rule(self, rule: AlertRule, metrics: Dict[str, Any]) -> bool:
        """
        Evaluate if a rule should trigger.

        Args:
            rule: Alert rule to evaluate
            metrics: Current metrics

        Returns:
            True if rule should trigger
        """
        try:
            if rule.type == AlertType.API_ERROR_RATE:
                error_rate = metrics.get("api", {}).get("error_rate", 0)
                return error_rate > rule.threshold

            elif rule.type == AlertType.DATABASE_PERFORMANCE:
                avg_query_time = metrics.get("database", {}).get("avg_query_time_ms", 0)
                return avg_query_time > rule.threshold

            elif rule.type == AlertType.CACHE_PERFORMANCE:
                hit_rate = metrics.get("cache", {}).get("hit_rate", 100)
                return hit_rate < rule.threshold

            elif rule.type == AlertType.MEMORY_USAGE:
                memory_percent = metrics.get("system", {}).get("memory_percent", 0)
                return memory_percent > rule.threshold

            elif rule.type == AlertType.WEBSOCKET_CONNECTIONS:
                connections = metrics.get("websocket", {}).get("active_connections", 0)
                return connections > rule.threshold

        except Exception as e:
            logger.error(f"Error evaluating rule {rule.name}: {e}")

        return False

    async def _cache_alert(self, alert: Alert):
        """Cache alert for dashboard display."""
        # Cache individual alert
        await cache_service.set(
            f"alert:{alert.type}:{alert.timestamp.timestamp()}",
            alert.dict(),
            ttl=86400,  # 24 hours
        )

        # Update active alerts cache
        active_alerts = [a.dict() for a in self.active_alerts.values()]
        await cache_service.set("alerts:active", active_alerts, ttl=300)  # 5 minutes

    async def _process_notifications(self):
        """Process notification queue."""
        while self._running:
            try:
                # Wait for alert with timeout
                alert = await asyncio.wait_for(
                    self._notification_queue.get(), timeout=5.0
                )

                # Send notifications based on severity
                if alert.severity in [AlertSeverity.ERROR, AlertSeverity.CRITICAL]:
                    await self._send_urgent_notification(alert)
                else:
                    await self._send_standard_notification(alert)

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing notification: {e}")

    async def _send_urgent_notification(self, alert: Alert):
        """Send urgent notification (email, SMS, etc.)."""
        # In production, integrate with notification services
        logger.critical(
            f"URGENT ALERT: {alert.title}\n"
            f"Message: {alert.message}\n"
            f"Type: {alert.type}\n"
            f"Context: {alert.context}"
        )

        # Could integrate with:
        # - SendGrid for email
        # - Twilio for SMS
        # - Slack webhooks
        # - PagerDuty

    async def _send_standard_notification(self, alert: Alert):
        """Send standard notification."""
        logger.warning(
            f"Alert: {alert.title}\n"
            f"Message: {alert.message}\n"
            f"Type: {alert.type}"
        )

    async def get_active_alerts(self) -> List[Alert]:
        """Get all active alerts."""
        return list(self.active_alerts.values())

    async def get_alert_history(
        self,
        hours: int = 24,
        severity: Optional[AlertSeverity] = None,
        type: Optional[AlertType] = None,
    ) -> List[Alert]:
        """
        Get alert history.

        Args:
            hours: Hours of history to retrieve
            severity: Filter by severity
            type: Filter by type

        Returns:
            List of historical alerts
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours)

        filtered = [alert for alert in self.alert_history if alert.timestamp > cutoff]

        if severity:
            filtered = [a for a in filtered if a.severity == severity]

        if type:
            filtered = [a for a in filtered if a.type == type]

        return filtered


# Global alert service instance
alert_service = AlertService()
