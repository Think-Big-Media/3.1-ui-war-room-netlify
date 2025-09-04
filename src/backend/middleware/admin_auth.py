"""
Admin Authentication Middleware

Provides middleware for verifying admin authentication and permissions:
- JWT token verification from httpOnly cookies
- Admin permission checking
- Request context enrichment with admin information
- Session management and security headers
"""
import logging
from typing import Optional, List, Callable
from datetime import datetime
from fastapi import HTTPException, status, Request, Response
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

from models.admin_user import AdminUser
from services.admin_auth_service import AdminAuthService, get_admin_auth_service
from core.security import get_client_ip, SecurityHeaders
from core.database import get_db

# Configure logging
logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)


class AdminAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware for admin authentication and authorization.
    
    Automatically verifies admin JWT tokens from httpOnly cookies for admin routes
    and enriches request context with admin information.
    """
    
    def __init__(self, app, admin_required_paths: List[str] = None):
        """
        Initialize admin authentication middleware.
        
        Args:
            app: FastAPI application instance
            admin_required_paths: List of path prefixes requiring admin auth
        """
        super().__init__(app)
        self.admin_required_paths = admin_required_paths or ["/api/v1/admin/"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request through admin authentication middleware.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler in chain
            
        Returns:
            Response from downstream handlers
        """
        # Check if this is an admin route
        requires_admin_auth = any(
            request.url.path.startswith(path) for path in self.admin_required_paths
        )
        
        if requires_admin_auth:
            # Skip auth for specific endpoints (login, setup)
            if self._is_public_admin_endpoint(request.url.path):
                return await self._add_security_headers(request, call_next)
            
            # Verify admin authentication
            try:
                admin = await self._verify_admin_auth(request)
                request.state.current_admin = admin
                request.state.is_admin_authenticated = True
                
                # Log admin action
                logger.info(
                    f"Admin action: {admin.username} {request.method} {request.url.path} "
                    f"from {get_client_ip(request)}"
                )
                
            except HTTPException as e:
                logger.warning(
                    f"Admin auth failed for {request.url.path}: {e.detail}"
                )
                raise e
        
        return await self._add_security_headers(request, call_next)
    
    def _is_public_admin_endpoint(self, path: str) -> bool:
        """
        Check if admin endpoint is public (doesn't require authentication).
        
        Args:
            path: Request path
            
        Returns:
            True if endpoint is public, False otherwise
        """
        public_endpoints = [
            "/api/v1/admin/login",
            "/api/v1/admin/setup",
            "/api/v1/admin/forgot-password",
            "/api/v1/admin/reset-password"
        ]
        
        return any(path.startswith(endpoint) for endpoint in public_endpoints)
    
    async def _verify_admin_auth(self, request: Request) -> AdminUser:
        """
        Verify admin authentication from httpOnly cookie.
        
        Args:
            request: Request object
            
        Returns:
            Authenticated admin user
            
        Raises:
            HTTPException: If authentication fails
        """
        # Get token from httpOnly cookie
        token = request.cookies.get("admin_session")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin authentication required"
            )
        
        # Get database session
        db = next(get_db())
        auth_service = AdminAuthService(db)
        
        # Verify token and get admin
        admin = auth_service.get_admin_from_token(token)
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired admin session"
            )
        
        # Check if admin account is still active and not locked
        if not admin.can_login:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is inactive or locked"
            )
        
        return admin
    
    async def _add_security_headers(self, request: Request, call_next: Callable) -> Response:
        """
        Add security headers to response.
        
        Args:
            request: Request object
            call_next: Next handler in chain
            
        Returns:
            Response with security headers
        """
        response = await call_next(request)
        
        # Add standard security headers
        security_headers = SecurityHeaders.get_security_headers()
        for header, value in security_headers.items():
            response.headers[header] = value
        
        # Add admin-specific security headers
        if any(request.url.path.startswith(path) for path in self.admin_required_paths):
            response.headers["X-Admin-Route"] = "true"
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        
        return response


# Admin permission decorators and helpers
class AdminPermissionChecker:
    """Helper class for checking admin permissions."""
    
    @staticmethod
    def require_superadmin(admin: AdminUser) -> None:
        """
        Require superadmin privileges.
        
        Args:
            admin: Admin user to check
            
        Raises:
            HTTPException: If admin is not superadmin
        """
        if not admin.is_superadmin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Superadmin privileges required"
            )
    
    @staticmethod
    def require_active_admin(admin: AdminUser) -> None:
        """
        Require active admin account.
        
        Args:
            admin: Admin user to check
            
        Raises:
            HTTPException: If admin is inactive
        """
        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Active admin account required"
            )
    
    @staticmethod
    def check_admin_permissions(
        admin: AdminUser, 
        required_permissions: List[str] = None,
        require_superadmin: bool = False
    ) -> None:
        """
        Check admin permissions.
        
        Args:
            admin: Admin user to check
            required_permissions: List of required permissions
            require_superadmin: Whether superadmin is required
            
        Raises:
            HTTPException: If permissions are insufficient
        """
        # Check if account is active
        AdminPermissionChecker.require_active_admin(admin)
        
        # Check superadmin requirement
        if require_superadmin:
            AdminPermissionChecker.require_superadmin(admin)
            return  # Superadmin has all permissions
        
        # Check specific permissions (if implemented in future)
        if required_permissions:
            # For now, all active admins have all permissions
            # This can be expanded later with role-based permissions
            pass


