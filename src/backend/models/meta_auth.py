"""
Meta Business Suite authentication model for storing OAuth2 tokens.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.base import BaseModel
from core.encryption import token_encryption


class MetaAuth(BaseModel):
    """Meta Business Suite OAuth2 authentication tokens for organizations."""

    __tablename__ = "meta_auth"

    # Link to organization
    org_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, unique=True, index=True
    )
    organization = relationship("Organization", back_populates="meta_auth")

    # OAuth2 credentials
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text)  # Meta may not always provide refresh tokens
    token_expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Meta Business specific fields
    app_id = Column(String(255), nullable=False)  # Meta App ID
    app_secret = Column(Text, nullable=False)  # Encrypted App Secret
    
    # Primary ad account details
    ad_account_id = Column(String(50))  # Primary ad account ID for this org
    business_id = Column(String(50))  # Business Manager ID if applicable
    
    # Page access tokens (JSON field for storing page-specific tokens)
    page_access_tokens = Column(JSON, default=dict)  # {page_id: {token, expires_at}}
    
    # Token status and metadata
    is_active = Column(Boolean, default=True)
    last_refreshed_at = Column(DateTime(timezone=True))
    last_error = Column(Text)  # Store last authentication error
    
    # Scopes and permissions granted
    scopes = Column(JSON, default=list)  # List of OAuth2 scopes
    permissions = Column(JSON, default=list)  # List of granted permissions
    
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
        # Meta uses long-lived tokens (60+ days) but we can exchange short-lived for long-lived
        return self.is_active and self.is_token_expired() and self.access_token
    
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
    
    def get_decrypted_app_secret(self) -> Optional[str]:
        """Get decrypted app secret."""
        if not self.app_secret:
            return None
        return token_encryption.decrypt_token(self.app_secret)
    
    def set_encrypted_app_secret(self, secret: str) -> None:
        """Set encrypted app secret."""
        if secret:
            self.app_secret = token_encryption.encrypt_token(secret)
    
    def get_page_access_token(self, page_id: str) -> Optional[Dict[str, Any]]:
        """Get page access token for specific page."""
        if not self.page_access_tokens or page_id not in self.page_access_tokens:
            return None
        
        page_token_data = self.page_access_tokens[page_id]
        if 'token' in page_token_data:
            # Decrypt the token
            decrypted_token = token_encryption.decrypt_token(page_token_data['token'])
            return {
                'token': decrypted_token,
                'expires_at': page_token_data.get('expires_at'),
                'permissions': page_token_data.get('permissions', [])
            }
        return None
    
    def set_page_access_token(self, page_id: str, token: str, expires_at: Optional[datetime] = None, permissions: Optional[list] = None) -> None:
        """Set encrypted page access token."""
        if not self.page_access_tokens:
            self.page_access_tokens = {}
        
        self.page_access_tokens[page_id] = {
            'token': token_encryption.encrypt_token(token),
            'expires_at': expires_at.isoformat() if expires_at else None,
            'permissions': permissions or []
        }
    
    def remove_page_access_token(self, page_id: str) -> None:
        """Remove page access token."""
        if self.page_access_tokens and page_id in self.page_access_tokens:
            del self.page_access_tokens[page_id]

    def to_dict(self) -> dict:
        """Convert to dictionary (excluding sensitive data)."""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "ad_account_id": self.ad_account_id,
            "business_id": self.business_id,
            "app_id": self.app_id,
            "is_active": self.is_active,
            "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
            "last_refreshed_at": self.last_refreshed_at.isoformat() if self.last_refreshed_at else None,
            "scopes": self.scopes,
            "permissions": self.permissions,
            "page_count": len(self.page_access_tokens) if self.page_access_tokens else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        """String representation."""
        return f"<MetaAuth(org_id={self.org_id}, ad_account_id={self.ad_account_id})>"