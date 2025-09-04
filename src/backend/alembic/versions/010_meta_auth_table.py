"""Create Meta Business Suite OAuth2 authentication table

Revision ID: 010_meta_auth_table
Revises: 009_google_ads_auth_table
Create Date: 2025-01-01 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "010_meta_auth_table"
down_revision = "009_google_ads_auth_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create meta_auth table for storing Meta Business Suite OAuth2 tokens
    op.create_table(
        "meta_auth",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column(
            "org_id",
            sa.String(36),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            unique=True,
            index=True,
        ),
        # OAuth2 credentials (encrypted)
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),  # Meta may not provide refresh tokens
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=False),
        
        # Meta Business specific fields
        sa.Column("app_id", sa.String(255), nullable=False),  # Meta App ID
        sa.Column("app_secret", sa.Text(), nullable=False),   # Encrypted App Secret
        sa.Column("ad_account_id", sa.String(50), nullable=True),  # Primary ad account ID
        sa.Column("business_id", sa.String(50), nullable=True),    # Business Manager ID
        
        # Page access tokens (JSON field for storing page-specific tokens)
        sa.Column("page_access_tokens", sa.JSON(), default={}, nullable=True),
        
        # Token status and metadata
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("last_refreshed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        
        # Scopes and permissions granted
        sa.Column("scopes", sa.JSON(), default=[], nullable=True),
        sa.Column("permissions", sa.JSON(), default=[], nullable=True),
        
        # Timestamps
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
        
        # Indexes for performance
        sa.Index("idx_meta_auth_org_id", "org_id"),
        sa.Index("idx_meta_auth_active", "is_active"),
        sa.Index("idx_meta_auth_expires", "token_expires_at"),
        sa.Index("idx_meta_auth_ad_account_id", "ad_account_id"),
        sa.Index("idx_meta_auth_business_id", "business_id"),
        sa.Index("idx_meta_auth_app_id", "app_id"),
    )


def downgrade() -> None:
    op.drop_table("meta_auth")