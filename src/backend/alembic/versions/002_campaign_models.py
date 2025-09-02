"""
Campaign business models

Create tables for volunteers, events, contacts, and donations.

Revision ID: 002_campaign_models
Revises: 001_initial_core_tables
Create Date: 2025-07-11 04:35:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "002_campaign_models"
down_revision = "001_initial_core_tables"
branch_labels = None
depends_on = None


def upgrade():
    """Create campaign business model tables."""

    # Create volunteers table
    op.create_table(
        "volunteers",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("org_id", sa.String(36), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("address_line1", sa.String(255), nullable=True),
        sa.Column("address_line2", sa.String(255), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(50), nullable=True),
        sa.Column("zip_code", sa.String(20), nullable=True),
        sa.Column("skills", sa.Text(), nullable=True),
        sa.Column("interests", sa.Text(), nullable=True),
        sa.Column("availability", sa.JSON(), nullable=True),
        sa.Column("emergency_contact_name", sa.String(200), nullable=True),
        sa.Column("emergency_contact_phone", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_volunteers_id"), "volunteers", ["id"], unique=False)
    op.create_index(
        op.f("ix_volunteers_org_id"), "volunteers", ["org_id"], unique=False
    )
    op.create_index(op.f("ix_volunteers_email"), "volunteers", ["email"], unique=False)

    # Create events table
    op.create_table(
        "events",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("org_id", sa.String(36), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("timezone", sa.String(50), nullable=True),
        sa.Column("location_name", sa.String(255), nullable=True),
        sa.Column("location_address", sa.String(500), nullable=True),
        sa.Column("location_city", sa.String(100), nullable=True),
        sa.Column("location_state", sa.String(50), nullable=True),
        sa.Column("location_zip", sa.String(20), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("registration_required", sa.Boolean(), nullable=True),
        sa.Column("registration_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False)
    op.create_index(op.f("ix_events_org_id"), "events", ["org_id"], unique=False)
    op.create_index(
        op.f("ix_events_start_date"), "events", ["start_date"], unique=False
    )

    # Create contacts table
    op.create_table(
        "contacts",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("org_id", sa.String(36), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=True),
        sa.Column("last_name", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("address_line1", sa.String(255), nullable=True),
        sa.Column("address_line2", sa.String(255), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(50), nullable=True),
        sa.Column("zip_code", sa.String(20), nullable=True),
        sa.Column("voter_id", sa.String(50), nullable=True),
        sa.Column(
            "voter_status",
            sa.Enum(
                "REGISTERED", "UNREGISTERED", "INACTIVE", "UNKNOWN", name="voterstatus"
            ),
            nullable=True,
        ),
        sa.Column("party_affiliation", sa.String(50), nullable=True),
        sa.Column(
            "contact_type",
            sa.Enum(
                "VOTER",
                "SUPPORTER",
                "VOLUNTEER",
                "DONOR",
                "MEDIA",
                "VIP",
                name="contacttype",
            ),
            nullable=True,
        ),
        sa.Column("support_level", sa.Integer(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("last_contacted", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contacts_id"), "contacts", ["id"], unique=False)
    op.create_index(op.f("ix_contacts_org_id"), "contacts", ["org_id"], unique=False)
    op.create_index(op.f("ix_contacts_email"), "contacts", ["email"], unique=False)
    op.create_index(
        op.f("ix_contacts_voter_id"), "contacts", ["voter_id"], unique=False
    )

    # Create donations table
    op.create_table(
        "donations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("org_id", sa.String(36), nullable=False),
        sa.Column("contact_id", sa.String(36), nullable=True),
        sa.Column("donor_first_name", sa.String(100), nullable=True),
        sa.Column("donor_last_name", sa.String(100), nullable=True),
        sa.Column("donor_email", sa.String(255), nullable=True),
        sa.Column("donor_phone", sa.String(50), nullable=True),
        sa.Column("donor_address", sa.String(500), nullable=True),
        sa.Column("donor_city", sa.String(100), nullable=True),
        sa.Column("donor_state", sa.String(50), nullable=True),
        sa.Column("donor_zip", sa.String(20), nullable=True),
        sa.Column("donor_employer", sa.String(255), nullable=True),
        sa.Column("donor_occupation", sa.String(255), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "donation_type",
            sa.Enum("INDIVIDUAL", "CORPORATE", "PAC", "OTHER", name="donationtype"),
            nullable=True,
        ),
        sa.Column(
            "payment_method",
            sa.Enum(
                "CREDIT_CARD",
                "BANK_TRANSFER",
                "CHECK",
                "CASH",
                "OTHER",
                name="paymentmethod",
            ),
            nullable=True,
        ),
        sa.Column("transaction_id", sa.String(255), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING", "COMPLETED", "FAILED", "REFUNDED", name="donationstatus"
            ),
            nullable=True,
        ),
        sa.Column("donation_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("processed_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_recurring", sa.Boolean(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_donations_id"), "donations", ["id"], unique=False)
    op.create_index(op.f("ix_donations_org_id"), "donations", ["org_id"], unique=False)
    op.create_index(
        op.f("ix_donations_contact_id"), "donations", ["contact_id"], unique=False
    )
    op.create_index(
        op.f("ix_donations_donation_date"), "donations", ["donation_date"], unique=False
    )
    op.create_index(
        op.f("ix_donations_transaction_id"),
        "donations",
        ["transaction_id"],
        unique=False,
    )

    # Create event_registrations table
    op.create_table(
        "event_registrations",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("event_id", sa.String(36), nullable=False),
        sa.Column("volunteer_id", sa.String(36), nullable=True),
        sa.Column("contact_id", sa.String(36), nullable=True),
        sa.Column("first_name", sa.String(100), nullable=True),
        sa.Column("last_name", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("registration_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attendance_status", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_event_registrations_id"), "event_registrations", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_event_registrations_event_id"),
        "event_registrations",
        ["event_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_event_registrations_volunteer_id"),
        "event_registrations",
        ["volunteer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_event_registrations_contact_id"),
        "event_registrations",
        ["contact_id"],
        unique=False,
    )

    # Create volunteer_shifts table
    op.create_table(
        "volunteer_shifts",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("volunteer_id", sa.String(36), nullable=False),
        sa.Column("event_id", sa.String(36), nullable=True),
        sa.Column("shift_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("hours_worked", sa.Numeric(5, 2), nullable=True),
        sa.Column("activity_type", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_volunteer_shifts_id"), "volunteer_shifts", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_volunteer_shifts_volunteer_id"),
        "volunteer_shifts",
        ["volunteer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_volunteer_shifts_event_id"),
        "volunteer_shifts",
        ["event_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_volunteer_shifts_shift_date"),
        "volunteer_shifts",
        ["shift_date"],
        unique=False,
    )

    # Create foreign key constraints
    op.create_foreign_key(
        "fk_volunteers_org_id_organizations",
        "volunteers",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_events_org_id_organizations",
        "events",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_contacts_org_id_organizations",
        "contacts",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_donations_org_id_organizations",
        "donations",
        "organizations",
        ["org_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_donations_contact_id_contacts",
        "donations",
        "contacts",
        ["contact_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_event_registrations_event_id_events",
        "event_registrations",
        "events",
        ["event_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_event_registrations_volunteer_id_volunteers",
        "event_registrations",
        "volunteers",
        ["volunteer_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_event_registrations_contact_id_contacts",
        "event_registrations",
        "contacts",
        ["contact_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_volunteer_shifts_volunteer_id_volunteers",
        "volunteer_shifts",
        "volunteers",
        ["volunteer_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_volunteer_shifts_event_id_events",
        "volunteer_shifts",
        "events",
        ["event_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade():
    """Drop campaign business model tables."""

    # Drop foreign key constraints first
    op.drop_constraint(
        "fk_volunteer_shifts_event_id_events", "volunteer_shifts", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_volunteer_shifts_volunteer_id_volunteers",
        "volunteer_shifts",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_event_registrations_contact_id_contacts",
        "event_registrations",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_event_registrations_volunteer_id_volunteers",
        "event_registrations",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_event_registrations_event_id_events",
        "event_registrations",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_donations_contact_id_contacts", "donations", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_donations_org_id_organizations", "donations", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_contacts_org_id_organizations", "contacts", type_="foreignkey"
    )
    op.drop_constraint("fk_events_org_id_organizations", "events", type_="foreignkey")
    op.drop_constraint(
        "fk_volunteers_org_id_organizations", "volunteers", type_="foreignkey"
    )

    # Drop indexes and tables
    op.drop_index(op.f("ix_volunteer_shifts_shift_date"), table_name="volunteer_shifts")
    op.drop_index(op.f("ix_volunteer_shifts_event_id"), table_name="volunteer_shifts")
    op.drop_index(
        op.f("ix_volunteer_shifts_volunteer_id"), table_name="volunteer_shifts"
    )
    op.drop_index(op.f("ix_volunteer_shifts_id"), table_name="volunteer_shifts")
    op.drop_table("volunteer_shifts")

    op.drop_index(
        op.f("ix_event_registrations_contact_id"), table_name="event_registrations"
    )
    op.drop_index(
        op.f("ix_event_registrations_volunteer_id"), table_name="event_registrations"
    )
    op.drop_index(
        op.f("ix_event_registrations_event_id"), table_name="event_registrations"
    )
    op.drop_index(op.f("ix_event_registrations_id"), table_name="event_registrations")
    op.drop_table("event_registrations")

    op.drop_index(op.f("ix_donations_transaction_id"), table_name="donations")
    op.drop_index(op.f("ix_donations_donation_date"), table_name="donations")
    op.drop_index(op.f("ix_donations_contact_id"), table_name="donations")
    op.drop_index(op.f("ix_donations_org_id"), table_name="donations")
    op.drop_index(op.f("ix_donations_id"), table_name="donations")
    op.drop_table("donations")

    op.drop_index(op.f("ix_contacts_voter_id"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_email"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_org_id"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_id"), table_name="contacts")
    op.drop_table("contacts")

    op.drop_index(op.f("ix_events_start_date"), table_name="events")
    op.drop_index(op.f("ix_events_org_id"), table_name="events")
    op.drop_index(op.f("ix_events_id"), table_name="events")
    op.drop_table("events")

    op.drop_index(op.f("ix_volunteers_email"), table_name="volunteers")
    op.drop_index(op.f("ix_volunteers_org_id"), table_name="volunteers")
    op.drop_index(op.f("ix_volunteers_id"), table_name="volunteers")
    op.drop_table("volunteers")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS donationstatus")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("DROP TYPE IF EXISTS donationtype")
    op.execute("DROP TYPE IF EXISTS contacttype")
    op.execute("DROP TYPE IF EXISTS voterstatus")
