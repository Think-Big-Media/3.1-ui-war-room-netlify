"""Create initial core tables

Revision ID: 001
Revises: 
Create Date: 2025-01-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create organizations table
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, index=True),
        sa.Column("slug", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column(
            "org_type",
            sa.Enum(
                "political_campaign",
                "nonprofit",
                "advocacy_group",
                "pac",
                "union",
                "other",
                name="organizationtype",
            ),
            nullable=True,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50)),
        sa.Column("website", sa.String(500)),
        sa.Column("address_line1", sa.String(255)),
        sa.Column("address_line2", sa.String(255)),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(50)),
        sa.Column("postal_code", sa.String(20)),
        sa.Column("country", sa.String(2), default="US"),
        sa.Column("logo_url", sa.String(500)),
        sa.Column("primary_color", sa.String(7)),
        sa.Column("secondary_color", sa.String(7)),
        sa.Column("description", sa.Text),
        sa.Column("mission_statement", sa.Text),
        sa.Column("tax_id", sa.String(50)),
        sa.Column("fec_id", sa.String(50)),
        sa.Column(
            "subscription_tier",
            sa.Enum(
                "free", "starter", "professional", "enterprise", name="subscriptiontier"
            ),
            default="free",
            nullable=False,
        ),
        sa.Column("subscription_expires_at", sa.DateTime(timezone=True)),
        sa.Column("stripe_customer_id", sa.String(255)),
        sa.Column("stripe_subscription_id", sa.String(255)),
        sa.Column("settings", sa.JSON, default=dict),
        sa.Column("features", sa.JSON, default=dict),
        sa.Column("max_users", sa.Integer, default=5),
        sa.Column("max_contacts", sa.Integer, default=1000),
        sa.Column("max_monthly_emails", sa.Integer, default=5000),
        sa.Column("max_monthly_sms", sa.Integer, default=500),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("is_verified", sa.Boolean, default=False),
        sa.Column("verified_at", sa.DateTime(timezone=True)),
        sa.Column("founded_date", sa.DateTime(timezone=True)),
        sa.Column("election_date", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50)),
        sa.Column("avatar_url", sa.String(500)),
        sa.Column(
            "org_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("role", sa.String(50), nullable=False, default="member"),
        sa.Column("permissions", sa.JSON, default=list),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("is_verified", sa.Boolean, default=False),
        sa.Column("email_verified_at", sa.DateTime(timezone=True)),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("last_login_ip", sa.String(45)),
        sa.Column("failed_login_attempts", sa.Integer, default=0),
        sa.Column("locked_until", sa.DateTime(timezone=True)),
        sa.Column("reset_token", sa.String(255)),
        sa.Column("reset_token_expires", sa.DateTime(timezone=True)),
        sa.Column("two_factor_enabled", sa.Boolean, default=False),
        sa.Column("two_factor_secret", sa.String(255)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Create contacts table
    op.create_table(
        "contacts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "org_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("external_id", sa.String(255)),
        sa.Column("email", sa.String(255), index=True),
        sa.Column("phone", sa.String(50), index=True),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("middle_name", sa.String(100)),
        sa.Column("prefix", sa.String(20)),
        sa.Column("suffix", sa.String(20)),
        sa.Column("date_of_birth", sa.Date),
        sa.Column("gender", sa.String(20)),
        sa.Column("address_line1", sa.String(255)),
        sa.Column("address_line2", sa.String(255)),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(50)),
        sa.Column("postal_code", sa.String(20)),
        sa.Column("county", sa.String(100)),
        sa.Column("country", sa.String(2), default="US"),
        sa.Column("latitude", sa.Float),
        sa.Column("longitude", sa.Float),
        sa.Column(
            "contact_type",
            sa.Enum(
                "voter",
                "donor",
                "volunteer",
                "supporter",
                "media",
                "vip",
                "other",
                name="contacttype",
            ),
            default="supporter",
        ),
        sa.Column(
            "voter_status",
            sa.Enum(
                "registered",
                "unregistered",
                "inactive",
                "purged",
                "unknown",
                name="voterstatus",
            ),
        ),
        sa.Column("voter_id", sa.String(100)),
        sa.Column("party_affiliation", sa.String(50)),
        sa.Column("precinct", sa.String(50)),
        sa.Column("congressional_district", sa.String(10)),
        sa.Column("state_legislative_district", sa.String(10)),
        sa.Column("tags", sa.JSON, default=list),
        sa.Column("custom_fields", sa.JSON, default=dict),
        sa.Column("notes", sa.Text),
        sa.Column("preferred_contact_method", sa.String(20)),
        sa.Column("do_not_email", sa.Boolean, default=False),
        sa.Column("do_not_call", sa.Boolean, default=False),
        sa.Column("do_not_text", sa.Boolean, default=False),
        sa.Column("email_bounce_count", sa.Integer, default=0),
        sa.Column("engagement_score", sa.Integer, default=0),
        sa.Column("last_contacted_at", sa.DateTime(timezone=True)),
        sa.Column("source", sa.String(100)),
        sa.Column("acquisition_date", sa.Date),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.UniqueConstraint("org_id", "email", name="uq_contact_org_email"),
        sa.Index("ix_contact_full_name", "first_name", "last_name"),
    )

    # Create volunteers table
    op.create_table(
        "volunteers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "org_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "contact_id",
            sa.String(36),
            sa.ForeignKey("contacts.id"),
            unique=True,
            index=True,
        ),
        sa.Column("email", sa.String(255), nullable=False, index=True),
        sa.Column("phone", sa.String(50)),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("date_of_birth", sa.Date),
        sa.Column("emergency_contact_name", sa.String(255)),
        sa.Column("emergency_contact_phone", sa.String(50)),
        sa.Column("address_line1", sa.String(255)),
        sa.Column("address_line2", sa.String(255)),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(50)),
        sa.Column("postal_code", sa.String(20)),
        sa.Column("skills", sa.JSON, default=list),
        sa.Column("interests", sa.JSON, default=list),
        sa.Column("languages", sa.JSON, default=list),
        sa.Column("availability", sa.JSON, default=dict),
        sa.Column("transportation", sa.Boolean, default=True),
        sa.Column("background_check_completed", sa.Boolean, default=False),
        sa.Column("background_check_date", sa.Date),
        sa.Column("training_completed", sa.JSON, default=list),
        sa.Column("status", sa.String(50), default="active"),
        sa.Column("total_hours", sa.Float, default=0),
        sa.Column("notes", sa.Text),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.UniqueConstraint("org_id", "email", name="uq_volunteer_org_email"),
    )

    # Create events table
    op.create_table(
        "events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "org_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("timezone", sa.String(50), default="America/New_York"),
        sa.Column("is_virtual", sa.Boolean, default=False),
        sa.Column("virtual_link", sa.String(500)),
        sa.Column("venue_name", sa.String(255)),
        sa.Column("address_line1", sa.String(255)),
        sa.Column("address_line2", sa.String(255)),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(50)),
        sa.Column("postal_code", sa.String(20)),
        sa.Column("latitude", sa.Float),
        sa.Column("longitude", sa.Float),
        sa.Column("max_attendees", sa.Integer),
        sa.Column("current_attendees", sa.Integer, default=0),
        sa.Column("registration_required", sa.Boolean, default=True),
        sa.Column("registration_deadline", sa.DateTime(timezone=True)),
        sa.Column("is_public", sa.Boolean, default=True),
        sa.Column("status", sa.String(50), default="scheduled"),
        sa.Column("tags", sa.JSON, default=list),
        sa.Column("custom_fields", sa.JSON, default=dict),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.UniqueConstraint("org_id", "slug", name="uq_event_org_slug"),
        sa.Index("ix_event_date_range", "start_date", "end_date"),
    )

    # Create donations table
    op.create_table(
        "donations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "org_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "contact_id", sa.String(36), sa.ForeignKey("contacts.id"), index=True
        ),
        sa.Column("amount", sa.Float, nullable=False),
        sa.Column("currency", sa.String(3), default="USD"),
        sa.Column(
            "donation_type",
            sa.Enum("one_time", "recurring", "pledge", name="donationtype"),
            default="one_time",
        ),
        sa.Column(
            "payment_method",
            sa.Enum(
                "credit_card",
                "debit_card",
                "ach",
                "check",
                "cash",
                "other",
                name="paymentmethod",
            ),
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "completed",
                "failed",
                "refunded",
                "cancelled",
                name="donationstatus",
            ),
            default="pending",
        ),
        sa.Column("transaction_id", sa.String(255)),
        sa.Column("stripe_payment_intent_id", sa.String(255)),
        sa.Column("stripe_charge_id", sa.String(255)),
        sa.Column("stripe_customer_id", sa.String(255)),
        sa.Column("stripe_subscription_id", sa.String(255)),
        sa.Column("donor_first_name", sa.String(100)),
        sa.Column("donor_last_name", sa.String(100)),
        sa.Column("donor_email", sa.String(255)),
        sa.Column("donor_phone", sa.String(50)),
        sa.Column("donor_address_line1", sa.String(255)),
        sa.Column("donor_address_line2", sa.String(255)),
        sa.Column("donor_city", sa.String(100)),
        sa.Column("donor_state", sa.String(50)),
        sa.Column("donor_postal_code", sa.String(20)),
        sa.Column("donor_country", sa.String(2)),
        sa.Column("donor_occupation", sa.String(255)),
        sa.Column("donor_employer", sa.String(255)),
        sa.Column("is_anonymous", sa.Boolean, default=False),
        sa.Column("campaign", sa.String(255)),
        sa.Column("source", sa.String(100)),
        sa.Column("dedication", sa.Text),
        sa.Column("notes", sa.Text),
        sa.Column("receipt_sent", sa.Boolean, default=False),
        sa.Column("receipt_sent_at", sa.DateTime(timezone=True)),
        sa.Column("thank_you_sent", sa.Boolean, default=False),
        sa.Column("thank_you_sent_at", sa.DateTime(timezone=True)),
        sa.Column("processing_fee", sa.Float),
        sa.Column("net_amount", sa.Float),
        sa.Column(
            "donated_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("failed_at", sa.DateTime(timezone=True)),
        sa.Column("refunded_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Index("ix_donation_date", "donated_at"),
        sa.Index("ix_donation_amount", "amount"),
    )

    # Create event_registrations table
    op.create_table(
        "event_registrations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "event_id",
            sa.String(36),
            sa.ForeignKey("events.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "volunteer_id", sa.String(36), sa.ForeignKey("volunteers.id"), index=True
        ),
        sa.Column(
            "contact_id", sa.String(36), sa.ForeignKey("contacts.id"), index=True
        ),
        sa.Column(
            "registration_date",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column("registration_source", sa.String(100)),
        sa.Column("guest_name", sa.String(255)),
        sa.Column("guest_email", sa.String(255)),
        sa.Column("guest_phone", sa.String(50)),
        sa.Column("number_of_guests", sa.Integer, default=1),
        sa.Column("status", sa.String(50), default="registered"),
        sa.Column("checked_in", sa.Boolean, default=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True)),
        sa.Column("checked_in_by", sa.String(36), sa.ForeignKey("users.id")),
        sa.Column("payment_required", sa.Boolean, default=False),
        sa.Column("payment_status", sa.String(50)),
        sa.Column("payment_amount", sa.Float),
        sa.Column("payment_transaction_id", sa.String(255)),
        sa.Column("dietary_restrictions", sa.Text),
        sa.Column("accessibility_needs", sa.Text),
        sa.Column("special_requests", sa.Text),
        sa.Column("confirmation_sent", sa.Boolean, default=False),
        sa.Column("confirmation_sent_at", sa.DateTime(timezone=True)),
        sa.Column("reminder_sent", sa.Boolean, default=False),
        sa.Column("reminder_sent_at", sa.DateTime(timezone=True)),
        sa.Column("volunteer_role", sa.String(100)),
        sa.Column("volunteer_shift_id", sa.String(36)),
        sa.Column("notes", sa.Text),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Create volunteer_shifts table
    op.create_table(
        "volunteer_shifts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "event_id",
            sa.String(36),
            sa.ForeignKey("events.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "volunteer_id", sa.String(36), sa.ForeignKey("volunteers.id"), index=True
        ),
        sa.Column("role", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("volunteers_needed", sa.Integer, default=1),
        sa.Column("volunteers_assigned", sa.Integer, default=0),
        sa.Column("skills_required", sa.JSON, default=list),
        sa.Column("status", sa.String(50), default="scheduled"),
        sa.Column("checked_in", sa.Boolean, default=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True)),
        sa.Column("checked_out", sa.Boolean, default=False),
        sa.Column("checked_out_at", sa.DateTime(timezone=True)),
        sa.Column("scheduled_hours", sa.Float),
        sa.Column("actual_hours", sa.Float),
        sa.Column("notes", sa.Text),
        sa.Column("volunteer_feedback", sa.Text),
        sa.Column("coordinator_notes", sa.Text),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )

    # Add foreign key constraint for volunteer_shifts in event_registrations
    op.create_foreign_key(
        "fk_event_registration_shift",
        "event_registrations",
        "volunteer_shifts",
        ["volunteer_shift_id"],
        ["id"],
    )


def downgrade():
    # Drop tables in reverse order of dependencies
    op.drop_constraint(
        "fk_event_registration_shift", "event_registrations", type_="foreignkey"
    )
    op.drop_table("volunteer_shifts")
    op.drop_table("event_registrations")
    op.drop_table("donations")
    op.drop_table("events")
    op.drop_table("volunteers")
    op.drop_table("contacts")
    op.drop_table("users")
    op.drop_table("organizations")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS organizationtype")
    op.execute("DROP TYPE IF EXISTS subscriptiontier")
    op.execute("DROP TYPE IF EXISTS contacttype")
    op.execute("DROP TYPE IF EXISTS voterstatus")
    op.execute("DROP TYPE IF EXISTS donationtype")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("DROP TYPE IF EXISTS donationstatus")
