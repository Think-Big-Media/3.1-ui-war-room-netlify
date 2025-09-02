"""
Pydantic schemas for platform administration.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, validator
from enum import Enum


# Enums
class OrganizationStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TRIAL = "trial"
    DELETED = "deleted"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DELETED = "deleted"


# Organization Management
class OrganizationCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    description: Optional[str] = None
    status: OrganizationStatus = OrganizationStatus.ACTIVE
    subscription_tier: str = "free"
    max_users: int = 10
    admin_email: Optional[EmailStr] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator("slug")
    def validate_slug(cls, v):
        if not v.islower():
            raise ValueError("Slug must be lowercase")
        return v


class OrganizationUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[OrganizationStatus] = None
    subscription_tier: Optional[str] = None
    max_users: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    feature_overrides: Optional[Dict[str, bool]] = None


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    status: OrganizationStatus
    subscription_tier: str
    max_users: int
    current_users: int = 0
    analytics_consent: bool
    analytics_consent_date: Optional[datetime]
    feature_overrides: Optional[Dict[str, bool]]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# User Management
class PlatformUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    status: UserStatus
    org_id: UUID
    org_name: str
    last_login: Optional[datetime]
    created_at: datetime
    suspended_at: Optional[datetime]
    suspension_reason: Optional[str]

    class Config:
        orm_mode = True


# Feature Flags
class FeatureFlagRequest(BaseModel):
    flag_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    enabled: bool = False
    rollout_percentage: int = Field(0, ge=0, le=100)
    enabled_for_orgs: Optional[List[UUID]] = None
    disabled_for_orgs: Optional[List[UUID]] = None
    enabled_for_users: Optional[List[UUID]] = None
    rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class FeatureFlagResponse(BaseModel):
    id: UUID
    flag_name: str
    description: Optional[str]
    enabled: bool
    rollout_percentage: int
    enabled_for_orgs: Optional[List[UUID]]
    disabled_for_orgs: Optional[List[UUID]]
    enabled_for_users: Optional[List[UUID]]
    rules: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Platform Metrics
class PlatformMetricsResponse(BaseModel):
    date_range: Dict[str, str]
    organizations: Dict[str, int]
    users: Dict[str, int]
    usage: Dict[str, Any]
    top_organizations: List[Dict[str, Any]]

    class Config:
        schema_extra = {
            "example": {
                "date_range": {"from": "2024-01-01", "to": "2024-01-31"},
                "organizations": {"total": 150, "active": 120, "new": 15},
                "users": {"total": 5000, "active": 3500, "platform_admins": 5},
                "usage": {
                    "total_api_calls": 1500000,
                    "total_ai_tokens": 5000000,
                    "total_events": 25000,
                    "avg_active_users": 3200.5,
                },
                "top_organizations": [],
            }
        }


# Analytics Query
class AnalyticsQueryRequest(BaseModel):
    event_types: Optional[List[str]] = None
    event_names: Optional[List[str]] = None
    org_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    aggregate_by: Optional[str] = None  # hour, day, week, month
    group_by: Optional[List[str]] = None
    limit: int = Field(100, ge=1, le=1000)
    offset: int = Field(0, ge=0)


# Audit Log
class AuditLogResponse(BaseModel):
    id: UUID
    action: str
    entity_type: str
    entity_id: Optional[UUID]
    admin_user: Dict[str, str]
    target_org_id: Optional[UUID]
    target_user_id: Optional[UUID]
    ip_address: Optional[str]
    changes: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]
    timestamp: datetime

    class Config:
        orm_mode = True


# Platform Admin Dashboard Stats
class DashboardStatsResponse(BaseModel):
    """Quick stats for platform admin dashboard."""

    total_organizations: int
    active_organizations: int
    total_users: int
    active_users_today: int
    api_calls_today: int
    ai_tokens_today: int
    system_health: str  # operational, degraded, down
    alerts: List[Dict[str, Any]]
    recent_signups: List[Dict[str, Any]]


# Billing/Usage
class OrganizationUsageResponse(BaseModel):
    """Organization usage details for billing."""

    org_id: UUID
    org_name: str
    billing_period: Dict[str, date]
    usage_summary: Dict[str, int]
    cost_breakdown: Dict[str, float]
    overage_charges: float
    total_cost: float


# Onboarding
class OrganizationOnboardingRequest(BaseModel):
    """Complete org setup with initial admin."""

    organization: OrganizationCreateRequest
    admin_user: Dict[str, Any] = Field(..., description="Admin user details")
    initial_settings: Optional[Dict[str, Any]] = None
    enable_features: Optional[List[str]] = None

    class Config:
        schema_extra = {
            "example": {
                "organization": {
                    "name": "ACME Campaign",
                    "slug": "acme-campaign",
                    "subscription_tier": "professional",
                },
                "admin_user": {
                    "email": "admin@acme.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "password": "SecurePassword123!",
                },
                "enable_features": ["ai_assistant", "advanced_analytics"],
            }
        }


# Error Responses
class PlatformError(BaseModel):
    error: str
    detail: str
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Missing schemas for compatibility
class FeatureFlagCreate(BaseModel):
    """Schema for creating a feature flag."""
    flag_name: str
    description: Optional[str] = None
    enabled: bool = False
    rollout_percentage: int = 0
    enabled_for_orgs: Optional[List[UUID]] = None
    disabled_for_orgs: Optional[List[UUID]] = None
    enabled_for_users: Optional[List[UUID]] = None
    rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class FeatureFlagUpdate(BaseModel):
    """Schema for updating a feature flag."""
    description: Optional[str] = None
    enabled: Optional[bool] = None
    rollout_percentage: Optional[int] = None
    enabled_for_orgs: Optional[List[UUID]] = None
    disabled_for_orgs: Optional[List[UUID]] = None
    enabled_for_users: Optional[List[UUID]] = None
    rules: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class PlatformAuditLogResponse(BaseModel):
    """Schema for platform audit log response."""
    id: UUID
    action: str
    resource_type: str
    resource_id: Optional[UUID] = None
    performed_by: UUID
    organization_id: Optional[UUID] = None
    details: Dict[str, Any]
    created_at: datetime
    
    class Config:
        orm_mode = True


class SystemMetricsResponse(BaseModel):
    """Schema for system metrics response."""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    request_rate: float
    error_rate: float
    response_time_p50: float
    response_time_p95: float
    response_time_p99: float
