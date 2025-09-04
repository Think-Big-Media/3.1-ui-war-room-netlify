"""
Example authentication service with JWT implementation.
Shows patterns for:
- JWT token generation and validation
- Password hashing with bcrypt
- Refresh token handling
- Role-based access control
- Session management
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import secrets
import redis
from functools import wraps

from app.database import get_db
from app.models import User, UserRole
from app.config import settings


# Configuration
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
PASSWORD_RESET_EXPIRE_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# HTTP Bearer for refresh tokens
bearer_scheme = HTTPBearer()

# Redis for token blacklist and session management
redis_client = redis.from_url(settings.redis_url, decode_responses=True)


class TokenData(BaseModel):
    """Token payload data"""
    user_id: int
    email: str
    role: UserRole
    permissions: List[str]
    exp: datetime
    jti: Optional[str] = None  # JWT ID for revocation


class AuthService:
    """Authentication service with comprehensive security features"""
    
    @staticmethod
    def create_access_token(user: User) -> str:
        """
        Create JWT access token with user claims.
        
        Args:
            user: User model instance
            
        Returns:
            Encoded JWT token
        """
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        jti = secrets.token_urlsafe(16)
        
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "permissions": AuthService._get_user_permissions(user),
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": jti
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        # Store token metadata in Redis for tracking
        redis_client.setex(
            f"token:{jti}",
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            user.id
        )
        
        return token
    
    @staticmethod
    def create_refresh_token(user: User) -> str:
        """
        Create refresh token for token renewal.
        
        Args:
            user: User model instance
            
        Returns:
            Encoded refresh token
        """
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        jti = secrets.token_urlsafe(32)
        
        payload = {
            "sub": str(user.id),
            "type": "refresh",
            "exp": expire,
            "iat": datetime.utcnow(),
            "jti": jti
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        # Store refresh token in Redis
        redis_client.setex(
            f"refresh:{user.id}:{jti}",
            timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            "active"
        )
        
        return token
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> TokenData:
        """
        Verify and decode JWT token.
        
        Args:
            token: JWT token string
            token_type: Type of token (access/refresh)
            
        Returns:
            Decoded token data
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Check token type for refresh tokens
            if token_type == "refresh" and payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            # Check if token is blacklisted
            jti = payload.get("jti")
            if jti and redis_client.exists(f"blacklist:{jti}"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked"
                )
            
            # For access tokens, check if it's still valid in Redis
            if token_type == "access" and jti:
                if not redis_client.exists(f"token:{jti}"):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired or been revoked"
                    )
            
            return TokenData(
                user_id=int(payload.get("sub")),
                email=payload.get("email", ""),
                role=UserRole(payload.get("role", UserRole.VOLUNTEER.value)),
                permissions=payload.get("permissions", []),
                exp=datetime.fromtimestamp(payload.get("exp")),
                jti=jti
            )
            
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not validate credentials: {str(e)}"
            )
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)
    
    @staticmethod
    def revoke_token(jti: str, exp: datetime):
        """
        Revoke a token by adding it to blacklist.
        
        Args:
            jti: JWT ID
            exp: Token expiration time
        """
        ttl = exp - datetime.utcnow()
        if ttl.total_seconds() > 0:
            redis_client.setex(
                f"blacklist:{jti}",
                int(ttl.total_seconds()),
                "revoked"
            )
    
    @staticmethod
    def revoke_all_user_tokens(user_id: int):
        """Revoke all tokens for a specific user."""
        # Get all active tokens for user
        pattern = f"token:*"
        for key in redis_client.scan_iter(match=pattern):
            if redis_client.get(key) == str(user_id):
                redis_client.delete(key)
        
        # Revoke refresh tokens
        pattern = f"refresh:{user_id}:*"
        for key in redis_client.scan_iter(match=pattern):
            redis_client.delete(key)
    
    @staticmethod
    def create_password_reset_token(user: User) -> str:
        """Create a password reset token."""
        expire = datetime.utcnow() + timedelta(hours=PASSWORD_RESET_EXPIRE_HOURS)
        reset_token = secrets.token_urlsafe(32)
        
        # Store in Redis with user ID
        redis_client.setex(
            f"reset:{reset_token}",
            timedelta(hours=PASSWORD_RESET_EXPIRE_HOURS),
            user.id
        )
        
        return reset_token
    
    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[int]:
        """Verify password reset token and return user ID."""
        user_id = redis_client.get(f"reset:{token}")
        if user_id:
            redis_client.delete(f"reset:{token}")  # One-time use
            return int(user_id)
        return None
    
    @staticmethod
    def _get_user_permissions(user: User) -> List[str]:
        """Get user permissions based on role and custom permissions."""
        # Base permissions by role
        role_permissions = {
            UserRole.ADMIN: [
                "users.read", "users.write", "users.delete",
                "volunteers.read", "volunteers.write", "volunteers.delete",
                "events.read", "events.write", "events.delete",
                "reports.read", "reports.write",
                "settings.read", "settings.write"
            ],
            UserRole.COORDINATOR: [
                "volunteers.read", "volunteers.write",
                "events.read", "events.write",
                "reports.read"
            ],
            UserRole.VOLUNTEER: [
                "volunteers.read:self",
                "events.read",
                "events.register"
            ],
            UserRole.VIEWER: [
                "events.read",
                "reports.read:public"
            ]
        }
        
        permissions = set(role_permissions.get(user.role, []))
        
        # Add custom permissions
        if user.permissions:
            permissions.update(user.permissions.get("additional", []))
            # Remove revoked permissions
            for revoked in user.permissions.get("revoked", []):
                permissions.discard(revoked)
        
        return list(permissions)


