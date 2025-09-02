"""
Authentication endpoints with secure cookie-based implementation.
"""

from datetime import datetime, timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from core.config import settings
from core.deps import get_db, get_current_user
from core.security import (
    verify_password,
    get_password_hash,
    generate_verification_token,
    generate_password_reset_token,
    is_strong_password,
)
from core.auth_cookies import cookie_auth
from models.user import User
from schemas.user import UserCreate, UserResponse
from services.email import send_verification_email, send_password_reset_email

router = APIRouter()


# Request/Response models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    message: str
    user: UserResponse
    csrf_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: Optional[str] = None


class RefreshResponse(BaseModel):
    message: str
    csrf_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


@router.post("/login", response_model=LoginResponse)
async def login(
    response: Response, login_data: LoginRequest, db: Session = Depends(get_db)
) -> Any:
    """
    Login with email and password.
    Sets httpOnly cookies for authentication.
    """
    # Find user
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
        )

    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    # Set authentication cookies
    csrf_data = cookie_auth.set_auth_cookies(response, str(user.id))

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    return {
        "message": "Login successful",
        "user": UserResponse.from_orm(user),
        "csrf_token": csrf_data["csrf_token"],
    }


@router.post("/register", response_model=UserResponse)
async def register(
    register_data: RegisterRequest, db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user account.
    """
    # Check if user exists
    existing_user = db.query(User).filter(User.email == register_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Validate password strength
    is_strong, issues = is_strong_password(register_data.password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password does not meet requirements", "issues": issues},
        )

    # Create user
    verification_token = generate_verification_token()
    user = User(
        email=register_data.email,
        hashed_password=get_password_hash(register_data.password),
        full_name=register_data.full_name,
        organization_name=register_data.organization_name,
        verification_token=verification_token,
        is_verified=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send verification email
    await send_verification_email(user.email, verification_token)

    return UserResponse.from_orm(user)


@router.post("/logout")
async def logout(
    response: Response, current_user: User = Depends(get_current_user)
) -> Any:
    """
    Logout the current user by clearing cookies.
    """
    # Clear all auth cookies
    cookie_auth.clear_auth_cookies(response)

    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: Request, response: Response) -> Any:
    """
    Refresh authentication token using refresh token cookie.
    """
    csrf_data = cookie_auth.refresh_auth_token(response)

    return {
        "message": "Token refreshed successfully",
        "csrf_token": csrf_data["csrf_token"],
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    Get current user information.
    """
    return UserResponse.from_orm(current_user)


@router.post("/verify-email/{token}")
async def verify_email(token: str, db: Session = Depends(get_db)) -> Any:
    """
    Verify user email with verification token.
    """
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invalid verification token"
        )

    if user.is_verified:
        return {"message": "Email already verified"}

    # Verify user
    user.is_verified = True
    user.verification_token = None
    user.verified_at = datetime.utcnow()
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
async def forgot_password(
    reset_data: PasswordResetRequest, db: Session = Depends(get_db)
) -> Any:
    """
    Request password reset email.
    """
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link has been sent"}

    # Generate reset token
    reset_token = generate_password_reset_token()
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    # Send reset email
    await send_password_reset_email(user.email, reset_token)

    return {"message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm, db: Session = Depends(get_db)
) -> Any:
    """
    Reset password with reset token.
    """
    user = (
        db.query(User)
        .filter(
            User.password_reset_token == reset_data.token,
            User.password_reset_expires > datetime.utcnow(),
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired reset token",
        )

    # Validate new password
    is_strong, issues = is_strong_password(reset_data.new_password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password does not meet requirements", "issues": issues},
        )

    # Update password
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Change password for authenticated user.
    """
    # Verify current password
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    # Validate new password
    is_strong, issues = is_strong_password(new_password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Password does not meet requirements", "issues": issues},
        )

    # Update password
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()

    return {"message": "Password changed successfully"}


# OAuth endpoints (Meta, Google, etc.)
@router.get("/oauth/{provider}")
async def oauth_login(provider: str) -> Any:
    """
    Initiate OAuth login flow.
    """
    # This would redirect to OAuth provider
    # Implementation depends on specific provider
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"OAuth provider {provider} not implemented yet",
    )


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: Optional[str] = None,
    response: Response = None,
    db: Session = Depends(get_db),
) -> Any:
    """
    Handle OAuth callback and set cookies.
    """
    # This would handle OAuth callback
    # Implementation depends on specific provider
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"OAuth provider {provider} callback not implemented yet",
    )


# Dependency for other endpoints
async def get_current_active_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current active user.
    Ensures user is active and not deleted.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user
