"""
Automation workflow models for War Room platform.
Handles custom automation rules, triggers, and execution tracking.
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    JSON,
    Integer,
    Boolean,
    ForeignKey,
    Index,
    Float,
)
from sqlalchemy.orm import relationship
from models.base import BaseModel as Base


class TriggerType(str, Enum):
    """Types of automation triggers."""

    SCHEDULE = "schedule"  # Time-based triggers
    EVENT = "event"  # Platform events (new donation, volunteer signup)
    EXTERNAL = "external"  # External API events (Mentionlytics, social media)
    THRESHOLD = "threshold"  # Metric-based triggers (donation goal reached)
    USER_ACTION = "user_action"  # User interaction triggers
    CRISIS = "crisis"  # Crisis detection from monitoring


class ActionType(str, Enum):
    """Types of automation actions."""

    SEND_EMAIL = "send_email"
    SEND_SMS = "send_sms"
    SEND_WHATSAPP = "send_whatsapp"
    BROWSER_NOTIFICATION = "browser_notification"
    SLACK_MESSAGE = "slack_message"
    CREATE_TASK = "create_task"
    UPDATE_CONTACT = "update_contact"
    ADD_TAG = "add_tag"
    WEBHOOK = "webhook"
    CRISIS_ALERT = "crisis_alert"


class WorkflowStatus(str, Enum):
    """Workflow execution status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    PAUSED = "paused"
    DRAFT = "draft"
    ARCHIVED = "archived"


