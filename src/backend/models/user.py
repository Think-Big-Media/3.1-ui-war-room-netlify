"""
User model for authentication and authorization.
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.base import BaseModel as Base
from core.security import get_password_hash, verify_password


class User(Base):
    """User model for campaign staff and administrators."""

    __tablename__ = "users"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Authentication fields
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Profile fields
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50))
    avatar_url = Column(String(500))

    # Organization relationship
    org_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    organization = relationship("Organization", back_populates="users")

    # Authorization fields
    role = Column(
        String(50), nullable=False, default="member"
    )  # admin, manager, member
    permissions = Column(JSON, default=list)  # List of permission strings

    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime(timezone=True))

    # Security fields
    last_login_at = Column(DateTime(timezone=True))
    last_login_ip = Column(String(45))
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True))

    # Password reset
    reset_token = Column(String(255))
    reset_token_expires = Column(DateTime(timezone=True))

    # Two-factor auth
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(255))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    audit_logs = relationship(
        "PlatformAuditLog", 
        foreign_keys="PlatformAuditLog.admin_user_id",
        back_populates="admin_user"
    )
    oauth_providers = relationship(
        "OAuthProvider",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def set_password(self, password: str) -> None:
        """Hash and set user password."""
        self.hashed_password = get_password_hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify user password."""
        return verify_password(password, self.hashed_password)

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        # Admin has all permissions
        if self.role == "admin":
            return True

        # Check specific permissions
        return permission in (self.permissions or [])

    def has_any_permission(self, permissions: List[str]) -> bool:
        """Check if user has any of the specified permissions."""
        return any(self.has_permission(p) for p in permissions)

    def has_all_permissions(self, permissions: List[str]) -> bool:
        """Check if user has all of the specified permissions."""
        return all(self.has_permission(p) for p in permissions)

    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == "admin"

    @property
    def is_manager(self) -> bool:
        """Check if user is a manager or higher."""
        return self.role in ["admin", "manager"]

    @property
    def display_name(self) -> str:
        """Get user display name."""
        return self.full_name or self.email.split("@")[0]

    def to_dict(self) -> dict:
        """Convert user to dictionary."""
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "org_id": self.org_id,
            "role": self.role,
            "permissions": self.permissions,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "two_factor_enabled": self.two_factor_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
