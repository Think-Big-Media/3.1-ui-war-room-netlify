-- Manual SQL script for creating Google Ads API tables
-- Run this directly in your Supabase SQL editor if Alembic migration fails

-- Create google_ads_customers table
CREATE TABLE IF NOT EXISTS google_ads_customers (
    id VARCHAR(50) PRIMARY KEY,
    resource_name VARCHAR(255) NOT NULL,
    descriptive_name VARCHAR(255),
    currency_code VARCHAR(3) NOT NULL,
    time_zone VARCHAR(50) NOT NULL,
    tracking_url_template TEXT,
    auto_tagging_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    has_partners_badge BOOLEAN NOT NULL DEFAULT FALSE,
    manager BOOLEAN NOT NULL DEFAULT FALSE,
    test_account BOOLEAN NOT NULL DEFAULT FALSE,
    call_reporting_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    conversion_tracking_id VARCHAR(50),
    google_global_site_tag VARCHAR(50),
    organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id),
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sync_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_customers
CREATE INDEX IF NOT EXISTS idx_google_ads_customers_org_id ON google_ads_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_customers_sync_status ON google_ads_customers(sync_status);
CREATE INDEX IF NOT EXISTS idx_google_ads_customers_last_sync ON google_ads_customers(last_sync_at);

