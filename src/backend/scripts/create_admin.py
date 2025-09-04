#!/usr/bin/env python3
"""
Initial Admin Setup Script

Creates the first admin user for the War Room platform using environment variables.
This script should only be run during initial setup and will only create an admin
if no admin users exist in the database.

Usage:
    python scripts/create_admin.py

Environment Variables Required:
    ADMIN_USERNAME: Username for the initial admin (default: admin)
    ADMIN_PASSWORD: Password for the initial admin
    ADMIN_EMAIL: Email address for the initial admin
    ADMIN_FULL_NAME: Full name for the initial admin (optional)

Security Features:
- Only runs if no admin users exist
- Validates password strength
- Uses bcrypt hashing with work factor 12
- Creates superadmin by default
- Comprehensive logging
"""
import os
import sys
import logging
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from models.admin_user import AdminUser
from core.database import get_db
from core.config import settings
from core.security import is_strong_password
from services.admin_auth_service import AdminAuthService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def validate_environment_variables() -> dict:
    """
    Validate and extract admin setup environment variables.
    
    Returns:
        Dictionary containing admin setup parameters
        
    Raises:
        ValueError: If required environment variables are missing or invalid
    """
    # Get required environment variables
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_password = os.getenv('ADMIN_PASSWORD')
    admin_email = os.getenv('ADMIN_EMAIL')
    admin_full_name = os.getenv('ADMIN_FULL_NAME')
    
    # Validate required fields
    if not admin_password:
        raise ValueError(
            "ADMIN_PASSWORD environment variable is required. "
            "Please set a strong password for the initial admin user."
        )
    
    if not admin_email:
        raise ValueError(
            "ADMIN_EMAIL environment variable is required. "
            "Please set an email address for the initial admin user."
        )
    
    # Validate username format
    if len(admin_username) < 3 or len(admin_username) > 50:
        raise ValueError(
            f"Admin username must be 3-50 characters long. Got: {len(admin_username)}"
        )
    
    # Check if username contains only allowed characters
    import re
    if not re.match(r'^[a-zA-Z0-9_.-]+$', admin_username):
        raise ValueError(
            "Admin username can only contain alphanumeric characters, "
            "underscores, dots, and hyphens."
        )
    
    # Validate email format (basic)
    if '@' not in admin_email or len(admin_email) < 5:
        raise ValueError(
            f"Invalid email format: {admin_email}"
        )
    
    # Validate password strength
    is_strong, password_issues = is_strong_password(admin_password)
    if not is_strong:
        raise ValueError(
            f"Password does not meet security requirements:\n" +
            "\n".join(f"- {issue}" for issue in password_issues)
        )
    
    return {
        'username': admin_username,
        'password': admin_password,
        'email': admin_email,
        'full_name': admin_full_name
    }


def check_existing_admins(db: Session) -> int:
    """
    Check if any admin users already exist.
    
    Args:
        db: Database session
        
    Returns:
        Number of existing admin users
    """
    try:
        return db.query(AdminUser).count()
    except Exception as e:
        logger.error(f"Error checking existing admins: {str(e)}")
        raise


def create_initial_admin(admin_data: dict, db: Session) -> AdminUser:
    """
    Create the initial admin user.
    
    Args:
        admin_data: Admin user data
        db: Database session
        
    Returns:
        Created AdminUser instance
        
    Raises:
        Exception: If admin creation fails
    """
    try:
        auth_service = AdminAuthService(db)
        
        admin = auth_service.create_admin(
            username=admin_data['username'],
            email=admin_data['email'],
            password=admin_data['password'],
            full_name=admin_data['full_name'],
            is_superadmin=True  # First admin is always superadmin
        )
        
        logger.info(f"Initial admin created successfully: {admin.username}")
        return admin
        
    except Exception as e:
        logger.error(f"Failed to create initial admin: {str(e)}")
        raise


def main():
    """
    Main function to create initial admin user.
    """
    try:
        logger.info("Starting initial admin setup...")
        
        # Validate environment variables
        try:
            admin_data = validate_environment_variables()
            logger.info(f"Environment variables validated for admin: {admin_data['username']}")
        except ValueError as e:
            logger.error(f"Environment validation failed: {str(e)}")
            sys.exit(1)
        
        # Get database session
        try:
            db = next(get_db())
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            sys.exit(1)
        
        try:
            # Check if admin users already exist
            existing_admin_count = check_existing_admins(db)
            
            if existing_admin_count > 0:
                logger.warning(
                    f"Admin users already exist ({existing_admin_count} found). "
                    "Initial admin setup is only allowed when no admin users exist."
                )
                logger.info("If you need to create additional admins, use the admin dashboard.")
                sys.exit(0)
            
            logger.info("No existing admin users found. Proceeding with initial setup...")
            
            # Create initial admin
            admin = create_initial_admin(admin_data, db)
            
            # Success message
            logger.info("=" * 60)
            logger.info("INITIAL ADMIN SETUP COMPLETED SUCCESSFULLY!")
            logger.info("=" * 60)
            logger.info(f"Username: {admin.username}")
            logger.info(f"Email: {admin.email}")
            logger.info(f"Full Name: {admin.full_name or 'Not set'}")
            logger.info(f"Superadmin: Yes")
            logger.info(f"Account Status: Active")
            logger.info(f"Created At: {admin.created_at}")
            logger.info("=" * 60)
            logger.info("You can now log in to the admin dashboard using these credentials.")
            logger.info("For security, consider removing the ADMIN_PASSWORD from environment variables.")
            
        except Exception as e:
            logger.error(f"Admin setup failed: {str(e)}")
            sys.exit(1)
        
        finally:
            db.close()
    
    except KeyboardInterrupt:
        logger.info("Admin setup cancelled by user")
        sys.exit(1)
    
    except Exception as e:
        logger.error(f"Unexpected error during admin setup: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    # Security check: Don't run if this appears to be production
    if settings.ENVIRONMENT == "production":
        print("=" * 60)
        print("WARNING: PRODUCTION ENVIRONMENT DETECTED")
        print("=" * 60)
        print("This script is creating an admin user. In production, ensure:")
        print("1. You have a secure ADMIN_PASSWORD set")
        print("2. You remove the ADMIN_PASSWORD from environment after setup")
        print("3. You secure access to this server")
        print("4. You monitor admin access logs")
        print("")
        
        confirm = input("Are you sure you want to continue in production? (yes/no): ")
        if confirm.lower() != "yes":
            print("Admin setup cancelled for safety.")
            sys.exit(0)
    
    main()