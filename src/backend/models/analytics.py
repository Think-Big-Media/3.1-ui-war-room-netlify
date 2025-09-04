"""
Analytics models and enums for War Room platform.
"""
from enum import Enum
from typing import Optional, Dict, List, Any
from datetime import datetime
from pydantic import BaseModel


class DateRangeEnum(str, Enum):
    """Date range options for analytics."""
    
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    LAST_90_DAYS = "last_90_days"
    CUSTOM = "custom"


class MetricCard(BaseModel):
    """Single metric card data."""
    
    title: str
    value: float
    change: float
    change_type: str  # "increase" or "decrease"
    

class TimeSeriesData(BaseModel):
    """Time series data point."""
    
    date: str
    value: float
    

class VolunteerMetrics(BaseModel):
    """Volunteer-related metrics."""
    
    total_volunteers: int
    active_volunteers: int
    new_volunteers: int
    volunteer_hours: float
    

class EventMetrics(BaseModel):
    """Event-related metrics."""
    
    total_events: int
    upcoming_events: int
    total_attendees: int
    average_attendance: float
    

class AnalyticsDashboard(BaseModel):
    """Complete analytics dashboard data."""
    
    overview: Dict[str, MetricCard]
    volunteer_metrics: VolunteerMetrics
    event_metrics: EventMetrics
    donation_trends: List[TimeSeriesData]
    volunteer_activity: List[TimeSeriesData]
    engagement_data: Dict[str, Any]


class WebSocketMessage(BaseModel):
    """WebSocket message structure for real-time updates."""
    
    type: str  # "analytics_update", "alert", "notification"
    data: Dict[str, Any]
    timestamp: datetime
    user_id: Optional[str] = None


class CampaignAnalytics(BaseModel):
    """Campaign analytics data structure."""
    
    id: Optional[str] = None
    name: str
    status: str = "active"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_impressions: int = 0
    total_clicks: int = 0
    total_conversions: int = 0
    total_spend: float = 0.0