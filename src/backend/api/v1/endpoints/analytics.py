"""
Analytics API endpoints for the War Room dashboard.
Provides real-time metrics, historical data, and export functionality.
"""
from typing import Optional, List
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_db, get_current_user, require_permissions
from models.user import User
from models.analytics import DateRangeEnum
from schemas.analytics import (
    AnalyticsDashboardResponse,
    MetricCardResponse,
    VolunteerChart,
    EventChart,
    DonationChart,
    GeographicData,
    ExportRequest,
    ExportJobResponse,
)
from services.analytics_service import analytics_service
from services.export_service import export_service
from services.cache_service import cache_service
from services.query_optimizer import QueryOptimizer
from core.cache_middleware import cache_response


router = APIRouter()


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
# # @require_permissions(["analytics.view"])  # TODO: Fix decorator implementation  # TODO: Fix decorator implementation
@cache_response(ttl=300, vary_by=["org_id", "date_range"])
async def get_analytics_dashboard(
    date_range: DateRangeEnum = Query(DateRangeEnum.LAST_30_DAYS),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Get comprehensive analytics dashboard data.

    Includes volunteer metrics, event statistics, reach data, and donations.
    Results are cached for 5 minutes using optimized queries.
    """
    # Validate custom date range
    if date_range == DateRangeEnum.CUSTOM:
        if not start_date or not end_date:
            raise HTTPException(
                status_code=400, detail="Start and end dates required for custom range"
            )
        if start_date > end_date:
            raise HTTPException(
                status_code=400, detail="Start date must be before end date"
            )

    # Get org_id from JWT
    org_id = current_user.org_id

    # Use optimized query service
    query_optimizer = QueryOptimizer(db)

    # Convert date_range enum to string for cache key
    date_range_str = f"{date_range.days}d" if hasattr(date_range, "days") else "30d"

    # Get optimized dashboard data
    dashboard_data = await query_optimizer.get_organization_dashboard_data(org_id)

    # Get analytics summary for the specified date range
    analytics_summary = await query_optimizer.get_analytics_summary_optimized(
        org_id, date_range_str
    )

    # Merge the data
    enhanced_dashboard = {
        **dashboard_data,
        "analytics_summary": analytics_summary,
        "date_range": date_range_str,
    }

    # Pre-warm cache for next request in background
    background_tasks.add_task(
        analytics_service.pre_calculate_metrics, org_id, date_range
    )

    return AnalyticsDashboardResponse.from_orm(enhanced_dashboard)


@router.get("/metrics/overview", response_model=List[MetricCardResponse])
# @require_permissions(["analytics.view"])  # TODO: Fix decorator implementation
@cache_response(ttl=180, vary_by=["org_id", "date_range"])
async def get_metric_cards(
    date_range: DateRangeEnum = Query(DateRangeEnum.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get overview metric cards for dashboard header.

    Returns key metrics with percentage changes from previous period.
    Uses optimized caching for 3 minutes.
    """
    query_optimizer = QueryOptimizer(db)

    # Get dashboard data which includes key metrics
    dashboard_data = await query_optimizer.get_organization_dashboard_data(
        current_user.org_id
    )

    # Convert to metric card format
    metric_cards = []

    if "campaigns" in dashboard_data:
        campaigns_data = dashboard_data["campaigns"]
        metric_cards.append(
            {
                "title": "Active Campaigns",
                "value": campaigns_data.get("active_count", 0),
                "total": campaigns_data.get("count", 0),
                "percentage_change": 0,  # Would calculate from previous period
                "trend": "up"
                if campaigns_data.get("active_count", 0) > 0
                else "stable",
                "icon": "campaigns",
            }
        )

    if "volunteers" in dashboard_data:
        volunteers_data = dashboard_data["volunteers"]
        metric_cards.append(
            {
                "title": "Active Volunteers",
                "value": volunteers_data.get("active_count", 0),
                "total": volunteers_data.get("count", 0),
                "percentage_change": 0,
                "trend": "up"
                if volunteers_data.get("active_count", 0) > 0
                else "stable",
                "icon": "volunteers",
            }
        )

    if "donations" in dashboard_data:
        donations_data = dashboard_data["donations"]
        metric_cards.append(
            {
                "title": "Total Donations",
                "value": donations_data.get("total_amount", 0),
                "total": donations_data.get("count", 0),
                "percentage_change": 0,
                "trend": "up"
                if donations_data.get("total_amount", 0) > 0
                else "stable",
                "icon": "donations",
                "format": "currency",
            }
        )

    if "events" in dashboard_data:
        events_data = dashboard_data["events"]
        metric_cards.append(
            {
                "title": "Scheduled Events",
                "value": events_data.get("scheduled_count", 0),
                "total": events_data.get("count", 0),
                "percentage_change": 0,
                "trend": "up"
                if events_data.get("scheduled_count", 0) > 0
                else "stable",
                "icon": "events",
            }
        )

    return [MetricCardResponse.from_orm(card) for card in metric_cards]


@router.get("/charts/volunteers", response_model=VolunteerChart)
# @require_permissions(["analytics.view"])  # TODO: Fix decorator implementation
async def get_volunteer_chart(
    date_range: DateRangeEnum = Query(DateRangeEnum.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get volunteer growth chart data."""
    # This would fetch time-series data for volunteer growth
    # For now, returning mock data
    return VolunteerChart(
        labels=["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets=[
            {
                "label": "Active Volunteers",
                "data": [120, 135, 142, 158],
                "borderColor": "rgb(75, 192, 192)",
                "tension": 0.1,
            },
            {
                "label": "New Signups",
                "data": [15, 12, 18, 22],
                "borderColor": "rgb(255, 99, 132)",
                "tension": 0.1,
            },
        ],
    )


@router.get("/charts/events", response_model=EventChart)
# @require_permissions(["analytics.view"])  # TODO: Fix decorator implementation
async def get_event_chart(
    date_range: DateRangeEnum = Query(DateRangeEnum.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get event attendance chart data."""
    # This would fetch event attendance data
    # For now, returning mock data
    return EventChart(
        labels=["Town Hall", "Canvassing", "Phone Bank", "Fundraiser"],
        datasets=[
            {
                "label": "Attendance",
                "data": [45, 89, 34, 67],
                "backgroundColor": "rgba(54, 162, 235, 0.5)",
            }
        ],
    )


@router.get("/charts/donations", response_model=DonationChart)
# @require_permissions(["analytics.view"])  # TODO: Fix decorator implementation
async def get_donation_chart(
    date_range: DateRangeEnum = Query(DateRangeEnum.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get donation breakdown chart data."""
    # This would fetch donation data by category
    # For now, returning mock data
    return DonationChart(
        labels=["Individual", "Corporate", "PAC", "Events"],
        datasets=[
            {
                "data": [45, 25, 20, 10],
                "backgroundColor": [
                    "rgba(255, 99, 132, 0.5)",
                    "rgba(54, 162, 235, 0.5)",
                    "rgba(255, 206, 86, 0.5)",
                    "rgba(75, 192, 192, 0.5)",
                ],
            }
        ],
    )


@router.get("/geographic", response_model=GeographicData)
# @require_permissions(["analytics.view"])  # TODO: Fix decorator implementation
async def get_geographic_data(
    date_range: DateRangeEnum = Query(DateRangeEnum.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get geographic distribution of volunteers and events."""
    # This would fetch geographic data
    # For now, returning mock data
    return GeographicData(
        regions=[
            {"name": "Northeast", "volunteers": 234, "events": 12},
            {"name": "Southeast", "volunteers": 189, "events": 8},
            {"name": "Midwest", "volunteers": 156, "events": 10},
            {"name": "West", "volunteers": 298, "events": 15},
        ]
    )


# Export endpoints


@router.post("/export", response_model=ExportJobResponse)
# @require_permissions(["analytics.export"])  # TODO: Fix decorator implementation
async def export_analytics(
    export_request: ExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Export analytics data in PDF or CSV format.

    For large exports, returns a job ID to track progress.
    """
    # Validate export format
    if export_request.format not in ["csv", "pdf"]:
        raise HTTPException(
            status_code=400, detail="Invalid export format. Use 'csv' or 'pdf'"
        )

    # Check export limits
    if export_request.include_raw_data and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Raw data export requires admin permissions"
        )

    # Create export job
    job_info = await export_service.export_dashboard_data(
        org_id=current_user.org_id,
        date_range=export_request.date_range,
        format=export_request.format,
        user_id=current_user.id,
        filters=export_request.filters,
    )

    return ExportJobResponse(**job_info)


@router.get("/export/{job_id}", response_model=ExportJobResponse)
# @require_permissions(["analytics.view"])  # TODO: Fix decorator implementation
async def get_export_status(
    job_id: str, current_user: User = Depends(get_current_user)
):
    """Get export job status."""
    job_info = await export_service.get_export_status(job_id)

    if not job_info:
        raise HTTPException(status_code=404, detail="Export job not found")

    # Verify org access
    if (
        job_info.get("org_id") != current_user.org_id
        and not current_user.is_platform_admin
    ):
        raise HTTPException(status_code=403, detail="Access denied to this export")

    return ExportJobResponse(**job_info)