class ExecutionStatus(str, Enum):
    """Individual execution status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class AutomationWorkflow(Base):
    """
    Main automation workflow definition.

    Features:
    - Configurable triggers and conditions
    - Multi-step action sequences
    - Organization-level isolation
    - Performance tracking
    - Version control
    """

    __tablename__ = "automation_workflows"

    # Primary key
    id = Column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # Organization association
    organization_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)

    # Workflow metadata
    name = Column(String(255), nullable=False)
    description = Column(Text)
    version = Column(Integer, default=1, nullable=False)

    # Configuration
    trigger_type = Column(String(50), nullable=False)
    trigger_config = Column(JSON, default=dict)  # Trigger-specific configuration
    conditions = Column(JSON, default=list)  # List of conditions to check
    actions = Column(JSON, default=list)  # List of actions to execute

    # Execution settings
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(20), default=WorkflowStatus.DRAFT, nullable=False)
    priority = Column(Integer, default=5)  # 1-10 priority scale

    # Scheduling (for schedule-based triggers)
    schedule_config = Column(JSON, default=dict)  # Cron expressions, intervals

    # Performance tracking
    execution_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    last_executed_at = Column(DateTime)
    avg_execution_time_ms = Column(Float)

    # Rate limiting
    max_executions_per_hour = Column(Integer, default=100)
    max_executions_per_day = Column(Integer, default=1000)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_modified_by = Column(String(36), ForeignKey("users.id"))

    # Relationships
    organization = relationship("Organization")
    creator = relationship("User", foreign_keys=[created_by])
    modifier = relationship("User", foreign_keys=[last_modified_by])
    executions = relationship(
        "WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan"
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_workflows_org_status", "organization_id", "status"),
        Index("idx_workflows_org_trigger", "organization_id", "trigger_type"),
        Index("idx_workflows_active", "organization_id", "is_active"),
        Index("idx_workflows_priority", "organization_id", "priority"),
    )

    @property
    def success_rate(self) -> float:
        """Calculate workflow success rate."""
        if self.execution_count == 0:
            return 0.0
        return (self.success_count / self.execution_count) * 100

    @property
    def is_schedule_based(self) -> bool:
        """Check if workflow is schedule-based."""
        return self.trigger_type == TriggerType.SCHEDULE

    @property
    def is_crisis_detection(self) -> bool:
        """Check if workflow is for crisis detection."""
        return self.trigger_type == TriggerType.CRISIS

    def can_execute(self) -> bool:
        """Check if workflow can be executed."""
        return self.is_active and self.status == WorkflowStatus.ACTIVE

    def to_dict(self) -> Dict[str, Any]:
        """Convert workflow to dictionary representation."""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "trigger_type": self.trigger_type,
            "trigger_config": self.trigger_config,
            "conditions": self.conditions,
            "actions": self.actions,
            "is_active": self.is_active,
            "status": self.status,
            "priority": self.priority,
            "execution_count": self.execution_count,
            "success_rate": self.success_rate,
            "last_executed_at": self.last_executed_at.isoformat()
            if self.last_executed_at
            else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class WorkflowExecution(Base):
    """
    Individual workflow execution tracking.
    Records each time a workflow runs with detailed logging.
    """

    __tablename__ = "workflow_executions"

    # Primary key
    id = Column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # Workflow association
    workflow_id = Column(
        String(36), ForeignKey("automation_workflows.id"), nullable=False, index=True
    )
    organization_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )

    # Execution metadata
    execution_status = Column(
        String(20), default=ExecutionStatus.PENDING, nullable=False
    )
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    duration_ms = Column(Integer)  # Execution time in milliseconds

    # Trigger information
    trigger_data = Column(JSON, default=dict)  # Data that triggered the workflow
    trigger_source = Column(
        String(100)
    )  # Source of the trigger (e.g., "mentionlytics", "schedule")

    # Execution details
    steps_completed = Column(Integer, default=0)
    steps_total = Column(Integer, default=0)
    current_step = Column(String(255))

    # Results and logging
    success = Column(Boolean)
    error_message = Column(Text)
    execution_log = Column(JSON, default=list)  # Detailed step-by-step log
    output_data = Column(JSON, default=dict)  # Data generated by the workflow

    # Performance metrics
    actions_executed = Column(Integer, default=0)
    notifications_sent = Column(Integer, default=0)
    api_calls_made = Column(Integer, default=0)

    # Relationships
    workflow = relationship("AutomationWorkflow", back_populates="executions")
    organization = relationship("Organization")

    # Indexes
    __table_args__ = (
        Index("idx_executions_workflow", "workflow_id", "started_at"),
        Index("idx_executions_org", "organization_id", "started_at"),
        Index("idx_executions_status", "organization_id", "execution_status"),
    )

    @property
    def is_running(self) -> bool:
        """Check if execution is currently running."""
        return self.execution_status == ExecutionStatus.RUNNING

    @property
    def is_completed(self) -> bool:
        """Check if execution is completed (success or failure)."""
        return self.execution_status in [
            ExecutionStatus.COMPLETED,
            ExecutionStatus.FAILED,
        ]

    def add_log_entry(
        self, level: str, message: str, data: Optional[Dict] = None
    ) -> None:
        """Add an entry to the execution log."""
        if self.execution_log is None:
            self.execution_log = []

        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
        }

        if data:
            entry["data"] = data

        self.execution_log.append(entry)

    def to_dict(self) -> Dict[str, Any]:
        """Convert execution to dictionary representation."""
        return {
            "id": self.id,
            "workflow_id": self.workflow_id,
            "execution_status": self.execution_status,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat()
            if self.completed_at
            else None,
            "duration_ms": self.duration_ms,
            "trigger_source": self.trigger_source,
            "steps_completed": self.steps_completed,
            "steps_total": self.steps_total,
            "success": self.success,
            "error_message": self.error_message,
            "actions_executed": self.actions_executed,
            "notifications_sent": self.notifications_sent,
        }


class CrisisAlert(Base):
    """
    Crisis detection and alert management.
    Tracks crisis events from external monitoring services.
    """

    __tablename__ = "crisis_alerts"

    # Primary key
    id = Column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # Organization association
    organization_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )

    # Alert metadata
    alert_type = Column(
        String(50), nullable=False
    )  # e.g., "negative_sentiment", "viral_mention"
    severity = Column(String(20), nullable=False)  # "low", "medium", "high", "critical"
    title = Column(String(500), nullable=False)
    description = Column(Text)

    # Source information
    source = Column(
        String(100), nullable=False
    )  # e.g., "mentionlytics", "twitter", "facebook"
    source_id = Column(String(255))  # External source identifier
    source_url = Column(String(1000))  # Link to original content

    # Content details
    content = Column(Text)  # Original content that triggered alert
    keywords_matched = Column(JSON, default=list)  # Keywords that triggered detection
    sentiment_score = Column(Float)  # Sentiment analysis score
    reach_estimate = Column(Integer)  # Estimated reach/impressions
    engagement_metrics = Column(JSON, default=dict)  # Likes, shares, comments

    # Workflow triggers
    workflow_triggered = Column(Boolean, default=False)
    workflow_ids = Column(JSON, default=list)  # Workflows that were triggered

    # Response tracking
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(36), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    response_notes = Column(Text)

    # Status tracking
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String(36), ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)

    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    organization = relationship("Organization")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])
    resolver = relationship("User", foreign_keys=[resolved_by])

    # Indexes
    __table_args__ = (
        Index("idx_alerts_org_severity", "organization_id", "severity"),
        Index("idx_alerts_org_detected", "organization_id", "detected_at"),
        Index("idx_alerts_org_unresolved", "organization_id", "is_resolved"),
        Index("idx_alerts_source", "source", "source_id"),
    )

    @property
    def is_critical(self) -> bool:
        """Check if alert is critical severity."""
        return self.severity == "critical"

    @property
    def needs_attention(self) -> bool:
        """Check if alert needs immediate attention."""
        return not self.acknowledged and self.severity in ["high", "critical"]

    @property
    def response_time(self) -> Optional[float]:
        """Calculate response time in minutes."""
        if self.acknowledged_at:
            return (self.acknowledged_at - self.detected_at).total_seconds() / 60
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary representation."""
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "source": self.source,
            "source_url": self.source_url,
            "content": self.content[:500] + "..."
            if self.content and len(self.content) > 500
            else self.content,
            "keywords_matched": self.keywords_matched,
            "sentiment_score": self.sentiment_score,
            "reach_estimate": self.reach_estimate,
            "acknowledged": self.acknowledged,
            "is_resolved": self.is_resolved,
            "detected_at": self.detected_at.isoformat(),
            "response_time": self.response_time,
        }


