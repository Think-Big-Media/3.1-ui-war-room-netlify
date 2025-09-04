"""
Google Ads authentication model for storing OAuth2 tokens.
"""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.base import BaseModel
from core.encryption import token_encryption


class GoogleAdsAuth(BaseModel):
    """Google Ads OAuth2 authentication tokens for organizations."""

    __tablename__ = "google_ads_auth"

    # Link to organization
    org_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, unique=True, index=True
    )
    organization = relationship("Organization", back_populates="google_ads_auth")

    # OAuth2 credentials
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Google Ads specific fields
    customer_id = Column(String(50))  # Primary customer ID for this org
    developer_token = Column(String(255))  # Google Ads developer token
    
    # OAuth2 app details
    client_id = Column(String(255), nullable=False)
    client_secret = Column(Text, nullable=False)
    
    # Token status
    is_active = Column(Boolean, default=True)
    last_refreshed_at = Column(DateTime(timezone=True))
    last_error = Column(Text)  # Store last authentication error
    
    # Scopes granted
    scopes = Column(JSON, default=list)  # List of OAuth2 scopes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def is_token_expired(self) -> bool:
        """Check if the access token is expired or will expire soon."""
        if not self.token_expires_at:
            return True
        
        # Consider token expired if it expires within 5 minutes
        buffer_time = datetime.utcnow() + timedelta(minutes=5)
        return self.token_expires_at <= buffer_time

    def needs_refresh(self) -> bool:
        """Check if token needs to be refreshed."""
        return self.is_active and self.is_token_expired() and self.refresh_token
    
    def get_decrypted_access_token(self) -> Optional[str]:
        """Get decrypted access token."""
        if not self.access_token:
            return None
        return token_encryption.decrypt_token(self.access_token)
    
    def get_decrypted_refresh_token(self) -> Optional[str]:
        """Get decrypted refresh token."""
        if not self.refresh_token:
            return None
        return token_encryption.decrypt_token(self.refresh_token)
    
    def set_encrypted_access_token(self, token: str) -> None:
        """Set encrypted access token."""
        if token:
            self.access_token = token_encryption.encrypt_token(token)
    
    def set_encrypted_refresh_token(self, token: str) -> None:
        """Set encrypted refresh token."""
        if token:
            self.refresh_token = token_encryption.encrypt_token(token)
    
    def get_decrypted_client_secret(self) -> Optional[str]:
        """Get decrypted client secret."""
        if not self.client_secret:
            return None
        return token_encryption.decrypt_token(self.client_secret)
    
    def set_encrypted_client_secret(self, secret: str) -> None:
        """Set encrypted client secret."""
        if secret:
            self.client_secret = token_encryption.encrypt_token(secret)

    def to_dict(self) -> dict:
        """Convert to dictionary (excluding sensitive data)."""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "customer_id": self.customer_id,
            "is_active": self.is_active,
            "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
            "last_refreshed_at": self.last_refreshed_at.isoformat() if self.last_refreshed_at else None,
            "scopes": self.scopes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        """String representation."""
        return f"<GoogleAdsAuth(org_id={self.org_id}, customer_id={self.customer_id})>"