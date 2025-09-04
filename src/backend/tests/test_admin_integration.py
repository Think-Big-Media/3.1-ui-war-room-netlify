"""
Admin Authentication Integration Tests

End-to-end tests for the admin authentication system including:
- Complete login flow with frontend integration
- Dashboard access and functionality
- Configuration management
- User management operations
- Session timeout handling
- Concurrent session management
- Security features validation
- API integration tests
"""

import pytest
import uuid
import asyncio
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from main import app
from models.admin_user import AdminUser
from models.user import User
from core.database import get_db


class TestCompleteAdminFlow:
    """Test complete admin authentication and usage flows."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)

    @pytest.fixture
    def test_admin(self, db_session: Session):
        """Create a test admin user."""
        admin = AdminUser(
            id=uuid.uuid4(),
            username="integrationadmin",
            email="integration@example.com",
            full_name="Integration Test Admin"
        )
        admin.set_password("integration123")
        
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
        
        return admin

    @pytest.fixture
    def test_superadmin(self, db_session: Session):
        """Create a test superadmin user."""
        admin = AdminUser(
            id=uuid.uuid4(),
            username="integrationsuper",
            email="superintegration@example.com",
            full_name="Integration Super Admin",
            is_superadmin=True
        )
        admin.set_password("superintegration123")
        
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)
        
        return admin

    @pytest.fixture
    def test_users(self, db_session: Session):
        """Create test users for management operations."""
        users = []
        for i in range(5):
            user = User(
                id=uuid.uuid4(),
                email=f"testuser{i}@example.com",
                full_name=f"Test User {i}",
                role="user",
                is_active=True,
                is_verified=True
            )
            users.append(user)
            db_session.add(user)
        
        db_session.commit()
        return users

    def test_complete_login_flow(self, client: TestClient, test_admin: AdminUser):
        """Test complete login flow from start to dashboard access."""
        
        # Step 1: Attempt to access protected resource (should fail)
        dashboard_response = client.get("/api/v1/admin/dashboard")
        assert dashboard_response.status_code == 401
        
        # Step 2: Login with credentials
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        assert login_data["success"] is True
        assert login_data["admin"]["username"] == "integrationadmin"
        assert "expires_in" in login_data
        
        # Extract cookies
        cookies = login_response.cookies
        assert "admin_session" in cookies
        
        # Step 3: Verify session
        verify_response = client.get("/api/v1/admin/verify", cookies=cookies)
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["username"] == "integrationadmin"
        
        # Step 4: Access dashboard with valid session
        dashboard_response = client.get("/api/v1/admin/dashboard", cookies=cookies)
        assert dashboard_response.status_code == 200
        dashboard_data = dashboard_response.json()
        
        assert "total_users" in dashboard_data
        assert "database_status" in dashboard_data
        
        # Step 5: Access profile
        profile_response = client.get("/api/v1/admin/profile", cookies=cookies)
        assert profile_response.status_code == 200
        
        # Step 6: Logout
        logout_response = client.post("/api/v1/admin/logout", cookies=cookies)
        assert logout_response.status_code == 200
        
        # Step 7: Verify session is invalid after logout
        verify_after_logout = client.get("/api/v1/admin/verify", cookies=cookies)
        assert verify_after_logout.status_code == 401

    def test_dashboard_functionality(self, client: TestClient, test_admin: AdminUser, test_users):
        """Test dashboard functionality and data retrieval."""
        
        # Login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        cookies = login_response.cookies
        
        # Test dashboard stats
        dashboard_response = client.get("/api/v1/admin/dashboard", cookies=cookies)
        assert dashboard_response.status_code == 200
        dashboard_data = dashboard_response.json()
        
        assert dashboard_data["total_users"] >= len(test_users)
        assert dashboard_data["database_status"] in ["healthy", "degraded", "unhealthy"]
        
        # Test user list access
        users_response = client.get("/api/v1/admin/users?limit=10", cookies=cookies)
        assert users_response.status_code == 200
        users_data = users_response.json()
        
        assert isinstance(users_data, list)
        if users_data:  # If users exist
            assert "email" in users_data[0]
            assert "role" in users_data[0]
        
        # Test health check
        health_response = client.get("/api/v1/admin/health", cookies=cookies)
        assert health_response.status_code == 200
        health_data = health_response.json()
        
        assert "status" in health_data
        assert "components" in health_data
        assert "overall_health" in health_data

    def test_superadmin_exclusive_features(self, client: TestClient, test_admin: AdminUser, test_superadmin: AdminUser):
        """Test features that require superadmin access."""
        
        # Login as regular admin
        admin_login = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        admin_cookies = admin_login.cookies
        
        # Login as superadmin
        super_login = client.post("/api/v1/admin/login", json={
            "username": "integrationsuper",
            "password": "superintegration123"
        })
        super_cookies = super_login.cookies
        
        # Test system config access (superadmin only)
        config_response_admin = client.get("/api/v1/admin/config", cookies=admin_cookies)
        assert config_response_admin.status_code == 403  # Should be forbidden for regular admin
        
        config_response_super = client.get("/api/v1/admin/config", cookies=super_cookies)
        assert config_response_super.status_code == 200
        config_data = config_response_super.json()
        
        assert "app_name" in config_data
        assert "environment" in config_data
        assert "features" in config_data
        
        # Test admin activity access (superadmin only)
        activity_response_admin = client.get("/api/v1/admin/activity", cookies=admin_cookies)
        assert activity_response_admin.status_code == 403
        
        activity_response_super = client.get("/api/v1/admin/activity", cookies=super_cookies)
        assert activity_response_super.status_code == 200
        
        # Test admin users list (superadmin only)
        admins_response_admin = client.get("/api/v1/admin/admins", cookies=admin_cookies)
        assert admins_response_admin.status_code == 403
        
        admins_response_super = client.get("/api/v1/admin/admins", cookies=super_cookies)
        assert admins_response_super.status_code == 200
        admins_data = admins_response_super.json()
        
        assert isinstance(admins_data, list)
        assert len(admins_data) >= 2  # Should include both test admins

    def test_user_management_operations(self, client: TestClient, test_admin: AdminUser, test_users):
        """Test user management operations."""
        
        # Login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        cookies = login_response.cookies
        
        # Test user list with pagination
        users_response = client.get("/api/v1/admin/users?skip=0&limit=3", cookies=cookies)
        assert users_response.status_code == 200
        users_data = users_response.json()
        
        assert len(users_data) <= 3
        
        # Test user list with search
        search_response = client.get("/api/v1/admin/users?search=testuser1", cookies=cookies)
        assert search_response.status_code == 200
        search_data = search_response.json()
        
        # Should find the user with testuser1 in email
        matching_users = [u for u in search_data if "testuser1" in u["email"]]
        assert len(matching_users) > 0
        
        # Test user list with active filter
        active_response = client.get("/api/v1/admin/users?active_only=true", cookies=cookies)
        assert active_response.status_code == 200
        active_data = active_response.json()
        
        # All returned users should be active
        for user in active_data:
            assert user["is_active"] is True

    def test_session_timeout_handling(self, client: TestClient, test_admin: AdminUser):
        """Test session timeout and expiration handling."""
        
        # Login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        cookies = login_response.cookies
        
        # Verify session works initially
        verify_response = client.get("/api/v1/admin/verify", cookies=cookies)
        assert verify_response.status_code == 200
        
        # Mock expired token by manipulating the JWT
        with patch('services.admin_auth_service.AdminAuthService.verify_admin_token') as mock_verify:
            mock_verify.return_value = None  # Simulate expired/invalid token
            
            expired_response = client.get("/api/v1/admin/verify", cookies=cookies)
            assert expired_response.status_code == 401

    def test_concurrent_admin_sessions(self, client: TestClient, test_admin: AdminUser):
        """Test handling of concurrent admin sessions."""
        
        def create_session():
            """Create an admin session."""
            login_response = client.post("/api/v1/admin/login", json={
                "username": "integrationadmin",
                "password": "integration123"
            })
            
            if login_response.status_code == 200:
                cookies = login_response.cookies
                verify_response = client.get("/api/v1/admin/verify", cookies=cookies)
                return verify_response.status_code == 200
            return False
        
        # Test multiple concurrent logins
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(create_session) for _ in range(3)]
            results = [future.result() for future in futures]
        
        # All sessions should be valid (the system allows multiple sessions)
        assert all(results)

    def test_account_lockout_integration(self, client: TestClient, test_admin: AdminUser):
        """Test account lockout mechanism in integration context."""
        
        # Make multiple failed login attempts
        for i in range(5):
            response = client.post("/api/v1/admin/login", json={
                "username": "integrationadmin",
                "password": "wrongpassword"
            })
            
            if i < 4:
                assert response.status_code == 401
            else:
                # 5th attempt should lock the account
                assert response.status_code == 423  # Account locked
        
        # Verify that even correct password fails when locked
        locked_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"  # Correct password
        })
        
        assert locked_response.status_code == 423
        
        # Simulate lockout expiration by directly modifying the admin
        from core.database import get_db
        db = next(get_db())
        admin = db.query(AdminUser).filter(AdminUser.username == "integrationadmin").first()
        admin.locked_until = datetime.utcnow() - timedelta(minutes=1)  # Expired lockout
        db.commit()
        
        # Should be able to login again
        unlock_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        
        assert unlock_response.status_code == 200

    def test_password_change_flow(self, client: TestClient, test_admin: AdminUser):
        """Test password change functionality."""
        
        # Login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        cookies = login_response.cookies
        
        # Change password
        change_response = client.put("/api/v1/admin/change-password", 
                                   json={
                                       "current_password": "integration123",
                                       "new_password": "newintegration456"
                                   }, 
                                   cookies=cookies)
        
        assert change_response.status_code == 200
        change_data = change_response.json()
        assert change_data["success"] is True
        
        # Logout
        client.post("/api/v1/admin/logout", cookies=cookies)
        
        # Try to login with old password (should fail)
        old_login = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        assert old_login.status_code == 401
        
        # Login with new password (should succeed)
        new_login = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "newintegration456"
        })
        assert new_login.status_code == 200

    def test_profile_management(self, client: TestClient, test_admin: AdminUser):
        """Test admin profile management."""
        
        # Login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        cookies = login_response.cookies
        
        # Get current profile
        profile_response = client.get("/api/v1/admin/profile", cookies=cookies)
        assert profile_response.status_code == 200
        profile_data = profile_response.json()
        
        original_full_name = profile_data["full_name"]
        
        # Update profile
        update_response = client.put("/api/v1/admin/profile", 
                                   json={
                                       "full_name": "Updated Integration Admin",
                                       "email": "updated.integration@example.com"
                                   }, 
                                   cookies=cookies)
        
        assert update_response.status_code == 200
        update_data = update_response.json()
        
        assert update_data["success"] is True
        assert update_data["admin"]["full_name"] == "Updated Integration Admin"
        assert update_data["admin"]["email"] == "updated.integration@example.com"
        
        # Verify profile was actually updated
        updated_profile_response = client.get("/api/v1/admin/profile", cookies=cookies)
        assert updated_profile_response.status_code == 200
        updated_profile_data = updated_profile_response.json()
        
        assert updated_profile_data["full_name"] == "Updated Integration Admin"
        assert updated_profile_data["email"] == "updated.integration@example.com"

    def test_rate_limiting(self, client: TestClient, test_admin: AdminUser):
        """Test rate limiting protection."""
        
        # Login
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        cookies = login_response.cookies
        
        # Make rapid requests to trigger rate limiting
        responses = []
        for _ in range(100):  # Make many rapid requests
            response = client.get("/api/v1/admin/dashboard", cookies=cookies)
            responses.append(response)
        
        # Some requests should succeed, but rate limiting might kick in
        # The exact behavior depends on rate limiting configuration
        success_count = sum(1 for r in responses if r.status_code == 200)
        rate_limited_count = sum(1 for r in responses if r.status_code == 429)
        
        # At least some requests should succeed
        assert success_count > 0
        
        # If rate limiting is enabled, some requests might be limited
        # This test verifies the system handles rapid requests gracefully

    def test_error_handling_and_recovery(self, client: TestClient, test_admin: AdminUser):
        """Test error handling and recovery scenarios."""
        
        # Test malformed login request
        malformed_response = client.post("/api/v1/admin/login", json={
            "username": "",  # Empty username
            "password": ""   # Empty password
        })
        assert malformed_response.status_code == 422  # Validation error
        
        # Test SQL injection attempt (should be safely handled)
        injection_response = client.post("/api/v1/admin/login", json={
            "username": "'; DROP TABLE admin_users; --",
            "password": "anything"
        })
        # Should not crash, just return auth failure
        assert injection_response.status_code in [401, 422]
        
        # Verify admin table still exists by logging in normally
        normal_login = client.post("/api/v1/admin/login", json={
            "username": "integrationadmin",
            "password": "integration123"
        })
        assert normal_login.status_code == 200

    def test_audit_logging(self, client: TestClient, test_superadmin: AdminUser):
        """Test that admin activities are properly logged."""
        
        # Login as superadmin
        login_response = client.post("/api/v1/admin/login", json={
            "username": "integrationsuper",
            "password": "superintegration123"
        })
        cookies = login_response.cookies
        
        # Perform various activities
        client.get("/api/v1/admin/dashboard", cookies=cookies)
        client.get("/api/v1/admin/users", cookies=cookies)
        client.get("/api/v1/admin/config", cookies=cookies)
        
        # Check activity logs
        activity_response = client.get("/api/v1/admin/activity?hours=1", cookies=cookies)
        assert activity_response.status_code == 200
        activity_data = activity_response.json()
        
        # Should have at least some activities recorded
        assert isinstance(activity_data, list)
        
        # Verify log entries contain expected fields
        if activity_data:
            for activity in activity_data:
                assert "admin_username" in activity
                assert "action" in activity
                assert "timestamp" in activity


@pytest.fixture
def db_session():
    """Create database session for testing."""
    from core.database import get_db
    return next(get_db())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])