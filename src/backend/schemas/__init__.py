"""
Pydantic schemas for API request/response models.
"""

# User schemas
from .user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserInDB,
    UserLogin,
    TokenResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    EmailVerifyRequest,
)

# Analytics schemas
from .analytics import (
    TimeSeriesData,
    ChartData,
    DashboardMetrics,
    AnalyticsQuery,
    AnalyticsResponse,
    DateRangeEnum,
)

# Document schemas
from .document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    SearchQuery,
    SearchResponse,
)

# Platform admin schemas
from .platform_admin import (
    FeatureFlagCreate,
    FeatureFlagUpdate,
    FeatureFlagResponse,
    PlatformAuditLogResponse,
    SystemMetricsResponse,
)

# Checkpoint schemas
from .checkpoint import (
    CheckpointCreate,
    CheckpointUpdate,
    CheckpointResponse,
    CheckpointRestore,
    CheckpointHistory,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserInDB",
    "UserLogin",
    "TokenResponse",
    "PasswordResetRequest",
    "PasswordResetConfirm",
    "EmailVerifyRequest",
    # Analytics
    "TimeSeriesData",
    "ChartData",
    "DashboardMetrics",
    "AnalyticsQuery",
    "AnalyticsResponse",
    "DateRangeEnum",
    # Document
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    "SearchQuery",
    "SearchResponse",
    # Platform Admin
    "FeatureFlagCreate",
    "FeatureFlagUpdate",
    "FeatureFlagResponse",
    "PlatformAuditLogResponse",
    "SystemMetricsResponse",
    # Checkpoint
    "CheckpointCreate",
    "CheckpointUpdate",
    "CheckpointResponse",
    "CheckpointRestore",
    "CheckpointHistory",
]
