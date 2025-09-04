"""
Comprehensive Security Middleware Suite
Implements multiple security measures as FastAPI middleware.
"""
import re
import time
import logging
import hashlib
import secrets
from typing import Dict, Set, Optional, List, Any
from datetime import datetime, timedelta
import ipaddress
from urllib.parse import unquote

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .config import settings
from .input_validator import input_validator, SanitizationLevel, ValidationError
from services.cache_service import cache_service

logger = logging.getLogger(__name__)


class SecurityHeaders:
    """Security headers configuration."""

    DEFAULT_HEADERS = {
        # Prevent MIME type sniffing
        "X-Content-Type-Options": "nosniff",
        # Enable XSS protection
        "X-XSS-Protection": "1; mode=block",
        # Prevent page embedding in frames
        "X-Frame-Options": "DENY",
        # Strict transport security (HTTPS only)
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        # Referrer policy
        "Referrer-Policy": "strict-origin-when-cross-origin",
        # Permissions policy
        "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
        # Content Security Policy
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        ),
        # Server header (hide server info)
        "Server": "War Room API",
    }


class IPWhitelist:
    """IP address whitelist/blacklist management."""

    def __init__(self):
        self.whitelist: Set[str] = set()
        self.blacklist: Set[str] = set()
        self.whitelist_networks: List[ipaddress.IPv4Network] = []
        self.blacklist_networks: List[ipaddress.IPv4Network] = []

    def add_to_whitelist(self, ip_or_network: str):
        """Add IP or network to whitelist."""
        try:
            if "/" in ip_or_network:
                network = ipaddress.IPv4Network(ip_or_network, strict=False)
                self.whitelist_networks.append(network)
            else:
                self.whitelist.add(ip_or_network)
        except ValueError as e:
            logger.error(f"Invalid IP/network for whitelist: {ip_or_network}: {e}")

    def add_to_blacklist(self, ip_or_network: str):
        """Add IP or network to blacklist."""
        try:
            if "/" in ip_or_network:
                network = ipaddress.IPv4Network(ip_or_network, strict=False)
                self.blacklist_networks.append(network)
            else:
                self.blacklist.add(ip_or_network)
        except ValueError as e:
            logger.error(f"Invalid IP/network for blacklist: {ip_or_network}: {e}")

    def is_allowed(self, ip_address: str) -> bool:
        """Check if IP address is allowed."""
        try:
            ip = ipaddress.IPv4Address(ip_address)

            # Check blacklist first
            if ip_address in self.blacklist:
                return False

            for network in self.blacklist_networks:
                if ip in network:
                    return False

            # If whitelist is empty, allow all (except blacklisted)
            if not self.whitelist and not self.whitelist_networks:
                return True

            # Check whitelist
            if ip_address in self.whitelist:
                return True

            for network in self.whitelist_networks:
                if ip in network:
                    return True

            return False

        except ValueError:
            # Invalid IP format - block by default
            logger.warning(f"Invalid IP address format: {ip_address}")
            return False


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security middleware that implements:
    - Security headers
    - IP filtering
    - Request size limits
    - Path traversal protection
    - Input validation
    - CSRF protection
    - Request logging
    """

    def __init__(
        self,
        app: ASGIApp,
        enable_security_headers: bool = True,
        enable_ip_filtering: bool = True,
        enable_input_validation: bool = True,
        enable_csrf_protection: bool = True,
        max_request_size: int = 10 * 1024 * 1024,  # 10MB
        blocked_paths: Optional[List[str]] = None,
        custom_headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(app)
        self.enable_security_headers = enable_security_headers
        self.enable_ip_filtering = enable_ip_filtering
        self.enable_input_validation = enable_input_validation
        self.enable_csrf_protection = enable_csrf_protection
        self.max_request_size = max_request_size

        # Security headers
        self.security_headers = SecurityHeaders.DEFAULT_HEADERS.copy()
        if custom_headers:
            self.security_headers.update(custom_headers)

        # IP filtering
        self.ip_whitelist = IPWhitelist()

        # Blocked paths (path traversal protection)
        self.blocked_paths = blocked_paths or [
            "/.env",
            "/etc/passwd",
            "/etc/shadow",
            "/.git/",
            "/.svn/",
            "/admin/",
            "/wp-admin/",
            "/phpmyadmin/",
            "/backup/",
            "/config/",
            "/.aws/",
            "/.ssh/",
        ]

        # Suspicious patterns
        self.suspicious_patterns = [
            r"\.\./+",  # Directory traversal
            r'[<>"\']',  # Potential XSS chars in path
            r"script:",  # JavaScript protocol
            r"eval\s*\(",  # Code evaluation
            r"base64_decode",  # Base64 decoding
            r"exec\s*\(",  # Code execution
        ]

    async def dispatch(self, request: Request, call_next):
        """Main security middleware dispatch."""
        start_time = time.time()

        try:
            # 1. IP filtering
            if self.enable_ip_filtering:
                if not await self._check_ip_allowed(request):
                    return self._create_error_response(
                        403, "Access denied from this IP address"
                    )

            # 2. Request size validation
            if not await self._check_request_size(request):
                return self._create_error_response(413, "Request entity too large")

            # 3. Path validation
            if not self._check_path_security(request):
                return self._create_error_response(
                    403, "Access to this path is forbidden"
                )

            # 4. Suspicious pattern detection
            if self._detect_suspicious_patterns(request):
                return self._create_error_response(
                    400, "Potentially malicious request detected"
                )

            # 5. CSRF protection
            if self.enable_csrf_protection:
                if not await self._check_csrf_protection(request):
                    return self._create_error_response(
                        403, "CSRF token validation failed"
                    )

            # 6. Input validation (for query parameters)
            if self.enable_input_validation:
                if not await self._validate_query_params(request):
                    return self._create_error_response(400, "Invalid query parameters")

            # Process request
            response = await call_next(request)

            # 7. Add security headers
            if self.enable_security_headers:
                self._add_security_headers(response)

            # 8. Log security events
            await self._log_security_event(request, response, time.time() - start_time)

            return response

        except Exception as e:
            logger.error(f"Security middleware error: {e}")
            return self._create_error_response(500, "Internal security error")

    async def _check_ip_allowed(self, request: Request) -> bool:
        """Check if request IP is allowed."""
        try:
            # Get real IP address
            client_ip = self._get_client_ip(request)

            # Check against whitelist/blacklist
            return self.ip_whitelist.is_allowed(client_ip)

        except Exception as e:
            logger.error(f"IP check error: {e}")
            return True  # Fail open for IP checks

    def _get_client_ip(self, request: Request) -> str:
        """Extract real client IP from request."""
        # Check various headers for real IP (reverse proxy scenarios)
        ip_headers = [
            "X-Forwarded-For",
            "X-Real-IP",
            "X-Client-IP",
            "CF-Connecting-IP",  # Cloudflare
            "True-Client-IP",
        ]

        for header in ip_headers:
            header_value = request.headers.get(header)
            if header_value:
                # X-Forwarded-For can contain multiple IPs, take the first
                ip = header_value.split(",")[0].strip()
                if self._is_valid_ip(ip):
                    return ip

        # Fall back to direct connection IP
        if request.client and request.client.host:
            return request.client.host

        return "unknown"

    def _is_valid_ip(self, ip: str) -> bool:
        """Check if string is a valid IP address."""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False

    async def _check_request_size(self, request: Request) -> bool:
        """Check request size limits."""
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                return size <= self.max_request_size
            except ValueError:
                return False
        return True

    def _check_path_security(self, request: Request) -> bool:
        """Check for path traversal and blocked paths."""
        path = unquote(request.url.path)  # URL decode the path

        # Check for blocked paths
        for blocked_path in self.blocked_paths:
            if blocked_path in path:
                logger.warning(f"Blocked path access attempt: {path}")
                return False

        # Check for path traversal
        if "../" in path or "..%2f" in path.lower() or "..%5c" in path.lower():
            logger.warning(f"Path traversal attempt: {path}")
            return False

        # Check for null bytes
        if "\x00" in path:
            logger.warning(f"Null byte in path: {path}")
            return False

        return True

    def _detect_suspicious_patterns(self, request: Request) -> bool:
        """Detect suspicious patterns in request."""
        # Check URL path
        path = request.url.path
        query = str(request.url.query)

        # Check user agent for bots/scanners
        user_agent = request.headers.get("user-agent", "").lower()
        suspicious_agents = [
            "sqlmap",
            "nikto",
            "dirb",
            "dirbuster",
            "gobuster",
            "masscan",
            "nmap",
            "zap",
            "burp",
            "acunetix",
        ]

        if any(agent in user_agent for agent in suspicious_agents):
            logger.warning(f"Suspicious user agent: {user_agent}")
            return True

        # Check for suspicious patterns in path and query
        full_request = f"{path}?{query}"
        for pattern in self.suspicious_patterns:
            if re.search(pattern, full_request, re.IGNORECASE):
                logger.warning(
                    f"Suspicious pattern detected: {pattern} in {full_request}"
                )
                return True

        return False

    async def _check_csrf_protection(self, request: Request) -> bool:
        """Check CSRF protection for state-changing requests."""
        # Skip CSRF for safe methods
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Skip CSRF for API requests with proper authentication
        if request.url.path.startswith("/api/"):
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                return True

        # Check CSRF token
        csrf_token = (
            request.headers.get("X-CSRF-Token")
            or request.headers.get("X-CSRFToken")
            or request.cookies.get("csrf_token")
        )

        if not csrf_token:
            logger.warning("Missing CSRF token")
            return False

        # Validate CSRF token format and age
        return await self._validate_csrf_token(csrf_token)

    async def _validate_csrf_token(self, token: str) -> bool:
        """Validate CSRF token."""
        try:
            # Simple token validation - in production, use more sophisticated method
            if len(token) < 32:
                return False

            # Check if token exists in cache (for single-use tokens)
            cached_token = await cache_service.get(f"csrf_token:{token}", db=2)
            if cached_token is None:
                return False

            # Remove token after use (single-use)
            await cache_service.delete(f"csrf_token:{token}", db=2)

            return True

        except Exception as e:
            logger.error(f"CSRF token validation error: {e}")
            return False

    async def _validate_query_params(self, request: Request) -> bool:
        """Validate query parameters."""
        try:
            query_params = dict(request.query_params)

            for param_name, param_value in query_params.items():
                # Basic validation rules for query parameters
                validation_rules = {
                    "type": "string",
                    "max_length": 1000,  # Reasonable limit
                    "required": False,
                }

                # Validate each parameter
                input_validator.validate_and_sanitize(
                    param_value,
                    param_name,
                    validation_rules,
                    SanitizationLevel.MODERATE,
                )

            return True

        except ValidationError as e:
            logger.warning(f"Query parameter validation failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Query parameter validation error: {e}")
            return True  # Fail open for non-critical validation

    def _add_security_headers(self, response: Response):
        """Add security headers to response."""
        for header_name, header_value in self.security_headers.items():
            response.headers[header_name] = header_value

    async def _log_security_event(
        self, request: Request, response: Response, processing_time: float
    ):
        """Log security-related events."""
        client_ip = self._get_client_ip(request)

        # Log suspicious status codes
        if response.status_code in [400, 401, 403, 404, 429]:
            logger.info(
                f"Security event: {response.status_code} - "
                f"{request.method} {request.url.path} - "
                f"IP: {client_ip} - "
                f"Time: {processing_time:.3f}s - "
                f"UA: {request.headers.get('user-agent', 'Unknown')}"
            )

    def _create_error_response(self, status_code: int, message: str) -> JSONResponse:
        """Create standardized error response."""
        return JSONResponse(
            status_code=status_code,
            content={
                "error": message,
                "status_code": status_code,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


class CSRFTokenManager:
    """Manage CSRF tokens."""

    @staticmethod
    async def generate_token(user_id: Optional[str] = None) -> str:
        """Generate a new CSRF token."""
        # Generate cryptographically secure random token
        token = secrets.token_urlsafe(32)

        # Store in cache with expiration (1 hour)
        await cache_service.set(
            f"csrf_token:{token}",
            {"user_id": user_id, "created_at": datetime.utcnow().isoformat()},
            ttl=3600,  # 1 hour
            db=2,
        )

        return token

    @staticmethod
    async def validate_token(token: str, user_id: Optional[str] = None) -> bool:
        """Validate CSRF token."""
        try:
            token_data = await cache_service.get(f"csrf_token:{token}", db=2)
            if not token_data:
                return False

            # Check user association if provided
            if user_id and token_data.get("user_id") != user_id:
                return False

            return True

        except Exception as e:
            logger.error(f"CSRF token validation error: {e}")
            return False


class SecurityAuditLogger:
    """Security audit logging."""

    @staticmethod
    async def log_security_violation(
        violation_type: str,
        details: Dict[str, Any],
        request: Request,
        severity: str = "medium",
    ):
        """Log security violations for monitoring."""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "violation_type": violation_type,
            "severity": severity,
            "client_ip": SecurityMiddleware._get_client_ip(None, request),
            "user_agent": request.headers.get("user-agent"),
            "path": request.url.path,
            "method": request.method,
            "details": details,
        }

        # Store in cache for monitoring system pickup
        await cache_service.set(
            f"security_audit:{datetime.utcnow().timestamp()}",
            audit_entry,
            ttl=86400,  # 24 hours
            db=1,  # Real-time database
        )

        # Log at appropriate level
        if severity == "critical":
            logger.critical(f"Security violation: {audit_entry}")
        elif severity == "high":
            logger.error(f"Security violation: {audit_entry}")
        else:
            logger.warning(f"Security violation: {audit_entry}")


# Export main components
__all__ = [
    "SecurityMiddleware",
    "SecurityHeaders",
    "IPWhitelist",
    "CSRFTokenManager",
    "SecurityAuditLogger",
]
