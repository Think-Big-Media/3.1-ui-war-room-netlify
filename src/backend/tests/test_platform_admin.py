"""
Unit tests for platform admin functionality.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from httpx import AsyncClient

from models.platform_admin import FeatureFlag, PlatformAuditLog
from schemas.platform_admin import FeatureFlagCreate, FeatureFlagUpdate


class TestPlatformAdminEndpoints:
    """Test suite for platform admin API endpoints."""

    @pytest.fixture
    def platform_admin_headers(self, test_user):
        """Create headers with platform admin permission."""
        from core.security import create_access_token

        token = create_access_token(
            data={
                "sub": test_user.email,
                "user_id": test_user.id,
                "org_id": test_user.org_id,
                "role": "platform_admin",
                "permissions": ["platform.admin", "analytics.view"],
            }
        )
        return {"Authorization": f"Bearer {token}"}

    @pytest.mark.asyncio
    async def test_get_dashboard_success(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        sample_platform_admin_data,
    ):
        """Test platform admin dashboard retrieval."""
        with patch(
            "app.api.v1.endpoints.platform_admin.get_platform_metrics"
        ) as mock_metrics:
            mock_metrics.return_value = sample_platform_admin_data

            response = await test_client.get(
                "/api/v1/platform-admin/dashboard", headers=platform_admin_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "system_health" in data
            assert "usage_metrics" in data
            assert "feature_flags" in data

    @pytest.mark.asyncio
    async def test_get_dashboard_forbidden(
        self,
        test_client: AsyncClient,
        auth_headers,  # Regular user headers
    ):
        """Test platform admin dashboard access denied."""
        response = await test_client.get(
            "/api/v1/platform-admin/dashboard", headers=auth_headers
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_organizations(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_org,
    ):
        """Test listing organizations."""
        response = await test_client.get(
            "/api/v1/platform-admin/organizations", headers=platform_admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(org["id"] == test_org.id for org in data)

    @pytest.mark.asyncio
    async def test_get_organization_details(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_org,
    ):
        """Test getting organization details."""
        response = await test_client.get(
            f"/api/v1/platform-admin/organizations/{test_org.id}",
            headers=platform_admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_org.id
        assert data["name"] == test_org.name

    @pytest.mark.asyncio
    async def test_update_organization(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_org,
    ):
        """Test updating organization."""
        update_data = {
            "name": "Updated Campaign Name",
            "subscription_tier": "enterprise",
            "is_active": True,
        }

        response = await test_client.put(
            f"/api/v1/platform-admin/organizations/{test_org.id}",
            headers=platform_admin_headers,
            json=update_data,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["subscription_tier"] == update_data["subscription_tier"]

    @pytest.mark.asyncio
    async def test_create_feature_flag(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_db_session,
    ):
        """Test creating a feature flag."""
        flag_data = {
            "name": "new-feature",
            "description": "Test new feature",
            "enabled": True,
            "rollout_percentage": 50,
            "targeting_rules": {
                "organizations": ["org-1", "org-2"],
            },
        }

        response = await test_client.post(
            "/api/v1/platform-admin/feature-flags",
            headers=platform_admin_headers,
            json=flag_data,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == flag_data["name"]
        assert data["enabled"] == flag_data["enabled"]
        assert data["rollout_percentage"] == flag_data["rollout_percentage"]

    @pytest.mark.asyncio
    async def test_list_feature_flags(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_db_session,
    ):
        """Test listing feature flags."""
        # Create test flags
        for i in range(3):
            flag = FeatureFlag(
                name=f"test-flag-{i}",
                description=f"Test flag {i}",
                enabled=i % 2 == 0,
                rollout_percentage=100,
                created_by="test-user",
            )
            test_db_session.add(flag)
        await test_db_session.commit()

        response = await test_client.get(
            "/api/v1/platform-admin/feature-flags", headers=platform_admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3

    @pytest.mark.asyncio
    async def test_update_feature_flag(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_db_session,
    ):
        """Test updating a feature flag."""
        # Create flag
        flag = FeatureFlag(
            name="update-test-flag",
            description="Flag to update",
            enabled=False,
            rollout_percentage=0,
            created_by="test-user",
        )
        test_db_session.add(flag)
        await test_db_session.commit()
        await test_db_session.refresh(flag)

        # Update flag
        update_data = {
            "enabled": True,
            "rollout_percentage": 75,
            "description": "Updated description",
        }

        response = await test_client.put(
            f"/api/v1/platform-admin/feature-flags/{flag.id}",
            headers=platform_admin_headers,
            json=update_data,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["enabled"] == True
        assert data["rollout_percentage"] == 75
        assert data["description"] == "Updated description"

    @pytest.mark.asyncio
    async def test_delete_feature_flag(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_db_session,
    ):
        """Test deleting a feature flag."""
        # Create flag
        flag = FeatureFlag(
            name="delete-test-flag",
            description="Flag to delete",
            enabled=True,
            rollout_percentage=100,
            created_by="test-user",
        )
        test_db_session.add(flag)
        await test_db_session.commit()
        await test_db_session.refresh(flag)

        # Delete flag
        response = await test_client.delete(
            f"/api/v1/platform-admin/feature-flags/{flag.id}",
            headers=platform_admin_headers,
        )

        assert response.status_code == 204

        # Verify deletion
        response = await test_client.get(
            f"/api/v1/platform-admin/feature-flags/{flag.id}",
            headers=platform_admin_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_audit_logs(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_db_session,
        test_user,
        test_org,
    ):
        """Test retrieving audit logs."""
        # Create test audit logs
        for i in range(5):
            log = PlatformAuditLog(
                user_id=test_user.id,
                org_id=test_org.id,
                action=f"test.action.{i}",
                resource_type="test_resource",
                resource_id=f"resource-{i}",
                details={"test": f"data-{i}"},
                ip_address="127.0.0.1",
                user_agent="test-agent",
            )
            test_db_session.add(log)
        await test_db_session.commit()

        response = await test_client.get(
            "/api/v1/platform-admin/audit-logs", headers=platform_admin_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 5

    @pytest.mark.asyncio
    async def test_audit_logs_filtering(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        test_db_session,
        test_user,
        test_org,
    ):
        """Test audit logs filtering."""
        # Create logs with different actions
        actions = ["user.login", "user.logout", "org.update"]
        for action in actions:
            log = PlatformAuditLog(
                user_id=test_user.id,
                org_id=test_org.id,
                action=action,
                resource_type="user",
                resource_id=test_user.id,
                details={},
                ip_address="127.0.0.1",
                user_agent="test-agent",
            )
            test_db_session.add(log)
        await test_db_session.commit()

        # Filter by action
        response = await test_client.get(
            "/api/v1/platform-admin/audit-logs?action=user.login",
            headers=platform_admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert all(log["action"] == "user.login" for log in data)

    @pytest.mark.asyncio
    async def test_posthog_event_tracking(
        self,
        test_client: AsyncClient,
        platform_admin_headers,
        mock_posthog,
    ):
        """Test PostHog event tracking."""
        with patch("app.services.posthog.analytics", mock_posthog):
            # Make a platform admin action
            response = await test_client.get(
                "/api/v1/platform-admin/dashboard", headers=platform_admin_headers
            )

            assert response.status_code == 200
            # Verify PostHog was called
            assert mock_posthog.capture.called

    @pytest.mark.asyncio
    async def test_feature_flag_evaluation(
        self,
        test_db_session,
        test_org,
        mock_posthog,
    ):
        """Test feature flag evaluation logic."""
        from services.feature_flags import FeatureFlagService

        # Create service
        service = FeatureFlagService()
        service.posthog = mock_posthog

        # Create flag with targeting
        flag = FeatureFlag(
            name="targeted-flag",
            description="Flag with targeting",
            enabled=True,
            rollout_percentage=100,
            targeting_rules={
                "organizations": [test_org.id],
            },
            created_by="test-user",
        )
        test_db_session.add(flag)
        await test_db_session.commit()

        # Test evaluation
        # Should be enabled for targeted org
        is_enabled = await service.is_enabled(
            "targeted-flag", test_org.id, test_db_session
        )
        assert is_enabled

        # Should be disabled for non-targeted org
        is_enabled = await service.is_enabled(
            "targeted-flag", "other-org-id", test_db_session
        )
        assert not is_enabled
