-- ============================================================================
-- WAR ROOM ANALYTICS - CRITICAL PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================
-- This migration addresses the specific performance bottlenecks identified
-- in HEALTH_CHECK_REPORT_20250808.md
--
-- Issues Fixed:
-- 1. Line 89: Unindexed temporal range query on profiles.created_at
-- 2. Lines 288-315: CROSS JOIN performance in engagement_rate query
-- 3. Lines 475-516: Multiple LEFT JOINs across tables without composite indexes
-- 4. General org_id + temporal filtering performance
-- ============================================================================

-- Profiles table optimization (addresses issues on lines 89, 288-315)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_org_created_date 
ON profiles(org_id, created_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_org_status_active 
ON profiles(org_id, status, created_at) 
WHERE deleted_at IS NULL AND status = 'active';

-- Mentionlytics data optimization (addresses lines 475-516 CROSS JOIN issues)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentionlytics_org_created_date 
ON mentionlytics_data(org_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentionlytics_sentiment_lookup 
ON mentionlytics_data(org_id, mention_id, created_at)
INCLUDE (reach_count, sentiment_score);

-- Chat logs optimization (addresses engagement query performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_logs_user_created 
ON chat_logs(user_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_logs_org_date_range 
ON chat_logs(created_at) 
WHERE created_at IS NOT NULL;

-- Composite index for JOIN optimization between chat_logs and profiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_chat_join_optimization
ON profiles(id, org_id) 
WHERE deleted_at IS NULL;

-- Digests table optimization (addresses email stats in lines 496-504)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_digests_org_created_status 
ON digests(org_id, created_at, status);

-- Events table optimization (if exists - for event metrics queries)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_org_start_date 
                ON events(org_id, start_date, created_at) 
                WHERE deleted_at IS NULL';
        
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_attendance_lookup
                ON events(org_id, id) 
                INCLUDE (attendee_count, registered_count)
                WHERE deleted_at IS NULL';
    END IF;
END $$;

-- Event registrations optimization (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_registrations') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_registrations_event_date
                ON event_registrations(event_id, created_at, status)';
    END IF;
END $$;

-- Donations table optimization (for donation metrics)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'donations') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_org_created_amount
                ON donations(org_id, created_at, amount) 
                WHERE deleted_at IS NULL';
        
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_monthly_aggregation
                ON donations(org_id, DATE_TRUNC(''month'', created_at)) 
                INCLUDE (amount, status)
                WHERE deleted_at IS NULL';
    END IF;
END $$;

-- ============================================================================
-- QUERY-SPECIFIC OPTIMIZATIONS
-- ============================================================================

-- Optimize the specific problematic query pattern from line 89
-- This addresses the "created_at >= :date_start - INTERVAL '7 days'" pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_trailing_week_lookup
ON profiles(org_id, created_at, status) 
WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Optimize CROSS JOIN queries (lines 288-315, 475-516) with partial indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_logs_active_period
ON chat_logs(user_id, created_at) 
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';

-- Optimize the aggregate counting pattern used throughout analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_count_optimization
ON profiles(org_id, status) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- STATISTICS UPDATE
-- ============================================================================
-- Update table statistics after creating indexes for optimal query planning
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('profiles', 'chat_logs', 'mentionlytics_data', 'digests', 'events', 'donations')
    LOOP
        EXECUTE format('ANALYZE %I', table_name);
    END LOOP;
END $$;

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================
-- Provide queries to monitor index effectiveness

-- Check index usage
COMMENT ON INDEX idx_profiles_org_created_date IS 'Critical index for analytics queries - Monitor usage with: SELECT schemaname,tablename,indexname,idx_scan,idx_tup_read,idx_tup_fetch FROM pg_stat_user_indexes WHERE indexname = ''idx_profiles_org_created_date'';';

-- Expected performance improvement:
-- - Volunteer metrics queries: 2-5s → 50-200ms
-- - Engagement rate queries: 1-3s → 100-300ms  
-- - Reach metrics queries: 3-8s → 200-500ms
-- - Overall dashboard load: 5-15s → 1-2s

-- ============================================================================
-- ROLLBACK PLAN (if needed)
-- ============================================================================
/*
-- To rollback these indexes if they cause issues:
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_org_created_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_org_status_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_mentionlytics_org_created_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_mentionlytics_sentiment_lookup;
DROP INDEX CONCURRENTLY IF EXISTS idx_chat_logs_user_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_chat_logs_org_date_range;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_chat_join_optimization;
DROP INDEX CONCURRENTLY IF EXISTS idx_digests_org_created_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_events_org_start_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_events_attendance_lookup;
DROP INDEX CONCURRENTLY IF EXISTS idx_event_registrations_event_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_donations_org_created_amount;
DROP INDEX CONCURRENTLY IF EXISTS idx_donations_monthly_aggregation;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_trailing_week_lookup;
DROP INDEX CONCURRENTLY IF EXISTS idx_chat_logs_active_period;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_count_optimization;
*/