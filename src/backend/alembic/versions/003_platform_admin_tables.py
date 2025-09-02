"""Add platform admin tables

Revision ID: 003_platform_admin_tables  
Revises: 002_campaign_models
Create Date: 2025-07-11 04:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "003_platform_admin_tables"
down_revision = "002_campaign_models"
branch_labels = None
depends_on = None


def upgrade():
    """Create platform admin tables for monitoring and feature flags."""

    # Platform analytics events for PostHog integration
    op.create_table(
        "platform_analytics_events",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("event_name", sa.String(255), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=True),
        sa.Column("org_id", sa.String(36), nullable=True),
        sa.Column("session_id", sa.String(255), nullable=True),
        sa.Column("element_id", sa.String(255), nullable=True),
        sa.Column("page_url", sa.String(500), nullable=True),
        sa.Column("properties", postgresql.JSONB, nullable=True),
        sa.Column("posthog_event_id", sa.String(255), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for analytics queries
    op.create_index(
        "idx_platform_analytics_timestamp", "platform_analytics_events", ["timestamp"]
    )
    op.create_index(
        "idx_platform_analytics_event_type", "platform_analytics_events", ["event_type"]
    )
    op.create_index(
        "idx_platform_analytics_org", "platform_analytics_events", ["org_id"]
    )
    op.create_index(
        "idx_platform_analytics_user", "platform_analytics_events", ["user_id"]
    )

    # Feature flags
    op.create_table(
        "feature_flags",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("flag_name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "rollout_percentage", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "enabled_for_orgs", sa.JSON(), nullable=True
        ),  # JSON array of org IDs
        sa.Column(
            "disabled_for_orgs", sa.JSON(), nullable=True
        ),  # JSON array of org IDs
        sa.Column(
            "enabled_for_users", sa.JSON(), nullable=True
        ),  # JSON array of user IDs
        sa.Column("rules", sa.JSON(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_by", sa.String(36), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("idx_feature_flags_name", "feature_flags", ["flag_name"])

    # Platform audit log
    op.create_table(
        "platform_audit_log",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=True),
        sa.Column("admin_user_id", sa.String(36), nullable=False),
        sa.Column("admin_user_email", sa.String(255), nullable=False),
        sa.Column("target_org_id", sa.String(36), nullable=True),
        sa.Column("target_user_id", sa.String(36), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("changes", sa.JSON(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for audit queries
    op.create_index("idx_platform_audit_timestamp", "platform_audit_log", ["timestamp"])
    op.create_index("idx_platform_audit_action", "platform_audit_log", ["action"])
    op.create_index("idx_platform_audit_admin", "platform_audit_log", ["admin_user_id"])
    op.create_index(
        "idx_platform_audit_entity", "platform_audit_log", ["entity_type", "entity_id"]
    )

    # Platform usage metrics (aggregated)
    op.create_table(
        "platform_usage_metrics",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("org_id", sa.String(36), nullable=False),
        sa.Column("metric_date", sa.Date(), nullable=False),
        sa.Column("active_users", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("api_calls", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ai_tokens_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("events_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("volunteers_added", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("storage_used_mb", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("feature_usage", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("org_id", "metric_date", name="uq_platform_usage_org_date"),
    )

    op.create_index(
        "idx_platform_usage_date", "platform_usage_metrics", ["metric_date"]
    )
    op.create_index("idx_platform_usage_org", "platform_usage_metrics", ["org_id"])

    # Add analytics consent to organizations
    op.add_column(
        "organizations",
        sa.Column(
            "analytics_consent", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "organizations",
        sa.Column("analytics_consent_date", sa.DateTime(timezone=True), nullable=True),
    )

    # Add feature flag overrides to organizations
    op.add_column(
        "organizations", sa.Column("feature_overrides", sa.JSON(), nullable=True)
    )

    # Add platform admin flag to users
    op.add_column(
        "users",
        sa.Column(
            "is_platform_admin", sa.Boolean(), nullable=False, server_default="false"
        ),
    )

    # Create foreign key constraints (after tables exist)
    op.create_foreign_key(
        "fk_platform_analytics_user_id",
        "platform_analytics_events",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_platform_analytics_org_id",
        "platform_analytics_events",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_feature_flags_created_by",
        "feature_flags",
        "users",
        ["created_by"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_platform_audit_admin_user",
        "platform_audit_log",
        "users",
        ["admin_user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_platform_audit_target_org",
        "platform_audit_log",
        "organizations",
        ["target_org_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_platform_audit_target_user",
        "platform_audit_log",
        "users",
        ["target_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_platform_usage_org",
        "platform_usage_metrics",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade():
    """Drop platform admin tables."""

    # Drop foreign key constraints first
    op.drop_constraint(
        "fk_platform_usage_org", "platform_usage_metrics", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_platform_audit_target_user", "platform_audit_log", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_platform_audit_target_org", "platform_audit_log", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_platform_audit_admin_user", "platform_audit_log", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_feature_flags_created_by", "feature_flags", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_platform_analytics_org_id", "platform_analytics_events", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_platform_analytics_user_id", "platform_analytics_events", type_="foreignkey"
    )

    # Drop columns from existing tables
    op.drop_column("users", "is_platform_admin")
    op.drop_column("organizations", "feature_overrides")
    op.drop_column("organizations", "analytics_consent_date")
    op.drop_column("organizations", "analytics_consent")

    # Drop indexes and tables
    op.drop_index("idx_platform_usage_org", table_name="platform_usage_metrics")
    op.drop_index("idx_platform_usage_date", table_name="platform_usage_metrics")
    op.drop_table("platform_usage_metrics")

    op.drop_index("idx_platform_audit_entity", table_name="platform_audit_log")
    op.drop_index("idx_platform_audit_admin", table_name="platform_audit_log")
    op.drop_index("idx_platform_audit_action", table_name="platform_audit_log")
    op.drop_index("idx_platform_audit_timestamp", table_name="platform_audit_log")
    op.drop_table("platform_audit_log")

    op.drop_index("idx_feature_flags_name", table_name="feature_flags")
    op.drop_table("feature_flags")

    op.drop_index("idx_platform_analytics_user", table_name="platform_analytics_events")
    op.drop_index("idx_platform_analytics_org", table_name="platform_analytics_events")
    op.drop_index(
        "idx_platform_analytics_event_type", table_name="platform_analytics_events"
    )
    op.drop_index(
        "idx_platform_analytics_timestamp", table_name="platform_analytics_events"
    )
    op.drop_table("platform_analytics_events")
