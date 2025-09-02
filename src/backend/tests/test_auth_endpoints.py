"""
Comprehensive test suite for authentication endpoints.
Tests: login, register, logout, token refresh, password reset, email verification
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
import json
from unittest.mock import Mock, patch

from models.user import User
from models.organization import Organization
from core.security import verify_password, get_password_hash


class TestAuthEndpoints:
    """Test suite for authentication endpoints."""

    @pytest.mark.asyncio
    async def test_login_success(
        self,
        test_client: AsyncClient,
        test_db_session: AsyncSession,
        test_org: Organization,
    ):
        """Test successful login with valid credentials."""
        # Create a user with known password
        password = "TestPassword123!"
        user = User(
            email="login@example.com",
            full_name="Login Test User",
            hashed_password=get_password_hash(password),
            org_id=test_org.id,
            role="user",
            permissions=["analytics.view"],
            is_active=True,
            is_verified=True,
        )
        test_db_session.add(user)
        await test_db_session.commit()

        # Attempt login
        response = await test_client.post(
            "/api/v1/auth/login",
            data={
                "username": "login@example.com",
                "password": password,
                "grant_type": "password",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data

        # Verify user data
        assert data["user"]["email"] == "login@example.com"
        assert data["user"]["full_name"] == "Login Test User"
        assert data["user"]["role"] == "user"
        assert data["user"]["is_active"] is True

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(
        self,
        test_client: AsyncClient,
        test_db_session: AsyncSession,
        test_org: Organization,
    ):
        """Test login with invalid credentials."""
        # Create a user
        user = User(
            email="invalid@example.com",
            full_name="Test User",
            hashed_password=get_password_hash("CorrectPassword123!"),
            org_id=test_org.id,
            role="user",
            is_active=True,
            is_verified=True,
        )
        test_db_session.add(user)
        await test_db_session.commit()

        # Attempt login with wrong password
        response = await test_client.post(
            "/api/v1/auth/login",
            data={
                "username": "invalid@example.com",
                "password": "WrongPassword123!",
                "grant_type": "password",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"

    @pytest.mark.asyncio
    async def test_login_inactive_user(
        self,
        test_client: AsyncClient,
        test_db_session: AsyncSession,
        test_org: Organization,
    ):
        """Test login with inactive user account."""
        password = "TestPassword123!"
        user = User(
            email="inactive@example.com",
            full_name="Inactive User",
            hashed_password=get_password_hash(password),
            org_id=test_org.id,
            role="user",
            is_active=False,  # Inactive user
            is_verified=True,
        )
        test_db_session.add(user)
        await test_db_session.commit()

        response = await test_client.post(
            "/api/v1/auth/login",
            data={
                "username": "inactive@example.com",
                "password": password,
                "grant_type": "password",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Account is inactive"

    @pytest.mark.asyncio
    async def test_login_unverified_email(
        self,
        test_client: AsyncClient,
        test_db_session: AsyncSession,
        test_org: Organization,
    ):
        """Test login with unverified email."""
        password = "TestPassword123!"
        user = User(
            email="unverified@example.com",
            full_name="Unverified User",
            hashed_password=get_password_hash(password),
            org_id=test_org.id,
            role="user",
            is_active=True,
            is_verified=False,  # Email not verified
        )
        test_db_session.add(user)
        await test_db_session.commit()

        response = await test_client.post(
            "/api/v1/auth/login",
            data={
                "username": "unverified@example.com",
                "password": password,
                "grant_type": "password",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 403
        assert response.json()["detail"] == "Email not verified"

    @pytest.mark.asyncio
    async def test_register_success(
        self,
        test_client: AsyncClient,
        test_org: Organization,
        mock_posthog,
    ):
        """Test successful user registration."""
        with patch("app.services.email_service.send_verification_email") as mock_email:
            response = await test_client.post(
                "/api/v1/auth/register",
                json={
                    "email": "newuser@example.com",
                    "password": "SecurePassword123!",
                    "first_name": "New",
                    "last_name": "User",
                    "username": "newuser",
                    "phone": "555-123-4567",
                },
            )

        assert response.status_code == 201
        data = response.json()

        # Verify user data
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert data["first_name"] == "New"
        assert data["last_name"] == "User"
        assert data["full_name"] == "New User"
        assert data["is_active"] is True
        assert data["is_verified"] is False

        # Verify email was sent
        mock_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        test_client: AsyncClient,
        test_db_session: AsyncSession,
        test_org: Organization,
    ):
        """Test registration with existing email."""
        # Create existing user
        existing_user = User(
            email="existing@example.com",
            full_name="Existing User",
            hashed_password=get_password_hash("Password123!"),
            org_id=test_org.id,
            role="user",
        )
        test_db_session.add(existing_user)
        await test_db_session.commit()

        # Try to register with same email
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": "existing@example.com",
                "password": "NewPassword123!",
                "first_name": "New",
                "last_name": "User",
                "username": "newusername",
            },
        )

        assert response.status_code == 409
        assert response.json()["detail"] == "Email already registered"

    @pytest.mark.asyncio
    async def test_register_invalid_password(
        self,
        test_client: AsyncClient,
    ):
        """Test registration with weak password."""
        response = await test_client.post(
            "/api/v1/auth/register",
            json={
                "email": "weak@example.com",
                "password": "weak",  # Too short
                "first_name": "Weak",
                "last_name": "Password",
                "username": "weakpass",
            },
        )

        assert response.status_code == 422
        error = response.json()["detail"][0]
        assert "password" in error["loc"]
        assert "at least 8 characters" in error["msg"]

    @pytest.mark.asyncio
    async def test_logout_success(
        self,
        test_client: AsyncClient,
        auth_headers: dict,
    ):
        """Test successful logout."""
        response = await test_client.post(
            "/api/v1/auth/logout",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"

    @pytest.mark.asyncio
    async def test_logout_all_devices(
        self,
        test_client: AsyncClient,
        auth_headers: dict,
        test_cache_service,
    ):
        """Test logout from all devices."""
        response = await test_client.post(
            "/api/v1/auth/logout-all",
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out from all devices"

    @pytest.mark.asyncio
    async def test_refresh_token(
        self,
        test_client: AsyncClient,
        test_user: User,
    ):
        """Test token refresh endpoint."""
        # First login to get tokens
        login_response = await test_client.post(
            "/api/v1/auth/login",
            data={
                "username": test_user.email,
                "password": "test_password",  # This would need proper setup
                "grant_type": "password",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # For this test, we'll mock the refresh token validation
        with patch("app.core.security.verify_refresh_token") as mock_verify:
            mock_verify.return_value = {
                "sub": test_user.email,
                "user_id": test_user.id,
                "type": "refresh",
            }

            response = await test_client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "mock-refresh-token"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_get_current_user(
        self,
        test_client: AsyncClient,
        auth_headers: dict,
        test_user: User,
    ):
        """Test getting current user profile."""
        response = await test_client.get(
            "/api/v1/auth/me",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id
        assert data["role"] == test_user.role

    @pytest.mark.asyncio
    async def test_forgot_password(
        self,
        test_client: AsyncClient,
        test_user: User,
    ):
        """Test forgot password endpoint."""
        with patch(
            "app.services.email_service.send_password_reset_email"
        ) as mock_email:
            response = await test_client.post(
                "/api/v1/auth/forgot-password",
                json={"email": test_user.email},
            )

        assert response.status_code == 200
        assert response.json()["message"] == "Password reset email sent"
        mock_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_forgot_password_nonexistent_email(
        self,
        test_client: AsyncClient,
    ):
        """Test forgot password with non-existent email."""
        response = await test_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"},
        )

        # Should return success to prevent email enumeration
        assert response.status_code == 200
        assert response.json()["message"] == "Password reset email sent"

    @pytest.mark.asyncio
    async def test_reset_password(
        self,
        test_client: AsyncClient,
        test_user: User,
    ):
        """Test password reset with valid token."""
        with patch("app.core.security.verify_password_reset_token") as mock_verify:
            mock_verify.return_value = test_user.email

            response = await test_client.post(
                "/api/v1/auth/reset-password",
                json={
                    "token": "valid-reset-token",
                    "new_password": "NewSecurePassword123!",
                },
            )

        assert response.status_code == 200
        assert response.json()["message"] == "Password reset successful"

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(
        self,
        test_client: AsyncClient,
    ):
        """Test password reset with invalid token."""
        with patch("app.core.security.verify_password_reset_token") as mock_verify:
            mock_verify.return_value = None

            response = await test_client.post(
                "/api/v1/auth/reset-password",
                json={
                    "token": "invalid-token",
                    "new_password": "NewSecurePassword123!",
                },
            )

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired reset token"

    @pytest.mark.asyncio
    async def test_change_password(
        self,
        test_client: AsyncClient,
        auth_headers: dict,
        test_user: User,
        test_db_session: AsyncSession,
    ):
        """Test changing password for authenticated user."""
        # Set up user with known password
        old_password = "OldPassword123!"
        test_user.hashed_password = get_password_hash(old_password)
        await test_db_session.commit()

        response = await test_client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": old_password,
                "new_password": "NewSecurePassword123!",
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(
        self,
        test_client: AsyncClient,
        auth_headers: dict,
        test_user: User,
        test_db_session: AsyncSession,
    ):
        """Test changing password with wrong current password."""
        test_user.hashed_password = get_password_hash("CorrectPassword123!")
        await test_db_session.commit()

        response = await test_client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "WrongPassword123!",
                "new_password": "NewPassword123!",
            },
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Incorrect password"

    @pytest.mark.asyncio
    async def test_verify_email(
        self,
        test_client: AsyncClient,
        test_db_session: AsyncSession,
        test_org: Organization,
    ):
        """Test email verification endpoint."""
        # Create unverified user
        user = User(
            email="unverified@example.com",
            full_name="Unverified User",
            hashed_password=get_password_hash("Password123!"),
            org_id=test_org.id,
            is_verified=False,
            verification_token="valid-verification-token",
        )
        test_db_session.add(user)
        await test_db_session.commit()

        with patch("app.core.security.verify_email_token") as mock_verify:
            mock_verify.return_value = user.email

            response = await test_client.post(
                "/api/v1/auth/verify-email/valid-verification-token"
            )

        assert response.status_code == 200
        assert response.json()["message"] == "Email verified successfully"

        # Check user is now verified
        await test_db_session.refresh(user)
        assert user.is_verified is True

    @pytest.mark.asyncio
    async def test_verify_email_invalid_token(
        self,
        test_client: AsyncClient,
    ):
        """Test email verification with invalid token."""
        with patch("app.core.security.verify_email_token") as mock_verify:
            mock_verify.return_value = None

            response = await test_client.post("/api/v1/auth/verify-email/invalid-token")

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired verification token"

    @pytest.mark.asyncio
    async def test_resend_verification_email(
        self,
        test_client: AsyncClient,
        test_db_session: AsyncSession,
        test_org: Organization,
    ):
        """Test resending verification email."""
        # Create unverified user
        user = User(
            email="resend@example.com",
            full_name="Resend User",
            hashed_password=get_password_hash("Password123!"),
            org_id=test_org.id,
            is_verified=False,
        )
        test_db_session.add(user)
        await test_db_session.commit()

        with patch("app.services.email_service.send_verification_email") as mock_email:
            # Need to be authenticated as the user
            with patch("app.api.v1.dependencies.auth.get_current_user") as mock_auth:
                mock_auth.return_value = user

                response = await test_client.post(
                    "/api/v1/auth/resend-verification",
                    headers={"Authorization": "Bearer mock-token"},
                )

        assert response.status_code == 200
        assert response.json()["message"] == "Verification email sent"
        mock_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_rate_limiting(
        self,
        test_client: AsyncClient,
        test_cache_service,
    ):
        """Test rate limiting on login endpoint."""
        # Make multiple rapid requests
        for i in range(6):  # Assuming rate limit is 5 per minute
            response = await test_client.post(
                "/api/v1/auth/login",
                data={
                    "username": f"test{i}@example.com",
                    "password": "password",
                    "grant_type": "password",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if i < 5:
                # First 5 should work (even if credentials are wrong)
                assert response.status_code in [401, 404]
            else:
                # 6th should be rate limited
                assert response.status_code == 429
                assert "Too many requests" in response.json()["detail"]
