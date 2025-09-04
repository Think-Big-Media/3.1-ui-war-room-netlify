"""
Example SQLAlchemy models for the War Room platform.
Shows patterns for:
- Table definitions with proper relationships
- Indexes and constraints
- Soft deletes
- Audit fields
- JSON columns
- Enum types
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, 
    Text, JSON, Enum, Index, UniqueConstraint, CheckConstraint,
    Table, Float
)
from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()


class UserRole(str, PyEnum):
    """User role enumeration"""
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    VOLUNTEER = "volunteer"
    VIEWER = "viewer"


class EventStatus(str, PyEnum):
    """Event status enumeration"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VolunteerStatus(str, PyEnum):
    """Volunteer status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    BLOCKED = "blocked"


# Association tables for many-to-many relationships
volunteer_skills = Table(
    'volunteer_skills',
    Base.metadata,
    Column('volunteer_id', Integer, ForeignKey('volunteers.id', ondelete='CASCADE')),
    Column('skill_id', Integer, ForeignKey('skills.id', ondelete='CASCADE')),
    UniqueConstraint('volunteer_id', 'skill_id', name='uq_volunteer_skill')
)

event_tags = Table(
    'event_tags',
    Base.metadata,
    Column('event_id', Integer, ForeignKey('events.id', ondelete='CASCADE')),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE')),
    UniqueConstraint('event_id', 'tag_id', name='uq_event_tag')
)


class TimestampMixin:
    """Mixin for automatic timestamp fields"""
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SoftDeleteMixin:
    """Mixin for soft delete functionality"""
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    deleted_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('users.id'), nullable=True)


class User(Base, TimestampMixin, SoftDeleteMixin):
    """User model with authentication and role management"""
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uuid: Mapped[str] = mapped_column(String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False)
    
    # Authentication fields
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile fields
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Role and permissions
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.VOLUNTEER, nullable=False)
    permissions: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    
    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    volunteer_profile = relationship("Volunteer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    organized_events = relationship("Event", back_populates="organizer", foreign_keys="Event.organizer_id")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    
    # Indexes
    __table_args__ = (
        Index('ix_users_email_active', 'email', 'is_active'),
        Index('ix_users_role_active', 'role', 'is_active'),
    )
    
    @hybrid_property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class Volunteer(Base, TimestampMixin, SoftDeleteMixin):
    """Volunteer profile with detailed information"""
    __tablename__ = 'volunteers'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    
    # Contact information (can be different from user account)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Address
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # Volunteer information
    status: Mapped[VolunteerStatus] = mapped_column(Enum(VolunteerStatus), default=VolunteerStatus.PENDING, nullable=False)
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    availability: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"monday": ["morning", "evening"], ...}
    preferences: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Statistics
    total_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    events_attended: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reliability_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="volunteer_profile")
    skills = relationship("Skill", secondary=volunteer_skills, back_populates="volunteers")
    event_assignments = relationship("EventVolunteer", back_populates="volunteer", cascade="all, delete-orphan")
    time_logs = relationship("TimeLog", back_populates="volunteer", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_volunteers_status_city', 'status', 'city'),
        CheckConstraint('total_hours >= 0', name='ck_volunteers_positive_hours'),
    )


class Event(Base, TimestampMixin, SoftDeleteMixin):
    """Event model with comprehensive event management features"""
    __tablename__ = 'events'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uuid: Mapped[str] = mapped_column(String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False)
    
    # Basic information
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(250), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[EventStatus] = mapped_column(Enum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    
    # Dates and times
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    registration_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Location
    venue_name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(50), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(10), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Capacity and requirements
    max_volunteers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    min_volunteers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    requires_training: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requirements: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Media
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    resources: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"documents": [], "links": []}
    
    # Organization
    organizer_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    campaign_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('campaigns.id'), nullable=True)
    
    # Relationships
    organizer = relationship("User", back_populates="organized_events", foreign_keys=[organizer_id])
    volunteers = relationship("EventVolunteer", back_populates="event", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=event_tags, back_populates="events")
    tasks = relationship("Task", back_populates="event", cascade="all, delete-orphan")
    time_logs = relationship("TimeLog", back_populates="event", cascade="all, delete-orphan")
    
    # Indexes and constraints
    __table_args__ = (
        Index('ix_events_dates', 'start_date', 'end_date'),
        Index('ix_events_status_start', 'status', 'start_date'),
        CheckConstraint('end_date > start_date', name='ck_events_valid_dates'),
        CheckConstraint('max_volunteers IS NULL OR max_volunteers > 0', name='ck_events_positive_max_volunteers'),
    )


class EventVolunteer(Base, TimestampMixin):
    """Association model for event-volunteer relationships with additional data"""
    __tablename__ = 'event_volunteers'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    volunteer_id: Mapped[int] = mapped_column(Integer, ForeignKey('volunteers.id', ondelete='CASCADE'), nullable=False)
    
    # Registration details
    status: Mapped[str] = mapped_column(String(50), default='registered', nullable=False)  # registered, confirmed, attended, no-show
    role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Attendance tracking
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    hours_credited: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Feedback
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    event = relationship("Event", back_populates="volunteers")
    volunteer = relationship("Volunteer", back_populates="event_assignments")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('event_id', 'volunteer_id', name='uq_event_volunteer'),
        Index('ix_event_volunteers_status', 'event_id', 'status'),
        CheckConstraint('rating IS NULL OR (rating >= 1 AND rating <= 5)', name='ck_event_volunteers_valid_rating'),
    )


class Skill(Base, TimestampMixin):
    """Skills that volunteers can have"""
    __tablename__ = 'skills'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    volunteers = relationship("Volunteer", secondary=volunteer_skills, back_populates="skills")


class Tag(Base, TimestampMixin):
    """Tags for categorizing events"""
    __tablename__ = 'tags'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # Hex color
    
    # Relationships
    events = relationship("Event", secondary=event_tags, back_populates="tags")


class AuditLog(Base, TimestampMixin):
    """Audit logging for tracking important actions"""
    __tablename__ = 'audit_logs'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Action details
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Additional context
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])
    
    # Indexes
    __table_args__ = (
        Index('ix_audit_logs_entity', 'entity_type', 'entity_id'),
        Index('ix_audit_logs_user_action', 'user_id', 'action'),
    )