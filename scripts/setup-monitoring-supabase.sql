-- Monitoring System Tables for Supabase
-- Run this script in the Supabase SQL editor to set up monitoring tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create monitoring_events table
CREATE TABLE IF NOT EXISTS monitoring_events (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('news', 'social', 'mention', 'forum', 'review')),
    timestamp TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    author JSONB NOT NULL,
    platform TEXT NOT NULL,
    sentiment JSONB NOT NULL,
    metrics JSONB,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    mentions TEXT[] NOT NULL DEFAULT '{}',
    language TEXT,
    location JSONB,
    influence_score INTEGER,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for monitoring_events
CREATE INDEX idx_monitoring_events_timestamp ON monitoring_events(timestamp);
CREATE INDEX idx_monitoring_events_source ON monitoring_events(source);
CREATE INDEX idx_monitoring_events_platform ON monitoring_events(platform);
CREATE INDEX idx_monitoring_events_keywords ON monitoring_events USING gin(keywords);
CREATE INDEX idx_monitoring_events_sentiment ON monitoring_events USING gin(sentiment);

-- Create monitoring_alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id TEXT PRIMARY KEY,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    type TEXT NOT NULL CHECK (type IN ('volume_spike', 'sentiment_drop', 'negative_trend', 'viral_negative')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    trigger_event_ids JSONB NOT NULL,
    trigger_conditions JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by TEXT,
    escalated BOOLEAN DEFAULT FALSE NOT NULL,
    affected_keywords JSONB NOT NULL,
    affected_platforms JSONB NOT NULL,
    estimated_reach BIGINT NOT NULL,
    metadata JSONB
);

-- Create indexes for monitoring_alerts
CREATE INDEX idx_monitoring_alerts_created_at ON monitoring_alerts(created_at);
CREATE INDEX idx_monitoring_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX idx_monitoring_alerts_type ON monitoring_alerts(type);
CREATE INDEX idx_monitoring_alerts_status ON monitoring_alerts(status);

-- Create monitoring_alert_subscribers table
CREATE TABLE IF NOT EXISTS monitoring_alert_subscribers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type TEXT NOT NULL CHECK (type IN ('websocket', 'email', 'sms', 'webhook')),
    endpoint TEXT NOT NULL,
    filters JSONB,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create monitoring_metrics table
CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    events_processed_total INTEGER NOT NULL,
    events_per_minute FLOAT NOT NULL,
    alerts_generated INTEGER NOT NULL,
    processing_latency_ms FLOAT NOT NULL,
    duplicate_events_filtered INTEGER NOT NULL,
    sentiment_distribution JSONB NOT NULL,
    platform_distribution JSONB NOT NULL,
    service_health JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_monitoring_metrics_timestamp ON monitoring_metrics(timestamp);

-- Create monitoring_webhooks table
CREATE TABLE IF NOT EXISTS monitoring_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT,
    events TEXT[] NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    last_triggered TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create views for analytics
CREATE OR REPLACE VIEW monitoring_alerts_summary AS
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

CREATE OR REPLACE VIEW monitoring_events_summary AS
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

-- Enable Row Level Security (RLS)
ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_webhooks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read monitoring events"
ON monitoring_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert monitoring events"
ON monitoring_events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read monitoring alerts"
ON monitoring_alerts FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to manage alert subscriptions"
ON monitoring_alert_subscribers FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to read monitoring metrics"
ON monitoring_metrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service role to manage monitoring metrics"
ON monitoring_metrics FOR ALL
TO service_role
USING (true);

-- Create real-time publication for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE monitoring_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE monitoring_events;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_monitoring_alerts_updated_at BEFORE UPDATE ON monitoring_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_alert_subscribers_updated_at BEFORE UPDATE ON monitoring_alert_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_webhooks_updated_at BEFORE UPDATE ON monitoring_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void AS $$
BEGIN
    -- Delete events older than 30 days
    DELETE FROM monitoring_events WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete resolved alerts older than 7 days
    DELETE FROM monitoring_alerts WHERE status = 'resolved' AND updated_at < NOW() - INTERVAL '7 days';
    
    -- Delete metrics older than 90 days
    DELETE FROM monitoring_metrics WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_monitoring_events_created_at ON monitoring_events(created_at);
CREATE INDEX idx_monitoring_alerts_acknowledged ON monitoring_alerts(acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_monitoring_alerts_escalated ON monitoring_alerts(escalated) WHERE escalated = true;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO monitoring_alert_subscribers (type, endpoint, filters) VALUES
-- ('email', 'alerts@warroom.com', '{"severity": ["critical", "high"]}'::jsonb),
-- ('webhook', 'https://api.warroom.com/webhooks/alerts', '{"types": ["viral_negative"]}'::jsonb);

COMMENT ON TABLE monitoring_events IS 'Stores all monitoring events from various sources';
COMMENT ON TABLE monitoring_alerts IS 'Stores crisis alerts generated by the detection system';
COMMENT ON TABLE monitoring_alert_subscribers IS 'Manages alert delivery subscriptions';
COMMENT ON TABLE monitoring_metrics IS 'Stores monitoring pipeline performance metrics';
COMMENT ON TABLE monitoring_webhooks IS 'Webhook configurations for real-time event delivery';