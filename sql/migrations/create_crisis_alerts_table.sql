-- Crisis Alerts Table Migration
-- Creates table for storing crisis detection alerts with comprehensive tracking

-- Create crisis_alerts table
CREATE TABLE IF NOT EXISTS public.crisis_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Core alert data
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 10),
    threat_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    affected_topics TEXT[] NOT NULL DEFAULT '{}',
    
    -- Status and timing
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'investigating', 'resolved', 'dismissed')),
    
    -- Metrics
    mentions_count INTEGER NOT NULL DEFAULT 0,
    reach BIGINT NOT NULL DEFAULT 0,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Actions and recommendations
    recommended_actions TEXT[] NOT NULL DEFAULT '{}',
    source VARCHAR(100) NOT NULL DEFAULT 'Mentionlytics',
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Assignment and resolution
    assigned_to VARCHAR(200),
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    
    -- Metadata and tracking
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_organization_id ON public.crisis_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_status ON public.crisis_alerts(status);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON public.crisis_alerts(severity DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_timestamp ON public.crisis_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_urgency ON public.crisis_alerts(urgency_level);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_escalated ON public.crisis_alerts(escalated) WHERE escalated = TRUE;
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_active ON public.crisis_alerts(organization_id, status, timestamp DESC) WHERE status IN ('active', 'acknowledged', 'investigating');

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_org_status_severity ON public.crisis_alerts(organization_id, status, severity DESC, timestamp DESC);

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_crisis_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_crisis_alerts_updated_at ON public.crisis_alerts;
CREATE TRIGGER trigger_crisis_alerts_updated_at
    BEFORE UPDATE ON public.crisis_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_crisis_alerts_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access alerts for their organization
CREATE POLICY "Users can access their organization's crisis alerts" ON public.crisis_alerts
    FOR ALL USING (
        organization_id IN (
            SELECT id FROM public.organizations 
            WHERE id IN (
                SELECT organization_id FROM public.user_organizations 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Service role can access all alerts (for system operations)
CREATE POLICY "Service role can access all crisis alerts" ON public.crisis_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- Create alert_statistics view for analytics
CREATE OR REPLACE VIEW public.crisis_alert_statistics AS
SELECT 
    organization_id,
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE status IN ('active', 'acknowledged', 'investigating')) as active_alerts,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'dismissed')) as resolved_alerts,
    ROUND(AVG(severity), 2) as avg_severity,
    MAX(severity) as max_severity,
    COUNT(*) FILTER (WHERE severity >= 8) as critical_alerts,
    COUNT(*) FILTER (WHERE severity >= 6 AND severity < 8) as high_alerts,
    COUNT(*) FILTER (WHERE severity >= 4 AND severity < 6) as medium_alerts,
    COUNT(*) FILTER (WHERE severity < 4) as low_alerts,
    COUNT(*) FILTER (WHERE escalated = TRUE) as escalated_alerts,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') as alerts_last_24h,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') as alerts_last_7d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '30 days') as alerts_last_30d
FROM public.crisis_alerts
GROUP BY organization_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crisis_alerts TO authenticated;
GRANT SELECT ON public.crisis_alert_statistics TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create alert archival function for cleanup
CREATE OR REPLACE FUNCTION archive_old_crisis_alerts(
    org_id UUID,
    days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move alerts older than specified days to archived status in metadata
    UPDATE public.crisis_alerts 
    SET 
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'archived', true,
            'archived_at', NOW(),
            'archived_reason', 'automatic_cleanup'
        ),
        updated_at = NOW()
    WHERE 
        organization_id = org_id
        AND status IN ('resolved', 'dismissed')
        AND timestamp < (NOW() - (days_old || ' days')::INTERVAL)
        AND (metadata->>'archived')::boolean IS NOT TRUE;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get alert trends
CREATE OR REPLACE FUNCTION get_crisis_alert_trends(
    org_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    date_bucket DATE,
    total_alerts BIGINT,
    avg_severity NUMERIC,
    critical_alerts BIGINT,
    high_alerts BIGINT,
    medium_alerts BIGINT,
    low_alerts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(timestamp) as date_bucket,
        COUNT(*) as total_alerts,
        ROUND(AVG(severity), 2) as avg_severity,
        COUNT(*) FILTER (WHERE severity >= 8) as critical_alerts,
        COUNT(*) FILTER (WHERE severity >= 6 AND severity < 8) as high_alerts,
        COUNT(*) FILTER (WHERE severity >= 4 AND severity < 6) as medium_alerts,
        COUNT(*) FILTER (WHERE severity < 4) as low_alerts
    FROM public.crisis_alerts
    WHERE 
        organization_id = org_id
        AND timestamp >= (NOW() - (days_back || ' days')::INTERVAL)
    GROUP BY DATE(timestamp)
    ORDER BY date_bucket DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some example data for development (optional)
-- Uncomment below for development setup
/*
INSERT INTO public.crisis_alerts (
    organization_id,
    severity,
    threat_type,
    title,
    description,
    affected_topics,
    mentions_count,
    reach,
    confidence,
    urgency_level,
    recommended_actions,
    source,
    escalated
) VALUES 
(
    (SELECT id FROM public.organizations LIMIT 1), -- Use first organization
    8,
    'misinformation_spread',
    'CRITICAL: Viral Misinformation Campaign Detected',
    'False claims about healthcare policy spreading rapidly across social platforms with 125,000 total reach',
    ARRAY['healthcare', 'policy', 'credibility'],
    247,
    125000,
    0.89,
    'critical',
    ARRAY['Issue immediate fact-check response', 'Contact platform moderators', 'Prepare comprehensive rebuttal'],
    'Mentionlytics',
    true
),
(
    (SELECT id FROM public.organizations LIMIT 1),
    6,
    'negative_sentiment_spike', 
    'HIGH: Negative Sentiment Spike on Economic Policy',
    'Unusual increase in negative mentions regarding economic proposals with 34,000 reach',
    ARRAY['economy', 'taxes', 'small_business'],
    89,
    34000,
    0.74,
    'high',
    ARRAY['Monitor for 2 more hours', 'Prepare economic policy clarification', 'Engage supportive economists'],
    'Mentionlytics',
    false
);
*/

-- Add comments for documentation
COMMENT ON TABLE public.crisis_alerts IS 'Stores crisis detection alerts from monitoring systems';
COMMENT ON COLUMN public.crisis_alerts.severity IS 'Crisis severity on 1-10 scale (10 being most severe)';
COMMENT ON COLUMN public.crisis_alerts.confidence IS 'AI confidence in crisis assessment (0-1)';
COMMENT ON COLUMN public.crisis_alerts.reach IS 'Total reach/impressions of mentions';
COMMENT ON COLUMN public.crisis_alerts.metadata IS 'Additional structured data about the alert';

-- Create notification for real-time updates
CREATE OR REPLACE FUNCTION notify_crisis_alert_change()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'crisis_alert_changes',
        json_build_object(
            'operation', TG_OP,
            'organization_id', COALESCE(NEW.organization_id, OLD.organization_id),
            'alert_id', COALESCE(NEW.id, OLD.id),
            'severity', COALESCE(NEW.severity, OLD.severity)
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crisis_alert_change_trigger ON public.crisis_alerts;
CREATE TRIGGER crisis_alert_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.crisis_alerts
    FOR EACH ROW EXECUTE FUNCTION notify_crisis_alert_change();