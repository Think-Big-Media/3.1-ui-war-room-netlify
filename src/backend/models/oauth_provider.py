"""
OAuth provider model for social authentication.
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.base import BaseModel as Base


class OAuthProvider(Base):
    """OAuth provider account linking for social authentication."""
    
    __tablename__ = "oauth_providers"
    
    # Primary key
    id = Column(String(36), primary_key=True, index=True)
    
    # User relationship
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    user = relationship("User", back_populates="oauth_providers")
    
    # Provider information
    provider = Column(String(50), nullable=False)  # google, facebook, etc.
    provider_user_id = Column(String(255), nullable=False)  # ID from provider
    
    # Provider data
    email = Column(String(255))
    name = Column(String(255))
    picture = Column(String(500))
    
    # OAuth tokens (encrypted in production)
    access_token = Column(String(500))
    refresh_token = Column(String(500))
    token_expires_at = Column(DateTime(timezone=True))
    
    # Additional provider data
    provider_data = Column(JSON, default=dict)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_used_at = Column(DateTime(timezone=True))
    
    # Unique constraint for provider + provider_user_id
    __table_args__ = (
        {"mysql_engine": "InnoDB"},
    )