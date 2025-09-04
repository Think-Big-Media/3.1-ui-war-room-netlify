"""Add automation tables

Revision ID: 006_automation_tables
Revises: 005_document_intelligence_tables
Create Date: 2025-01-08 11:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "006_automation_tables"
down_revision = "005_document_intelligence_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create automation_workflows table
    op.create_table(
        "automation_workflows",
        sa.Column("id", sa.String(36), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "created_by",
            sa.String(36),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("version", sa.Integer(), default=1, nullable=False),
        sa.Column("trigger_type", sa.String(50), nullable=False),
        sa.Column("trigger_config", sa.JSON(), default={}),
        sa.Column("conditions", sa.JSON(), default=[]),
        sa.Column("actions", sa.JSON(), default=[]),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("status", sa.String(20), default="draft", nullable=False),
        sa.Column("priority", sa.Integer(), default=5),
        sa.Column("schedule_config", sa.JSON(), default={}),
        sa.Column("execution_count", sa.Integer(), default=0),
        sa.Column("success_count", sa.Integer(), default=0),
        sa.Column("failure_count", sa.Integer(), default=0),
        sa.Column("last_executed_at", sa.DateTime()),
        sa.Column("avg_execution_time_ms", sa.Float()),
        sa.Column("max_executions_per_hour", sa.Integer(), default=100),
        sa.Column("max_executions_per_day", sa.Integer(), default=1000),
        sa.Column("created_at", sa.DateTime(), default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()
        ),
        sa.Column("last_modified_by", sa.String(36), sa.ForeignKey("users.id")),
    )

    # Create workflow_executions table
    op.create_table(
        "workflow_executions",
        sa.Column("id", sa.String(36), primary_key=True, index=True),
        sa.Column(
            "workflow_id",
            sa.String(36),
            sa.ForeignKey("automation_workflows.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("execution_status", sa.String(20), default="pending", nullable=False),
        sa.Column("started_at", sa.DateTime(), default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime()),
        sa.Column("duration_ms", sa.Integer()),
        sa.Column("trigger_data", sa.JSON(), default={}),
        sa.Column("trigger_source", sa.String(100)),
        sa.Column("steps_completed", sa.Integer(), default=0),
        sa.Column("steps_total", sa.Integer(), default=0),
        sa.Column("current_step", sa.String(255)),
        sa.Column("success", sa.Boolean()),
        sa.Column("error_message", sa.Text()),
        sa.Column("execution_log", sa.JSON(), default=[]),
        sa.Column("output_data", sa.JSON(), default={}),
        sa.Column("actions_executed", sa.Integer(), default=0),
        sa.Column("notifications_sent", sa.Integer(), default=0),
        sa.Column("api_calls_made", sa.Integer(), default=0),
    )

    # Create crisis_alerts table
    op.create_table(
        "crisis_alerts",
        sa.Column("id", sa.String(36), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("alert_type", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("source_id", sa.String(255)),
        sa.Column("source_url", sa.String(1000)),
        sa.Column("content", sa.Text()),
        sa.Column("keywords_matched", sa.JSON(), default=[]),
        sa.Column("sentiment_score", sa.Float()),
        sa.Column("reach_estimate", sa.Integer()),
        sa.Column("engagement_metrics", sa.JSON(), default={}),
        sa.Column("workflow_triggered", sa.Boolean(), default=False),
        sa.Column("workflow_ids", sa.JSON(), default=[]),
        sa.Column("acknowledged", sa.Boolean(), default=False),
        sa.Column("acknowledged_by", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("acknowledged_at", sa.DateTime()),
        sa.Column("response_notes", sa.Text()),
        sa.Column("is_resolved", sa.Boolean(), default=False),
        sa.Column("resolved_by", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("resolved_at", sa.DateTime()),
        sa.Column("resolution_notes", sa.Text()),
        sa.Column("detected_at", sa.DateTime(), default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(), default=sa.func.now(), nullable=False),
    )

    # Create notification_deliveries table
    op.create_table(
        "notification_deliveries",
        sa.Column("id", sa.String(36), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "workflow_execution_id",
            sa.String(36),
            sa.ForeignKey("workflow_executions.id"),
            index=True,
        ),
        sa.Column("channel", sa.String(50), nullable=False),
        sa.Column("recipient", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500)),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), default="pending", nullable=False),
        sa.Column("sent_at", sa.DateTime()),
        sa.Column("delivered_at", sa.DateTime()),
        sa.Column("read_at", sa.DateTime()),
        sa.Column("provider", sa.String(100)),
        sa.Column("provider_id", sa.String(255)),
        sa.Column("provider_response", sa.JSON(), default={}),
        sa.Column("error_message", sa.Text()),
        sa.Column("retry_count", sa.Integer(), default=0),
        sa.Column("max_retries", sa.Integer(), default=3),
        sa.Column("clicked_links", sa.JSON(), default=[]),
        sa.Column("engagement_score", sa.Float()),
        sa.Column("created_at", sa.DateTime(), default=sa.func.now(), nullable=False),
    )

    # Create indexes
    op.create_index(
        "idx_workflows_org_status",
        "automation_workflows",
        ["organization_id", "status"],
    )
    op.create_index(
        "idx_workflows_org_trigger",
        "automation_workflows",
        ["organization_id", "trigger_type"],
    )
    op.create_index(
        "idx_workflows_active", "automation_workflows", ["organization_id", "is_active"]
    )
    op.create_index(
        "idx_workflows_priority",
        "automation_workflows",
        ["organization_id", "priority"],
    )

    op.create_index(
        "idx_executions_workflow", "workflow_executions", ["workflow_id", "started_at"]
    )
    op.create_index(
        "idx_executions_org", "workflow_executions", ["organization_id", "started_at"]
    )
    op.create_index(
        "idx_executions_status",
        "workflow_executions",
        ["organization_id", "execution_status"],
    )

    op.create_index(
        "idx_alerts_org_severity", "crisis_alerts", ["organization_id", "severity"]
    )
    op.create_index(
        "idx_alerts_org_detected", "crisis_alerts", ["organization_id", "detected_at"]
    )
    op.create_index(
        "idx_alerts_org_unresolved", "crisis_alerts", ["organization_id", "is_resolved"]
    )
    op.create_index("idx_alerts_source", "crisis_alerts", ["source", "source_id"])

    op.create_index(
        "idx_notifications_org_channel",
        "notification_deliveries",
        ["organization_id", "channel"],
    )
    op.create_index(
        "idx_notifications_org_status",
        "notification_deliveries",
        ["organization_id", "status"],
    )
    op.create_index(
        "idx_notifications_execution",
        "notification_deliveries",
        ["workflow_execution_id"],
    )
    op.create_index(
        "idx_notifications_provider",
        "notification_deliveries",
        ["provider", "provider_id"],
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_notifications_provider", table_name="notification_deliveries")
    op.drop_index("idx_notifications_execution", table_name="notification_deliveries")
    op.drop_index("idx_notifications_org_status", table_name="notification_deliveries")
    op.drop_index("idx_notifications_org_channel", table_name="notification_deliveries")

    op.drop_index("idx_alerts_source", table_name="crisis_alerts")
    op.drop_index("idx_alerts_org_unresolved", table_name="crisis_alerts")
    op.drop_index("idx_alerts_org_detected", table_name="crisis_alerts")
    op.drop_index("idx_alerts_org_severity", table_name="crisis_alerts")

    op.drop_index("idx_executions_status", table_name="workflow_executions")
    op.drop_index("idx_executions_org", table_name="workflow_executions")
    op.drop_index("idx_executions_workflow", table_name="workflow_executions")

    op.drop_index("idx_workflows_priority", table_name="automation_workflows")
    op.drop_index("idx_workflows_active", table_name="automation_workflows")
    op.drop_index("idx_workflows_org_trigger", table_name="automation_workflows")
    op.drop_index("idx_workflows_org_status", table_name="automation_workflows")

    # Drop tables
    op.drop_table("notification_deliveries")
    op.drop_table("crisis_alerts")
    op.drop_table("workflow_executions")
    op.drop_table("automation_workflows")
