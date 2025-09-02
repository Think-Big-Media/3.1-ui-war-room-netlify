"""
Campaign and political models for War Room application.

This module defines models specific to political campaigns and activities:
- Volunteer: People who volunteer for campaigns
- Event: Campaign events and activities
- Contact: External contacts and supporters
- Donation: Campaign donations and contributions
"""

from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Text,
    Enum,
    Numeric,
    ForeignKey,
    Date,
    Index,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from enum import Enum as PyEnum

from .base import BaseModel


class VolunteerStatus(PyEnum):
    """Volunteer status enumeration."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    FORMER = "former"


class EventType(PyEnum):
    """Event type enumeration."""

    RALLY = "rally"
    FUNDRAISER = "fundraiser"
    TOWN_HALL = "town_hall"
    CANVASSING = "canvassing"
    PHONE_BANK = "phone_bank"
    TRAINING = "training"
    MEETING = "meeting"
    DEBATE = "debate"
    INTERVIEW = "interview"
    OTHER = "other"


class EventStatus(PyEnum):
    """Event status enumeration."""

    PLANNED = "planned"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class ContactType(PyEnum):
    """Contact type enumeration."""

    SUPPORTER = "supporter"
    VOTER = "voter"
    DONOR = "donor"
    VOLUNTEER = "volunteer"
    MEDIA = "media"
    OFFICIAL = "official"
    VENDOR = "vendor"
    OTHER = "other"


class ContactStatus(PyEnum):
    """Contact engagement status."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    DO_NOT_CONTACT = "do_not_contact"
    UNSUBSCRIBED = "unsubscribed"


class DonationType(PyEnum):
    """Donation type enumeration."""

    INDIVIDUAL = "individual"
    CORPORATE = "corporate"
    PAC = "pac"
    COMMITTEE = "committee"
    IN_KIND = "in_kind"
    OTHER = "other"


class DonationStatus(PyEnum):
    """Donation processing status."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class Volunteer(BaseModel):
    """
    Volunteer model for campaign volunteers and staff.

    Tracks volunteer information, skills, availability, and activity.
    """

    __tablename__ = "volunteers"

    # Organization relationship (required - all volunteers belong to an org)
    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Basic information
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Status and availability
    status: Mapped[VolunteerStatus] = mapped_column(
        Enum(VolunteerStatus), default=VolunteerStatus.ACTIVE
    )
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    # Skills and roles
    skills: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON or comma-separated
    roles: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON or comma-separated

    # Contact preferences
    preferred_contact_method: Mapped[str] = mapped_column(String(20), default="email")
    can_contact_email: Mapped[bool] = mapped_column(Boolean, default=True)
    can_contact_phone: Mapped[bool] = mapped_column(Boolean, default=True)
    can_contact_text: Mapped[bool] = mapped_column(Boolean, default=False)

    # Demographics (optional)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Address
    address_line1: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Activity tracking
    first_activity_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_activity_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_hours_volunteered: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    total_events_attended: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="volunteers"
    )

    # Indexes and constraints
    __table_args__ = (
        Index("idx_volunteers_org_email", organization_id, email),
        Index("idx_volunteers_org_status", organization_id, status),
        Index("idx_volunteers_org_available", organization_id, is_available),
        UniqueConstraint(
            "organization_id", "email", name="unique_volunteer_email_per_org"
        ),
    )

    def __repr__(self):
        return f"<Volunteer(id={self.id}, name='{self.full_name}', org_id={self.organization_id})>"

    @property
    def full_name(self) -> str:
        """Return volunteer's full name."""
        return f"{self.first_name} {self.last_name}".strip()


class Event(BaseModel):
    """
    Event model for campaign events and activities.

    Tracks all types of campaign events with location, attendance, and outcomes.
    """

    __tablename__ = "events"

    # Organization relationship (required)
    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Basic event information
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_type: Mapped[EventType] = mapped_column(Enum(EventType), nullable=False)
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus), default=EventStatus.PLANNED
    )

    # Scheduling
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")

    # Location
    venue_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    address_line1: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Virtual event info
    is_virtual: Mapped[bool] = mapped_column(Boolean, default=False)
    virtual_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Capacity and attendance
    max_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    expected_attendance: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_attendance: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Registration
    requires_registration: Mapped[bool] = mapped_column(Boolean, default=False)
    registration_deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    registration_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Outcomes and metrics
    funds_raised: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    volunteers_recruited: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    media_coverage_score: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # 1-10 scale

    # Internal notes
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="events"
    )

    # Indexes and constraints
    __table_args__ = (
        Index("idx_events_org_date", organization_id, start_date),
        Index("idx_events_org_type", organization_id, event_type),
        Index("idx_events_org_status", organization_id, status),
        Index("idx_events_start_date", start_date),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date", name="check_event_dates"
        ),
        CheckConstraint(
            "max_capacity IS NULL OR max_capacity > 0", name="check_positive_capacity"
        ),
    )

    def __repr__(self):
        return f"<Event(id={self.id}, title='{self.title}', type='{self.event_type.value}')>"

    @property
    def duration_hours(self) -> Optional[float]:
        """Calculate event duration in hours."""
        if self.end_date:
            delta = self.end_date - self.start_date
            return delta.total_seconds() / 3600
        return None

    @property
    def is_upcoming(self) -> bool:
        """Check if event is in the future."""
        return self.start_date > datetime.utcnow()

    @property
    def attendance_rate(self) -> Optional[float]:
        """Calculate attendance rate as percentage."""
        if self.expected_attendance and self.actual_attendance:
            return (self.actual_attendance / self.expected_attendance) * 100
        return None


