"""
Admin Authentication Endpoints

Provides secure API endpoints for admin authentication with enhanced security features:
- httpOnly cookie-based JWT sessions
- Rate limiting protection
- CSRF protection
- Comprehensive request logging
"""
import logging
from typing import Any, Dict
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from core.database import get_db
from core.security import get_client_ip
from core.config import settings
from services.admin_auth_service import AdminAuthService, get_admin_auth_service
from models.admin_user import AdminUser

# Configure logging
logger = logging.getLogger(__name__)

# Router setup
router = APIRouter()
security = HTTPBearer(auto_error=False)

# Request/Response Models
class AdminLoginRequest(BaseModel):
    """Request model for admin login."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)


class AdminSetupRequest(BaseModel):
    """Request model for initial admin setup."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)
    email: EmailStr
    full_name: str = Field(None, max_length=255)


class AdminPasswordChangeRequest(BaseModel):
    """Request model for admin password change."""
    current_password: str = Field(..., min_length=8, max_length=100)
    new_password: str = Field(..., min_length=8, max_length=100)


class AdminPasswordResetRequest(BaseModel):
    """Request model for password reset initiation."""
    email: EmailStr


class AdminPasswordResetConfirmRequest(BaseModel):
    """Request model for password reset confirmation."""
    email: EmailStr
    reset_token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=100)


class AdminResponse(BaseModel):
    """Response model for admin data."""
    id: str
    username: str
    email: str
    full_name: str = None
    is_active: bool
    is_superadmin: bool
    last_login: str = None
    created_at: str = None
    display_name: str


# Security helper functions
def set_admin_cookie(response: Response, token: str) -> None:
    """
    Set secure httpOnly cookie for admin authentication.
    
    Args:
        response: FastAPI response object
        token: JWT token to set in cookie
    """
    response.set_cookie(
        key="admin_session",
        value=token,
        max_age=4 * 3600,  # 4 hours
        httponly=True,
        secure=True,  # HTTPS only in production
        samesite="strict",  # CSRF protection
        path="/api/v1/admin/"  # Limit cookie scope
    )


def clear_admin_cookie(response: Response) -> None:
    """
    Clear admin authentication cookie.
    
    Args:
        response: FastAPI response object
    """
    response.delete_cookie(
        key="admin_session",
        path="/api/v1/admin/",
        httponly=True,
        secure=True,
        samesite="strict"
    )


def get_admin_token_from_cookie(request: Request) -> str:
    """
    Extract admin JWT token from httpOnly cookie.
    
    Args:
        request: FastAPI request object
        
    Returns:
        JWT token string
        
    Raises:
        HTTPException: If token not found or invalid
    """
    token = request.cookies.get("admin_session")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required"
        )
    return token


def get_current_admin(
    request: Request,
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
) -> AdminUser:
    """
    Get current authenticated admin from JWT cookie.
    
    Args:
        request: FastAPI request object
        auth_service: Admin authentication service
        
    Returns:
        Current authenticated admin user
        
    Raises:
        HTTPException: If authentication fails
    """
    token = get_admin_token_from_cookie(request)
    admin = auth_service.get_admin_from_token(token)
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin session"
        )
    
    return admin


