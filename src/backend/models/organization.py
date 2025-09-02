"""
Organization model for campaigns and nonprofit organizations.
"""
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from models.base import BaseModel as Base


class SubscriptionTier(str, enum.Enum):
    """Subscription tier levels."""

    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class OrganizationType(str, enum.Enum):
    """Types of organizations."""

    POLITICAL_CAMPAIGN = "political_campaign"
    NONPROFIT = "nonprofit"
    ADVOCACY_GROUP = "advocacy_group"
    PAC = "pac"
    UNION = "union"
    OTHER = "other"


class Organization(Base):
    """Organization model for campaigns and nonprofits."""

    __tablename__ = "organizations"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Basic information
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    org_type = Column(
        Enum(OrganizationType), default=OrganizationType.POLITICAL_CAMPAIGN
    )

    # Contact information
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    website = Column(String(500))

    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    postal_code = Column(String(20))
    country = Column(String(2), default="US")

    # Branding
    logo_url = Column(String(500))
    primary_color = Column(String(7))  # Hex color
    secondary_color = Column(String(7))  # Hex color

    # Campaign/Organization details
    description = Column(Text)
    mission_statement = Column(Text)
    tax_id = Column(String(50))  # EIN for nonprofits
    fec_id = Column(String(50))  # FEC ID for political campaigns

    # Subscription and billing
    subscription_tier = Column(
        Enum(SubscriptionTier), default=SubscriptionTier.FREE, nullable=False
    )
    subscription_expires_at = Column(DateTime(timezone=True))
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))

    # Settings and configuration
    settings = Column(JSON, default=dict)
    features = Column(JSON, default=dict)  # Feature flags specific to org

    # Limits based on subscription
    max_users = Column(Integer, default=5)
    max_contacts = Column(Integer, default=1000)
    max_monthly_emails = Column(Integer, default=5000)
    max_monthly_sms = Column(Integer, default=500)

    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True))

    # Important dates
    founded_date = Column(DateTime(timezone=True))
    election_date = Column(DateTime(timezone=True))  # For campaigns

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="organization")
    volunteers = relationship("Volunteer", back_populates="organization")
    events = relationship("Event", back_populates="organization")
    donations = relationship("Donation", back_populates="organization")
    contacts = relationship("Contact", back_populates="organization")
    audit_logs = relationship("PlatformAuditLog", back_populates="organization")
    documents = relationship("Document", back_populates="organization")
    google_ads_auth = relationship("GoogleAdsAuth", back_populates="organization", uselist=False)
    meta_auth = relationship("MetaAuth", back_populates="organization", uselist=False)

    @property
    def is_political(self) -> bool:
        """Check if organization is political."""
        return self.org_type in [
            OrganizationType.POLITICAL_CAMPAIGN,
            OrganizationType.PAC,
        ]

    @property
    def is_nonprofit(self) -> bool:
        """Check if organization is a nonprofit."""
        return self.org_type == OrganizationType.NONPROFIT

    @property
    def has_premium_features(self) -> bool:
        """Check if organization has premium features."""
        return self.subscription_tier in [
            SubscriptionTier.PROFESSIONAL,
            SubscriptionTier.ENTERPRISE,
        ]

    def get_setting(self, key: str, default: Any = None) -> Any:
        """Get organization setting."""
        return (self.settings or {}).get(key, default)

    def set_setting(self, key: str, value: Any) -> None:
        """Set organization setting."""
        if self.settings is None:
            self.settings = {}
        self.settings[key] = value

    def has_feature(self, feature: str) -> bool:
        """Check if organization has a specific feature enabled."""
        return (self.features or {}).get(feature, False)

    def to_dict(self) -> dict:
        """Convert organization to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "org_type": self.org_type.value if self.org_type else None,
            "email": self.email,
            "phone": self.phone,
            "website": self.website,
            "logo_url": self.logo_url,
            "subscription_tier": self.subscription_tier.value
            if self.subscription_tier
            else None,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
