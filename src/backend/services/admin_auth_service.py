"""
Admin Authentication Service

Provides secure authentication services for administrative users with enhanced security features:
- Bcrypt password hashing with work factor 12
- Account lockout after failed attempts
- JWT session management with httpOnly cookies
- Rate limiting protection
- Comprehensive audit logging
"""
import uuid
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from jose import JWTError, jwt

from models.admin_user import AdminUser
from core.config import settings
from core.security import get_password_hash, verify_password, get_client_ip
from core.database import get_db

# Configure logging for admin actions
logger = logging.getLogger(__name__)

# Admin JWT settings - separate from regular user JWT
ADMIN_JWT_ALGORITHM = "HS256"
ADMIN_ACCESS_TOKEN_EXPIRE_HOURS = 4  # Shorter session for security
ADMIN_REFRESH_TOKEN_EXPIRE_DAYS = 1  # Much shorter refresh period


class AdminAuthService:
    """Service for managing admin authentication and authorization."""
    
    def __init__(self, db: Session):
        self.db = db

    def authenticate_admin(
        self, 
        username: str, 
        password: str, 
        ip_address: str
    ) -> Optional[AdminUser]:
        """
        Authenticate admin user with comprehensive security checks.
        
        Args:
            username: Admin username or email
            password: Plain text password
            ip_address: Client IP address for logging
            
        Returns:
            AdminUser if authentication successful, None otherwise
            
        Raises:
            HTTPException: If account is locked or authentication fails
        """
        # Log authentication attempt
        logger.info(f"Admin login attempt for username: {username} from IP: {ip_address}")
        
        # Find admin by username or email
        admin = (
            self.db.query(AdminUser)
            .filter(
                (AdminUser.username == username) | (AdminUser.email == username)
            )
            .first()
        )
        
        if not admin:
            logger.warning(f"Admin login failed - user not found: {username} from IP: {ip_address}")
            return None
        
        # Check if account is locked
        if admin.is_account_locked():
            lock_expires = admin.locked_until.strftime("%Y-%m-%d %H:%M:%S UTC") if admin.locked_until else "unknown"
            logger.warning(f"Admin login blocked - account locked: {username} until {lock_expires}")
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account is locked due to multiple failed attempts. Try again after {lock_expires}."
            )
        
        # Check if account is active
        if not admin.is_active:
            logger.warning(f"Admin login failed - account inactive: {username}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is inactive"
            )
        
        # Verify password
        if not admin.verify_password(password):
            admin.increment_failed_attempts()
            self.db.commit()
            
            logger.warning(
                f"Admin login failed - invalid password: {username} "
                f"(attempt {admin.failed_login_attempts}/5) from IP: {ip_address}"
            )
            
            if admin.failed_login_attempts >= 5:
                logger.critical(f"Admin account locked after 5 failed attempts: {username}")
            
            return None
        
        # Successful authentication
        admin.update_last_login(ip_address)
        self.db.commit()
        
        logger.info(f"Admin login successful: {username} from IP: {ip_address}")
        return admin

    def create_admin_tokens(self, admin: AdminUser) -> Dict[str, Any]:
        """
        Create JWT access and refresh tokens for admin.
        
        Args:
            admin: Authenticated admin user
            
        Returns:
            Dictionary containing access_token, refresh_token, and metadata
        """
        # Create access token payload
        access_payload = {
            "sub": str(admin.id),
            "username": admin.username,
            "email": admin.email,
            "is_superadmin": admin.is_superadmin,
            "type": "admin_access",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(hours=ADMIN_ACCESS_TOKEN_EXPIRE_HOURS)
        }
        
        # Create refresh token payload
        refresh_payload = {
            "sub": str(admin.id),
            "username": admin.username,
            "type": "admin_refresh",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=ADMIN_REFRESH_TOKEN_EXPIRE_DAYS)
        }
        
        # Generate tokens using admin-specific secret
        access_token = jwt.encode(
            access_payload,
            settings.ADMIN_JWT_SECRET,
            algorithm=ADMIN_JWT_ALGORITHM
        )
        
        refresh_token = jwt.encode(
            refresh_payload,
            settings.ADMIN_JWT_SECRET,
            algorithm=ADMIN_JWT_ALGORITHM
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ADMIN_ACCESS_TOKEN_EXPIRE_HOURS * 3600,
            "admin_info": admin.to_dict()
        }

    def verify_admin_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify admin JWT token and extract payload.
        
        Args:
            token: JWT token to verify
            
        Returns:
            Token payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(
                token,
                settings.ADMIN_JWT_SECRET,
                algorithms=[ADMIN_JWT_ALGORITHM]
            )
            
            # Verify this is an admin token
            if payload.get("type") not in ["admin_access", "admin_refresh"]:
                logger.warning(f"Invalid admin token type: {payload.get('type')}")
                return None
            
            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                return None
            
            return payload
            
        except JWTError as e:
            logger.warning(f"Admin token verification failed: {str(e)}")
            return None

    def get_admin_from_token(self, token: str) -> Optional[AdminUser]:
        """
        Get admin user from JWT token.
        
        Args:
            token: JWT token
            
        Returns:
            AdminUser if token is valid and admin exists, None otherwise
        """
        payload = self.verify_admin_token(token)
        if not payload:
            return None
        
        admin_id = payload.get("sub")
        if not admin_id:
            return None
        
        try:
            admin = self.db.query(AdminUser).filter(AdminUser.id == admin_id).first()
            
            # Verify admin is still active
            if admin and admin.is_active and not admin.is_account_locked():
                return admin
                
        except Exception as e:
            logger.error(f"Error retrieving admin from token: {str(e)}")
        
        return None

    def refresh_admin_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh admin access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New token set if successful, None otherwise
        """
        payload = self.verify_admin_token(refresh_token)
        if not payload or payload.get("type") != "admin_refresh":
            return None
        
        admin_id = payload.get("sub")
        admin = self.db.query(AdminUser).filter(AdminUser.id == admin_id).first()
        
        if not admin or not admin.can_login:
            return None
        
        # Create new tokens
        return self.create_admin_tokens(admin)

    def logout_admin(self, token: str) -> bool:
        """
        Logout admin user (invalidate token).
        
        Note: In a production system, you would typically maintain a token blacklist
        in Redis or database to properly invalidate tokens before expiration.
        
        Args:
            token: JWT token to invalidate
            
        Returns:
            True if logout successful
        """
        payload = self.verify_admin_token(token)
        if not payload:
            return False
        
        username = payload.get("username", "unknown")
        logger.info(f"Admin logout: {username}")
        
        # TODO: Add token to blacklist in Redis for proper invalidation
        # For now, we rely on client-side cookie deletion
        
        return True

    def create_admin(
        self,
        username: str,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        is_superadmin: bool = False
    ) -> AdminUser:
        """
        Create new admin user.
        
        Args:
            username: Unique username
            email: Unique email address
            password: Plain text password (will be hashed)
            full_name: Optional full name
            is_superadmin: Whether admin has superadmin privileges
            
        Returns:
            Created AdminUser
            
        Raises:
            HTTPException: If username or email already exists
        """
        # Check if username already exists
        if self.db.query(AdminUser).filter(AdminUser.username == username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Check if email already exists
        if self.db.query(AdminUser).filter(AdminUser.email == email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Create new admin
        admin = AdminUser(
            id=uuid.uuid4(),
            username=username,
            email=email,
            full_name=full_name,
            is_superadmin=is_superadmin
        )
        
        # Set password (will be hashed)
        admin.set_password(password)
        
        self.db.add(admin)
        self.db.commit()
        self.db.refresh(admin)
        
        logger.info(f"New admin created: {username} (superadmin: {is_superadmin})")
        
        return admin

    def update_admin_password(
        self,
        admin: AdminUser,
        new_password: str,
        current_password: Optional[str] = None
    ) -> bool:
        """
        Update admin password with optional current password verification.
        
        Args:
            admin: Admin user to update
            new_password: New password
            current_password: Current password for verification (optional)
            
        Returns:
            True if password updated successfully
            
        Raises:
            HTTPException: If current password is incorrect
        """
        # Verify current password if provided
        if current_password and not admin.verify_password(current_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password strength
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long"
            )
        
        # Update password
        admin.set_password(new_password)
        self.db.commit()
        
        logger.info(f"Admin password updated: {admin.username}")
        
        return True

    def initiate_password_reset(self, email: str) -> Optional[str]:
        """
        Initiate password reset process for admin.
        
        Args:
            email: Admin email address
            
        Returns:
            Reset token if admin found, None otherwise
        """
        admin = self.db.query(AdminUser).filter(AdminUser.email == email).first()
        if not admin:
            # Don't reveal whether email exists
            return None
        
        reset_token = admin.generate_reset_token()
        self.db.commit()
        
        logger.info(f"Password reset initiated for admin: {email}")
        
        return reset_token

    def complete_password_reset(
        self,
        email: str,
        reset_token: str,
        new_password: str
    ) -> bool:
        """
        Complete password reset process.
        
        Args:
            email: Admin email address
            reset_token: Password reset token
            new_password: New password
            
        Returns:
            True if reset successful, False otherwise
        """
        admin = self.db.query(AdminUser).filter(AdminUser.email == email).first()
        if not admin or not admin.is_reset_token_valid(reset_token):
            return False
        
        # Update password and clear reset token
        admin.set_password(new_password)
        admin.clear_reset_token()
        self.db.commit()
        
        logger.info(f"Password reset completed for admin: {email}")
        
        return True

    def get_admin_stats(self) -> Dict[str, Any]:
        """
        Get administrative statistics.
        
        Returns:
            Dictionary containing system statistics
        """
        try:
            total_admins = self.db.query(AdminUser).count()
            active_admins = self.db.query(AdminUser).filter(AdminUser.is_active == True).count()
            locked_admins = self.db.query(AdminUser).filter(AdminUser.locked_until.isnot(None)).count()
            superadmins = self.db.query(AdminUser).filter(AdminUser.is_superadmin == True).count()
            
            return {
                "total_admins": total_admins,
                "active_admins": active_admins,
                "locked_admins": locked_admins,
                "superadmins": superadmins,
                "last_updated": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting admin stats: {str(e)}")
            return {"error": "Unable to retrieve stats"}


def get_admin_auth_service(db: Session = Depends(get_db)) -> AdminAuthService:
    """
    Get admin authentication service instance.
    
    Args:
        db: Database session dependency
        
    Returns:
        AdminAuthService instance
    """
    return AdminAuthService(db)