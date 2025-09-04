"""
Example authentication API endpoints.
Shows patterns for:
- Login/logout flows
- Token refresh
- Password reset
- Email verification
- OAuth2 integration
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, validator
import secrets

from app.database import get_db
from app.models import User, UserRole
from app.auth_service import (
    AuthService, get_current_user, get_current_active_user,
    SessionManager, bearer_scheme
)
from app.email_service import EmailService
from app.schemas import UserCreate, UserResponse, TokenResponse
from app.utils.rate_limit import rate_limit

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    device_name: Optional[str] = Field(None, description="Device name for session tracking")
    remember_me: bool = Field(False, description="Extended session duration")


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=12)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """Ensure password meets security requirements"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(..., min_length=12)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@rate_limit("5/hour")
async def register(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    Features:
    - Email uniqueness validation
    - Password hashing
    - Email verification sending
    - Rate limiting
    """
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = AuthService.hash_password(user_data.password)
    
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=UserRole.VOLUNTEER,  # Default role
        is_active=True,
        is_verified=False
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    redis_client.setex(
        f"verify:{verification_token}",
        timedelta(days=7),
        db_user.id
    )
    
    # Send verification email in background
    background_tasks.add_task(
        EmailService.send_verification_email,
        db_user.email,
        db_user.first_name,
        verification_token
    )
    
    # Log registration
    audit_log = AuditLog(
        user_id=db_user.id,
        action="user.registered",
        entity_type="user",
        entity_id=db_user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("User-Agent")
    )
    db.add(audit_log)
    db.commit()
    
    return db_user


@router.post("/login", response_model=TokenResponse)
@rate_limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with email/username and password.
    
    Features:
    - Support both email and username login
    - Session creation
    - Device tracking
    - Failed login tracking
    """
    # Find user by email or username
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()
    
    if not user or not AuthService.verify_password(form_data.password, user.password_hash):
        # Track failed login attempt
        redis_client.incr(f"failed_login:{request.client.host}")
        redis_client.expire(f"failed_login:{request.client.host}", timedelta(hours=1))
        
        # Check if too many failed attempts
        failed_attempts = int(redis_client.get(f"failed_login:{request.client.host}") or 0)
        if failed_attempts > 5:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Please try again later."
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )
    
    # Clear failed login attempts
    redis_client.delete(f"failed_login:{request.client.host}")
    
    # Create tokens
    access_token = AuthService.create_access_token(user)
    refresh_token = AuthService.create_refresh_token(user)
    
    # Create session
    device_info = {
        "ip_address": request.client.host,
        "user_agent": request.headers.get("User-Agent"),
        "device_name": form_data.client_id or "Unknown Device"
    }
    session_id = SessionManager.create_session(user.id, device_info)
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Log login
    audit_log = AuditLog(
        user_id=user.id,
        action="user.login",
        entity_type="user",
        entity_id=user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("User-Agent"),
        details={"session_id": session_id}
    )
    db.add(audit_log)
    db.commit()
    
    response = JSONResponse(
        content={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
                "is_verified": user.is_verified
            }
        }
    )
    
    # Set secure HTTP-only cookie for session
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,  # Only over HTTPS in production
        samesite="lax",
        max_age=30 * 24 * 60 * 60 if form_data.grant_type == "password" else None
    )
    
    return response


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    Features:
    - Validate refresh token
    - Issue new access token
    - Rotate refresh token for security
    """
    try:
        # Verify refresh token
        token_data = AuthService.verify_token(refresh_request.refresh_token, token_type="refresh")
        
        # Get user
        user = db.query(User).filter(
            User.id == token_data.user_id,
            User.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new tokens
        access_token = AuthService.create_access_token(user)
        new_refresh_token = AuthService.create_refresh_token(user)
        
        # Revoke old refresh token
        if token_data.jti:
            AuthService.revoke_token(token_data.jti, token_data.exp)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout current user.
    
    Features:
    - Revoke current access token
    - Terminate session
    - Clear cookies
    """
    # Get token from request
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            token_data = AuthService.verify_token(token)
            if token_data.jti:
                AuthService.revoke_token(token_data.jti, token_data.exp)
        except:
            pass
    
    # Terminate session
    session_id = request.cookies.get("session_id")
    if session_id:
        SessionManager.terminate_session(session_id)
    
    # Log logout
    audit_log = AuditLog(
        user_id=current_user.id,
        action="user.logout",
        entity_type="user",
        entity_id=current_user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("User-Agent")
    )
    db.add(audit_log)
    db.commit()
    
    response = JSONResponse(content={"message": "Successfully logged out"})
    response.delete_cookie("session_id")
    
    return response


@router.post("/logout-all")
async def logout_all_devices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Logout from all devices.
    
    Features:
    - Revoke all user tokens
    - Terminate all sessions
    """
    # Revoke all tokens
    AuthService.revoke_all_user_tokens(current_user.id)
    
    # Terminate all sessions
    SessionManager.terminate_all_sessions(current_user.id)
    
    return {"message": "Successfully logged out from all devices"}


@router.post("/verify-email/{token}")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify email address with token.
    
    Features:
    - One-time token validation
    - Account activation
    """
    # Get user ID from token
    user_id = redis_client.get(f"verify:{token}")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Update user
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    user.is_verified = True
    user.verified_at = datetime.utcnow()
    
    # Delete verification token
    redis_client.delete(f"verify:{token}")
    
    db.commit()
    
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
@rate_limit("3/hour")
async def forgot_password(
    reset_request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request password reset.
    
    Features:
    - Rate limiting
    - Reset token generation
    - Email notification
    """
    # Find user
    user = db.query(User).filter(User.email == reset_request.email).first()
    
    # Always return success to prevent email enumeration
    if user and user.is_active:
        # Generate reset token
        reset_token = AuthService.create_password_reset_token(user)
        
        # Send reset email
        background_tasks.add_task(
            EmailService.send_password_reset_email,
            user.email,
            user.first_name,
            reset_token
        )
    
    return {
        "message": "If the email exists, a password reset link has been sent"
    }


@router.post("/reset-password")
async def reset_password(
    reset_confirm: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password with token.
    
    Features:
    - Token validation
    - Password strength enforcement
    - Token invalidation after use
    """
    # Verify token
    user_id = AuthService.verify_password_reset_token(reset_confirm.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password_hash = AuthService.hash_password(reset_confirm.new_password)
    
    # Revoke all existing tokens for security
    AuthService.revoke_all_user_tokens(user.id)
    SessionManager.terminate_all_sessions(user.id)
    
    db.commit()
    
    return {"message": "Password reset successfully. Please login with your new password."}


@router.post("/change-password")
async def change_password(
    password_change: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change password for authenticated user.
    
    Features:
    - Current password verification
    - Password history check (optional)
    - Session management
    """
    # Verify current password
    if not AuthService.verify_password(password_change.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Check if new password is same as current
    if AuthService.verify_password(password_change.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.password_hash = AuthService.hash_password(password_change.new_password)
    
    db.commit()
    
    return {"message": "Password changed successfully"}