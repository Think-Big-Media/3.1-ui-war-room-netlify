"""
Event registration model for tracking event attendees.
"""
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


class EventRegistration(Base):
    """Event registration model."""

    __tablename__ = "event_registrations"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Event relationship
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False, index=True)
    event = relationship("Event", back_populates="registrations")

    # Registrant relationship (can be volunteer or contact)
    volunteer_id = Column(String(36), ForeignKey("volunteers.id"), index=True)
    volunteer = relationship("Volunteer", back_populates="event_registrations")

    contact_id = Column(String(36), ForeignKey("contacts.id"), index=True)
    contact = relationship("Contact", back_populates="event_registrations")

    # Registration details
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    registration_source = Column(String(100))  # website, phone, in_person

    # Guest information (if not in database)
    guest_name = Column(String(255))
    guest_email = Column(String(255))
    guest_phone = Column(String(50))
    number_of_guests = Column(Integer, default=1)

    # Status
    status = Column(
        String(50), default="registered"
    )  # registered, waitlisted, cancelled, attended, no_show
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))
    checked_in_by = Column(String(36), ForeignKey("users.id"))

    # Payment (for paid events)
    payment_required = Column(Boolean, default=False)
    payment_status = Column(String(50))  # pending, completed, refunded
    payment_amount = Column(Float)
    payment_transaction_id = Column(String(255))

    # Special requirements
    dietary_restrictions = Column(Text)
    accessibility_needs = Column(Text)
    special_requests = Column(Text)

    # Communication
    confirmation_sent = Column(Boolean, default=False)
    confirmation_sent_at = Column(DateTime(timezone=True))
    reminder_sent = Column(Boolean, default=False)
    reminder_sent_at = Column(DateTime(timezone=True))

    # Volunteer assignment (if registered as volunteer)
    volunteer_role = Column(String(100))
    volunteer_shift_id = Column(String(36), ForeignKey("volunteer_shifts.id"))

    # Notes
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def registrant_name(self) -> str:
        """Get registrant name."""
        if self.volunteer:
            return self.volunteer.full_name
        elif self.contact:
            return self.contact.full_name
        else:
            return self.guest_name or "Unknown"

    @property
    def registrant_email(self) -> str:
        """Get registrant email."""
        if self.volunteer:
            return self.volunteer.email
        elif self.contact:
            return self.contact.email
        else:
            return self.guest_email or ""

    @property
    def is_attended(self) -> bool:
        """Check if registrant attended."""
        return self.status == "attended" or self.checked_in

    def check_in(self, user_id: str) -> None:
        """Check in registrant."""
        self.checked_in = True
        self.checked_in_at = datetime.utcnow()
        self.checked_in_by = user_id
        self.status = "attended"


class VolunteerShift(Base):
    """Volunteer shift model for event staffing."""

    __tablename__ = "volunteer_shifts"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Event relationship
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False, index=True)
    event = relationship("Event", back_populates="shifts")

    # Volunteer relationship
    volunteer_id = Column(String(36), ForeignKey("volunteers.id"), index=True)
    volunteer = relationship("Volunteer", back_populates="shifts")

    # Shift details
    role = Column(String(100), nullable=False)  # setup, registration, cleanup, etc.
    description = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)

    # Requirements
    volunteers_needed = Column(Integer, default=1)
    volunteers_assigned = Column(Integer, default=0)
    skills_required = Column(JSON, default=list)

    # Status
    status = Column(
        String(50), default="scheduled"
    )  # scheduled, in_progress, completed, cancelled

    # Check-in/out
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))
    checked_out = Column(Boolean, default=False)
    checked_out_at = Column(DateTime(timezone=True))

    # Hours tracking
    scheduled_hours = Column(Float)
    actual_hours = Column(Float)

    # Notes and feedback
    notes = Column(Text)
    volunteer_feedback = Column(Text)
    coordinator_notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def duration_hours(self) -> float:
        """Calculate shift duration in hours."""
        if not self.start_time or not self.end_time:
            return 0
        delta = self.end_time - self.start_time
        return delta.total_seconds() / 3600

    @property
    def is_full(self) -> bool:
        """Check if shift is fully staffed."""
        return self.volunteers_assigned >= self.volunteers_needed
