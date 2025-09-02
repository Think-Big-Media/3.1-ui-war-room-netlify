"""Create monitoring tables

Revision ID: monitoring_tables_001
Revises: 
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "monitoring_tables_001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create monitoring_events table
    op.create_table(
        "monitoring_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("author", postgresql.JSONB(), nullable=False),
        sa.Column("platform", sa.String(), nullable=False),
        sa.Column("sentiment", postgresql.JSONB(), nullable=False),
        sa.Column("metrics", postgresql.JSONB(), nullable=True),
        sa.Column("keywords", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("mentions", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("language", sa.String(), nullable=True),
        sa.Column("location", postgresql.JSONB(), nullable=True),
        sa.Column("influence_score", sa.Integer(), nullable=True),
        sa.Column("raw_data", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for monitoring_events
    op.create_index(
        "idx_monitoring_events_timestamp", "monitoring_events", ["timestamp"]
    )
    op.create_index("idx_monitoring_events_source", "monitoring_events", ["source"])
    op.create_index("idx_monitoring_events_platform", "monitoring_events", ["platform"])
    op.create_index(
        "idx_monitoring_events_keywords",
        "monitoring_events",
        ["keywords"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_monitoring_events_sentiment",
        "monitoring_events",
        ["sentiment"],
        postgresql_using="gin",
    )

    # Create monitoring_alerts table
    op.create_table(
        "monitoring_alerts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("severity", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("trigger_event_ids", postgresql.JSONB(), nullable=False),
        sa.Column("trigger_conditions", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("acknowledged", sa.Boolean(), default=False, nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("acknowledged_by", sa.String(), nullable=True),
        sa.Column("escalated", sa.Boolean(), default=False, nullable=False),
        sa.Column("affected_keywords", postgresql.JSONB(), nullable=False),
        sa.Column("affected_platforms", postgresql.JSONB(), nullable=False),
        sa.Column("estimated_reach", sa.BigInteger(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for monitoring_alerts
    op.create_index(
        "idx_monitoring_alerts_created_at", "monitoring_alerts", ["created_at"]
    )
    op.create_index("idx_monitoring_alerts_severity", "monitoring_alerts", ["severity"])
    op.create_index("idx_monitoring_alerts_type", "monitoring_alerts", ["type"])
    op.create_index("idx_monitoring_alerts_status", "monitoring_alerts", ["status"])

    # Create monitoring_alert_subscribers table
    op.create_table(
        "monitoring_alert_subscribers",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column(
            "type", sa.String(), nullable=False
        ),  # websocket, email, sms, webhook
        sa.Column("endpoint", sa.String(), nullable=False),
        sa.Column("filters", postgresql.JSONB(), nullable=True),
        sa.Column("active", sa.Boolean(), default=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create monitoring_metrics table for analytics
    op.create_table(
        "monitoring_metrics",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("events_processed_total", sa.Integer(), nullable=False),
        sa.Column("events_per_minute", sa.Float(), nullable=False),
        sa.Column("alerts_generated", sa.Integer(), nullable=False),
        sa.Column("processing_latency_ms", sa.Float(), nullable=False),
        sa.Column("duplicate_events_filtered", sa.Integer(), nullable=False),
        sa.Column("sentiment_distribution", postgresql.JSONB(), nullable=False),
        sa.Column("platform_distribution", postgresql.JSONB(), nullable=False),
        sa.Column("service_health", postgresql.JSONB(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "idx_monitoring_metrics_timestamp", "monitoring_metrics", ["timestamp"]
    )

    # Create monitoring_webhooks table
    op.create_table(
        "monitoring_webhooks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("service", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("secret", sa.String(), nullable=True),
        sa.Column("events", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("active", sa.Boolean(), default=True, nullable=False),
        sa.Column("last_triggered", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create views for analytics
    op.execute(
        """
        CREATE VIEW monitoring_alerts_summary AS
        SELECT 
            DATE_TRUNC('hour', created_at) as hour,
            severity,
            type,
            COUNT(*) as count,
            SUM(estimated_reach) as total_reach
        FROM monitoring_alerts
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE_TRUNC('hour', created_at), severity, type
        ORDER BY hour DESC;
    """
    )

    op.execute(
        """
        CREATE VIEW monitoring_events_summary AS
        SELECT 
            DATE_TRUNC('hour', timestamp) as hour,
            platform,
            source,
            COUNT(*) as count,
            AVG((sentiment->>'score')::float) as avg_sentiment
        FROM monitoring_events
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', timestamp), platform, source
        ORDER BY hour DESC;
    """
    )


def downgrade() -> None:
    # Drop views
    op.execute("DROP VIEW IF EXISTS monitoring_events_summary")
    op.execute("DROP VIEW IF EXISTS monitoring_alerts_summary")

    # Drop tables
    op.drop_table("monitoring_webhooks")
    op.drop_table("monitoring_metrics")
    op.drop_table("monitoring_alert_subscribers")
    op.drop_table("monitoring_alerts")
    op.drop_table("monitoring_events")
