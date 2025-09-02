"""
Admin User model for platform administration.

Separate from regular users to provide enhanced security for administrative functions.
"""
import uuid
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text
from models.uuid_type import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from models.base import BaseModel as Base
from core.security import get_password_hash, verify_password


class AdminUser(Base):
    """Admin user model for platform administration."""

    __tablename__ = "admin_users"

    # Primary key - using UUID for security
    id = Column(UUID, primary_key=True, default=uuid.uuid4, index=True)

    # Authentication fields
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_superadmin = Column(Boolean, default=False, nullable=False)

    # Login tracking
    last_login = Column(DateTime(timezone=True))
    last_login_ip = Column(String(45))  # Support IPv6

    # Security fields for account lockout
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True))

    # Password reset functionality
    reset_token = Column(String(255))
    reset_token_expires = Column(DateTime(timezone=True))

    # Additional profile fields
    full_name = Column(String(255))
    notes = Column(Text)  # Internal notes about the admin

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def set_password(self, password: str) -> None:
        """
        Hash and set admin password using bcrypt with work factor 12.
        
        Args:
            password: Plain text password to hash
        """
        self.password_hash = get_password_hash(password)
        self.reset_failed_attempts()

    def verify_password(self, password: str) -> bool:
        """
        Verify admin password against stored hash.
        
        Args:
            password: Plain text password to verify
            
        Returns:
            True if password is correct, False otherwise
        """
        return verify_password(password, self.password_hash)

    def increment_failed_attempts(self) -> None:
        """
        Increment failed login attempts and lock account if threshold reached.
        Implements progressive lockout: 5 attempts = 15 minutes lockout.
        """
        self.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts for 15 minutes
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=15)

    def reset_failed_attempts(self) -> None:
        """Reset failed login attempts and remove account lock."""
        self.failed_login_attempts = 0
        self.locked_until = None

    def is_account_locked(self) -> bool:
        """
        Check if account is currently locked.
        
        Returns:
            True if account is locked, False otherwise
        """
        if not self.locked_until:
            return False
        
        # Check if lock period has expired
        if datetime.utcnow() > self.locked_until:
            self.reset_failed_attempts()
            return False
            
        return True

    def update_last_login(self, ip_address: str) -> None:
        """
        Update last login timestamp and IP address.
        
        Args:
            ip_address: Client IP address
        """
        self.last_login = datetime.utcnow()
        self.last_login_ip = ip_address
        self.reset_failed_attempts()

    def generate_reset_token(self) -> str:
        """
        Generate password reset token with 1-hour expiration.
        
        Returns:
            Reset token string
        """
        import secrets
        token = secrets.token_urlsafe(32)
        self.reset_token = token
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return token

    def is_reset_token_valid(self, token: str) -> bool:
        """
        Validate password reset token.
        
        Args:
            token: Reset token to validate
            
        Returns:
            True if token is valid and not expired, False otherwise
        """
        if not self.reset_token or not self.reset_token_expires:
            return False
            
        if self.reset_token != token:
            return False
            
        if datetime.utcnow() > self.reset_token_expires:
            return False
            
        return True

    def clear_reset_token(self) -> None:
        """Clear password reset token after use."""
        self.reset_token = None
        self.reset_token_expires = None

    @property
    def display_name(self) -> str:
        """Get admin display name."""
        return self.full_name or self.username

    @property
    def can_login(self) -> bool:
        """Check if admin can log in (active and not locked)."""
        return self.is_active and not self.is_account_locked()

    def to_dict(self, include_sensitive: bool = False) -> dict:
        """
        Convert admin user to dictionary.
        
        Args:
            include_sensitive: Whether to include sensitive fields
            
        Returns:
            Dictionary representation of admin user
        """
        data = {
            "id": str(self.id),
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_superadmin": self.is_superadmin,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "display_name": self.display_name,
            "can_login": self.can_login,
        }
        
        if include_sensitive:
            data.update({
                "failed_login_attempts": self.failed_login_attempts,
                "locked_until": self.locked_until.isoformat() if self.locked_until else None,
                "last_login_ip": self.last_login_ip,
                "notes": self.notes,
            })
            
        return data

    def __repr__(self) -> str:
        """String representation of admin user."""
        return f"<AdminUser {self.username}>"