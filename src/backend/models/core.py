"""
Core database models for War Room application.

This module defines the foundational models that all other models depend on:
- User: Authentication and user management
- Organization: Campaign/organization structure
- Role-based permissions system
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Text,
    Enum,
    ForeignKey,
    Table,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from .base import BaseModel


class UserStatus(PyEnum):
    """User account status enumeration."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class OrganizationType(PyEnum):
    """Organization type enumeration."""

    CAMPAIGN = "campaign"
    COMMITTEE = "committee"
    PAC = "pac"
    SUPER_PAC = "super_pac"
    NONPROFIT = "nonprofit"
    AGENCY = "agency"


class UserRole(PyEnum):
    """User role enumeration with hierarchical permissions."""

    SUPER_ADMIN = "super_admin"  # Platform-wide access
    ORG_ADMIN = "org_admin"  # Organization-wide admin
    CAMPAIGN_MANAGER = "campaign_manager"  # Campaign management
    ANALYST = "analyst"  # Analytics and reporting
    VIEWER = "viewer"  # Read-only access


# Association table for user-organization relationships with roles
user_organization_roles = Table(
    "user_organization_roles",
    BaseModel.metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column(
        "organization_id", Integer, ForeignKey("organizations.id", ondelete="CASCADE")
    ),
    Column("role", Enum(UserRole), nullable=False),
    Column("granted_at", DateTime(timezone=True), server_default=func.now()),
    Column("granted_by", Integer, ForeignKey("users.id")),
    Column("is_active", Boolean, default=True),
    UniqueConstraint("user_id", "organization_id", "role", name="unique_user_org_role"),
    Index("idx_user_org_roles_user", "user_id"),
    Index("idx_user_org_roles_org", "organization_id"),
    Index("idx_user_org_roles_active", "is_active"),
)


class User(BaseModel):
    """
    User model for authentication and authorization.

    Supports multiple organization memberships with different roles.
    Includes comprehensive audit fields and security features.
    """

    __tablename__ = "users"

    # Basic user information
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    username: Mapped[Optional[str]] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Authentication
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    password_reset_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    password_reset_expires: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Account status
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )

    # Activity tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_activity: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    login_count: Mapped[int] = mapped_column(Integer, default=0)

    # Security
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Profile
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")

    # Platform-level permissions
    is_platform_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    organizations: Mapped[List["Organization"]] = relationship(
        "Organization",
        secondary=user_organization_roles,
        back_populates="users",
        overlaps="user_roles,organization_roles",
    )

    # User roles across organizations
    user_roles = relationship(
        "Organization", secondary=user_organization_roles, overlaps="organizations"
    )

    # Indexes
    __table_args__ = (
        Index("idx_users_email_lower", func.lower(email)),
        Index("idx_users_status_verified", status, is_verified),
        Index("idx_users_last_activity", last_activity),
    )

    def __repr__(self):
        return (
            f"<User(id={self.id}, email='{self.email}', status='{self.status.value}')>"
        )

    @property
    def full_name(self) -> str:
        """Return user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def display_name(self) -> str:
        """Return display name (username or full name)."""
        return self.username or self.full_name

    def has_role_in_org(self, organization_id: int, role: UserRole) -> bool:
        """Check if user has specific role in organization."""
        # This would be implemented with a query in the service layer
        pass

    def get_org_roles(self, organization_id: int) -> List[UserRole]:
        """Get all roles for user in specific organization."""
        # This would be implemented with a query in the service layer
        pass


class Organization(BaseModel):
    """
    Organization model representing campaigns, committees, PACs, etc.

    Serves as the primary tenant boundary for data isolation.
    All analytics and data are scoped to organization level.
    """

    __tablename__ = "organizations"

    # Basic organization information
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    organization_type: Mapped[OrganizationType] = mapped_column(
        Enum(OrganizationType), nullable=False
    )

    # Description and branding
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Contact information
    primary_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    primary_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Address
    address_line1: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(50), default="US")

    # Status and lifecycle
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # FEC/Legal identifiers (for compliance)
    fec_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    ein: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Subscription/billing
    subscription_tier: Mapped[str] = mapped_column(String(50), default="basic")
    subscription_status: Mapped[str] = mapped_column(String(50), default="active")

    # Relationships
    users: Mapped[List[User]] = relationship(
        "User",
        secondary=user_organization_roles,
        back_populates="organizations",
        overlaps="user_roles,organization_roles",
    )

    # Organization roles for users
    organization_roles = relationship(
        "User", secondary=user_organization_roles, overlaps="users"
    )

    # Indexes
    __table_args__ = (
        Index("idx_orgs_slug_active", slug, is_active),
        Index("idx_orgs_type_active", organization_type, is_active),
        Index("idx_orgs_fec_id", fec_id),
    )

    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', type='{self.organization_type.value}')>"

    @property
    def is_political_entity(self) -> bool:
        """Check if organization is a political entity requiring FEC compliance."""
        return self.organization_type in [
            OrganizationType.CAMPAIGN,
            OrganizationType.COMMITTEE,
            OrganizationType.PAC,
            OrganizationType.SUPER_PAC,
        ]