class Contact(BaseModel):
    """
    Contact model for external contacts and supporters.

    Tracks supporters, voters, donors, media contacts, and other external relationships.
    """

    __tablename__ = "contacts"

    # Organization relationship (required)
    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Basic information
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    organization_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Contact information
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Classification
    contact_type: Mapped[ContactType] = mapped_column(Enum(ContactType), nullable=False)
    status: Mapped[ContactStatus] = mapped_column(
        Enum(ContactStatus), default=ContactStatus.ACTIVE
    )

    # Address
    address_line1: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Demographics and preferences
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    political_affiliation: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )

    # Communication preferences
    preferred_contact_method: Mapped[str] = mapped_column(String(20), default="email")
    can_contact_email: Mapped[bool] = mapped_column(Boolean, default=True)
    can_contact_phone: Mapped[bool] = mapped_column(Boolean, default=True)
    can_contact_text: Mapped[bool] = mapped_column(Boolean, default=False)
    can_contact_mail: Mapped[bool] = mapped_column(Boolean, default=True)

    # Engagement tracking
    first_contact_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_contact_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_interactions: Mapped[int] = mapped_column(Integer, default=0)

    # Scoring and rating
    support_score: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # 1-10 scale
    engagement_score: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # 1-10 scale

    # Tags and notes
    tags: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON or comma-separated
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="contacts"
    )

    # Indexes and constraints
    __table_args__ = (
        Index("idx_contacts_org_type", organization_id, contact_type),
        Index("idx_contacts_org_status", organization_id, status),
        Index("idx_contacts_org_email", organization_id, email),
        Index("idx_contacts_last_contact", last_contact_date),
        Index("idx_contacts_support_score", support_score),
    )

    def __repr__(self):
        return f"<Contact(id={self.id}, name='{self.full_name}', type='{self.contact_type.value}')>"

    @property
    def full_name(self) -> str:
        """Return contact's full name or organization name."""
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self.organization_name or "Unknown"

    @property
    def display_name(self) -> str:
        """Return best available name for display."""
        if self.organization_name and (self.first_name or self.last_name):
            return f"{self.full_name} ({self.organization_name})"
        return self.full_name


class Donation(BaseModel):
    """
    Donation model for campaign contributions.

    Tracks monetary and in-kind donations with compliance and reporting features.
    """

    __tablename__ = "donations"

    # Organization relationship (required)
    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Optional contact relationship (if donor is in contacts)
    contact_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Donor information (may duplicate contact info for compliance)
    donor_first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    donor_last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    donor_organization: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True
    )
    donor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    donor_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Donor address (required for compliance)
    donor_address_line1: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True
    )
    donor_address_line2: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True
    )
    donor_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    donor_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    donor_zip_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Donation details
    donation_type: Mapped[DonationType] = mapped_column(
        Enum(DonationType), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    # Processing
    status: Mapped[DonationStatus] = mapped_column(
        Enum(DonationStatus), default=DonationStatus.PENDING
    )
    transaction_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, unique=True
    )
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    processor: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # Stripe, PayPal, etc.

    # Dates
    donation_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    processed_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Compliance and reporting
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurring_frequency: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # monthly, quarterly, etc.

    # FEC reporting
    employer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    occupation: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_reportable: Mapped[bool] = mapped_column(Boolean, default=True)
    reporting_quarter: Mapped[Optional[str]] = mapped_column(
        String(10), nullable=True
    )  # 2024-Q1

    # Internal tracking
    source: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # Website, event, etc.
    campaign: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # Marketing campaign
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="donations"
    )
    contact: Mapped[Optional["Contact"]] = relationship(
        "Contact", back_populates="donations"
    )

    # Indexes and constraints
    __table_args__ = (
        Index("idx_donations_org_date", organization_id, donation_date),
        Index("idx_donations_org_amount", organization_id, amount),
        Index("idx_donations_org_status", organization_id, status),
        Index("idx_donations_donor_email", donor_email),
        Index("idx_donations_transaction_id", transaction_id),
        Index("idx_donations_reporting_quarter", reporting_quarter),
        CheckConstraint("amount > 0", name="check_positive_amount"),
    )

    def __repr__(self):
        return f"<Donation(id={self.id}, amount=${self.amount}, donor='{self.donor_full_name}')>"

    @property
    def donor_full_name(self) -> str:
        """Return donor's full name or organization name."""
        if self.donor_first_name or self.donor_last_name:
            return f"{self.donor_first_name or ''} {self.donor_last_name or ''}".strip()
        return self.donor_organization or "Anonymous"

    @property
    def is_large_donation(self) -> bool:
        """Check if donation requires special FEC reporting (>$200)."""
        return self.amount > 200

    @property
    def donor_address_full(self) -> str:
        """Return formatted full address."""
        parts = [
            self.donor_address_line1,
            self.donor_address_line2,
            self.donor_city,
            f"{self.donor_state} {self.donor_zip_code}".strip(),
        ]
        return ", ".join([part for part in parts if part])


# Add relationships to Organization model (extend the existing model)
# This would be added to the Organization class in core.py:
# volunteers: Mapped[List[Volunteer]] = relationship("Volunteer", back_populates="organization")
# events: Mapped[List[Event]] = relationship("Event", back_populates="organization")
# contacts: Mapped[List[Contact]] = relationship("Contact", back_populates="organization")
# donations: Mapped[List[Donation]] = relationship("Donation", back_populates="organization")

# Add relationships to Contact model for donations
# This would be added to the Contact class:
# donations: Mapped[List[Donation]] = relationship("Donation", back_populates="contact")
