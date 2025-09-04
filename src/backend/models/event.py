"""
Event model for campaign events and activities.
"""
from typing import Optional, Dict, Any
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
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from models.base import BaseModel as Base


class Event(Base):
    """Event model for campaign events."""

    __tablename__ = "events"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Organization relationship
    org_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    organization = relationship("Organization", back_populates="events")

    # Event information
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), index=True)
    description = Column(Text)
    event_type = Column(
        String(50), nullable=False, index=True
    )  # meeting, rally, fundraiser, canvassing, training

    # Date and time
    start_date = Column(DateTime(timezone=True), nullable=False, index=True)
    end_date = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(50), default="America/New_York")

    # Location
    location_name = Column(String(255))
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state = Column(String(50))
    postal_code = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)

    # Virtual event details
    is_virtual = Column(Boolean, default=False)
    virtual_url = Column(String(500))
    virtual_platform = Column(String(50))  # zoom, teams, meet, etc.

    # Capacity and registration
    max_attendees = Column(Integer)
    current_attendees = Column(Integer, default=0)
    registration_required = Column(Boolean, default=True)
    registration_deadline = Column(DateTime(timezone=True))

    # Cost and fundraising
    is_free = Column(Boolean, default=True)
    ticket_price = Column(Float, default=0.0)
    fundraising_goal = Column(Float)
    funds_raised = Column(Float, default=0.0)

    # Event details
    agenda = Column(JSON, default=list)  # List of agenda items
    speakers = Column(JSON, default=list)  # List of speaker info
    sponsors = Column(JSON, default=list)  # List of sponsors
    materials_needed = Column(JSON, default=list)  # List of materials

    # Volunteer requirements
    volunteers_needed = Column(Integer, default=0)
    volunteers_registered = Column(Integer, default=0)
    volunteer_roles = Column(JSON, default=list)  # Roles needed

    # Status and visibility
    status = Column(
        String(50), default="scheduled"
    )  # draft, scheduled, in_progress, completed, cancelled
    visibility = Column(String(50), default="public")  # public, private, unlisted
    featured = Column(Boolean, default=False)

    # Communication
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime(timezone=True))
    follow_up_sent = Column(Boolean, default=False)
    follow_up_sent_at = Column(DateTime(timezone=True))

    # Performance metrics
    actual_attendees = Column(Integer)
    no_shows = Column(Integer)
    satisfaction_score = Column(Float)  # Average rating

    # Media
    cover_image_url = Column(String(500))
    gallery_urls = Column(JSON, default=list)

    # Tags and categories
    tags = Column(JSON, default=list)
    categories = Column(JSON, default=list)

    # Custom fields
    custom_fields = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(36), ForeignKey("users.id"))

    # Relationships
    registrations = relationship("EventRegistration", back_populates="event")
    shifts = relationship("VolunteerShift", back_populates="event")

    @property
    def is_upcoming(self) -> bool:
        """Check if event is upcoming."""
        return self.start_date > datetime.utcnow() and self.status == "scheduled"

    @property
    def is_past(self) -> bool:
        """Check if event is past."""
        return self.end_date < datetime.utcnow()

    @property
    def is_full(self) -> bool:
        """Check if event is at capacity."""
        return self.max_attendees and self.current_attendees >= self.max_attendees

    @property
    def spots_available(self) -> Optional[int]:
        """Get number of spots available."""
        if not self.max_attendees:
            return None
        return max(0, self.max_attendees - self.current_attendees)

    @property
    def duration_hours(self) -> float:
        """Get event duration in hours."""
        if not self.start_date or not self.end_date:
            return 0
        delta = self.end_date - self.start_date
        return delta.total_seconds() / 3600

    @property
    def attendance_rate(self) -> Optional[float]:
        """Calculate attendance rate."""
        if not self.current_attendees or not self.actual_attendees:
            return None
        return (self.actual_attendees / self.current_attendees) * 100

    def needs_volunteers(self) -> bool:
        """Check if event needs more volunteers."""
        return self.volunteers_needed > self.volunteers_registered

    def to_dict(self) -> dict:
        """Convert event to dictionary."""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "name": self.name,
            "slug": self.slug,
            "event_type": self.event_type,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "location_name": self.location_name,
            "city": self.city,
            "state": self.state,
            "is_virtual": self.is_virtual,
            "max_attendees": self.max_attendees,
            "current_attendees": self.current_attendees,
            "is_full": self.is_full,
            "spots_available": self.spots_available,
            "status": self.status,
            "is_free": self.is_free,
            "ticket_price": self.ticket_price,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
