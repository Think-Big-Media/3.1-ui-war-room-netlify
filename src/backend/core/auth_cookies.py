"""
Secure cookie-based authentication system.
Implements httpOnly cookies with CSRF protection.
"""

import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Cookie, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt

from .config import settings
from .security import create_access_token, create_refresh_token, verify_token


class CookieAuth:
    """Secure cookie-based authentication handler."""

    # Cookie configuration
    AUTH_COOKIE_NAME = "auth_token"
    REFRESH_COOKIE_NAME = "refresh_token"
    CSRF_COOKIE_NAME = "csrf_token"
    CSRF_HEADER_NAME = "X-CSRF-Token"

    # Cookie settings
    COOKIE_SECURE = settings.ENVIRONMENT == "production"  # HTTPS only in production
    COOKIE_HTTPONLY = True  # Prevent JavaScript access
    COOKIE_SAMESITE = "strict"  # CSRF protection
    COOKIE_PATH = "/"

    # Token expiration
    ACCESS_TOKEN_MAX_AGE = (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )  # Convert to seconds
    REFRESH_TOKEN_MAX_AGE = (
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )  # Convert to seconds

    @classmethod
    def set_auth_cookies(
        cls, response: Response, user_id: str, include_refresh: bool = True
    ) -> Dict[str, str]:
        """
        Set authentication cookies in the response.

        Args:
            response: FastAPI response object
            user_id: User ID to encode in token
            include_refresh: Whether to include refresh token

        Returns:
            Dictionary with CSRF token
        """
        # Generate tokens
        access_token = create_access_token(user_id)
        csrf_token = cls.generate_csrf_token()

        # Set access token cookie
        response.set_cookie(
            key=cls.AUTH_COOKIE_NAME,
            value=access_token,
            max_age=cls.ACCESS_TOKEN_MAX_AGE,
            secure=cls.COOKIE_SECURE,
            httponly=cls.COOKIE_HTTPONLY,
            samesite=cls.COOKIE_SAMESITE,
            path=cls.COOKIE_PATH,
        )

        # Set CSRF token cookie (not httpOnly so JS can read it)
        response.set_cookie(
            key=cls.CSRF_COOKIE_NAME,
            value=csrf_token,
            max_age=cls.ACCESS_TOKEN_MAX_AGE,
            secure=cls.COOKIE_SECURE,
            httponly=False,  # JavaScript needs to read this
            samesite=cls.COOKIE_SAMESITE,
            path=cls.COOKIE_PATH,
        )

        # Set refresh token if requested
        if include_refresh:
            refresh_token = create_refresh_token(user_id)
            response.set_cookie(
                key=cls.REFRESH_COOKIE_NAME,
                value=refresh_token,
                max_age=cls.REFRESH_TOKEN_MAX_AGE,
                secure=cls.COOKIE_SECURE,
                httponly=cls.COOKIE_HTTPONLY,
                samesite=cls.COOKIE_SAMESITE,
                path=cls.COOKIE_PATH,
            )

        return {"csrf_token": csrf_token}

    @classmethod
    def clear_auth_cookies(cls, response: Response) -> None:
        """Clear all authentication cookies."""
        for cookie_name in [
            cls.AUTH_COOKIE_NAME,
            cls.REFRESH_COOKIE_NAME,
            cls.CSRF_COOKIE_NAME,
        ]:
            response.delete_cookie(
                key=cookie_name,
                path=cls.COOKIE_PATH,
                secure=cls.COOKIE_SECURE,
                samesite=cls.COOKIE_SAMESITE,
            )

    @classmethod
    def verify_auth_cookie(
        cls,
        request: Request,
        auth_token: Optional[str] = Cookie(None, alias=AUTH_COOKIE_NAME),
        csrf_token: Optional[str] = Cookie(None, alias=CSRF_COOKIE_NAME),
    ) -> str:
        """
        Verify authentication cookie and CSRF token.

        Args:
            request: FastAPI request object
            auth_token: Auth token from cookie
            csrf_token: CSRF token from cookie

        Returns:
            User ID from token

        Raises:
            HTTPException: If authentication fails
        """
        # Check if cookies exist
        if not auth_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )

        # Verify CSRF token for state-changing requests
        if request.method not in ["GET", "HEAD", "OPTIONS"]:
            if not csrf_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token missing"
                )

            # Check CSRF header matches cookie
            csrf_header = request.headers.get(cls.CSRF_HEADER_NAME)
            if not csrf_header or csrf_header != csrf_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token invalid"
                )

        # Verify JWT token
        user_id = verify_token(auth_token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        return user_id

    @classmethod
    def refresh_auth_token(
        cls,
        response: Response,
        refresh_token: Optional[str] = Cookie(None, alias=REFRESH_COOKIE_NAME),
    ) -> Dict[str, str]:
        """
        Refresh authentication token using refresh token.

        Args:
            response: FastAPI response object
            refresh_token: Refresh token from cookie

        Returns:
            Dictionary with new CSRF token

        Raises:
            HTTPException: If refresh fails
        """
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token required",
            )

        # Verify refresh token
        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )

            # Check token type
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )

            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                )

            # Set new auth cookies (but not new refresh token)
            return cls.set_auth_cookies(response, user_id, include_refresh=False)

        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )

    @staticmethod
    def generate_csrf_token() -> str:
        """Generate a secure CSRF token."""
        return secrets.token_urlsafe(32)

    @classmethod
    def get_current_user_id(
        cls,
        request: Request,
        auth_token: Optional[str] = Cookie(None, alias=AUTH_COOKIE_NAME),
        csrf_token: Optional[str] = Cookie(None, alias=CSRF_COOKIE_NAME),
    ) -> Optional[str]:
        """
        Get current user ID from cookies without raising exceptions.

        Returns:
            User ID if authenticated, None otherwise
        """
        try:
            return cls.verify_auth_cookie(request, auth_token, csrf_token)
        except HTTPException:
            return None


# Session management with Redis (optional)
class SessionManager:
    """Manage user sessions with Redis backend."""

    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.session_prefix = "session:"
        self.session_ttl = 86400  # 24 hours

    async def create_session(
        self, user_id: str, metadata: Dict[str, Any] = None
    ) -> str:
        """Create a new session."""
        session_id = secrets.token_urlsafe(32)
        session_key = f"{self.session_prefix}{session_id}"

        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            **(metadata or {}),
        }

        if self.redis:
            await self.redis.setex(
                session_key, self.session_ttl, json.dumps(session_data)
            )

        return session_id

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data."""
        if not self.redis:
            return None

        session_key = f"{self.session_prefix}{session_id}"
        session_data = await self.redis.get(session_key)

        if session_data:
            data = json.loads(session_data)
            # Update last activity
            data["last_activity"] = datetime.utcnow().isoformat()
            await self.redis.setex(session_key, self.session_ttl, json.dumps(data))
            return data

        return None

    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        if not self.redis:
            return False

        session_key = f"{self.session_prefix}{session_id}"
        return await self.redis.delete(session_key) > 0

    async def delete_user_sessions(self, user_id: str) -> int:
        """Delete all sessions for a user."""
        if not self.redis:
            return 0

        # Find all sessions for user
        pattern = f"{self.session_prefix}*"
        deleted_count = 0

        async for key in self.redis.scan_iter(pattern):
            session_data = await self.redis.get(key)
            if session_data:
                data = json.loads(session_data)
                if data.get("user_id") == user_id:
                    await self.redis.delete(key)
                    deleted_count += 1

        return deleted_count


# Export convenience functions
cookie_auth = CookieAuth()

__all__ = ["CookieAuth", "SessionManager", "cookie_auth"]
