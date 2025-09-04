"""
Analytics schemas for API request/response validation.
"""
from typing import Dict, List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel
from models.analytics import DateRangeEnum, AnalyticsDashboard, MetricCard, TimeSeriesData, VolunteerMetrics, EventMetrics


class MetricCardResponse(MetricCard):
    """Response schema for metric cards."""
    pass


class VolunteerChart(BaseModel):
    """Volunteer chart data."""
    labels: List[str]
    data: List[int]
    

class EventChart(BaseModel):
    """Event chart data."""
    labels: List[str]
    data: List[int]
    

class DonationChart(BaseModel):
    """Donation chart data."""
    labels: List[str]
    data: List[float]
    

class GeographicData(BaseModel):
    """Geographic distribution data."""
    state: str
    count: int
    percentage: float


class ChartData(BaseModel):
    """Generic chart data structure."""
    labels: List[str]
    datasets: List[Dict[str, Any]]
    type: str = "line"  # line, bar, pie, doughnut, etc.


class DashboardMetrics(BaseModel):
    """Dashboard metrics summary."""
    total_volunteers: int
    active_volunteers: int
    total_events: int
    upcoming_events: int
    total_donations: float
    monthly_donations: float
    engagement_rate: float
    growth_rate: float


class AnalyticsQuery(BaseModel):
    """Analytics query parameters."""
    date_range: DateRangeEnum
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    organization_id: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class AnalyticsResponse(BaseModel):
    """Generic analytics response wrapper."""
    success: bool
    data: Dict[str, Any]
    timestamp: datetime
    query: AnalyticsQuery
    

class AnalyticsDashboardResponse(BaseModel):
    """Complete analytics dashboard response."""
    overview: Dict[str, MetricCard]
    volunteer_metrics: VolunteerMetrics
    event_metrics: EventMetrics
    donation_trends: List[TimeSeriesData]
    volunteer_activity: List[TimeSeriesData]
    engagement_data: Dict[str, Any]
    geographic_distribution: Optional[List[GeographicData]] = None
    

class ExportRequest(BaseModel):
    """Export request schema."""
    format: str  # csv, pdf, excel
    date_range: DateRangeEnum
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sections: List[str]  # Which sections to include
    

class ExportJobResponse(BaseModel):
    """Export job response."""
    job_id: str
    status: str
    created_at: datetime
    download_url: Optional[str] = None


# Re-export the models from models.analytics
__all__ = [
    "DateRangeEnum",
    "AnalyticsDashboard", 
    "MetricCard",
    "TimeSeriesData",
    "VolunteerMetrics",
    "EventMetrics",
    "AnalyticsDashboardResponse",
    "MetricCardResponse",
    "VolunteerChart",
    "EventChart",
    "DonationChart",
    "GeographicData",
    "ChartData",
    "DashboardMetrics",
    "AnalyticsQuery",
    "AnalyticsResponse",
    "ExportRequest",
    "ExportJobResponse",
]