"""
Volunteer model for campaign volunteers.
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
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.base import BaseModel as Base


class Volunteer(Base):
    """Volunteer model for campaign volunteers."""

    __tablename__ = "volunteers"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Organization relationship
    org_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    organization = relationship("Organization", back_populates="volunteers")

    # Personal information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50))
    secondary_phone = Column(String(50))

    # Address
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    postal_code = Column(String(20))

    # Demographics (optional)
    date_of_birth = Column(DateTime(timezone=True))
    gender = Column(String(50))
    occupation = Column(String(255))
    employer = Column(String(255))

    # Volunteer information
    status = Column(String(50), default="active")  # active, inactive, pending
    volunteer_since = Column(DateTime(timezone=True), default=func.now())
    source = Column(String(100))  # How they found us
    referred_by = Column(String(255))

    # Skills and interests
    skills = Column(JSON, default=list)  # ["canvassing", "phone_banking", "data_entry"]
    interests = Column(JSON, default=list)  # Areas of interest
    languages = Column(JSON, default=list)  # Languages spoken

    # Availability
    availability = Column(JSON, default=dict)  # {"monday": true, "tuesday": false, ...}
    hours_per_week = Column(Integer, default=0)
    preferred_contact_method = Column(String(50), default="email")  # email, phone, sms

    # Activity tracking
    total_hours = Column(Integer, default=0)
    events_attended = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True))

    # Communication preferences
    email_opt_in = Column(Boolean, default=True)
    sms_opt_in = Column(Boolean, default=False)
    phone_opt_in = Column(Boolean, default=True)

    # Notes and tags
    notes = Column(Text)
    tags = Column(JSON, default=list)  # Custom tags

    # Background check (if required)
    background_check_completed = Column(Boolean, default=False)
    background_check_date = Column(DateTime(timezone=True))

    # Emergency contact
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(50))
    emergency_contact_relationship = Column(String(100))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    event_registrations = relationship("EventRegistration", back_populates="volunteer")
    shifts = relationship("VolunteerShift", back_populates="volunteer")

    @property
    def full_name(self) -> str:
        """Get volunteer's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_active(self) -> bool:
        """Check if volunteer is active."""
        return self.status == "active"

    @property
    def age(self) -> Optional[int]:
        """Calculate volunteer's age."""
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

    def has_skill(self, skill: str) -> bool:
        """Check if volunteer has a specific skill."""
        return skill in (self.skills or [])

    def add_skill(self, skill: str) -> None:
        """Add a skill to volunteer."""
        if self.skills is None:
            self.skills = []
        if skill not in self.skills:
            self.skills.append(skill)

    def remove_skill(self, skill: str) -> None:
        """Remove a skill from volunteer."""
        if self.skills and skill in self.skills:
            self.skills.remove(skill)

    def is_available_on(self, day: str) -> bool:
        """Check if volunteer is available on a specific day."""
        return (self.availability or {}).get(day.lower(), False)

    def add_tag(self, tag: str) -> None:
        """Add a tag to volunteer."""
        if self.tags is None:
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)

    def remove_tag(self, tag: str) -> None:
        """Remove a tag from volunteer."""
        if self.tags and tag in self.tags:
            self.tags.remove(tag)

    def to_dict(self) -> dict:
        """Convert volunteer to dictionary."""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "full_name": self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "status": self.status,
            "skills": self.skills,
            "languages": self.languages,
            "availability": self.availability,
            "total_hours": self.total_hours,
            "events_attended": self.events_attended,
            "volunteer_since": self.volunteer_since.isoformat()
            if self.volunteer_since
            else None,
            "last_activity_date": self.last_activity_date.isoformat()
            if self.last_activity_date
            else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