def get_current_admin_from_request(request: Request) -> Optional[AdminUser]:
    """
    Get current admin from request state (set by middleware).
    
    Args:
        request: Request object
        
    Returns:
        Current admin user or None if not authenticated
    """
    return getattr(request.state, "current_admin", None)


def require_admin_auth(request: Request) -> AdminUser:
    """
    Require admin authentication for endpoint.
    
    Args:
        request: Request object
        
    Returns:
        Current authenticated admin
        
    Raises:
        HTTPException: If admin not authenticated
    """
    admin = get_current_admin_from_request(request)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required"
        )
    return admin


def require_superadmin_auth(request: Request) -> AdminUser:
    """
    Require superadmin authentication for endpoint.
    
    Args:
        request: Request object
        
    Returns:
        Current authenticated superadmin
        
    Raises:
        HTTPException: If superadmin not authenticated
    """
    admin = require_admin_auth(request)
    AdminPermissionChecker.require_superadmin(admin)
    return admin


# Rate limiting for admin endpoints
class AdminRateLimiter:
    """Rate limiter specifically for admin endpoints."""
    
    def __init__(self, max_requests: int = 100, window_minutes: int = 5):
        """
        Initialize admin rate limiter.
        
        Args:
            max_requests: Maximum requests per window
            window_minutes: Time window in minutes
        """
        self.max_requests = max_requests
        self.window_minutes = window_minutes
        self.request_counts = {}  # In production, use Redis
    
    def is_rate_limited(self, admin_id: str, ip_address: str) -> bool:
        """
        Check if admin is rate limited.
        
        Args:
            admin_id: Admin user ID
            ip_address: Client IP address
            
        Returns:
            True if rate limited, False otherwise
        """
        # Simple in-memory rate limiting (use Redis in production)
        now = datetime.utcnow()
        key = f"{admin_id}:{ip_address}"
        
        if key not in self.request_counts:
            self.request_counts[key] = {"count": 1, "window_start": now}
            return False
        
        data = self.request_counts[key]
        window_end = data["window_start"] + timedelta(minutes=self.window_minutes)
        
        if now > window_end:
            # Reset window
            self.request_counts[key] = {"count": 1, "window_start": now}
            return False
        
        # Increment counter
        data["count"] += 1
        
        return data["count"] > self.max_requests


# Global admin rate limiter instance
admin_rate_limiter = AdminRateLimiter()


def check_admin_rate_limit(request: Request, admin: AdminUser) -> None:
    """
    Check admin rate limiting.
    
    Args:
        request: Request object
        admin: Admin user
        
    Raises:
        HTTPException: If rate limit exceeded
    """
    client_ip = get_client_ip(request)
    
    if admin_rate_limiter.is_rate_limited(str(admin.id), client_ip):
        logger.warning(
            f"Admin rate limit exceeded: {admin.username} from {client_ip}"
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests - please try again later"
        )


# Session management helpers
class AdminSessionManager:
    """Helper for managing admin sessions."""
    
    @staticmethod
    def validate_session_context(request: Request, admin: AdminUser) -> None:
        """
        Validate admin session context for security.
        
        Args:
            request: Request object
            admin: Admin user
        """
        # Check for session hijacking indicators
        user_agent = request.headers.get("User-Agent", "")
        if not user_agent:
            logger.warning(f"Admin request without User-Agent: {admin.username}")
        
        # Log suspicious activity
        client_ip = get_client_ip(request)
        if admin.last_login_ip and admin.last_login_ip != client_ip:
            logger.info(
                f"Admin IP change detected: {admin.username} "
                f"from {admin.last_login_ip} to {client_ip}"
            )
    
    @staticmethod
    def should_require_reauthentication(admin: AdminUser) -> bool:
        """
        Check if admin should be required to re-authenticate.
        
        Args:
            admin: Admin user
            
        Returns:
            True if re-authentication required
        """
        if not admin.last_login:
            return True
        
        # Require re-auth after 24 hours for security
        hours_since_login = (datetime.utcnow() - admin.last_login).total_seconds() / 3600
        return hours_since_login > 24