# Authentication Endpoints
@router.post("/login", response_model=Dict[str, Any])
async def login_admin(
    request: Request,
    response: Response,
    login_data: AdminLoginRequest,
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
):
    """
    Authenticate admin user and set secure session cookie.
    
    Args:
        request: FastAPI request object
        response: FastAPI response object
        login_data: Login credentials
        auth_service: Admin authentication service
        
    Returns:
        Admin user data and success message
        
    Raises:
        HTTPException: If authentication fails
    """
    client_ip = get_client_ip(request)
    
    try:
        # Authenticate admin
        admin = auth_service.authenticate_admin(
            username=login_data.username,
            password=login_data.password,
            ip_address=client_ip
        )
        
        if not admin:
            logger.warning(f"Admin login failed for {login_data.username} from {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Create JWT tokens
        token_data = auth_service.create_admin_tokens(admin)
        
        # Set secure httpOnly cookie
        set_admin_cookie(response, token_data["access_token"])
        
        logger.info(f"Admin login successful: {admin.username} from {client_ip}")
        
        return {
            "success": True,
            "message": "Login successful",
            "admin": AdminResponse(**admin.to_dict()),
            "expires_in": token_data["expires_in"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )


@router.post("/logout")
async def logout_admin(
    request: Request,
    response: Response,
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
):
    """
    Logout admin user and clear session cookie.
    
    Args:
        request: FastAPI request object
        response: FastAPI response object
        auth_service: Admin authentication service
        
    Returns:
        Success message
    """
    try:
        token = request.cookies.get("admin_session")
        if token:
            auth_service.logout_admin(token)
        
        # Clear cookie
        clear_admin_cookie(response)
        
        return {"success": True, "message": "Logout successful"}
        
    except Exception as e:
        logger.error(f"Admin logout error: {str(e)}")
        # Still clear cookie even if error
        clear_admin_cookie(response)
        return {"success": True, "message": "Logout completed"}


@router.get("/verify", response_model=AdminResponse)
async def verify_admin_session(
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Verify current admin session and return admin info.
    
    Args:
        current_admin: Current authenticated admin
        
    Returns:
        Current admin user data
    """
    return AdminResponse(**current_admin.to_dict())


@router.post("/setup", response_model=Dict[str, Any])
async def setup_initial_admin(
    setup_data: AdminSetupRequest,
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
):
    """
    Create initial admin user (only works if no admins exist).
    
    Args:
        setup_data: Initial admin setup data
        auth_service: Admin authentication service
        
    Returns:
        Success message and admin data
        
    Raises:
        HTTPException: If admin users already exist
    """
    try:
        # Check if any admin users already exist
        existing_count = auth_service.db.query(AdminUser).count()
        if existing_count > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin setup not allowed - admin users already exist"
            )
        
        # Create initial admin as superadmin
        admin = auth_service.create_admin(
            username=setup_data.username,
            email=setup_data.email,
            password=setup_data.password,
            full_name=setup_data.full_name,
            is_superadmin=True
        )
        
        logger.info(f"Initial admin setup completed: {admin.username}")
        
        return {
            "success": True,
            "message": "Initial admin created successfully",
            "admin": AdminResponse(**admin.to_dict())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin setup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during admin setup"
        )


@router.get("/profile", response_model=AdminResponse)
async def get_admin_profile(
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Get current admin profile information.
    
    Args:
        current_admin: Current authenticated admin
        
    Returns:
        Admin profile data
    """
    return AdminResponse(**current_admin.to_dict())


@router.put("/profile")
async def update_admin_profile(
    profile_data: Dict[str, Any],
    current_admin: AdminUser = Depends(get_current_admin),
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
):
    """
    Update admin profile information.
    
    Args:
        profile_data: Profile update data
        current_admin: Current authenticated admin
        auth_service: Admin authentication service
        
    Returns:
        Updated admin profile
    """
    try:
        # Update allowed fields
        if "full_name" in profile_data:
            current_admin.full_name = profile_data["full_name"]
        
        if "email" in profile_data:
            # Check if email is already used by another admin
            existing = (
                auth_service.db.query(AdminUser)
                .filter(AdminUser.email == profile_data["email"])
                .filter(AdminUser.id != current_admin.id)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            current_admin.email = profile_data["email"]
        
        auth_service.db.commit()
        
        logger.info(f"Admin profile updated: {current_admin.username}")
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "admin": AdminResponse(**current_admin.to_dict())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating profile"
        )


@router.put("/change-password")
async def change_admin_password(
    password_data: AdminPasswordChangeRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
):
    """
    Change admin password.
    
    Args:
        password_data: Password change data
        current_admin: Current authenticated admin
        auth_service: Admin authentication service
        
    Returns:
        Success message
    """
    try:
        auth_service.update_admin_password(
            admin=current_admin,
            new_password=password_data.new_password,
            current_password=password_data.current_password
        )
        
        return {
            "success": True,
            "message": "Password changed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error changing password"
        )


@router.post("/forgot-password")
async def forgot_admin_password(
    reset_data: AdminPasswordResetRequest,
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
):
    """
    Initiate admin password reset.
    
    Args:
        reset_data: Password reset request data
        auth_service: Admin authentication service
        
    Returns:
        Success message (always returns success for security)
    """
    try:
        # Initiate password reset (returns None if email not found for security)
        reset_token = auth_service.initiate_password_reset(reset_data.email)
        
        # TODO: Send reset email with token
        # For now, log the token (in production, this would be sent via email)
        if reset_token:
            logger.info(f"Password reset token for {reset_data.email}: {reset_token}")
        
        # Always return success for security (don't reveal if email exists)
        return {
            "success": True,
            "message": "If the email exists, a password reset link has been sent"
        }
        
    except Exception as e:
        logger.error(f"Password reset initiation error: {str(e)}")
        return {
            "success": True,
            "message": "If the email exists, a password reset link has been sent"
        }


@router.post("/reset-password")
async def reset_admin_password(
    reset_data: AdminPasswordResetConfirmRequest,
    auth_service: AdminAuthService = Depends(get_admin_auth_service)
):
    """
    Complete admin password reset.
    
    Args:
        reset_data: Password reset confirmation data
        auth_service: Admin authentication service
        
    Returns:
        Success or error message
    """
    try:
        success = auth_service.complete_password_reset(
            email=reset_data.email,
            reset_token=reset_data.reset_token,
            new_password=reset_data.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        return {
            "success": True,
            "message": "Password reset successful"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting password"
        )