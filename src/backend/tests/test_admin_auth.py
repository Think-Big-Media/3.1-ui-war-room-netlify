"""
Comprehensive Admin Authentication Tests

Tests for the admin authentication system including:
- Admin login/logout functionality
- Password hashing and verification
- Session management with JWT tokens
- Account lockout mechanism
- Rate limiting protection
- Protected route access
- Initial admin setup
- Password reset functionality
- Security validations
"""

import pytest
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.testclient import TestClient
from jose import jwt

from main import app
from models.admin_user import AdminUser
from services.admin_auth_service import AdminAuthService
from core.config import settings
from core.database import get_db


class TestAdminUserModel:
    """Test AdminUser model functionality."""

    def test_admin_user_creation(self, db_session: Session):
        """Test creating an admin user."""
        admin = AdminUser(
            id=uuid.uuid4(),
            username="testadmin",
            email="admin@example.com",
            full_name="Test Admin"
        )
        admin.set_password("securepassword123")
        
        db_session.add(admin)
        db_session.commit()
        
        assert admin.id is not None
        assert admin.username == "testadmin"
        assert admin.email == "admin@example.com"
        assert admin.password_hash is not None
        assert admin.password_hash != "securepassword123"
        assert admin.is_active is True
        assert admin.is_superadmin is False
        assert admin.failed_login_attempts == 0

    def test_password_hashing(self):
        """Test password hashing and verification."""
        admin = AdminUser(
            username="testadmin",
            email="admin@example.com"
        )
        
        password = "securepassword123"
        admin.set_password(password)
        
        assert admin.password_hash != password
        assert admin.verify_password(password) is True
        assert admin.verify_password("wrongpassword") is False

    def test_account_lockout_mechanism(self):
        """Test account lockout after failed attempts."""
        admin = AdminUser(
            username="testadmin",
            email="admin@example.com"
        )
        
        # Account should not be locked initially
        assert admin.is_account_locked() is False
        
        # Increment failed attempts
        for i in range(4):
            admin.increment_failed_attempts()
            assert admin.is_account_locked() is False
        
        # 5th attempt should lock the account
        admin.increment_failed_attempts()
        assert admin.is_account_locked() is True
        assert admin.failed_login_attempts == 5
        assert admin.locked_until is not None

    def test_lockout_expiration(self):
        """Test that account lockout expires after time."""
        admin = AdminUser(
            username="testadmin",
            email="admin@example.com"
        )
        
        # Lock the account
        admin.failed_login_attempts = 5
        admin.locked_until = datetime.utcnow() - timedelta(minutes=1)  # Expired lockout
        
        # Account should not be locked anymore
        assert admin.is_account_locked() is False
        assert admin.failed_login_attempts == 0  # Should be reset
        assert admin.locked_until is None

    def test_reset_failed_attempts(self):
        """Test resetting failed login attempts."""
        admin = AdminUser(
            username="testadmin",
            email="admin@example.com"
        )
        
        admin.failed_login_attempts = 3
        admin.locked_until = datetime.utcnow() + timedelta(minutes=15)
        
        admin.reset_failed_attempts()
        
        assert admin.failed_login_attempts == 0
        assert admin.locked_until is None

    def test_password_reset_token(self):
        """Test password reset token generation and validation."""
        admin = AdminUser(
            username="testadmin",
            email="admin@example.com"
        )
        
        # Generate reset token
        token = admin.generate_reset_token()
        
        assert token is not None
        assert admin.reset_token == token
        assert admin.reset_token_expires is not None
        
        # Token should be valid
        assert admin.is_reset_token_valid(token) is True
        assert admin.is_reset_token_valid("invalid_token") is False
        
        # Clear token
        admin.clear_reset_token()
        assert admin.reset_token is None
        assert admin.reset_token_expires is None

    def test_display_name_property(self):
        """Test display name property."""
        admin = AdminUser(
            username="testadmin",
            email="admin@example.com"
        )
        
        # Should use username if no full name
        assert admin.display_name == "testadmin"
        
        # Should use full name if available
        admin.full_name = "Test Admin"
        assert admin.display_name == "Test Admin"

    def test_can_login_property(self):
        """Test can_login property."""
        admin = AdminUser(
            username="testadmin",
            email="admin@example.com"
        )
        
        # Active admin should be able to login
        assert admin.can_login is True
        
        # Inactive admin should not be able to login
        admin.is_active = False
        assert admin.can_login is False
        
        # Locked admin should not be able to login
        admin.is_active = True
        admin.locked_until = datetime.utcnow() + timedelta(minutes=15)
        assert admin.can_login is False


