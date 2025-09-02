"""Add auth tables and performance indexes

Revision ID: 002
Revises: 001
Create Date: 2025-01-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    # Create sessions table for auth tokens
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("token", sa.String(500), unique=True, nullable=False, index=True),
        sa.Column(
            "refresh_token", sa.String(500), unique=True, nullable=False, index=True
        ),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("user_agent", sa.String(500)),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("refresh_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column(
            "last_activity", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )

    # Create password_history table
    op.create_table(
        "password_history",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )

    # Create login_attempts table
    op.create_table(
        "login_attempts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, index=True),
        sa.Column("ip_address", sa.String(45), index=True),
        sa.Column("user_agent", sa.String(500)),
        sa.Column("success", sa.Boolean, nullable=False),
        sa.Column("failure_reason", sa.String(100)),
        sa.Column(
            "attempted_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            index=True,
        ),
    )

    # Add composite indexes for common queries

    # Users table indexes
    op.create_index("ix_users_org_role", "users", ["org_id", "role"])
    op.create_index("ix_users_org_active", "users", ["org_id", "is_active"])

    # Contacts table indexes
    op.create_index("ix_contacts_org_type", "contacts", ["org_id", "contact_type"])
    op.create_index(
        "ix_contacts_org_engagement", "contacts", ["org_id", "engagement_score"]
    )
    op.create_index("ix_contacts_org_created", "contacts", ["org_id", "created_at"])

    # Volunteers table indexes
    op.create_index("ix_volunteers_org_status", "volunteers", ["org_id", "status"])
    op.create_index("ix_volunteers_org_hours", "volunteers", ["org_id", "total_hours"])

    # Events table indexes
    op.create_index("ix_events_org_status", "events", ["org_id", "status"])
    op.create_index("ix_events_org_type", "events", ["org_id", "event_type"])
    op.create_index(
        "ix_events_public_upcoming", "events", ["is_public", "start_date", "status"]
    )

    # Donations table indexes
    op.create_index("ix_donations_org_status", "donations", ["org_id", "status"])
    op.create_index("ix_donations_org_type", "donations", ["org_id", "donation_type"])
    op.create_index("ix_donations_contact", "donations", ["contact_id", "donated_at"])
    op.create_index(
        "ix_donations_org_date_amount", "donations", ["org_id", "donated_at", "amount"]
    )

    # Event registrations indexes
    op.create_index(
        "ix_event_reg_event_status", "event_registrations", ["event_id", "status"]
    )
    op.create_index(
        "ix_event_reg_volunteer", "event_registrations", ["volunteer_id", "created_at"]
    )
    op.create_index(
        "ix_event_reg_contact", "event_registrations", ["contact_id", "created_at"]
    )

    # Volunteer shifts indexes
    op.create_index(
        "ix_volunteer_shifts_event_role", "volunteer_shifts", ["event_id", "role"]
    )
    op.create_index(
        "ix_volunteer_shifts_volunteer",
        "volunteer_shifts",
        ["volunteer_id", "start_time"],
    )
    op.create_index(
        "ix_volunteer_shifts_time_range", "volunteer_shifts", ["start_time", "end_time"]
    )

    # Add check constraints
    op.create_check_constraint(
        "ck_donations_amount_positive", "donations", "amount > 0"
    )

    op.create_check_constraint(
        "ck_events_date_order", "events", "end_date >= start_date"
    )

    op.create_check_constraint(
        "ck_volunteer_shifts_time_order", "volunteer_shifts", "end_time > start_time"
    )

    op.create_check_constraint(
        "ck_events_capacity",
        "events",
        "current_attendees <= max_attendees OR max_attendees IS NULL",
    )


def downgrade():
    # Drop check constraints
    op.drop_constraint("ck_events_capacity", "events")
    op.drop_constraint("ck_volunteer_shifts_time_order", "volunteer_shifts")
    op.drop_constraint("ck_events_date_order", "events")
    op.drop_constraint("ck_donations_amount_positive", "donations")

    # Drop indexes
    op.drop_index("ix_volunteer_shifts_time_range", "volunteer_shifts")
    op.drop_index("ix_volunteer_shifts_volunteer", "volunteer_shifts")
    op.drop_index("ix_volunteer_shifts_event_role", "volunteer_shifts")

    op.drop_index("ix_event_reg_contact", "event_registrations")
    op.drop_index("ix_event_reg_volunteer", "event_registrations")
    op.drop_index("ix_event_reg_event_status", "event_registrations")

    op.drop_index("ix_donations_org_date_amount", "donations")
    op.drop_index("ix_donations_contact", "donations")
    op.drop_index("ix_donations_org_type", "donations")
    op.drop_index("ix_donations_org_status", "donations")

    op.drop_index("ix_events_public_upcoming", "events")
    op.drop_index("ix_events_org_type", "events")
    op.drop_index("ix_events_org_status", "events")

    op.drop_index("ix_volunteers_org_hours", "volunteers")
    op.drop_index("ix_volunteers_org_status", "volunteers")

    op.drop_index("ix_contacts_org_created", "contacts")
    op.drop_index("ix_contacts_org_engagement", "contacts")
    op.drop_index("ix_contacts_org_type", "contacts")

    op.drop_index("ix_users_org_active", "users")
    op.drop_index("ix_users_org_role", "users")

    # Drop auth tables
    op.drop_table("login_attempts")
    op.drop_table("password_history")
    op.drop_table("sessions")
