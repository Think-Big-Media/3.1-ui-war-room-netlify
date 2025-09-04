"""Admin users table

Revision ID: 011_admin_users_table
Revises: 010_meta_auth_table
Create Date: 2025-08-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

# revision identifiers, used by Alembic.
revision = '011_admin_users_table'
down_revision = '010_meta_auth_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create admin_users table with comprehensive security features.
    
    This migration creates a secure admin authentication system separate from
    regular users with enhanced security features including:
    - Account lockout after failed attempts
    - Password reset functionality
    - Audit trail fields
    - Proper indexing for performance
    """
    
    # Create admin_users table
    op.create_table(
        'admin_users',
        
        # Primary key - UUID for enhanced security
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        
        # Authentication fields
        sa.Column('username', sa.String(50), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        
        # Account status
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_superadmin', sa.Boolean(), nullable=False, default=False),
        
        # Login tracking
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_ip', sa.String(45), nullable=True),  # Support IPv6
        
        # Security fields for account lockout
        sa.Column('failed_login_attempts', sa.Integer(), nullable=False, default=0),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        
        # Password reset functionality
        sa.Column('reset_token', sa.String(255), nullable=True),
        sa.Column('reset_token_expires', sa.DateTime(timezone=True), nullable=True),
        
        # Additional profile fields
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),  # Internal notes
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, 
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True,
                  onupdate=sa.func.now())
    )
    
    # Create indexes for performance and security
    
    # Primary lookup indexes
    op.create_index(
        'ix_admin_users_username',
        'admin_users',
        ['username'],
        unique=True
    )
    
    op.create_index(
        'ix_admin_users_email',
        'admin_users',
        ['email'],
        unique=True
    )
    
    op.create_index(
        'ix_admin_users_id',
        'admin_users',
        ['id'],
        unique=True
    )
    
    # Status and security indexes
    op.create_index(
        'ix_admin_users_is_active',
        'admin_users',
        ['is_active']
    )
    
    op.create_index(
        'ix_admin_users_is_superadmin',
        'admin_users',
        ['is_superadmin']
    )
    
    # Composite index for active admins
    op.create_index(
        'ix_admin_users_active_status',
        'admin_users',
        ['is_active', 'is_superadmin']
    )
    
    # Security-related indexes
    op.create_index(
        'ix_admin_users_locked_until',
        'admin_users',
        ['locked_until']
    )
    
    op.create_index(
        'ix_admin_users_failed_attempts',
        'admin_users',
        ['failed_login_attempts']
    )
    
    # Password reset indexes
    op.create_index(
        'ix_admin_users_reset_token',
        'admin_users',
        ['reset_token']
    )
    
    # Audit and monitoring indexes
    op.create_index(
        'ix_admin_users_last_login',
        'admin_users',
        ['last_login']
    )
    
    op.create_index(
        'ix_admin_users_created_at',
        'admin_users',
        ['created_at']
    )
    
    # Add table-level constraints for additional security
    
    # Username constraints
    op.create_check_constraint(
        'ck_admin_users_username_length',
        'admin_users',
        sa.text("LENGTH(username) >= 3 AND LENGTH(username) <= 50")
    )
    
    op.create_check_constraint(
        'ck_admin_users_username_format',
        'admin_users',
        sa.text("username ~ '^[a-zA-Z0-9_.-]+$'")  # Alphanumeric plus basic symbols
    )
    
    # Email format constraint (basic validation)
    op.create_check_constraint(
        'ck_admin_users_email_format',
        'admin_users',
        sa.text("email ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'")
    )
    
    # Password hash constraint (ensure it's bcrypt format)
    op.create_check_constraint(
        'ck_admin_users_password_hash_format',
        'admin_users',
        sa.text("password_hash ~ '^\\$2[aby]\\$[0-9]{2}\\$'")  # Bcrypt format
    )
    
    # Failed attempts constraint
    op.create_check_constraint(
        'ck_admin_users_failed_attempts_range',
        'admin_users',
        sa.text("failed_login_attempts >= 0 AND failed_login_attempts <= 10")
    )
    
    # Ensure locked_until is in the future if set
    op.create_check_constraint(
        'ck_admin_users_locked_until_future',
        'admin_users',
        sa.text("locked_until IS NULL OR locked_until > created_at")
    )
    
    # Reset token expiration constraint
    op.create_check_constraint(
        'ck_admin_users_reset_token_expiry',
        'admin_users',
        sa.text("""
            (reset_token IS NULL AND reset_token_expires IS NULL) OR
            (reset_token IS NOT NULL AND reset_token_expires IS NOT NULL AND 
             reset_token_expires > NOW())
        """)
    )
    
    # Create comment on table for documentation
    op.execute("""
        COMMENT ON TABLE admin_users IS 
        'Administrative users with enhanced security features for platform management'
    """)
    
    # Add column comments for documentation
    column_comments = {
        'id': 'Unique UUID identifier for admin user',
        'username': 'Unique username for admin login (3-50 chars, alphanumeric)',
        'password_hash': 'Bcrypt hashed password with work factor 12+',
        'email': 'Unique email address for admin notifications and recovery',
        'is_active': 'Whether admin account is active and can log in',
        'is_superadmin': 'Whether admin has superadmin privileges (full access)',
        'last_login': 'Timestamp of last successful login (UTC)',
        'last_login_ip': 'IP address of last successful login (IPv4/IPv6)',
        'failed_login_attempts': 'Number of consecutive failed login attempts (0-10)',
        'locked_until': 'Account lock expiration timestamp (NULL if not locked)',
        'reset_token': 'Secure token for password reset (expires in 1 hour)',
        'reset_token_expires': 'Password reset token expiration timestamp',
        'full_name': 'Optional full name for admin identification',
        'notes': 'Internal notes about admin user (not visible to admin)',
        'created_at': 'Account creation timestamp (UTC)',
        'updated_at': 'Last account modification timestamp (UTC)'
    }
    
    for column, comment in column_comments.items():
        op.execute(f"""
            COMMENT ON COLUMN admin_users.{column} IS '{comment}'
        """)


def downgrade() -> None:
    """
    Drop admin_users table and all related indexes/constraints.
    
    WARNING: This will permanently delete all admin user data!
    """
    
    # Drop all indexes first
    indexes_to_drop = [
        'ix_admin_users_username',
        'ix_admin_users_email', 
        'ix_admin_users_id',
        'ix_admin_users_is_active',
        'ix_admin_users_is_superadmin',
        'ix_admin_users_active_status',
        'ix_admin_users_locked_until',
        'ix_admin_users_failed_attempts',
        'ix_admin_users_reset_token',
        'ix_admin_users_last_login',
        'ix_admin_users_created_at'
    ]
    
    for index_name in indexes_to_drop:
        try:
            op.drop_index(index_name, 'admin_users')
        except Exception:
            # Index might not exist, continue
            pass
    
    # Drop check constraints
    constraints_to_drop = [
        'ck_admin_users_username_length',
        'ck_admin_users_username_format',
        'ck_admin_users_email_format',
        'ck_admin_users_password_hash_format',
        'ck_admin_users_failed_attempts_range',
        'ck_admin_users_locked_until_future',
        'ck_admin_users_reset_token_expiry'
    ]
    
    for constraint_name in constraints_to_drop:
        try:
            op.drop_constraint(constraint_name, 'admin_users')
        except Exception:
            # Constraint might not exist, continue
            pass
    
    # Finally drop the table
    op.drop_table('admin_users')