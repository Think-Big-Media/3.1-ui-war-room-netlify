"""OAuth provider table for social authentication

Revision ID: 012_oauth_provider_table
Revises: 011_admin_users_table
Create Date: 2025-08-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '012_oauth_provider_table'
down_revision = '011_admin_users_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create oauth_providers table for social authentication.
    """
    op.create_table(
        'oauth_providers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('provider_user_id', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255)),
        sa.Column('name', sa.String(255)),
        sa.Column('picture', sa.String(500)),
        sa.Column('access_token', sa.String(500)),
        sa.Column('refresh_token', sa.String(500)),
        sa.Column('token_expires_at', sa.DateTime(timezone=True)),
        sa.Column('provider_data', sa.JSON, default={}),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        sa.Column('last_used_at', sa.DateTime(timezone=True)),
    )
    
    # Create indexes
    op.create_index('ix_oauth_providers_user_id', 'oauth_providers', ['user_id'])
    op.create_index('ix_oauth_providers_provider', 'oauth_providers', ['provider'])
    op.create_unique_constraint(
        'uq_oauth_provider_user', 
        'oauth_providers', 
        ['provider', 'provider_user_id']
    )


def downgrade() -> None:
    """
    Drop oauth_providers table.
    """
    op.drop_table('oauth_providers')