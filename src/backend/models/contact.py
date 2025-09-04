"""
Contact model for voter/supporter database.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Integer,
    Float,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from models.base import BaseModel as Base


class ContactType(str, enum.Enum):
    """Types of contacts."""

    VOTER = "voter"
    SUPPORTER = "supporter"
    DONOR = "donor"
    VOLUNTEER = "volunteer"
    UNDECIDED = "undecided"
    OPPONENT = "opponent"
    MEDIA = "media"
    VIP = "vip"
    OTHER = "other"


class VoterStatus(str, enum.Enum):
    """Voter registration status."""

    REGISTERED = "registered"
    UNREGISTERED = "unregistered"
    UNKNOWN = "unknown"
    INELIGIBLE = "ineligible"


class Contact(Base):
    """Contact model for voter/supporter database."""

    __tablename__ = "contacts"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Organization relationship
    org_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    organization = relationship("Organization", back_populates="contacts")

    # Personal information
    first_name = Column(String(100), nullable=False, index=True)
    last_name = Column(String(100), nullable=False, index=True)
    middle_name = Column(String(100))
    prefix = Column(String(20))  # Mr., Mrs., Dr., etc.
    suffix = Column(String(20))  # Jr., Sr., III, etc.

    # Contact information
    email = Column(String(255), index=True)
    phone = Column(String(50), index=True)
    mobile_phone = Column(String(50))
    work_phone = Column(String(50))

    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50), index=True)
    postal_code = Column(String(20), index=True)
    county = Column(String(100))
    precinct = Column(String(50))

    # Demographics
    date_of_birth = Column(DateTime(timezone=True))
    gender = Column(String(50))
    ethnicity = Column(String(100))
    language_preference = Column(String(50), default="en")

    # Voter information
    contact_type = Column(Enum(ContactType), default=ContactType.VOTER, index=True)
    voter_status = Column(Enum(VoterStatus), default=VoterStatus.UNKNOWN)
    voter_id = Column(String(100), unique=True)
    registration_date = Column(DateTime(timezone=True))
    party_affiliation = Column(String(50))

    # Voting history
    elections_voted = Column(JSON, default=list)  # List of election IDs
    last_voted_date = Column(DateTime(timezone=True))
    voting_frequency = Column(String(50))  # always, sometimes, rarely, never

    # Engagement scoring
    support_level = Column(Integer, default=0)  # 1-5 scale
    engagement_score = Column(Float, default=0.0)  # Calculated score
    likelihood_to_vote = Column(Float)  # 0-1 probability

    # Contact history
    last_contact_date = Column(DateTime(timezone=True))
    last_contact_method = Column(String(50))
    total_contacts = Column(Integer, default=0)
    contact_history = Column(JSON, default=list)  # List of contact records

    # Canvassing results
    canvass_results = Column(JSON, default=list)  # List of canvass attempts
    issues_important = Column(JSON, default=list)  # Issues they care about

    # Communication preferences
    email_opt_in = Column(Boolean, default=True)
    sms_opt_in = Column(Boolean, default=False)
    phone_opt_in = Column(Boolean, default=True)
    mail_opt_in = Column(Boolean, default=True)
    do_not_contact = Column(Boolean, default=False)

    # Social media
    facebook_id = Column(String(255))
    twitter_handle = Column(String(255))
    instagram_handle = Column(String(255))

    # Additional information
    occupation = Column(String(255))
    employer = Column(String(255))
    household_size = Column(Integer)
    household_income_range = Column(String(50))

    # Tags and segmentation
    tags = Column(JSON, default=list)
    segments = Column(JSON, default=list)  # Audience segments
    custom_fields = Column(JSON, default=dict)

    # Source tracking
    source = Column(String(100))  # How they entered the system
    source_details = Column(JSON, default=dict)
    imported_from = Column(String(255))  # External system ID

    # Notes
    notes = Column(Text)
    internal_notes = Column(Text)  # Not visible to volunteers

    # Data quality
    is_verified = Column(Boolean, default=False)
    verification_date = Column(DateTime(timezone=True))
    data_quality_score = Column(Float)  # 0-1 score

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    donations = relationship("Donation", back_populates="contact")
    event_registrations = relationship("EventRegistration", back_populates="contact")

    @property
    def full_name(self) -> str:
        """Get contact's full name."""
        parts = []
        if self.prefix:
            parts.append(self.prefix)
        parts.append(self.first_name)
        if self.middle_name:
            parts.append(self.middle_name)
        parts.append(self.last_name)
        if self.suffix:
            parts.append(self.suffix)
        return " ".join(parts)

    @property
    def display_name(self) -> str:
        """Get contact's display name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self) -> Optional[int]:
        """Calculate contact's age."""
        if not self.date_of_birth:
            return None
        today = datetime.utcnow()
        return (
            today.year
            - self.date_of_birth.year
            - (
                (today.month, today.day)
                < (self.date_of_birth.month, self.date_of_birth.day)
            )
        )

    @property
    def is_voter(self) -> bool:
        """Check if contact is a registered voter."""
        return self.voter_status == VoterStatus.REGISTERED

    @property
    def is_supporter(self) -> bool:
        """Check if contact is a supporter."""
        return self.support_level and self.support_level >= 4

    @property
    def can_contact(self) -> bool:
        """Check if we can contact this person."""
        return not self.do_not_contact

    def add_tag(self, tag: str) -> None:
        """Add a tag to contact."""
        if self.tags is None:
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)

    def remove_tag(self, tag: str) -> None:
        """Remove a tag from contact."""
        if self.tags and tag in self.tags:
            self.tags.remove(tag)

    def has_tag(self, tag: str) -> bool:
        """Check if contact has a specific tag."""
        return tag in (self.tags or [])

    def record_contact(self, method: str, notes: str = None) -> None:
        """Record a contact attempt."""
        if self.contact_history is None:
            self.contact_history = []

        self.contact_history.append(
            {
                "date": datetime.utcnow().isoformat(),
                "method": method,
                "notes": notes,
            }
        )

        self.last_contact_date = datetime.utcnow()
        self.last_contact_method = method
        self.total_contacts = (self.total_contacts or 0) + 1

    def to_dict(self) -> dict:
        """Convert contact to dictionary."""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "full_name": self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "city": self.city,
            "state": self.state,
            "contact_type": self.contact_type.value if self.contact_type else None,
            "voter_status": self.voter_status.value if self.voter_status else None,
            "support_level": self.support_level,
            "tags": self.tags,
            "can_contact": self.can_contact,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
