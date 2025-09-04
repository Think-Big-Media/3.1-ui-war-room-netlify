"""
Analytics queries for the War Room dashboard.
Uses CTEs, window functions, and aggregations for complex analytics.
All queries enforce Row-Level Security by filtering on org_id.
"""
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy import text, select, func, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from models.analytics import DateRangeEnum


class AnalyticsQueries:
    """Complex analytics queries with RLS enforcement."""

    @staticmethod
    def get_date_range(
        range_type: DateRangeEnum,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Tuple[datetime, datetime]:
        """Convert date range enum to actual dates."""
        now = datetime.utcnow()

        if range_type == DateRangeEnum.CUSTOM and start_date and end_date:
            return (
                datetime.combine(start_date, datetime.min.time()),
                datetime.combine(end_date, datetime.max.time()),
            )

        ranges = {
            DateRangeEnum.LAST_7_DAYS: (now - timedelta(days=7), now),
            DateRangeEnum.LAST_30_DAYS: (now - timedelta(days=30), now),
            DateRangeEnum.LAST_90_DAYS: (now - timedelta(days=90), now),
        }

        return ranges.get(range_type, (now - timedelta(days=30), now))

    @staticmethod
    async def get_volunteer_metrics(
        db: AsyncSession,
        org_id: str,
        date_range: DateRangeEnum,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Get volunteer metrics with growth calculations.
        Uses CTEs for efficient computation.
        """
        date_start, date_end = AnalyticsQueries.get_date_range(
            date_range, start_date, end_date
        )

        # Calculate previous period for growth comparison
        period_length = (date_end - date_start).days
        prev_start = date_start - timedelta(days=period_length)
        prev_end = date_start

        query = text(
            """
        WITH volunteer_stats AS (
            SELECT 
                COUNT(*) as total_count,
                COUNT(*) FILTER (WHERE status = 'active') as active_count,
                COUNT(*) FILTER (WHERE status = 'inactive') as inactive_count,
                COUNT(*) FILTER (WHERE created_at >= :date_start) as new_volunteers
            FROM profiles
            WHERE org_id = :org_id
              AND deleted_at IS NULL
        ),
        previous_period AS (
            SELECT 
                COUNT(*) as prev_total,
                COUNT(*) FILTER (WHERE created_at >= :prev_start 
                                 AND created_at < :prev_end) as prev_new
            FROM profiles
            WHERE org_id = :org_id
              AND deleted_at IS NULL
        ),
        daily_trend AS (
            SELECT 
                DATE(created_at) as day,
                COUNT(*) as daily_count
            FROM profiles
            WHERE org_id = :org_id
              AND created_at >= :date_start - INTERVAL '7 days'
              AND deleted_at IS NULL
            GROUP BY DATE(created_at)
            ORDER BY day DESC
            LIMIT 7
        )
        SELECT 
            vs.*,
            pp.prev_total,
            pp.prev_new,
            CASE 
                WHEN pp.prev_total > 0 
                THEN ((vs.total_count - pp.prev_total)::float / pp.prev_total * 100)
                ELSE 0 
            END as growth_rate,
            array_agg(dt.daily_count ORDER BY dt.day) as trend_data
        FROM volunteer_stats vs
        CROSS JOIN previous_period pp
        CROSS JOIN daily_trend dt
        GROUP BY vs.total_count, vs.active_count, vs.inactive_count, 
                 vs.new_volunteers, pp.prev_total, pp.prev_new
        """
        )

        result = await db.execute(
            query,
            {
                "org_id": org_id,
                "date_start": date_start,
                "date_end": date_end,
                "prev_start": prev_start,
                "prev_end": prev_end,
            },
        )

        row = result.first()
        if not row:
            return {
                "total": 0,
                "active": 0,
                "inactive": 0,
                "new_volunteers": 0,
                "growth_rate": 0.0,
                "trend": [],
            }

        return {
            "total": row.total_count,
            "active": row.active_count,
            "inactive": row.inactive_count,
            "new_volunteers": row.new_volunteers,
            "growth_rate": round(row.growth_rate, 2),
            "trend": list(row.trend_data) if row.trend_data else [],
        }

    @staticmethod
    async def get_event_metrics(
        db: AsyncSession,
        org_id: str,
        date_range: DateRangeEnum,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Get event metrics with attendance calculations."""
        date_start, date_end = AnalyticsQueries.get_date_range(
            date_range, start_date, end_date
        )

        query = text(
            """
        WITH event_stats AS (
            SELECT 
                COUNT(*) as total_events,
                COUNT(*) FILTER (WHERE start_date > NOW()) as upcoming_events,
                COUNT(*) FILTER (WHERE end_date < NOW()) as completed_events,
                AVG(capacity) as avg_capacity
            FROM events
            WHERE org_id = :org_id
              AND created_at BETWEEN :date_start AND :date_end
              AND deleted_at IS NULL
        ),
        attendance_stats AS (
            SELECT 
                e.id,
                e.capacity,
                COUNT(ev.volunteer_id) as signups,
                COUNT(ev.volunteer_id) FILTER (WHERE ev.status = 'attended') as attended
            FROM events e
            LEFT JOIN event_volunteers ev ON e.id = ev.event_id
            WHERE e.org_id = :org_id
              AND e.created_at BETWEEN :date_start AND :date_end
              AND e.deleted_at IS NULL
            GROUP BY e.id, e.capacity
        ),
        attendance_summary AS (
            SELECT 
                AVG(CASE 
                    WHEN capacity > 0 
                    THEN (signups::float / capacity * 100) 
                    ELSE 0 
                END) as avg_signup_rate,
                AVG(CASE 
                    WHEN signups > 0 
                    THEN (attended::float / signups * 100) 
                    ELSE 0 
                END) as avg_attendance_rate
            FROM attendance_stats
        )
        SELECT 
            es.*,
            asumm.avg_signup_rate,
            asumm.avg_attendance_rate
        FROM event_stats es
        CROSS JOIN attendance_summary asumm
        """
        )

        result = await db.execute(
            query, {"org_id": org_id, "date_start": date_start, "date_end": date_end}
        )

        row = result.first()
        if not row:
            return {
                "total": 0,
                "upcoming": 0,
                "completed": 0,
                "avg_capacity": 0,
                "avg_signup_rate": 0.0,
                "avg_attendance_rate": 0.0,
            }

        return {
            "total": row.total_events,
            "upcoming": row.upcoming_events,
            "completed": row.completed_events,
            "avg_capacity": int(row.avg_capacity or 0),
            "avg_signup_rate": round(row.avg_signup_rate or 0, 1),
            "avg_attendance_rate": round(row.avg_attendance_rate or 0, 1),
        }

    @staticmethod
    async def get_time_series_data(
        db: AsyncSession,
        org_id: str,
        metric_type: str,
        date_range: DateRangeEnum,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        interval: str = "day",
    ) -> List[Dict[str, Any]]:
        """
        Get time series data for various metrics.
        Supports daily, weekly, and monthly intervals.
        """
        date_start, date_end = AnalyticsQueries.get_date_range(
            date_range, start_date, end_date
        )

        # Determine date truncation based on interval
        date_trunc = {"day": "day", "week": "week", "month": "month"}.get(
            interval, "day"
        )

        queries = {
            "volunteer_growth": f"""
                SELECT 
                    DATE_TRUNC('{date_trunc}', created_at) as period,
                    COUNT(*) as value,
                    'volunteers' as label
                FROM profiles
                WHERE org_id = :org_id
                  AND created_at BETWEEN :date_start AND :date_end
                  AND deleted_at IS NULL
                GROUP BY period
                ORDER BY period
            """,
            "event_attendance": f"""
                WITH event_data AS (
                    SELECT 
                        DATE_TRUNC('{date_trunc}', e.start_date) as period,
                        COUNT(DISTINCT e.id) as events,
                        COUNT(ev.volunteer_id) as total_signups,
                        COUNT(ev.volunteer_id) FILTER (WHERE ev.status = 'attended') as attended
                    FROM events e
                    LEFT JOIN event_volunteers ev ON e.id = ev.event_id
                    WHERE e.org_id = :org_id
                      AND e.start_date BETWEEN :date_start AND :date_end
                      AND e.deleted_at IS NULL
                    GROUP BY period
                )
                SELECT 
                    period,
                    attended as value,
                    'attendees' as label
                FROM event_data
                ORDER BY period
            """,
            "engagement_rate": f"""
                WITH daily_activity AS (
                    SELECT 
                        DATE_TRUNC('{date_trunc}', cl.created_at) as period,
                        COUNT(DISTINCT cl.user_id) as active_users,
                        COUNT(*) as total_interactions
                    FROM chat_logs cl
                    JOIN profiles p ON cl.user_id = p.id
                    WHERE p.org_id = :org_id
                      AND cl.created_at BETWEEN :date_start AND :date_end
                    GROUP BY period
                ),
                total_users AS (
                    SELECT COUNT(*) as total
                    FROM profiles
                    WHERE org_id = :org_id
                      AND deleted_at IS NULL
                )
                SELECT 
                    da.period,
                    CASE 
                        WHEN tu.total > 0 
                        THEN (da.active_users::float / tu.total * 100)
                        ELSE 0 
                    END as value,
                    'engagement_rate' as label
                FROM daily_activity da
                CROSS JOIN total_users tu
                ORDER BY period
            """,
        }

        query_text = queries.get(metric_type, queries["volunteer_growth"])
        query = text(query_text)

        result = await db.execute(
            query, {"org_id": org_id, "date_start": date_start, "date_end": date_end}
        )

        return [
            {
                "timestamp": row.period.isoformat(),
                "value": float(row.value),
                "label": row.label,
            }
            for row in result
        ]

    @staticmethod
    async def get_geographic_distribution(
        db: AsyncSession, org_id: str
    ) -> List[Dict[str, Any]]:
        """Get geographic distribution of volunteers."""
        query = text(
            """
        WITH location_stats AS (
            SELECT 
                COALESCE(city, 'Unknown') as location,
                COALESCE(state, country, 'Unknown') as region,
                COUNT(*) as count,
                COUNT(*)::float / SUM(COUNT(*)) OVER () * 100 as percentage
            FROM profiles
            WHERE org_id = :org_id
              AND deleted_at IS NULL
            GROUP BY city, state, country
            HAVING COUNT(*) > 0
        )
        SELECT 
            location,
            region,
            count,
            ROUND(percentage, 1) as percentage
        FROM location_stats
        ORDER BY count DESC
        LIMIT 20
        """
        )

        result = await db.execute(query, {"org_id": org_id})

        return [
            {
                "location": row.location,
                "region": row.region,
                "count": row.count,
                "percentage": float(row.percentage),
            }
            for row in result
        ]

    @staticmethod
    async def get_recent_activity(
        db: AsyncSession, org_id: str, limit: int = 50, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get recent activity feed across all entities."""
        query = text(
            """
        WITH activity_feed AS (
            -- New volunteers
            SELECT 
                'new_volunteer' as activity_type,
                p.id as entity_id,
                p.first_name || ' ' || p.last_name as title,
                'joined as a volunteer' as description,
                p.created_at as timestamp,
                NULL as metadata
            FROM profiles p
            WHERE p.org_id = :org_id
              AND p.deleted_at IS NULL
              AND p.created_at > NOW() - INTERVAL '7 days'
            
            UNION ALL
            
            -- Event signups
            SELECT 
                'event_signup' as activity_type,
                e.id as entity_id,
                e.title as title,
                p.first_name || ' signed up' as description,
                ev.created_at as timestamp,
                jsonb_build_object(
                    'volunteer_name', p.first_name || ' ' || p.last_name,
                    'volunteer_id', p.id
                ) as metadata
            FROM event_volunteers ev
            JOIN events e ON ev.event_id = e.id
            JOIN profiles p ON ev.volunteer_id = p.id
            WHERE e.org_id = :org_id
              AND ev.created_at > NOW() - INTERVAL '7 days'
            
            UNION ALL
            
            -- High engagement alerts
            SELECT 
                'high_engagement' as activity_type,
                cl.id as entity_id,
                'High AI Usage' as title,
                p.first_name || ' - ' || cl.tokens_used || ' tokens' as description,
                cl.created_at as timestamp,
                jsonb_build_object(
                    'tokens_used', cl.tokens_used,
                    'cost', cl.cost
                ) as metadata
            FROM chat_logs cl
            JOIN profiles p ON cl.user_id = p.id
            WHERE p.org_id = :org_id
              AND cl.tokens_used > 1000
              AND cl.created_at > NOW() - INTERVAL '7 days'
        )
        SELECT *
        FROM activity_feed
        ORDER BY timestamp DESC
        LIMIT :limit
        OFFSET :offset
        """
        )

        result = await db.execute(
            query, {"org_id": org_id, "limit": limit, "offset": offset}
        )

        return [
            {
                "type": row.activity_type,
                "entity_id": row.entity_id,
                "title": row.title,
                "description": row.description,
                "timestamp": row.timestamp.isoformat(),
                "metadata": row.metadata or {},
            }
            for row in result
        ]

    @staticmethod
    async def get_campaign_reach_metrics(
        db: AsyncSession,
        org_id: str,
        date_range: DateRangeEnum,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """Get campaign reach and engagement metrics."""
        date_start, date_end = AnalyticsQueries.get_date_range(
            date_range, start_date, end_date
        )

        query = text(
            """
        WITH reach_stats AS (
            -- Mentionlytics data if available
            SELECT 
                SUM(reach_count) as total_reach,
                AVG(sentiment_score) as avg_sentiment,
                COUNT(DISTINCT mention_id) as total_mentions
            FROM mentionlytics_data
            WHERE org_id = :org_id
              AND created_at BETWEEN :date_start AND :date_end
        ),
        engagement_stats AS (
            -- Chat/AI engagement
            SELECT 
                COUNT(DISTINCT user_id) as engaged_users,
                COUNT(*) as total_interactions,
                SUM(tokens_used) as total_tokens
            FROM chat_logs cl
            JOIN profiles p ON cl.user_id = p.id
            WHERE p.org_id = :org_id
              AND cl.created_at BETWEEN :date_start AND :date_end
        ),
        email_stats AS (
            -- Email digest stats
            SELECT 
                COUNT(*) as emails_sent,
                AVG(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) * 100 as open_rate
            FROM digests
            WHERE org_id = :org_id
              AND created_at BETWEEN :date_start AND :date_end
        )
        SELECT 
            COALESCE(r.total_reach, 0) as total_reach,
            COALESCE(r.avg_sentiment, 0) as avg_sentiment,
            COALESCE(r.total_mentions, 0) as total_mentions,
            COALESCE(e.engaged_users, 0) as engaged_users,
            COALESCE(e.total_interactions, 0) as total_interactions,
            COALESCE(em.emails_sent, 0) as emails_sent,
            COALESCE(em.open_rate, 0) as email_open_rate
        FROM reach_stats r
        CROSS JOIN engagement_stats e
        CROSS JOIN email_stats em
        """
        )

        result = await db.execute(
            query, {"org_id": org_id, "date_start": date_start, "date_end": date_end}
        )

        row = result.first()
        if not row:
            return {
                "total_reach": 0,
                "avg_sentiment": 0.0,
                "total_mentions": 0,
                "engaged_users": 0,
                "engagement_rate": 0.0,
                "emails_sent": 0,
                "email_open_rate": 0.0,
            }

        # Calculate engagement rate
        total_users_query = text(
            """
            SELECT COUNT(*) as total 
            FROM profiles 
            WHERE org_id = :org_id AND deleted_at IS NULL
        """
        )
        total_result = await db.execute(total_users_query, {"org_id": org_id})
        total_users = total_result.scalar() or 1

        return {
            "total_reach": row.total_reach,
            "avg_sentiment": round(row.avg_sentiment, 2),
            "total_mentions": row.total_mentions,
            "engaged_users": row.engaged_users,
            "engagement_rate": round((row.engaged_users / total_users * 100), 1),
            "emails_sent": row.emails_sent,
            "email_open_rate": round(row.email_open_rate, 1),
        }
