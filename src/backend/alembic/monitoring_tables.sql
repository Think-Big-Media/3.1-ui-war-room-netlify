-- Manual SQL script for creating monitoring tables
-- Run this directly in your Supabase SQL editor if Alembic migration fails

-- Create monitoring_events table
CREATE TABLE IF NOT EXISTS monitoring_events (
    id VARCHAR(255) PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    title TEXT,
    content TEXT,
    url TEXT,
    author JSONB,
    platform VARCHAR(100),
    sentiment JSONB,
    metrics JSONB,
    keywords TEXT[],
    mentions TEXT[],
    language VARCHAR(10),
    location JSONB,
    influence_score INTEGER,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for monitoring_events
CREATE INDEX IF NOT EXISTS idx_monitoring_events_source ON monitoring_events(source);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_type ON monitoring_events(type);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_timestamp ON monitoring_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_platform ON monitoring_events(platform);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_created_at ON monitoring_events(created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_sentiment_score ON monitoring_events((sentiment->>'score')::float);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_reach ON monitoring_events((metrics->>'reach')::integer);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_monitoring_events_author_gin ON monitoring_events USING gin(author);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_sentiment_gin ON monitoring_events USING gin(sentiment);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_metrics_gin ON monitoring_events USING gin(metrics);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_location_gin ON monitoring_events USING gin(location);

-- Create GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_monitoring_events_keywords_gin ON monitoring_events USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_mentions_gin ON monitoring_events USING gin(mentions);

-- Create crisis_alerts table
CREATE TABLE IF NOT EXISTS crisis_alerts (
    id VARCHAR(255) PRIMARY KEY,
    severity VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    trigger_event_ids TEXT[],
    trigger_conditions JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    escalated BOOLEAN NOT NULL DEFAULT false,
    affected_keywords TEXT[],
    affected_platforms TEXT[],
    estimated_reach BIGINT,
    metadata JSONB,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for crisis_alerts
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON crisis_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_type ON crisis_alerts(type);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_status ON crisis_alerts(status);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_escalated ON crisis_alerts(escalated);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_created_at ON crisis_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_acknowledged_at ON crisis_alerts(acknowledged_at);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_resolved_at ON crisis_alerts(resolved_at);

-- Create GIN indexes for crisis_alerts JSONB and array columns
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_trigger_conditions_gin ON crisis_alerts USING gin(trigger_conditions);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_metadata_gin ON crisis_alerts USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_keywords_gin ON crisis_alerts USING gin(affected_keywords);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_platforms_gin ON crisis_alerts USING gin(affected_platforms);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_trigger_events_gin ON crisis_alerts USING gin(trigger_event_ids);

-- Create monitoring_pipeline_metrics table for performance tracking
CREATE TABLE IF NOT EXISTS monitoring_pipeline_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    events_processed_total INTEGER NOT NULL DEFAULT 0,
    events_per_minute FLOAT NOT NULL DEFAULT 0,
    alerts_generated INTEGER NOT NULL DEFAULT 0,
    processing_latency_ms FLOAT NOT NULL DEFAULT 0,
    duplicate_events_filtered INTEGER NOT NULL DEFAULT 0,
    service_health JSONB,
    sentiment_distribution JSONB,
    platform_distribution JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for monitoring_pipeline_metrics
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_timestamp ON monitoring_pipeline_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_events_per_minute ON monitoring_pipeline_metrics(events_per_minute);
CREATE INDEX IF NOT EXISTS idx_pipeline_metrics_processing_latency ON monitoring_pipeline_metrics(processing_latency_ms);

-- Create monitoring_service_health table for service status tracking
CREATE TABLE IF NOT EXISTS monitoring_service_health (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_successful_request TIMESTAMPTZ,
    last_error JSONB,
    rate_limit_remaining INTEGER,
    rate_limit_reset_time TIMESTAMPTZ,
    response_time_ms FLOAT,
    uptime_percentage FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for monitoring_service_health
CREATE INDEX IF NOT EXISTS idx_service_health_service_name ON monitoring_service_health(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_status ON monitoring_service_health(status);
CREATE INDEX IF NOT EXISTS idx_service_health_updated_at ON monitoring_service_health(updated_at);

-- Create unique constraint to ensure one record per service
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_health_unique_service ON monitoring_service_health(service_name);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_monitoring_events_updated_at ON monitoring_events;
CREATE TRIGGER update_monitoring_events_updated_at
    BEFORE UPDATE ON monitoring_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crisis_alerts_updated_at ON crisis_alerts;
CREATE TRIGGER update_crisis_alerts_updated_at
    BEFORE UPDATE ON crisis_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_health_updated_at ON monitoring_service_health;
CREATE TRIGGER update_service_health_updated_at
    BEFORE UPDATE ON monitoring_service_health
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for sentiment trend analysis (used by EventStore)
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

-- Create materialized view for faster analytics queries
DROP MATERIALIZED VIEW IF EXISTS monitoring_hourly_stats;
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

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_stats_unique ON monitoring_hourly_stats(hour, source, platform);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_monitoring_hourly_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monitoring_hourly_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON monitoring_events TO your_app_user;
-- GRANT ALL ON crisis_alerts TO your_app_user;
-- GRANT ALL ON monitoring_pipeline_metrics TO your_app_user;
-- GRANT ALL ON monitoring_service_health TO your_app_user;
-- GRANT SELECT ON monitoring_hourly_stats TO your_app_user;

-- Optional: Create a scheduled job to refresh the materialized view every hour
-- SELECT cron.schedule('refresh-monitoring-stats', '0 * * * *', 'SELECT refresh_monitoring_hourly_stats();');