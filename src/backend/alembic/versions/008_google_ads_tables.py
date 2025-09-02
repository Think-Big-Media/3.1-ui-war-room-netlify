"""Create Google Ads API data tables

Revision ID: 008_google_ads_tables
Revises: 007_monitoring_tables
Create Date: 2025-01-31 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "008_google_ads_tables"
down_revision = "007_monitoring_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create google_ads_customers table
    op.create_table(
        "google_ads_customers",
        sa.Column("id", sa.String(50), nullable=False),
        sa.Column("resource_name", sa.String(255), nullable=False),
        sa.Column("descriptive_name", sa.String(255), nullable=True),
        sa.Column("currency_code", sa.String(3), nullable=False),
        sa.Column("time_zone", sa.String(50), nullable=False),
        sa.Column("tracking_url_template", sa.Text(), nullable=True),
        sa.Column("auto_tagging_enabled", sa.Boolean(), nullable=False, default=False),
        sa.Column("has_partners_badge", sa.Boolean(), nullable=False, default=False),
        sa.Column("manager", sa.Boolean(), nullable=False, default=False),
        sa.Column("test_account", sa.Boolean(), nullable=False, default=False),
        sa.Column(
            "call_reporting_enabled", sa.Boolean(), nullable=False, default=False
        ),
        sa.Column("conversion_tracking_id", sa.String(50), nullable=True),
        sa.Column("google_global_site_tag", sa.String(50), nullable=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("sync_enabled", sa.Boolean(), nullable=False, default=True),
        sa.Column("last_sync_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sync_status", sa.String(20), nullable=False, default="pending"),
        sa.Column("sync_error", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("idx_google_ads_customers_org_id", "organization_id"),
        sa.Index("idx_google_ads_customers_sync_status", "sync_status"),
        sa.Index("idx_google_ads_customers_last_sync", "last_sync_at"),
    )

    # Create google_ads_campaigns table
    op.create_table(
        "google_ads_campaigns",
        sa.Column("id", sa.String(50), nullable=False),
        sa.Column(
            "customer_id",
            sa.String(50),
            sa.ForeignKey("google_ads_customers.id"),
            nullable=False,
        ),
        sa.Column("resource_name", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("serving_status", sa.String(50), nullable=True),
        sa.Column("bidding_strategy_type", sa.String(50), nullable=True),
        sa.Column("budget_id", sa.String(50), nullable=True),
        sa.Column("budget_amount_micros", sa.BigInteger(), nullable=True),
        sa.Column("target_cpa_micros", sa.BigInteger(), nullable=True),
        sa.Column("target_roas", sa.Float(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("ad_serving_optimization_status", sa.String(50), nullable=True),
        sa.Column("advertising_channel_type", sa.String(50), nullable=True),
        sa.Column("advertising_channel_sub_type", sa.String(50), nullable=True),
        sa.Column("network_settings", sa.JSON(), nullable=True),
        sa.Column("geo_target_type_setting", sa.JSON(), nullable=True),
        sa.Column("local_campaign_setting", sa.JSON(), nullable=True),
        sa.Column("app_campaign_setting", sa.JSON(), nullable=True),
        sa.Column("labels", postgresql.ARRAY(sa.String(255)), nullable=True),
        sa.Column("experiment_type", sa.String(50), nullable=True),
        sa.Column("base_campaign", sa.String(255), nullable=True),
        sa.Column("campaign_group", sa.String(255), nullable=True),
        sa.Column("accessible_bidding_strategy", sa.String(255), nullable=True),
        sa.Column("optimization_goal_setting", sa.JSON(), nullable=True),
        sa.Column("audience_setting", sa.JSON(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["google_ads_customers.id"], ondelete="CASCADE"
        ),
        sa.Index("idx_google_ads_campaigns_customer_id", "customer_id"),
        sa.Index("idx_google_ads_campaigns_status", "status"),
        sa.Index("idx_google_ads_campaigns_type", "advertising_channel_type"),
        sa.Index("idx_google_ads_campaigns_budget_id", "budget_id"),
    )

    # Create google_ads_ad_groups table
    op.create_table(
        "google_ads_ad_groups",
        sa.Column("id", sa.String(50), nullable=False),
        sa.Column(
            "campaign_id",
            sa.String(50),
            sa.ForeignKey("google_ads_campaigns.id"),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            sa.String(50),
            sa.ForeignKey("google_ads_customers.id"),
            nullable=False,
        ),
        sa.Column("resource_name", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("type", sa.String(50), nullable=True),
        sa.Column("ad_rotation_mode", sa.String(50), nullable=True),
        sa.Column("cpc_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("cpm_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("target_cpa_micros", sa.BigInteger(), nullable=True),
        sa.Column("cpv_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("target_cpm_micros", sa.BigInteger(), nullable=True),
        sa.Column("percent_cpc_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("explorer_auto_optimizer_setting", sa.JSON(), nullable=True),
        sa.Column("display_custom_bid_dimension", sa.String(50), nullable=True),
        sa.Column("final_url_suffix", sa.String(500), nullable=True),
        sa.Column("tracking_url_template", sa.Text(), nullable=True),
        sa.Column("url_custom_parameters", postgresql.ARRAY(sa.JSON()), nullable=True),
        sa.Column("labels", postgresql.ARRAY(sa.String(255)), nullable=True),
        sa.Column(
            "excluded_parent_asset_field_types",
            postgresql.ARRAY(sa.String(50)),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["campaign_id"], ["google_ads_campaigns.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["google_ads_customers.id"], ondelete="CASCADE"
        ),
        sa.Index("idx_google_ads_ad_groups_campaign_id", "campaign_id"),
        sa.Index("idx_google_ads_ad_groups_customer_id", "customer_id"),
        sa.Index("idx_google_ads_ad_groups_status", "status"),
        sa.Index("idx_google_ads_ad_groups_type", "type"),
    )

    # Create google_ads_ads table
    op.create_table(
        "google_ads_ads",
        sa.Column("id", sa.String(50), nullable=False),
        sa.Column(
            "ad_group_id",
            sa.String(50),
            sa.ForeignKey("google_ads_ad_groups.id"),
            nullable=False,
        ),
        sa.Column(
            "campaign_id",
            sa.String(50),
            sa.ForeignKey("google_ads_campaigns.id"),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            sa.String(50),
            sa.ForeignKey("google_ads_customers.id"),
            nullable=False,
        ),
        sa.Column("resource_name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("system_managed_resource_source", sa.String(50), nullable=True),
        sa.Column("final_urls", postgresql.ARRAY(sa.String(500)), nullable=True),
        sa.Column("final_mobile_urls", postgresql.ARRAY(sa.String(500)), nullable=True),
        sa.Column("tracking_url_template", sa.Text(), nullable=True),
        sa.Column("final_url_suffix", sa.String(500), nullable=True),
        sa.Column("url_custom_parameters", postgresql.ARRAY(sa.JSON()), nullable=True),
        sa.Column("display_url", sa.String(500), nullable=True),
        sa.Column("device_preference", sa.String(20), nullable=True),
        # Ad type specific fields (stored as JSON for flexibility)
        sa.Column("text_ad", sa.JSON(), nullable=True),
        sa.Column("expanded_text_ad", sa.JSON(), nullable=True),
        sa.Column("responsive_search_ad", sa.JSON(), nullable=True),
        sa.Column("responsive_display_ad", sa.JSON(), nullable=True),
        sa.Column("app_ad", sa.JSON(), nullable=True),
        sa.Column("shopping_smart_ad", sa.JSON(), nullable=True),
        sa.Column("shopping_product_ad", sa.JSON(), nullable=True),
        sa.Column("image_ad", sa.JSON(), nullable=True),
        sa.Column("video_ad", sa.JSON(), nullable=True),
        sa.Column("gmail_ad", sa.JSON(), nullable=True),
        sa.Column("app_engagement_ad", sa.JSON(), nullable=True),
        sa.Column("shopping_comparison_listing_ad", sa.JSON(), nullable=True),
        sa.Column("video_responsive_ad", sa.JSON(), nullable=True),
        sa.Column("legacy_responsive_display_ad", sa.JSON(), nullable=True),
        sa.Column("local_ad", sa.JSON(), nullable=True),
        sa.Column("discovery_multi_asset_ad", sa.JSON(), nullable=True),
        sa.Column("discovery_carousel_ad", sa.JSON(), nullable=True),
        sa.Column("labels", postgresql.ARRAY(sa.String(255)), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["ad_group_id"], ["google_ads_ad_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["campaign_id"], ["google_ads_campaigns.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["google_ads_customers.id"], ondelete="CASCADE"
        ),
        sa.Index("idx_google_ads_ads_ad_group_id", "ad_group_id"),
        sa.Index("idx_google_ads_ads_campaign_id", "campaign_id"),
        sa.Index("idx_google_ads_ads_customer_id", "customer_id"),
        sa.Index("idx_google_ads_ads_status", "status"),
        sa.Index("idx_google_ads_ads_type", "type"),
    )

    # Create google_ads_performance_metrics table (daily aggregated metrics)
    op.create_table(
        "google_ads_performance_metrics",
        sa.Column("id", sa.String(255), nullable=False),  # Composite key hash
        sa.Column(
            "customer_id",
            sa.String(50),
            sa.ForeignKey("google_ads_customers.id"),
            nullable=False,
        ),
        sa.Column(
            "campaign_id",
            sa.String(50),
            sa.ForeignKey("google_ads_campaigns.id"),
            nullable=True,
        ),
        sa.Column(
            "ad_group_id",
            sa.String(50),
            sa.ForeignKey("google_ads_ad_groups.id"),
            nullable=True,
        ),
        sa.Column(
            "ad_id", sa.String(50), sa.ForeignKey("google_ads_ads.id"), nullable=True
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "level", sa.String(20), nullable=False
        ),  # customer, campaign, ad_group, ad
        sa.Column("device", sa.String(20), nullable=True),  # DESKTOP, MOBILE, TABLET
        sa.Column("network", sa.String(20), nullable=True),  # SEARCH, DISPLAY, YOUTUBE
        # Core metrics
        sa.Column("impressions", sa.BigInteger(), nullable=False, default=0),
        sa.Column("clicks", sa.BigInteger(), nullable=False, default=0),
        sa.Column("cost_micros", sa.BigInteger(), nullable=False, default=0),
        sa.Column("conversions", sa.Float(), nullable=False, default=0.0),
        sa.Column("conversion_value", sa.Float(), nullable=False, default=0.0),
        sa.Column(
            "view_through_conversions", sa.BigInteger(), nullable=False, default=0
        ),
        # Calculated metrics
        sa.Column("ctr", sa.Float(), nullable=False, default=0.0),
        sa.Column("average_cpc_micros", sa.BigInteger(), nullable=False, default=0),
        sa.Column("average_cpm_micros", sa.BigInteger(), nullable=False, default=0),
        sa.Column("average_cpv_micros", sa.BigInteger(), nullable=False, default=0),
        sa.Column("conversion_rate", sa.Float(), nullable=False, default=0.0),
        sa.Column(
            "cost_per_conversion_micros", sa.BigInteger(), nullable=False, default=0
        ),
        sa.Column("value_per_conversion", sa.Float(), nullable=False, default=0.0),
        sa.Column("return_on_ad_spend", sa.Float(), nullable=False, default=0.0),
        # Additional metrics
        sa.Column("interactions", sa.BigInteger(), nullable=False, default=0),
        sa.Column("interaction_rate", sa.Float(), nullable=False, default=0.0),
        sa.Column(
            "interaction_event_types", postgresql.ARRAY(sa.String(50)), nullable=True
        ),
        sa.Column("video_views", sa.BigInteger(), nullable=False, default=0),
        sa.Column("video_view_rate", sa.Float(), nullable=False, default=0.0),
        sa.Column("video_quartile_p25_rate", sa.Float(), nullable=False, default=0.0),
        sa.Column("video_quartile_p50_rate", sa.Float(), nullable=False, default=0.0),
        sa.Column("video_quartile_p75_rate", sa.Float(), nullable=False, default=0.0),
        sa.Column("video_quartile_p100_rate", sa.Float(), nullable=False, default=0.0),
        # Search metrics
        sa.Column("search_impression_share", sa.Float(), nullable=True),
        sa.Column("search_rank_lost_impression_share", sa.Float(), nullable=True),
        sa.Column("search_budget_lost_impression_share", sa.Float(), nullable=True),
        sa.Column("search_exact_match_impression_share", sa.Float(), nullable=True),
        sa.Column("top_impression_percentage", sa.Float(), nullable=True),
        sa.Column("absolute_top_impression_percentage", sa.Float(), nullable=True),
        # Quality Score metrics (ad group level)
        sa.Column("quality_score", sa.Integer(), nullable=True),
        sa.Column("quality_score_history_quality_score", sa.Integer(), nullable=True),
        sa.Column(
            "quality_score_history_landing_page_score", sa.String(20), nullable=True
        ),
        sa.Column(
            "quality_score_history_ad_relevance_score", sa.String(20), nullable=True
        ),
        sa.Column(
            "quality_score_history_expected_ctr_score", sa.String(20), nullable=True
        ),
        # Cross-device conversions
        sa.Column("cross_device_conversions", sa.Float(), nullable=False, default=0.0),
        # Timestamps
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["google_ads_customers.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["campaign_id"], ["google_ads_campaigns.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["ad_group_id"], ["google_ads_ad_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["ad_id"], ["google_ads_ads.id"], ondelete="CASCADE"),
        sa.Index("idx_google_ads_metrics_customer_date", "customer_id", "date"),
        sa.Index("idx_google_ads_metrics_campaign_date", "campaign_id", "date"),
        sa.Index("idx_google_ads_metrics_level", "level"),
        sa.Index("idx_google_ads_metrics_date", "date"),
        # Composite indexes for common queries
        sa.Index(
            "idx_google_ads_metrics_customer_level_date", "customer_id", "level", "date"
        ),
        sa.Index(
            "idx_google_ads_metrics_campaign_device_date",
            "campaign_id",
            "device",
            "date",
        ),
    )

    # Create google_ads_keywords table
    op.create_table(
        "google_ads_keywords",
        sa.Column("id", sa.String(50), nullable=False),
        sa.Column(
            "ad_group_id",
            sa.String(50),
            sa.ForeignKey("google_ads_ad_groups.id"),
            nullable=False,
        ),
        sa.Column(
            "campaign_id",
            sa.String(50),
            sa.ForeignKey("google_ads_campaigns.id"),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            sa.String(50),
            sa.ForeignKey("google_ads_customers.id"),
            nullable=False,
        ),
        sa.Column("resource_name", sa.String(255), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("text", sa.String(255), nullable=False),
        sa.Column("match_type", sa.String(20), nullable=False),
        sa.Column("cpc_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("cpm_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("cpv_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("percent_cpc_bid_micros", sa.BigInteger(), nullable=True),
        sa.Column("final_urls", postgresql.ARRAY(sa.String(500)), nullable=True),
        sa.Column("final_mobile_urls", postgresql.ARRAY(sa.String(500)), nullable=True),
        sa.Column("final_url_suffix", sa.String(500), nullable=True),
        sa.Column("tracking_url_template", sa.Text(), nullable=True),
        sa.Column("url_custom_parameters", postgresql.ARRAY(sa.JSON()), nullable=True),
        sa.Column("negative", sa.Boolean(), nullable=False, default=False),
        sa.Column("system_serving_status", sa.String(50), nullable=True),
        sa.Column("approval_status", sa.String(50), nullable=True),
        sa.Column(
            "disapproval_reasons", postgresql.ARRAY(sa.String(100)), nullable=True
        ),
        sa.Column("labels", postgresql.ARRAY(sa.String(255)), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["ad_group_id"], ["google_ads_ad_groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["campaign_id"], ["google_ads_campaigns.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["google_ads_customers.id"], ondelete="CASCADE"
        ),
        sa.Index("idx_google_ads_keywords_ad_group_id", "ad_group_id"),
        sa.Index("idx_google_ads_keywords_campaign_id", "campaign_id"),
        sa.Index("idx_google_ads_keywords_customer_id", "customer_id"),
        sa.Index("idx_google_ads_keywords_status", "status"),
        sa.Index("idx_google_ads_keywords_match_type", "match_type"),
        sa.Index("idx_google_ads_keywords_text", "text"),
        sa.Index("idx_google_ads_keywords_negative", "negative"),
    )

    # Create google_ads_budget_recommendations table
    op.create_table(
        "google_ads_budget_recommendations",
        sa.Column("id", sa.String(255), nullable=False),
        sa.Column(
            "customer_id",
            sa.String(50),
            sa.ForeignKey("google_ads_customers.id"),
            nullable=False,
        ),
        sa.Column("resource_name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("campaign_budget", sa.String(255), nullable=True),
        sa.Column("current_budget_amount_micros", sa.BigInteger(), nullable=False),
        sa.Column("recommended_budget_amount_micros", sa.BigInteger(), nullable=False),
        sa.Column("budget_increase_micros", sa.BigInteger(), nullable=False),
        # Impact metrics
        sa.Column("base_impressions", sa.BigInteger(), nullable=False, default=0),
        sa.Column("base_clicks", sa.BigInteger(), nullable=False, default=0),
        sa.Column("base_cost_micros", sa.BigInteger(), nullable=False, default=0),
        sa.Column("potential_impressions", sa.BigInteger(), nullable=False, default=0),
        sa.Column("potential_clicks", sa.BigInteger(), nullable=False, default=0),
        sa.Column("potential_cost_micros", sa.BigInteger(), nullable=False, default=0),
        # Additional fields
        sa.Column("dismissed", sa.Boolean(), nullable=False, default=False),
        sa.Column("applied", sa.Boolean(), nullable=False, default=False),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["google_ads_customers.id"], ondelete="CASCADE"
        ),
        sa.Index("idx_google_ads_budget_recs_customer_id", "customer_id"),
        sa.Index("idx_google_ads_budget_recs_type", "type"),
        sa.Index("idx_google_ads_budget_recs_dismissed", "dismissed"),
        sa.Index("idx_google_ads_budget_recs_applied", "applied"),
    )

    # Create google_ads_sync_logs table for tracking data synchronization
    op.create_table(
        "google_ads_sync_logs",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column(
            "customer_id",
            sa.String(50),
            sa.ForeignKey("google_ads_customers.id"),
            nullable=False,
        ),
        sa.Column(
            "sync_type", sa.String(50), nullable=False
        ),  # full, incremental, metrics_only
        sa.Column(
            "entity_type", sa.String(50), nullable=False
        ),  # customers, campaigns, ad_groups, ads, keywords, metrics
        sa.Column(
            "status", sa.String(20), nullable=False
        ),  # started, completed, failed
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("records_processed", sa.Integer(), nullable=False, default=0),
        sa.Column("records_created", sa.Integer(), nullable=False, default=0),
        sa.Column("records_updated", sa.Integer(), nullable=False, default=0),
        sa.Column("records_deleted", sa.Integer(), nullable=False, default=0),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("error_details", sa.JSON(), nullable=True),
        sa.Column("sync_metadata", sa.JSON(), nullable=True),  # Additional sync details
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["customer_id"], ["google_ads_customers.id"], ondelete="CASCADE"
        ),
        sa.Index("idx_google_ads_sync_logs_customer_id", "customer_id"),
        sa.Index("idx_google_ads_sync_logs_type", "sync_type"),
        sa.Index("idx_google_ads_sync_logs_entity", "entity_type"),
        sa.Index("idx_google_ads_sync_logs_status", "status"),
        sa.Index("idx_google_ads_sync_logs_started_at", "started_at"),
    )


def downgrade() -> None:
    # Drop tables in reverse order due to foreign key constraints
    op.drop_table("google_ads_sync_logs")
    op.drop_table("google_ads_budget_recommendations")
    op.drop_table("google_ads_keywords")
    op.drop_table("google_ads_performance_metrics")
    op.drop_table("google_ads_ads")
    op.drop_table("google_ads_ad_groups")
    op.drop_table("google_ads_campaigns")
    op.drop_table("google_ads_customers")
