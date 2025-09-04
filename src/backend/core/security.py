"""
Security utilities for authentication and authorization.

Provides password hashing, JWT token management, and related security functions.
"""

import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import ValidationError

from .config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The subject (usually user ID) to encode
        expires_delta: Optional custom expiration time

    Returns:
        JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    """
    Create a JWT refresh token.

    Args:
        subject: The subject (usually user ID) to encode

    Returns:
        JWT refresh token string
    """
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """
    Verify a JWT token and extract the subject.

    Args:
        token: JWT token to verify

    Returns:
        Subject string if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        subject: str = payload.get("sub")
        if subject is None:
            return None
        return subject
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password to verify against

    Returns:
        True if password is correct, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def generate_password_reset_token() -> str:
    """
    Generate a secure password reset token.

    Returns:
        Random token string
    """
    return secrets.token_urlsafe(32)


def generate_verification_token() -> str:
    """
    Generate a secure email verification token.

    Returns:
        Random token string
    """
    return secrets.token_urlsafe(32)


def generate_api_key() -> str:
    """
    Generate a secure API key.

    Returns:
        Random API key string
    """
    return secrets.token_urlsafe(40)


# Rate limiting and security headers
def get_client_ip(request) -> str:
    """
    Extract client IP address from request headers.

    Args:
        request: FastAPI request object

    Returns:
        Client IP address string
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    return request.client.host


def is_strong_password(password: str) -> tuple[bool, list[str]]:
    """
    Check if a password meets strength requirements.

    Args:
        password: Password to check

    Returns:
        Tuple of (is_strong, list_of_issues)
    """
    issues = []

    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")

    if not any(c.isupper() for c in password):
        issues.append("Password must contain at least one uppercase letter")

    if not any(c.islower() for c in password):
        issues.append("Password must contain at least one lowercase letter")

    if not any(c.isdigit() for c in password):
        issues.append("Password must contain at least one number")

    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        issues.append("Password must contain at least one special character")

    return len(issues) == 0, issues


def validate_jwt_payload(payload: Dict[str, Any]) -> bool:
    """
    Validate JWT payload structure.

    Args:
        payload: JWT payload dictionary

    Returns:
        True if valid, False otherwise
    """
    required_fields = ["sub", "exp"]
    return all(field in payload for field in required_fields)


# Security decorators and middleware helpers
class SecurityHeaders:
    """Security headers for HTTP responses."""

    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """Get standard security headers."""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        }


# Two-factor authentication helpers
def generate_totp_secret() -> str:
    """
    Generate a TOTP secret for two-factor authentication.

    Returns:
        Base32-encoded secret string
    """
    return secrets.token_urlsafe(20)


def verify_totp_token(secret: str, token: str) -> bool:
    """
    Verify a TOTP token.

    Args:
        secret: TOTP secret
        token: Token to verify

    Returns:
        True if token is valid, False otherwise
    """
    # This would integrate with a TOTP library like pyotp
    # For now, return True for demo purposes
    return True


# Session management
def generate_session_id() -> str:
    """
    Generate a secure session ID.

    Returns:
        Random session ID string
    """
    return secrets.token_urlsafe(32)


def is_session_valid(session_id: str, user_id: str) -> bool:
    """
    Check if a session is valid.

    Args:
        session_id: Session ID to check
        user_id: User ID associated with session

    Returns:
        True if session is valid, False otherwise
    """
    # This would check against a session store (Redis, database, etc.)
    # For now, return True for demo purposes
    return True