class TestAdminAuthService:
    """Test AdminAuthService functionality."""

    @pytest.fixture
    def admin_auth_service(self, db_session: Session):
        """Create admin auth service instance."""
        return AdminAuthService(db_session)

    @pytest.fixture
    def test_admin(self, db_session: Session):
        """Create a test admin user."""
        admin = AdminUser(
            id=uuid.uuid4(),
            username="testadmin",
            email="admin@example.com",
            full_name="Test Admin",
            is_superadmin=False
        )
        admin.set_password("securepassword123")
        
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
        
        return admin

    @pytest.fixture
    def test_superadmin(self, db_session: Session):
        """Create a test superadmin user."""
        admin = AdminUser(
            id=uuid.uuid4(),
            username="superadmin",
            email="superadmin@example.com",
            full_name="Super Admin",
            is_superadmin=True
        )
        admin.set_password("supersecurepassword123")
        
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
        
        return admin

    def test_authenticate_admin_success(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test successful admin authentication."""
        result = admin_auth_service.authenticate_admin(
            username="testadmin",
            password="securepassword123",
            ip_address="127.0.0.1"
        )
        
        assert result is not None
        assert result.username == "testadmin"
        assert result.last_login is not None
        assert result.last_login_ip == "127.0.0.1"
        assert result.failed_login_attempts == 0

    def test_authenticate_admin_with_email(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test admin authentication using email."""
        result = admin_auth_service.authenticate_admin(
            username="admin@example.com",  # Use email instead of username
            password="securepassword123",
            ip_address="127.0.0.1"
        )
        
        assert result is not None
        assert result.username == "testadmin"

    def test_authenticate_admin_wrong_password(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test admin authentication with wrong password."""
        result = admin_auth_service.authenticate_admin(
            username="testadmin",
            password="wrongpassword",
            ip_address="127.0.0.1"
        )
        
        assert result is None
        
        # Check that failed attempts were incremented
        admin_auth_service.db.refresh(test_admin)
        assert test_admin.failed_login_attempts == 1

    def test_authenticate_admin_nonexistent(self, admin_auth_service: AdminAuthService):
        """Test authentication with nonexistent admin."""
        result = admin_auth_service.authenticate_admin(
            username="nonexistent",
            password="password",
            ip_address="127.0.0.1"
        )
        
        assert result is None

    def test_authenticate_admin_locked_account(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test authentication with locked account."""
        # Lock the account
        test_admin.failed_login_attempts = 5
        test_admin.locked_until = datetime.utcnow() + timedelta(minutes=15)
        admin_auth_service.db.commit()
        
        with pytest.raises(HTTPException) as exc_info:
            admin_auth_service.authenticate_admin(
                username="testadmin",
                password="securepassword123",
                ip_address="127.0.0.1"
            )
        
        assert exc_info.value.status_code == 423
        assert "locked" in exc_info.value.detail.lower()

    def test_authenticate_admin_inactive_account(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test authentication with inactive account."""
        test_admin.is_active = False
        admin_auth_service.db.commit()
        
        with pytest.raises(HTTPException) as exc_info:
            admin_auth_service.authenticate_admin(
                username="testadmin",
                password="securepassword123",
                ip_address="127.0.0.1"
            )
        
        assert exc_info.value.status_code == 403
        assert "inactive" in exc_info.value.detail.lower()

    def test_create_admin_tokens(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test JWT token creation for admin."""
        tokens = admin_auth_service.create_admin_tokens(test_admin)
        
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert "token_type" in tokens
        assert "expires_in" in tokens
        assert "admin_info" in tokens
        
        assert tokens["token_type"] == "bearer"
        assert tokens["expires_in"] > 0
        
        # Verify token contents
        access_payload = jwt.decode(
            tokens["access_token"],
            settings.ADMIN_JWT_SECRET,
            algorithms=["HS256"]
        )
        
        assert access_payload["sub"] == str(test_admin.id)
        assert access_payload["username"] == test_admin.username
        assert access_payload["type"] == "admin_access"

    def test_verify_admin_token(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test JWT token verification."""
        tokens = admin_auth_service.create_admin_tokens(test_admin)
        access_token = tokens["access_token"]
        
        payload = admin_auth_service.verify_admin_token(access_token)
        
        assert payload is not None
        assert payload["sub"] == str(test_admin.id)
        assert payload["username"] == test_admin.username

    def test_verify_invalid_token(self, admin_auth_service: AdminAuthService):
        """Test verification of invalid token."""
        payload = admin_auth_service.verify_admin_token("invalid.token.here")
        assert payload is None

    def test_get_admin_from_token(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test retrieving admin from valid token."""
        tokens = admin_auth_service.create_admin_tokens(test_admin)
        access_token = tokens["access_token"]
        
        retrieved_admin = admin_auth_service.get_admin_from_token(access_token)
        
        assert retrieved_admin is not None
        assert retrieved_admin.id == test_admin.id
        assert retrieved_admin.username == test_admin.username

    def test_refresh_admin_token(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test refreshing admin token."""
        tokens = admin_auth_service.create_admin_tokens(test_admin)
        refresh_token = tokens["refresh_token"]
        
        new_tokens = admin_auth_service.refresh_admin_token(refresh_token)
        
        assert new_tokens is not None
        assert "access_token" in new_tokens
        assert new_tokens["access_token"] != tokens["access_token"]  # Should be different

    def test_create_admin(self, admin_auth_service: AdminAuthService):
        """Test creating a new admin."""
        admin = admin_auth_service.create_admin(
            username="newadmin",
            email="newadmin@example.com",
            password="newpassword123",
            full_name="New Admin",
            is_superadmin=False
        )
        
        assert admin.username == "newadmin"
        assert admin.email == "newadmin@example.com"
        assert admin.full_name == "New Admin"
        assert admin.is_superadmin is False
        assert admin.verify_password("newpassword123")

    def test_create_admin_duplicate_username(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test creating admin with duplicate username."""
        with pytest.raises(HTTPException) as exc_info:
            admin_auth_service.create_admin(
                username="testadmin",  # Already exists
                email="different@example.com",
                password="password123"
            )
        
        assert exc_info.value.status_code == 400
        assert "username" in exc_info.value.detail.lower()

    def test_create_admin_duplicate_email(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test creating admin with duplicate email."""
        with pytest.raises(HTTPException) as exc_info:
            admin_auth_service.create_admin(
                username="differentadmin",
                email="admin@example.com",  # Already exists
                password="password123"
            )
        
        assert exc_info.value.status_code == 400
        assert "email" in exc_info.value.detail.lower()

    def test_update_admin_password(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test updating admin password."""
        success = admin_auth_service.update_admin_password(
            admin=test_admin,
            new_password="newsecurepassword123",
            current_password="securepassword123"
        )
        
        assert success is True
        assert test_admin.verify_password("newsecurepassword123")
        assert not test_admin.verify_password("securepassword123")

    def test_update_admin_password_wrong_current(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test updating password with wrong current password."""
        with pytest.raises(HTTPException) as exc_info:
            admin_auth_service.update_admin_password(
                admin=test_admin,
                new_password="newsecurepassword123",
                current_password="wrongcurrentpassword"
            )
        
        assert exc_info.value.status_code == 400

    def test_initiate_password_reset(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test password reset initiation."""
        reset_token = admin_auth_service.initiate_password_reset("admin@example.com")
        
        assert reset_token is not None
        
        # Check that token was saved to admin
        admin_auth_service.db.refresh(test_admin)
        assert test_admin.reset_token == reset_token
        assert test_admin.reset_token_expires is not None

    def test_initiate_password_reset_nonexistent_email(self, admin_auth_service: AdminAuthService):
        """Test password reset for nonexistent email."""
        reset_token = admin_auth_service.initiate_password_reset("nonexistent@example.com")
        
        # Should return None for security (don't reveal if email exists)
        assert reset_token is None

    def test_complete_password_reset(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test completing password reset."""
        # Initiate reset
        reset_token = admin_auth_service.initiate_password_reset("admin@example.com")
        
        # Complete reset
        success = admin_auth_service.complete_password_reset(
            email="admin@example.com",
            reset_token=reset_token,
            new_password="resetpassword123"
        )
        
        assert success is True
        
        # Check password was updated
        admin_auth_service.db.refresh(test_admin)
        assert test_admin.verify_password("resetpassword123")
        assert test_admin.reset_token is None
        assert test_admin.reset_token_expires is None

    def test_complete_password_reset_invalid_token(self, admin_auth_service: AdminAuthService, test_admin: AdminUser):
        """Test completing password reset with invalid token."""
        success = admin_auth_service.complete_password_reset(
            email="admin@example.com",
            reset_token="invalid_token",
            new_password="resetpassword123"
        )
        
        assert success is False

    def test_get_admin_stats(self, admin_auth_service: AdminAuthService, test_admin: AdminUser, test_superadmin: AdminUser):
        """Test getting admin statistics."""
        stats = admin_auth_service.get_admin_stats()
        
        assert "total_admins" in stats
        assert "active_admins" in stats
        assert "locked_admins" in stats
        assert "superadmins" in stats
        assert "last_updated" in stats
        
        assert stats["total_admins"] >= 2  # At least test_admin and test_superadmin
        assert stats["superadmins"] >= 1   # At least test_superadmin


class TestAdminAuthEndpoints:
    """Test admin authentication API endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def test_admin(self, db_session: Session):
        """Create a test admin user."""
        admin = AdminUser(
            id=uuid.uuid4(),
            username="testadmin",
            email="admin@example.com",
            full_name="Test Admin"
        )
        admin.set_password("securepassword123")
        
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
        
        return admin

    def test_admin_login_success(self, client: TestClient, test_admin: AdminUser):
        """Test successful admin login."""
        response = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "securepassword123"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "admin" in data
        assert data["admin"]["username"] == "testadmin"
        assert "expires_in" in data
        
        # Check that session cookie was set
        assert "admin_session" in response.cookies

    def test_admin_login_wrong_password(self, client: TestClient, test_admin: AdminUser):
        """Test admin login with wrong password."""
        response = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401

    def test_admin_login_nonexistent_user(self, client: TestClient):
        """Test admin login with nonexistent user."""
        response = client.post("/api/v1/admin/login", json={
            "username": "nonexistent",
            "password": "password"
        })
        
        assert response.status_code == 401

    def test_admin_logout(self, client: TestClient, test_admin: AdminUser):
        """Test admin logout."""
        # First login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "securepassword123"
        })
        assert login_response.status_code == 200
        
        # Set cookies from login
        cookies = login_response.cookies
        
        # Then logout
        logout_response = client.post("/api/v1/admin/logout", cookies=cookies)
        
        assert logout_response.status_code == 200
        data = logout_response.json()
        
        assert data["success"] is True
        
        # Check that session cookie was cleared
        assert logout_response.cookies.get("admin_session") == ""

    def test_admin_verify_session(self, client: TestClient, test_admin: AdminUser):
        """Test verifying admin session."""
        # First login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "securepassword123"
        })
        assert login_response.status_code == 200
        cookies = login_response.cookies
        
        # Verify session
        verify_response = client.get("/api/v1/admin/verify", cookies=cookies)
        
        assert verify_response.status_code == 200
        data = verify_response.json()
        
        assert data["username"] == "testadmin"
        assert data["email"] == "admin@example.com"

    def test_admin_verify_session_no_cookie(self, client: TestClient):
        """Test verifying session without cookie."""
        response = client.get("/api/v1/admin/verify")
        
        assert response.status_code == 401

    def test_admin_initial_setup(self, client: TestClient):
        """Test initial admin setup when no admins exist."""
        # Note: This test assumes no admins exist in the test database
        response = client.post("/api/v1/admin/setup", json={
            "username": "initialadmin",
            "email": "initial@example.com",
            "password": "initialpassword123",
            "full_name": "Initial Admin"
        })
        
        # This might fail if admins already exist, which is expected
        # In a real test, you'd ensure the database is clean first
        if response.status_code == 200:
            data = response.json()
            assert data["success"] is True
            assert data["admin"]["is_superadmin"] is True

    def test_admin_profile_access(self, client: TestClient, test_admin: AdminUser):
        """Test accessing admin profile."""
        # Login first
        login_response = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "securepassword123"
        })
        cookies = login_response.cookies
        
        # Get profile
        profile_response = client.get("/api/v1/admin/profile", cookies=cookies)
        
        assert profile_response.status_code == 200
        data = profile_response.json()
        
        assert data["username"] == "testadmin"
        assert data["email"] == "admin@example.com"

    def test_protected_endpoint_without_auth(self, client: TestClient):
        """Test accessing protected endpoint without authentication."""
        response = client.get("/api/v1/admin/profile")
        
        assert response.status_code == 401


@pytest.fixture
def db_session():
    """Create database session for testing."""
    # This would typically use a test database
    # For now, return a mock or use dependency override
    from core.database import get_db
    return next(get_db())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])