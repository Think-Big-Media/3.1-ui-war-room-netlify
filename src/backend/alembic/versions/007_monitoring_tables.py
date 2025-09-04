"""Add monitoring tables for unified monitoring pipeline

Revision ID: 007_monitoring_tables
Revises: 006_automation_tables
Create Date: 2025-01-31 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "007_monitoring_tables"
down_revision = "006_automation_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create monitoring_events table
    op.create_table(
        "monitoring_events",
        sa.Column("id", sa.String(255), nullable=False),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("title", sa.Text, nullable=True),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("url", sa.Text, nullable=True),
        sa.Column("author", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("platform", sa.String(100), nullable=True),
        sa.Column("sentiment", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("keywords", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("mentions", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("language", sa.String(10), nullable=True),
        sa.Column("location", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("influence_score", sa.Integer, nullable=True),
        sa.Column("raw_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
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

    # Create indexes for monitoring_events
    op.create_index("idx_monitoring_events_source", "monitoring_events", ["source"])
    op.create_index("idx_monitoring_events_type", "monitoring_events", ["type"])
    op.create_index(
        "idx_monitoring_events_timestamp", "monitoring_events", ["timestamp"]
    )
    op.create_index("idx_monitoring_events_platform", "monitoring_events", ["platform"])
    op.create_index(
        "idx_monitoring_events_created_at", "monitoring_events", ["created_at"]
    )
    op.create_index(
        "idx_monitoring_events_sentiment_score",
        "monitoring_events",
        [sa.text("(sentiment->>'score')::float")],
    )
    op.create_index(
        "idx_monitoring_events_reach",
        "monitoring_events",
        [sa.text("(metrics->>'reach')::integer")],
    )

    # Create GIN indexes for JSONB columns
    op.create_index(
        "idx_monitoring_events_author_gin",
        "monitoring_events",
        ["author"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_monitoring_events_sentiment_gin",
        "monitoring_events",
        ["sentiment"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_monitoring_events_metrics_gin",
        "monitoring_events",
        ["metrics"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_monitoring_events_location_gin",
        "monitoring_events",
        ["location"],
        postgresql_using="gin",
    )

    # Create GIN indexes for array columns
    op.create_index(
        "idx_monitoring_events_keywords_gin",
        "monitoring_events",
        ["keywords"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_monitoring_events_mentions_gin",
        "monitoring_events",
        ["mentions"],
        postgresql_using="gin",
    )

    # Create crisis_alerts table
    op.create_table(
        "crisis_alerts",
        sa.Column("id", sa.String(255), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("trigger_event_ids", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column(
            "trigger_conditions", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("escalated", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("affected_keywords", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("affected_platforms", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column("estimated_reach", sa.BigInteger, nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("acknowledged_by", sa.String(255), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", sa.String(255), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
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

    # Create indexes for crisis_alerts
    op.create_index("idx_crisis_alerts_severity", "crisis_alerts", ["severity"])
    op.create_index("idx_crisis_alerts_type", "crisis_alerts", ["type"])
    op.create_index("idx_crisis_alerts_status", "crisis_alerts", ["status"])
    op.create_index("idx_crisis_alerts_escalated", "crisis_alerts", ["escalated"])
    op.create_index("idx_crisis_alerts_created_at", "crisis_alerts", ["created_at"])
    op.create_index(
        "idx_crisis_alerts_acknowledged_at", "crisis_alerts", ["acknowledged_at"]
    )
    op.create_index("idx_crisis_alerts_resolved_at", "crisis_alerts", ["resolved_at"])

    # Create GIN indexes for crisis_alerts JSONB and array columns
    op.create_index(
        "idx_crisis_alerts_trigger_conditions_gin",
        "crisis_alerts",
        ["trigger_conditions"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_crisis_alerts_metadata_gin",
        "crisis_alerts",
        ["metadata"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_crisis_alerts_keywords_gin",
        "crisis_alerts",
        ["affected_keywords"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_crisis_alerts_platforms_gin",
        "crisis_alerts",
        ["affected_platforms"],
        postgresql_using="gin",
    )
    op.create_index(
        "idx_crisis_alerts_trigger_events_gin",
        "crisis_alerts",
        ["trigger_event_ids"],
        postgresql_using="gin",
    )

    # Create monitoring_pipeline_metrics table for performance tracking
    op.create_table(
        "monitoring_pipeline_metrics",
        sa.Column("id", sa.Integer, nullable=False, autoincrement=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "events_processed_total", sa.Integer, nullable=False, server_default="0"
        ),
        sa.Column("events_per_minute", sa.Float, nullable=False, server_default="0"),
        sa.Column("alerts_generated", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "processing_latency_ms", sa.Float, nullable=False, server_default="0"
        ),
        sa.Column(
            "duplicate_events_filtered", sa.Integer, nullable=False, server_default="0"
        ),
        sa.Column(
            "service_health", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
        sa.Column(
            "sentiment_distribution",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "platform_distribution",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for monitoring_pipeline_metrics
    op.create_index(
        "idx_pipeline_metrics_timestamp", "monitoring_pipeline_metrics", ["timestamp"]
    )
    op.create_index(
        "idx_pipeline_metrics_events_per_minute",
        "monitoring_pipeline_metrics",
        ["events_per_minute"],
    )
    op.create_index(
        "idx_pipeline_metrics_processing_latency",
        "monitoring_pipeline_metrics",
        ["processing_latency_ms"],
    )

    # Create monitoring_service_health table for service status tracking
    op.create_table(
        "monitoring_service_health",
        sa.Column("id", sa.Integer, nullable=False, autoincrement=True),
        sa.Column("service_name", sa.String(100), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("last_successful_request", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("rate_limit_remaining", sa.Integer, nullable=True),
        sa.Column("rate_limit_reset_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("response_time_ms", sa.Float, nullable=True),
        sa.Column("uptime_percentage", sa.Float, nullable=True),
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

    # Create indexes for monitoring_service_health
    op.create_index(
        "idx_service_health_service_name", "monitoring_service_health", ["service_name"]
    )
    op.create_index(
        "idx_service_health_status", "monitoring_service_health", ["status"]
    )
    op.create_index(
        "idx_service_health_updated_at", "monitoring_service_health", ["updated_at"]
    )

    # Create unique constraint to ensure one record per service
    op.create_index(
        "idx_service_health_unique_service",
        "monitoring_service_health",
        ["service_name"],
        unique=True,
    )

    # Create function for updating updated_at timestamp
    op.execute(
        """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    """
    )

    # Create triggers for updated_at columns
    op.execute(
        """
        CREATE TRIGGER update_monitoring_events_updated_at
            BEFORE UPDATE ON monitoring_events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    """
    )

    op.execute(
        """
        CREATE TRIGGER update_crisis_alerts_updated_at
            BEFORE UPDATE ON crisis_alerts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    """
    )

    op.execute(
        """
        CREATE TRIGGER update_service_health_updated_at
            BEFORE UPDATE ON monitoring_service_health
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    """
    )

    # Create function for sentiment trend analysis (used by EventStore)
    op.execute(
        """
        CREATE OR REPLACE FUNCTION get_sentiment_trend(
            start_date timestamp with time zone,
            end_date timestamp with time zone,
            date_format text DEFAULT 'YYYY-MM-DD HH24:00:00'
        )
        RETURNS TABLE(
            timestamp text,
            sentiment numeric,
            count bigint
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                to_char(date_trunc('hour', me.timestamp), date_format) as timestamp,
                COALESCE(AVG((me.sentiment->>'score')::float), 0)::numeric as sentiment,
                COUNT(*)::bigint as count
            FROM monitoring_events me
            WHERE me.timestamp >= start_date 
                AND me.timestamp <= end_date
                AND me.sentiment IS NOT NULL
            GROUP BY date_trunc('hour', me.timestamp)
            ORDER BY date_trunc('hour', me.timestamp);
        END;
        $$ LANGUAGE plpgsql;
    """
    )

    # Create materialized view for faster analytics queries
    op.execute(
        """
        CREATE MATERIALIZED VIEW monitoring_hourly_stats AS
        SELECT 
            date_trunc('hour', timestamp) as hour,
            source,
            platform,
            COUNT(*) as event_count,
            AVG((sentiment->>'score')::float) as avg_sentiment,
            COUNT(*) FILTER (WHERE (sentiment->>'label') = 'positive') as positive_count,
            COUNT(*) FILTER (WHERE (sentiment->>'label') = 'negative') as negative_count,
            COUNT(*) FILTER (WHERE (sentiment->>'label') = 'neutral') as neutral_count,
            SUM((metrics->>'reach')::bigint) as total_reach,
            SUM((metrics->>'engagement')::bigint) as total_engagement
        FROM monitoring_events
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        GROUP BY date_trunc('hour', timestamp), source, platform
        ORDER BY hour DESC;
    """
    )

    # Create unique index on materialized view
    op.create_index(
        "idx_hourly_stats_unique",
        "monitoring_hourly_stats",
        ["hour", "source", "platform"],
        unique=True,
    )

    # Create function to refresh materialized view
    op.execute(
        """
        CREATE OR REPLACE FUNCTION refresh_monitoring_hourly_stats()
        RETURNS void AS $$
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY monitoring_hourly_stats;
        END;
        $$ LANGUAGE plpgsql;
    """
    )


def downgrade() -> None:
    # Drop materialized view and related objects
    op.execute("DROP FUNCTION IF EXISTS refresh_monitoring_hourly_stats()")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS monitoring_hourly_stats")
    op.execute(
        "DROP FUNCTION IF EXISTS get_sentiment_trend(timestamp with time zone, timestamp with time zone, text)"
    )

    # Drop triggers
    op.execute(
        "DROP TRIGGER IF EXISTS update_service_health_updated_at ON monitoring_service_health"
    )
    op.execute(
        "DROP TRIGGER IF EXISTS update_crisis_alerts_updated_at ON crisis_alerts"
    )
    op.execute(
        "DROP TRIGGER IF EXISTS update_monitoring_events_updated_at ON monitoring_events"
    )

    # Drop trigger function
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column()")

    # Drop tables
    op.drop_table("monitoring_service_health")
    op.drop_table("monitoring_pipeline_metrics")
    op.drop_table("crisis_alerts")
    op.drop_table("monitoring_events")
