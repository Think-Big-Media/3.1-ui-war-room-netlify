"""
Analytics service for processing and aggregating campaign metrics.
Handles business logic for dashboard data and real-time updates.
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from models.analytics import (
    DateRangeEnum,
    AnalyticsDashboard,
    VolunteerMetrics,
    EventMetrics,
    TimeSeriesData,
    MetricCard,
)
from db import analytics_queries
from services.cache_service import cache_service
from core.config import settings
from services.posthog import posthog_service


class AnalyticsService:
    """Service for managing analytics data and computations."""

    async def get_dashboard_overview(
        self,
        db: AsyncSession,
        org_id: str,
        date_range: DateRangeEnum,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> AnalyticsDashboard:
        """
        Get complete dashboard data with all metrics.

        Args:
            db: Database session
            org_id: Organization ID
            date_range: Date range enum or custom
            start_date: Custom start date
            end_date: Custom end date

        Returns:
            Complete dashboard data
        """
        # Calculate date range
        dates = self._calculate_date_range(date_range, start_date, end_date)

        # Create cache key
        cache_key = f"analytics:dashboard:{org_id}:{date_range}"
        if date_range == DateRangeEnum.CUSTOM:
            cache_key += f":{start_date}:{end_date}"

        # Try to get from cache
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            return AnalyticsDashboard(**cached_data)

        # Fetch all metrics in parallel
        tasks = [
            analytics_queries.get_volunteer_metrics(db, org_id, dates),
            analytics_queries.get_event_metrics(db, org_id, dates),
            analytics_queries.get_reach_metrics(db, org_id, dates),
            analytics_queries.get_donation_metrics(db, org_id, dates),
            analytics_queries.get_time_series_data(db, org_id, dates),
        ]

        results = await asyncio.gather(*tasks)

        # Process results
        volunteer_metrics = VolunteerMetrics(**results[0])
        event_metrics = EventMetrics(**results[1])
        reach_metrics = results[2]
        donation_metrics = results[3]
        time_series_data = self._process_time_series(results[4])

        # Create dashboard object
        dashboard = AnalyticsDashboard(
            volunteer_metrics=volunteer_metrics,
            event_metrics=event_metrics,
            reach_metrics=reach_metrics,
            donation_metrics=donation_metrics,
            time_series_data=time_series_data,
        )

        # Cache result
        await cache_service.set(
            cache_key, dashboard.model_dump(), ttl=settings.ANALYTICS_CACHE_TTL
        )

        # Track analytics view
        await posthog_service.track(
            user_id=org_id,
            event_name="analytics_dashboard_viewed",
            properties={"date_range": date_range, "org_id": org_id},
        )

        return dashboard

    async def get_metric_cards(
        self, db: AsyncSession, org_id: str, date_range: DateRangeEnum
    ) -> List[MetricCard]:
        """
        Get overview metric cards for dashboard header.

        Args:
            db: Database session
            org_id: Organization ID
            date_range: Date range for metrics

        Returns:
            List of metric cards
        """
        dates = self._calculate_date_range(date_range)

        # Get current and previous period metrics
        current_metrics = await analytics_queries.get_overview_metrics(
            db, org_id, dates["start"], dates["end"]
        )

        prev_dates = self._calculate_previous_period(dates)
        prev_metrics = await analytics_queries.get_overview_metrics(
            db, org_id, prev_dates["start"], prev_dates["end"]
        )

        # Calculate changes and trends
        cards = []

        # Volunteers card
        volunteer_change = self._calculate_change(
            current_metrics["volunteers"], prev_metrics["volunteers"]
        )
        cards.append(
            MetricCard(
                title="Active Volunteers",
                value=current_metrics["volunteers"],
                change=volunteer_change,
                trend=await self._get_mini_trend(db, org_id, "volunteers", 7),
            )
        )

        # Events card
        event_change = self._calculate_change(
            current_metrics["events"], prev_metrics["events"]
        )
        cards.append(
            MetricCard(
                title="Events Hosted",
                value=current_metrics["events"],
                change=event_change,
                trend=await self._get_mini_trend(db, org_id, "events", 7),
            )
        )

        # Reach card
        reach_change = self._calculate_change(
            current_metrics["reach"], prev_metrics["reach"]
        )
        cards.append(
            MetricCard(
                title="Total Reach",
                value=current_metrics["reach"],
                change=reach_change,
                trend=await self._get_mini_trend(db, org_id, "reach", 7),
            )
        )

        # Donations card
        donation_change = self._calculate_change(
            current_metrics["donations"], prev_metrics["donations"]
        )
        cards.append(
            MetricCard(
                title="Donations Raised",
                value=current_metrics["donations"],
                change=donation_change,
                trend=await self._get_mini_trend(db, org_id, "donations", 7),
            )
        )

        return cards

    async def get_real_time_metrics(self, org_id: str) -> Dict[str, Any]:
        """
        Get real-time metrics for WebSocket updates.

        Args:
            org_id: Organization ID

        Returns:
            Real-time metric data
        """
        # Get from real-time cache (shorter TTL)
        cache_key = f"analytics:realtime:{org_id}"

        cached = await cache_service.get(
            cache_key, db=1
        )  # Use separate DB for real-time
        if cached:
            return cached

        # If not cached, return latest activity
        # This would typically query recent events, volunteer actions, etc.
        return {
            "active_users": await self._get_active_user_count(org_id),
            "recent_activity": await self._get_recent_activity(org_id),
            "current_events": await self._get_current_events(org_id),
        }

    async def get_specific_metrics(
        self, org_id: str, metrics: List[str]
    ) -> Dict[str, Any]:
        """
        Get specific metrics requested by client.

        Args:
            org_id: Organization ID
            metrics: List of metric names

        Returns:
            Requested metric data
        """
        result = {}

        for metric in metrics:
            if metric == "volunteers":
                result[metric] = await self._get_volunteer_data(org_id)
            elif metric == "events":
                result[metric] = await self._get_event_data(org_id)
            elif metric == "donations":
                result[metric] = await self._get_donation_data(org_id)
            elif metric == "reach":
                result[metric] = await self._get_reach_data(org_id)
            elif metric == "activity_feed":
                result[metric] = await self._get_activity_feed(org_id)
            elif metric == "geographic_data":
                result[metric] = await self._get_geographic_data(org_id)

        return result

    async def pre_calculate_metrics(self, org_id: str, date_range: DateRangeEnum):
        """
        Pre-calculate and cache metrics for next request.

        Args:
            org_id: Organization ID
            date_range: Date range to pre-calculate
        """
        # This runs in background to warm cache
        try:
            # Simulate getting dashboard data to populate cache
            # In production, this would call get_dashboard_overview
            pass
        except Exception as e:
            # Log error but don't fail
            print(f"Error pre-calculating metrics: {e}")

    def _calculate_date_range(
        self,
        date_range: DateRangeEnum,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, datetime]:
        """Calculate actual date range from enum."""
        if date_range == DateRangeEnum.CUSTOM:
            return {"start": start_date, "end": end_date}

        end = datetime.utcnow()

        if date_range == DateRangeEnum.LAST_7_DAYS:
            start = end - timedelta(days=7)
        elif date_range == DateRangeEnum.LAST_30_DAYS:
            start = end - timedelta(days=30)
        elif date_range == DateRangeEnum.LAST_90_DAYS:
            start = end - timedelta(days=90)
        else:
            start = end - timedelta(days=30)  # Default

        return {"start": start, "end": end}

    def _calculate_previous_period(
        self, dates: Dict[str, datetime]
    ) -> Dict[str, datetime]:
        """Calculate previous period for comparison."""
        duration = dates["end"] - dates["start"]
        return {"start": dates["start"] - duration, "end": dates["start"]}

    def _calculate_change(self, current: float, previous: float) -> float:
        """Calculate percentage change."""
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100

    def _process_time_series(
        self, raw_data: List[Dict]
    ) -> Dict[str, List[TimeSeriesData]]:
        """Process raw time series data into structured format."""
        processed = {"volunteers": [], "events": [], "donations": [], "reach": []}

        for item in raw_data:
            ts_data = TimeSeriesData(
                timestamp=item["timestamp"],
                value=item["value"],
                label=item.get("label"),
            )

            metric_type = item.get("metric_type", "volunteers")
            if metric_type in processed:
                processed[metric_type].append(ts_data)

        return processed

    async def _get_mini_trend(
        self, db: AsyncSession, org_id: str, metric: str, days: int
    ) -> List[int]:
        """Get mini trend data for sparkline."""
        # This would query daily values for the metric
        # For now, return mock data
        return [10, 12, 15, 14, 18, 20, 22]

    async def _get_active_user_count(self, org_id: str) -> int:
        """Get count of currently active users."""
        # Query active sessions or recent activity
        return 42  # Mock

    async def _get_recent_activity(self, org_id: str) -> List[Dict]:
        """Get recent activity feed items."""
        # Query recent events, volunteer actions, etc.
        return []  # Mock

    async def _get_current_events(self, org_id: str) -> List[Dict]:
        """Get currently active events."""
        # Query events happening now
        return []  # Mock

    # Specific metric getters
    async def _get_volunteer_data(self, org_id: str) -> Dict:
        """Get detailed volunteer data."""
        return {}  # Implementation needed

    async def _get_event_data(self, org_id: str) -> Dict:
        """Get detailed event data."""
        return {}  # Implementation needed

    async def _get_donation_data(self, org_id: str) -> Dict:
        """Get detailed donation data."""
        return {}  # Implementation needed

    async def _get_reach_data(self, org_id: str) -> Dict:
        """Get detailed reach data."""
        return {}  # Implementation needed

    async def _get_activity_feed(self, org_id: str) -> List[Dict]:
        """Get activity feed data."""
        return []  # Implementation needed

    async def _get_geographic_data(self, org_id: str) -> Dict:
        """Get geographic distribution data."""
        return {}  # Implementation needed


# Singleton instance
analytics_service = AnalyticsService()