class NotificationDelivery(Base):
    """
    Multi-channel notification delivery tracking.
    Records all notifications sent through various channels.
    """

    __tablename__ = "notification_deliveries"

    # Primary key
    id = Column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )

    # Association
    organization_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    workflow_execution_id = Column(
        String(36), ForeignKey("workflow_executions.id"), index=True
    )

    # Notification details
    channel = Column(
        String(50), nullable=False
    )  # "email", "sms", "browser", "whatsapp", "slack"
    recipient = Column(String(255), nullable=False)  # Email, phone, user ID
    subject = Column(String(500))
    content = Column(Text, nullable=False)

    # Delivery tracking
    status = Column(String(50), default="pending", nullable=False)
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    read_at = Column(DateTime)  # For channels that support read receipts

    # Provider information
    provider = Column(String(100))  # "sendgrid", "twilio", "firebase"
    provider_id = Column(String(255))  # External provider message ID
    provider_response = Column(JSON, default=dict)

    # Error tracking
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

    # Engagement tracking
    clicked_links = Column(JSON, default=list)  # URLs clicked in the message
    engagement_score = Column(Float)  # Calculated engagement score

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    organization = relationship("Organization")
    workflow_execution = relationship("WorkflowExecution")

    # Indexes
    __table_args__ = (
        Index("idx_notifications_org_channel", "organization_id", "channel"),
        Index("idx_notifications_org_status", "organization_id", "status"),
        Index("idx_notifications_execution", "workflow_execution_id"),
        Index("idx_notifications_provider", "provider", "provider_id"),
    )

    @property
    def is_delivered(self) -> bool:
        """Check if notification was delivered."""
        return self.status == "delivered"

    @property
    def delivery_time(self) -> Optional[float]:
        """Calculate delivery time in seconds."""
        if self.sent_at and self.delivered_at:
            return (self.delivered_at - self.sent_at).total_seconds()
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Convert notification to dictionary representation."""
        return {
            "id": self.id,
            "channel": self.channel,
            "recipient": self.recipient,
            "subject": self.subject,
            "status": self.status,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "delivered_at": self.delivered_at.isoformat()
            if self.delivered_at
            else None,
            "provider": self.provider,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "created_at": self.created_at.isoformat(),
        }
