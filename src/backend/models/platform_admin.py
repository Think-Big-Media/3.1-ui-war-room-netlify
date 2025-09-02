"""
Platform administration models for War Room.
Handles feature flags, audit logging, and usage metrics.
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID as UUIDType

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    DateTime,
    Date,
    ForeignKey,
    JSON,
    UniqueConstraint,
)
from models.uuid_type import UUID, UUIDArray, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.base import BaseModel as Base


class PlatformAnalyticsEvent(Base):
    """Platform-wide analytics events for tracking usage patterns."""

    __tablename__ = "platform_analytics_events"

    id = Column(
        UUID(), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_type = Column(
        String(100), nullable=False, index=True
    )  # system, feature, api, custom
    event_name = Column(String(255), nullable=False)
    user_id = Column(
        UUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    org_id = Column(
        UUID(),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    session_id = Column(String(255), nullable=True)
    element_id = Column(String(255), nullable=True)  # For UI element tracking
    page_url = Column(String(500), nullable=True)
    properties = Column(JSONB, nullable=True)  # Additional event properties
    posthog_event_id = Column(String(255), nullable=True)  # Reference to PostHog event
    timestamp = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="posthog_analytics_events")
    organization = relationship(
        "Organization", foreign_keys=[org_id], backref="posthog_analytics_events"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "event_type": self.event_type,
            "event_name": self.event_name,
            "user_id": str(self.user_id) if self.user_id else None,
            "org_id": str(self.org_id) if self.org_id else None,
            "session_id": self.session_id,
            "properties": self.properties or {},
            "timestamp": self.timestamp.isoformat(),
        }


class FeatureFlag(Base):
    """Feature flags for gradual rollout and A/B testing."""

    __tablename__ = "feature_flags"

    id = Column(
        UUID(), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    flag_name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(String, nullable=True)
    enabled = Column(Boolean, nullable=False, default=False)
    rollout_percentage = Column(Integer, nullable=False, default=0)  # 0-100
    enabled_for_orgs = Column(
        UUIDArray(), nullable=True
    )  # Specific orgs
    disabled_for_orgs = Column(UUIDArray(), nullable=True)  # Blacklist
    enabled_for_users = Column(
        UUIDArray(), nullable=True
    )  # Specific users
    rules = Column(JSONB, nullable=True)  # Complex rules (e.g., user properties)
    meta_data = Column(JSONB, nullable=True)  # Additional configuration
    created_by = Column(
        UUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])

    def is_enabled_for_org(self, org_id: UUIDType) -> bool:
        """Check if feature is enabled for specific organization."""
        # Check blacklist first
        if self.disabled_for_orgs and org_id in self.disabled_for_orgs:
            return False

        # Check whitelist
        if self.enabled_for_orgs:
            return org_id in self.enabled_for_orgs

        # Check global enable and rollout
        if not self.enabled:
            return False

        # Simple percentage-based rollout (can be enhanced)
        if self.rollout_percentage < 100:
            # Use org_id for consistent rollout
            import hashlib

            hash_val = int(hashlib.md5(str(org_id).encode()).hexdigest(), 16)
            return (hash_val % 100) < self.rollout_percentage

        return True

    def is_enabled_for_user(self, user_id: UUIDType, org_id: Optional[UUIDType] = None) -> bool:
        """Check if feature is enabled for specific user."""
        # Check user whitelist
        if self.enabled_for_users and user_id in self.enabled_for_users:
            return True

        # Fall back to org check
        if org_id:
            return self.is_enabled_for_org(org_id)

        return self.enabled and self.rollout_percentage == 100

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "flag_name": self.flag_name,
            "description": self.description,
            "enabled": self.enabled,
            "rollout_percentage": self.rollout_percentage,
            "rules": self.rules,
            "metadata": self.meta_data,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class PlatformAuditLog(Base):
    """Audit log for platform admin actions."""

    __tablename__ = "platform_audit_log"

    id = Column(
        UUID(), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    action = Column(
        String(100), nullable=False, index=True
    )  # e.g., 'org.create', 'user.suspend'
    entity_type = Column(String(100), nullable=False)  # e.g., 'organization', 'user'
    entity_id = Column(UUID(), nullable=True)
    admin_user_id = Column(
        UUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    admin_user_email = Column(
        String(255), nullable=False
    )  # Store email in case user is deleted
    target_org_id = Column(
        UUID(),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_user_id = Column(
        UUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    ip_address = Column(String(45), nullable=True)  # Supports IPv6
    user_agent = Column(String(500), nullable=True)
    changes = Column(JSONB, nullable=True)  # Before/after values
    meta_data = Column(JSONB, nullable=True)  # Additional context
    timestamp = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    # Relationships
    admin_user = relationship("User", foreign_keys=[admin_user_id], back_populates="audit_logs")
    target_org = relationship("Organization", foreign_keys=[target_org_id])
    target_user = relationship("User", foreign_keys=[target_user_id])

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": str(self.entity_id) if self.entity_id else None,
            "admin_user": {
                "id": str(self.admin_user_id),
                "email": self.admin_user_email,
            },
            "target_org_id": str(self.target_org_id) if self.target_org_id else None,
            "target_user_id": str(self.target_user_id) if self.target_user_id else None,
            "ip_address": self.ip_address,
            "changes": self.changes,
            "metadata": self.meta_data,
            "timestamp": self.timestamp.isoformat(),
        }


class PlatformUsageMetrics(Base):
    """Aggregated platform usage metrics per organization."""

    __tablename__ = "platform_usage_metrics"
    __table_args__ = (
        UniqueConstraint("org_id", "metric_date", name="uq_platform_usage_org_date"),
    )

    id = Column(
        UUID(), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    org_id = Column(
        UUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    metric_date = Column(Date, nullable=False, index=True)
    active_users = Column(Integer, nullable=False, default=0)
    api_calls = Column(Integer, nullable=False, default=0)
    ai_tokens_used = Column(Integer, nullable=False, default=0)
    events_created = Column(Integer, nullable=False, default=0)
    volunteers_added = Column(Integer, nullable=False, default=0)
    storage_used_mb = Column(Integer, nullable=False, default=0)
    feature_usage = Column(JSONB, nullable=True)  # Feature -> count mapping
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    organization = relationship("Organization", backref="usage_metrics")

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": str(self.id),
            "org_id": str(self.org_id),
            "metric_date": self.metric_date.isoformat(),
            "active_users": self.active_users,
            "api_calls": self.api_calls,
            "ai_tokens_used": self.ai_tokens_used,
            "events_created": self.events_created,
            "volunteers_added": self.volunteers_added,
            "storage_used_mb": self.storage_used_mb,
            "feature_usage": self.feature_usage or {},
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    async def increment_metric(
        cls,
        db,
        org_id: UUIDType,
        metric_name: str,
        amount: int = 1,
        date: Optional[Date] = None,
    ):
        """Increment a specific metric for an organization."""
        if date is None:
            date = datetime.utcnow().date()

        # Get or create metrics for date
        metrics = (
            await db.query(cls)
            .filter(cls.org_id == org_id, cls.metric_date == date)
            .first()
        )

        if not metrics:
            metrics = cls(org_id=org_id, metric_date=date)
            db.add(metrics)

        # Increment the metric
        if hasattr(metrics, metric_name):
            setattr(metrics, metric_name, getattr(metrics, metric_name) + amount)
        else:
            # Handle feature usage
            if metric_name.startswith("feature_"):
                if not metrics.feature_usage:
                    metrics.feature_usage = {}
                feature = metric_name.replace("feature_", "")
                metrics.feature_usage[feature] = (
                    metrics.feature_usage.get(feature, 0) + amount
                )

        await db.commit()
        return metrics
