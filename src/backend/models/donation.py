"""
Donation model for campaign contributions.
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
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from models.base import BaseModel as Base


class DonationType(str, enum.Enum):
    """Types of donations."""

    ONE_TIME = "one_time"
    RECURRING = "recurring"
    PLEDGE = "pledge"
    IN_KIND = "in_kind"


class PaymentMethod(str, enum.Enum):
    """Payment methods."""

    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CASH = "cash"
    PAYPAL = "paypal"
    OTHER = "other"


class DonationStatus(str, enum.Enum):
    """Donation status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class Donation(Base):
    """Donation model for campaign contributions."""

    __tablename__ = "donations"

    # Primary key
    id = Column(String(36), primary_key=True, index=True)

    # Organization relationship
    org_id = Column(
        String(36), ForeignKey("organizations.id"), nullable=False, index=True
    )
    organization = relationship("Organization", back_populates="donations")

    # Donor information
    donor_name = Column(String(255), nullable=False, index=True)
    donor_email = Column(String(255), nullable=False, index=True)
    donor_phone = Column(String(50))

    # Donor address (required for compliance)
    donor_address_line1 = Column(String(255))
    donor_address_line2 = Column(String(255))
    donor_city = Column(String(100))
    donor_state = Column(String(50))
    donor_postal_code = Column(String(20))
    donor_country = Column(String(2), default="US")

    # Employer information (required for political campaigns)
    donor_occupation = Column(String(255))
    donor_employer = Column(String(255))

    # Donation details
    amount = Column(Float, nullable=False, index=True)
    currency = Column(String(3), default="USD")
    donation_type = Column(Enum(DonationType), default=DonationType.ONE_TIME)
    payment_method = Column(Enum(PaymentMethod), nullable=False)

    # Recurring donation details
    recurring_frequency = Column(String(50))  # monthly, weekly, quarterly, annually
    recurring_start_date = Column(DateTime(timezone=True))
    recurring_end_date = Column(DateTime(timezone=True))
    recurring_total_expected = Column(Float)

    # Payment processing
    status = Column(Enum(DonationStatus), default=DonationStatus.PENDING, index=True)
    transaction_id = Column(String(255), unique=True, index=True)
    stripe_payment_intent_id = Column(String(255))
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))  # For recurring

    # Processing fees
    processing_fee = Column(Float, default=0.0)
    net_amount = Column(Float)  # Amount after fees

    # Campaign/fund designation
    campaign_id = Column(String(36))
    fund_id = Column(String(36))
    designation = Column(String(255))  # Specific purpose

    # In-kind donation details
    in_kind_description = Column(Text)
    in_kind_value = Column(Float)

    # Compliance and reporting
    is_anonymous = Column(Boolean, default=False)
    compliance_verified = Column(Boolean, default=False)
    compliance_notes = Column(Text)
    fec_report_included = Column(Boolean, default=False)

    # Communication
    thank_you_sent = Column(Boolean, default=False)
    thank_you_sent_at = Column(DateTime(timezone=True))
    tax_receipt_sent = Column(Boolean, default=False)
    tax_receipt_sent_at = Column(DateTime(timezone=True))

    # Refund information
    refund_amount = Column(Float)
    refund_reason = Column(String(255))
    refund_date = Column(DateTime(timezone=True))
    refund_transaction_id = Column(String(255))

    # Source tracking
    source = Column(String(100))  # website, event, mail, phone
    source_details = Column(JSON, default=dict)  # Additional source info
    referrer = Column(String(255))
    utm_source = Column(String(100))
    utm_medium = Column(String(100))
    utm_campaign = Column(String(100))

    # Notes and metadata
    notes = Column(Text)
    meta_data = Column(JSON, default=dict)  # Renamed from metadata to avoid SQLAlchemy conflict
    tags = Column(JSON, default=list)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True))

    # Relationships
    contact_id = Column(String(36), ForeignKey("contacts.id"))
    contact = relationship("Contact", back_populates="donations")
    event_id = Column(String(36), ForeignKey("events.id"))

    @property
    def is_completed(self) -> bool:
        """Check if donation is completed."""
        return self.status == DonationStatus.COMPLETED

    @property
    def is_recurring(self) -> bool:
        """Check if donation is recurring."""
        return self.donation_type == DonationType.RECURRING

    @property
    def is_large_donation(self) -> bool:
        """Check if donation is considered large (for reporting)."""
        # FEC requires special reporting for donations over $200
        return self.amount >= 200

    @property
    def requires_employer_info(self) -> bool:
        """Check if donation requires employer information."""
        # Political campaigns require employer info for donations over $200
        return (
            self.amount >= 200 and self.organization and self.organization.is_political
        )

    def calculate_net_amount(self) -> float:
        """Calculate net amount after fees."""
        return self.amount - (self.processing_fee or 0)

    def to_dict(self) -> dict:
        """Convert donation to dictionary."""
        return {
            "id": self.id,
            "org_id": self.org_id,
            "donor_name": self.donor_name,
            "donor_email": self.donor_email,
            "amount": self.amount,
            "currency": self.currency,
            "donation_type": self.donation_type.value if self.donation_type else None,
            "payment_method": self.payment_method.value
            if self.payment_method
            else None,
            "status": self.status.value if self.status else None,
            "is_anonymous": self.is_anonymous,
            "net_amount": self.net_amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat()
            if self.processed_at
            else None,
        }