-- Create google_ads_campaigns table
CREATE TABLE IF NOT EXISTS google_ads_campaigns (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES google_ads_customers(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    serving_status VARCHAR(50),
    bidding_strategy_type VARCHAR(50),
    budget_id VARCHAR(50),
    budget_amount_micros BIGINT,
    target_cpa_micros BIGINT,
    target_roas REAL,
    start_date DATE,
    end_date DATE,
    ad_serving_optimization_status VARCHAR(50),
    advertising_channel_type VARCHAR(50),
    advertising_channel_sub_type VARCHAR(50),
    network_settings JSONB,
    geo_target_type_setting JSONB,
    local_campaign_setting JSONB,
    app_campaign_setting JSONB,
    labels TEXT[],
    experiment_type VARCHAR(50),
    base_campaign VARCHAR(255),
    campaign_group VARCHAR(255),
    accessible_bidding_strategy VARCHAR(255),
    optimization_goal_setting JSONB,
    audience_setting JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_campaigns
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_customer_id ON google_ads_campaigns(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_status ON google_ads_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_type ON google_ads_campaigns(advertising_channel_type);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_budget_id ON google_ads_campaigns(budget_id);

-- Create google_ads_ad_groups table
CREATE TABLE IF NOT EXISTS google_ads_ad_groups (
    id VARCHAR(50) PRIMARY KEY,
    campaign_id VARCHAR(50) NOT NULL REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES google_ads_customers(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    type VARCHAR(50),
    ad_rotation_mode VARCHAR(50),
    cpc_bid_micros BIGINT,
    cpm_bid_micros BIGINT,
    target_cpa_micros BIGINT,
    cpv_bid_micros BIGINT,
    target_cpm_micros BIGINT,
    percent_cpc_bid_micros BIGINT,
    explorer_auto_optimizer_setting JSONB,
    display_custom_bid_dimension VARCHAR(50),
    final_url_suffix VARCHAR(500),
    tracking_url_template TEXT,
    url_custom_parameters JSONB[],
    labels TEXT[],
    excluded_parent_asset_field_types TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_ad_groups
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_groups_campaign_id ON google_ads_ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_groups_customer_id ON google_ads_ad_groups(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_groups_status ON google_ads_ad_groups(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_ad_groups_type ON google_ads_ad_groups(type);

-- Create google_ads_ads table
CREATE TABLE IF NOT EXISTS google_ads_ads (
    id VARCHAR(50) PRIMARY KEY,
    ad_group_id VARCHAR(50) NOT NULL REFERENCES google_ads_ad_groups(id) ON DELETE CASCADE,
    campaign_id VARCHAR(50) NOT NULL REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES google_ads_customers(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    system_managed_resource_source VARCHAR(50),
    final_urls TEXT[],
    final_mobile_urls TEXT[],
    tracking_url_template TEXT,
    final_url_suffix VARCHAR(500),
    url_custom_parameters JSONB[],
    display_url VARCHAR(500),
    device_preference VARCHAR(20),
    -- Ad type specific fields (stored as JSON for flexibility)
    text_ad JSONB,
    expanded_text_ad JSONB,
    responsive_search_ad JSONB,
    responsive_display_ad JSONB,
    app_ad JSONB,
    shopping_smart_ad JSONB,
    shopping_product_ad JSONB,
    image_ad JSONB,
    video_ad JSONB,
    gmail_ad JSONB,
    app_engagement_ad JSONB,
    shopping_comparison_listing_ad JSONB,
    video_responsive_ad JSONB,
    legacy_responsive_display_ad JSONB,
    local_ad JSONB,
    discovery_multi_asset_ad JSONB,
    discovery_carousel_ad JSONB,
    labels TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_ads
CREATE INDEX IF NOT EXISTS idx_google_ads_ads_ad_group_id ON google_ads_ads(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ads_campaign_id ON google_ads_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ads_customer_id ON google_ads_ads(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ads_status ON google_ads_ads(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_ads_type ON google_ads_ads(type);

-- Create google_ads_performance_metrics table (daily aggregated metrics)
CREATE TABLE IF NOT EXISTS google_ads_performance_metrics (
    id VARCHAR(255) PRIMARY KEY,  -- Composite key hash
    customer_id VARCHAR(50) NOT NULL REFERENCES google_ads_customers(id) ON DELETE CASCADE,
    campaign_id VARCHAR(50) REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
    ad_group_id VARCHAR(50) REFERENCES google_ads_ad_groups(id) ON DELETE CASCADE,
    ad_id VARCHAR(50) REFERENCES google_ads_ads(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    level VARCHAR(20) NOT NULL,  -- customer, campaign, ad_group, ad
    device VARCHAR(20),  -- DESKTOP, MOBILE, TABLET
    network VARCHAR(20),  -- SEARCH, DISPLAY, YOUTUBE
    -- Core metrics
    impressions BIGINT NOT NULL DEFAULT 0,
    clicks BIGINT NOT NULL DEFAULT 0,
    cost_micros BIGINT NOT NULL DEFAULT 0,
    conversions REAL NOT NULL DEFAULT 0.0,
    conversion_value REAL NOT NULL DEFAULT 0.0,
    view_through_conversions BIGINT NOT NULL DEFAULT 0,
    -- Calculated metrics
    ctr REAL NOT NULL DEFAULT 0.0,
    average_cpc_micros BIGINT NOT NULL DEFAULT 0,
    average_cpm_micros BIGINT NOT NULL DEFAULT 0,
    average_cpv_micros BIGINT NOT NULL DEFAULT 0,
    conversion_rate REAL NOT NULL DEFAULT 0.0,
    cost_per_conversion_micros BIGINT NOT NULL DEFAULT 0,
    value_per_conversion REAL NOT NULL DEFAULT 0.0,
    return_on_ad_spend REAL NOT NULL DEFAULT 0.0,
    -- Additional metrics
    interactions BIGINT NOT NULL DEFAULT 0,
    interaction_rate REAL NOT NULL DEFAULT 0.0,
    interaction_event_types TEXT[],
    video_views BIGINT NOT NULL DEFAULT 0,
    video_view_rate REAL NOT NULL DEFAULT 0.0,
    video_quartile_p25_rate REAL NOT NULL DEFAULT 0.0,
    video_quartile_p50_rate REAL NOT NULL DEFAULT 0.0,
    video_quartile_p75_rate REAL NOT NULL DEFAULT 0.0,
    video_quartile_p100_rate REAL NOT NULL DEFAULT 0.0,
    -- Search metrics
    search_impression_share REAL,
    search_rank_lost_impression_share REAL,
    search_budget_lost_impression_share REAL,
    search_exact_match_impression_share REAL,
    top_impression_percentage REAL,
    absolute_top_impression_percentage REAL,
    -- Quality Score metrics (ad group level)
    quality_score INTEGER,
    quality_score_history_quality_score INTEGER,
    quality_score_history_landing_page_score VARCHAR(20),
    quality_score_history_ad_relevance_score VARCHAR(20),
    quality_score_history_expected_ctr_score VARCHAR(20),
    -- Cross-device conversions
    cross_device_conversions REAL NOT NULL DEFAULT 0.0,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_performance_metrics
CREATE INDEX IF NOT EXISTS idx_google_ads_metrics_customer_date ON google_ads_performance_metrics(customer_id, date);
CREATE INDEX IF NOT EXISTS idx_google_ads_metrics_campaign_date ON google_ads_performance_metrics(campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_google_ads_metrics_level ON google_ads_performance_metrics(level);
CREATE INDEX IF NOT EXISTS idx_google_ads_metrics_date ON google_ads_performance_metrics(date);
-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_google_ads_metrics_customer_level_date ON google_ads_performance_metrics(customer_id, level, date);
CREATE INDEX IF NOT EXISTS idx_google_ads_metrics_campaign_device_date ON google_ads_performance_metrics(campaign_id, device, date);

-- Create google_ads_keywords table
CREATE TABLE IF NOT EXISTS google_ads_keywords (
    id VARCHAR(50) PRIMARY KEY,
    ad_group_id VARCHAR(50) NOT NULL REFERENCES google_ads_ad_groups(id) ON DELETE CASCADE,
    campaign_id VARCHAR(50) NOT NULL REFERENCES google_ads_campaigns(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES google_ads_customers(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    text VARCHAR(255) NOT NULL,
    match_type VARCHAR(20) NOT NULL,
    cpc_bid_micros BIGINT,
    cpm_bid_micros BIGINT,
    cpv_bid_micros BIGINT,
    percent_cpc_bid_micros BIGINT,
    final_urls TEXT[],
    final_mobile_urls TEXT[],
    final_url_suffix VARCHAR(500),
    tracking_url_template TEXT,
    url_custom_parameters JSONB[],
    negative BOOLEAN NOT NULL DEFAULT FALSE,
    system_serving_status VARCHAR(50),
    approval_status VARCHAR(50),
    disapproval_reasons TEXT[],
    labels TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_keywords
CREATE INDEX IF NOT EXISTS idx_google_ads_keywords_ad_group_id ON google_ads_keywords(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_keywords_campaign_id ON google_ads_keywords(campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_keywords_customer_id ON google_ads_keywords(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_keywords_status ON google_ads_keywords(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_keywords_match_type ON google_ads_keywords(match_type);
CREATE INDEX IF NOT EXISTS idx_google_ads_keywords_text ON google_ads_keywords(text);
CREATE INDEX IF NOT EXISTS idx_google_ads_keywords_negative ON google_ads_keywords(negative);

-- Create google_ads_budget_recommendations table
CREATE TABLE IF NOT EXISTS google_ads_budget_recommendations (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES google_ads_customers(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    campaign_budget VARCHAR(255),
    current_budget_amount_micros BIGINT NOT NULL,
    recommended_budget_amount_micros BIGINT NOT NULL,
    budget_increase_micros BIGINT NOT NULL,
    -- Impact metrics
    base_impressions BIGINT NOT NULL DEFAULT 0,
    base_clicks BIGINT NOT NULL DEFAULT 0,
    base_cost_micros BIGINT NOT NULL DEFAULT 0,
    potential_impressions BIGINT NOT NULL DEFAULT 0,
    potential_clicks BIGINT NOT NULL DEFAULT 0,
    potential_cost_micros BIGINT NOT NULL DEFAULT 0,
    -- Additional fields
    dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    applied BOOLEAN NOT NULL DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_budget_recommendations
CREATE INDEX IF NOT EXISTS idx_google_ads_budget_recs_customer_id ON google_ads_budget_recommendations(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_budget_recs_type ON google_ads_budget_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_google_ads_budget_recs_dismissed ON google_ads_budget_recommendations(dismissed);
CREATE INDEX IF NOT EXISTS idx_google_ads_budget_recs_applied ON google_ads_budget_recommendations(applied);

-- Create google_ads_sync_logs table for tracking data synchronization
CREATE TABLE IF NOT EXISTS google_ads_sync_logs (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL REFERENCES google_ads_customers(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,  -- full, incremental, metrics_only
    entity_type VARCHAR(50) NOT NULL,  -- customers, campaigns, ad_groups, ads, keywords, metrics
    status VARCHAR(20) NOT NULL,  -- started, completed, failed
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    records_processed INTEGER NOT NULL DEFAULT 0,
    records_created INTEGER NOT NULL DEFAULT 0,
    records_updated INTEGER NOT NULL DEFAULT 0,
    records_deleted INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    sync_metadata JSONB,  -- Additional sync details
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for google_ads_sync_logs
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_logs_customer_id ON google_ads_sync_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_logs_type ON google_ads_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_logs_entity ON google_ads_sync_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_logs_status ON google_ads_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_sync_logs_started_at ON google_ads_sync_logs(started_at);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_google_ads_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all Google Ads tables
DROP TRIGGER IF EXISTS update_google_ads_customers_updated_at ON google_ads_customers;
CREATE TRIGGER update_google_ads_customers_updated_at
    BEFORE UPDATE ON google_ads_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_updated_at_column();

DROP TRIGGER IF EXISTS update_google_ads_campaigns_updated_at ON google_ads_campaigns;
CREATE TRIGGER update_google_ads_campaigns_updated_at
    BEFORE UPDATE ON google_ads_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_updated_at_column();

DROP TRIGGER IF EXISTS update_google_ads_ad_groups_updated_at ON google_ads_ad_groups;
CREATE TRIGGER update_google_ads_ad_groups_updated_at
    BEFORE UPDATE ON google_ads_ad_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_updated_at_column();

DROP TRIGGER IF EXISTS update_google_ads_ads_updated_at ON google_ads_ads;
CREATE TRIGGER update_google_ads_ads_updated_at
    BEFORE UPDATE ON google_ads_ads
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_updated_at_column();

DROP TRIGGER IF EXISTS update_google_ads_metrics_updated_at ON google_ads_performance_metrics;
CREATE TRIGGER update_google_ads_metrics_updated_at
    BEFORE UPDATE ON google_ads_performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_updated_at_column();

DROP TRIGGER IF EXISTS update_google_ads_keywords_updated_at ON google_ads_keywords;
CREATE TRIGGER update_google_ads_keywords_updated_at
    BEFORE UPDATE ON google_ads_keywords
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_updated_at_column();

DROP TRIGGER IF EXISTS update_google_ads_budget_recs_updated_at ON google_ads_budget_recommendations;
CREATE TRIGGER update_google_ads_budget_recs_updated_at
    BEFORE UPDATE ON google_ads_budget_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_google_ads_updated_at_column();

-- Create materialized view for Google Ads campaign performance summary
DROP MATERIALIZED VIEW IF EXISTS google_ads_campaign_performance_summary;
CREATE MATERIALIZED VIEW google_ads_campaign_performance_summary AS
SELECT 
    c.customer_id,
    c.id as campaign_id,
    c.name as campaign_name,
    c.status as campaign_status,
    c.advertising_channel_type,
    c.budget_amount_micros,
    -- Last 30 days performance
    COALESCE(SUM(m.impressions), 0) as impressions_30d,
    COALESCE(SUM(m.clicks), 0) as clicks_30d,
    COALESCE(SUM(m.cost_micros), 0) as cost_micros_30d,
    COALESCE(SUM(m.conversions), 0) as conversions_30d,
    COALESCE(SUM(m.conversion_value), 0) as conversion_value_30d,
    -- Calculated metrics
    CASE 
        WHEN SUM(m.impressions) > 0 
        THEN (SUM(m.clicks)::REAL / SUM(m.impressions)::REAL) * 100 
        ELSE 0 
    END as ctr_30d,
    CASE 
        WHEN SUM(m.clicks) > 0 
        THEN SUM(m.cost_micros) / SUM(m.clicks) 
        ELSE 0 
    END as avg_cpc_micros_30d,
    CASE 
        WHEN SUM(m.cost_micros) > 0 
        THEN (SUM(m.conversion_value) / (SUM(m.cost_micros)::REAL / 1000000))
        ELSE 0 
    END as roas_30d,
    -- Meta information
    COUNT(DISTINCT m.date) as active_days_30d,
    MAX(m.date) as last_active_date
FROM google_ads_campaigns c
LEFT JOIN google_ads_performance_metrics m ON c.id = m.campaign_id 
    AND m.date >= CURRENT_DATE - INTERVAL '30 days'
    AND m.level = 'campaign'
GROUP BY c.customer_id, c.id, c.name, c.status, c.advertising_channel_type, c.budget_amount_micros
ORDER BY cost_micros_30d DESC;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_google_ads_campaign_summary_unique 
ON google_ads_campaign_performance_summary(customer_id, campaign_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_google_ads_campaign_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY google_ads_campaign_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON google_ads_customers TO your_app_user;
-- GRANT ALL ON google_ads_campaigns TO your_app_user;
-- GRANT ALL ON google_ads_ad_groups TO your_app_user;
-- GRANT ALL ON google_ads_ads TO your_app_user;
-- GRANT ALL ON google_ads_performance_metrics TO your_app_user;
-- GRANT ALL ON google_ads_keywords TO your_app_user;
-- GRANT ALL ON google_ads_budget_recommendations TO your_app_user;
-- GRANT ALL ON google_ads_sync_logs TO your_app_user;
-- GRANT SELECT ON google_ads_campaign_performance_summary TO your_app_user;

-- Optional: Create a scheduled job to refresh the materialized view every hour
-- SELECT cron.schedule('refresh-google-ads-summary', '0 * * * *', 'SELECT refresh_google_ads_campaign_summary();');