# Dependency functions
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If authentication fails
    """
    token_data = AuthService.verify_token(token)
    
    user = db.query(User).filter(
        User.id == token_data.user_id,
        User.is_active == True,
        User.is_deleted == False
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Update last activity
    redis_client.setex(
        f"activity:{user.id}",
        timedelta(minutes=30),
        datetime.utcnow().isoformat()
    )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure user is active and verified."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address"
        )
    return current_user


def require_permissions(permissions: List[str]):
    """
    Decorator to require specific permissions.
    
    Args:
        permissions: List of required permissions
        
    Usage:
        @router.get("/admin")
        @require_permissions(["users.read", "users.write"])
        async def admin_endpoint(user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get user from kwargs
            user = kwargs.get('current_user') or kwargs.get('user')
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Get user permissions
            user_permissions = AuthService._get_user_permissions(user)
            
            # Check if user has all required permissions
            for permission in permissions:
                if permission not in user_permissions:
                    # Check for wildcard permissions (e.g., "users.*")
                    wildcard = permission.split('.')[0] + '.*'
                    if wildcard not in user_permissions:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Missing required permission: {permission}"
                        )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(roles: List[UserRole]):
    """
    Decorator to require specific roles.
    
    Args:
        roles: List of allowed roles
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = kwargs.get('current_user') or kwargs.get('user')
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if user.role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Required role: {', '.join([r.value for r in roles])}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# Session management
class SessionManager:
    """Manage user sessions with Redis"""
    
    @staticmethod
    def create_session(user_id: int, device_info: Dict[str, Any]) -> str:
        """Create a new session for user."""
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            **device_info
        }
        
        # Store session
        redis_client.hset(
            f"session:{session_id}",
            mapping=session_data
        )
        redis_client.expire(f"session:{session_id}", timedelta(days=30))
        
        # Add to user's session list
        redis_client.sadd(f"user_sessions:{user_id}", session_id)
        
        return session_id
    
    @staticmethod
    def validate_session(session_id: str) -> Optional[Dict[str, Any]]:
        """Validate and update session activity."""
        session_data = redis_client.hgetall(f"session:{session_id}")
        if session_data:
            # Update last activity
            redis_client.hset(
                f"session:{session_id}",
                "last_activity",
                datetime.utcnow().isoformat()
            )
            redis_client.expire(f"session:{session_id}", timedelta(days=30))
            return session_data
        return None
    
    @staticmethod
    def terminate_session(session_id: str):
        """Terminate a specific session."""
        session_data = redis_client.hgetall(f"session:{session_id}")
        if session_data:
            user_id = session_data.get("user_id")
            redis_client.delete(f"session:{session_id}")
            if user_id:
                redis_client.srem(f"user_sessions:{user_id}", session_id)
    
    @staticmethod
    def terminate_all_sessions(user_id: int):
        """Terminate all sessions for a user."""
        session_ids = redis_client.smembers(f"user_sessions:{user_id}")
        for session_id in session_ids:
            redis_client.delete(f"session:{session_id}")
        redis_client.delete(f"user_sessions:{user_id}")