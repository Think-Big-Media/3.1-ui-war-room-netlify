"""
Unit tests for analytics service.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from services.analytics_service import AnalyticsService
from services.cache_service import CacheService
from schemas.analytics import DateRangeEnum
from models.volunteer import Volunteer
from models.event import Event
from models.donation import Donation
from models.contact import Contact


class TestAnalyticsService:
    """Test suite for AnalyticsService."""

    @pytest.fixture
    def analytics_service(self, test_cache_service):
        """Create analytics service instance."""
        return AnalyticsService()

    @pytest.mark.asyncio
    async def test_get_dashboard_overview_success(
        self,
        analytics_service,
        test_db_session,
        test_org,
        sample_analytics_data,
    ):
        """Test successful dashboard overview retrieval."""
        # Mock the database queries
        with patch.object(
            analytics_service, "_get_volunteer_metrics", new_callable=AsyncMock
        ) as mock_volunteers:
            with patch.object(
                analytics_service, "_get_event_metrics", new_callable=AsyncMock
            ) as mock_events:
                with patch.object(
                    analytics_service, "_get_donation_metrics", new_callable=AsyncMock
                ) as mock_donations:
                    with patch.object(
                        analytics_service,
                        "_get_contact_metrics",
                        new_callable=AsyncMock,
                    ) as mock_contacts:
                        # Set mock return values
                        mock_volunteers.return_value = sample_analytics_data["overview"]
                        mock_events.return_value = sample_analytics_data["overview"]
                        mock_donations.return_value = sample_analytics_data["overview"]
                        mock_contacts.return_value = sample_analytics_data["overview"]

                        # Call the method
                        result = await analytics_service.get_dashboard_overview(
                            test_db_session, test_org.id, DateRangeEnum.LAST_30_DAYS
                        )

                        # Verify the result
                        assert result is not None
                        assert hasattr(result, "overview")
                        assert hasattr(result, "metrics")
                        assert hasattr(result, "charts")

    @pytest.mark.asyncio
    async def test_get_dashboard_overview_with_cache(
        self,
        analytics_service,
        test_db_session,
        test_org,
        test_cache_service,
        sample_analytics_data,
    ):
        """Test dashboard overview retrieval with cache."""
        # Pre-populate cache
        cache_key = f"analytics:dashboard:{test_org.id}:last_30_days"
        await test_cache_service.set(cache_key, sample_analytics_data, expire=300)

        # Call the method
        result = await analytics_service.get_dashboard_overview(
            test_db_session, test_org.id, DateRangeEnum.LAST_30_DAYS
        )

        # Verify cache was used (no database queries)
        assert result is not None

    @pytest.mark.asyncio
    async def test_get_volunteer_metrics(
        self,
        analytics_service,
        test_db_session,
        test_org,
    ):
        """Test volunteer metrics calculation."""
        # Create test volunteers
        now = datetime.utcnow()
        for i in range(5):
            volunteer = Volunteer(
                org_id=test_org.id,
                first_name=f"Test{i}",
                last_name="Volunteer",
                email=f"volunteer{i}@test.com",
                status="active" if i < 3 else "inactive",
                created_at=now - timedelta(days=i),
            )
            test_db_session.add(volunteer)
        await test_db_session.commit()

        # Get metrics
        metrics = await analytics_service._get_volunteer_metrics(
            test_db_session, test_org.id, now - timedelta(days=7), now
        )

        assert metrics["total_volunteers"] == 5
        assert metrics["active_volunteers"] == 3

    @pytest.mark.asyncio
    async def test_get_event_metrics(
        self,
        analytics_service,
        test_db_session,
        test_org,
    ):
        """Test event metrics calculation."""
        # Create test events
        now = datetime.utcnow()
        for i in range(4):
            event = Event(
                org_id=test_org.id,
                name=f"Test Event {i}",
                event_type="meeting",
                status="scheduled" if i < 2 else "completed",
                start_date=now + timedelta(days=i)
                if i < 2
                else now - timedelta(days=i),
                attendee_count=50 + (i * 10),
            )
            test_db_session.add(event)
        await test_db_session.commit()

        # Get metrics
        metrics = await analytics_service._get_event_metrics(
            test_db_session,
            test_org.id,
            now - timedelta(days=7),
            now + timedelta(days=7),
        )

        assert metrics["total_events"] == 4
        assert metrics["upcoming_events"] == 2

    @pytest.mark.asyncio
    async def test_get_donation_metrics(
        self,
        analytics_service,
        test_db_session,
        test_org,
    ):
        """Test donation metrics calculation."""
        # Create test donations
        now = datetime.utcnow()
        for i in range(3):
            donation = Donation(
                org_id=test_org.id,
                amount=1000.0 * (i + 1),
                donor_name=f"Donor {i}",
                donor_email=f"donor{i}@test.com",
                status="completed",
                created_at=now - timedelta(days=i),
            )
            test_db_session.add(donation)
        await test_db_session.commit()

        # Get metrics
        metrics = await analytics_service._get_donation_metrics(
            test_db_session, test_org.id, now - timedelta(days=7), now
        )

        assert metrics["total_donations"] == 6000.0  # 1000 + 2000 + 3000
        assert metrics["donor_count"] == 3

    @pytest.mark.asyncio
    async def test_calculate_trend(self, analytics_service):
        """Test trend calculation logic."""
        # Test upward trend
        assert analytics_service._calculate_trend(100, 80) == "up"

        # Test downward trend
        assert analytics_service._calculate_trend(80, 100) == "down"

        # Test neutral trend
        assert analytics_service._calculate_trend(100, 100) == "neutral"

        # Test with zero previous value
        assert analytics_service._calculate_trend(100, 0) == "up"

    @pytest.mark.asyncio
    async def test_calculate_change_percent(self, analytics_service):
        """Test percentage change calculation."""
        # Test positive change
        assert analytics_service._calculate_change_percent(120, 100) == 20.0

        # Test negative change
        assert analytics_service._calculate_change_percent(80, 100) == -20.0

        # Test no change
        assert analytics_service._calculate_change_percent(100, 100) == 0.0

        # Test with zero previous value
        assert analytics_service._calculate_change_percent(100, 0) == 100.0

    @pytest.mark.asyncio
    async def test_get_date_range(self, analytics_service):
        """Test date range calculation."""
        now = datetime.utcnow()

        # Test last 7 days
        start, end = analytics_service._get_date_range(DateRangeEnum.LAST_7_DAYS)
        assert (now - start).days == 7
        assert end >= now

        # Test last 30 days
        start, end = analytics_service._get_date_range(DateRangeEnum.LAST_30_DAYS)
        assert (now - start).days == 30

        # Test last 90 days
        start, end = analytics_service._get_date_range(DateRangeEnum.LAST_90_DAYS)
        assert (now - start).days == 90

    @pytest.mark.asyncio
    async def test_real_time_update(
        self,
        analytics_service,
        test_db_session,
        test_org,
        test_cache_service,
    ):
        """Test real-time metric update."""
        metric_type = "volunteer_signup"
        data = {"volunteer_id": "123", "name": "New Volunteer"}

        # Send update
        await analytics_service.send_real_time_update(test_org.id, metric_type, data)

        # Check cache was updated
        cache_key = f"realtime:{test_org.id}:latest_update"
        cached = await test_cache_service.get(cache_key, db=1)
        assert cached is not None
        assert cached["type"] == metric_type
        assert cached["data"] == data

    @pytest.mark.asyncio
    async def test_error_handling(
        self,
        analytics_service,
        test_db_session,
        test_org,
    ):
        """Test error handling in analytics service."""
        # Mock database error
        with patch.object(
            test_db_session, "execute", side_effect=Exception("DB Error")
        ):
            with pytest.raises(Exception) as exc_info:
                await analytics_service.get_dashboard_overview(
                    test_db_session, test_org.id, DateRangeEnum.LAST_30_DAYS
                )
            assert "DB Error" in str(exc_info.value)
