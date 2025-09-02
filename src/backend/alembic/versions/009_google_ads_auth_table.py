"""Create Google Ads OAuth2 authentication table

Revision ID: 009_google_ads_auth_table
Revises: 008_google_ads_tables
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "009_google_ads_auth_table"
down_revision = "008_google_ads_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create google_ads_auth table for storing OAuth2 tokens
    op.create_table(
        "google_ads_auth",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column(
            "org_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=False),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("customer_id", sa.String(50), nullable=True),
        sa.Column("developer_token", sa.String(255), nullable=True),
        sa.Column("client_id", sa.String(255), nullable=False),
        sa.Column("client_secret", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("last_refreshed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("scopes", sa.JSON(), default=[], nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        # Indexes for performance
        sa.Index("idx_google_ads_auth_org_id", "org_id"),
        sa.Index("idx_google_ads_auth_active", "is_active"),
        sa.Index("idx_google_ads_auth_expires", "token_expires_at"),
        sa.Index("idx_google_ads_auth_customer_id", "customer_id"),
    )


def downgrade() -> None:
    op.drop_table("google_ads_auth")