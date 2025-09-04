"""
Unit tests for analytics API endpoints.
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from httpx import AsyncClient

from schemas.analytics import DateRangeEnum


class TestAnalyticsEndpoints:
    """Test suite for analytics API endpoints."""

    @pytest.mark.asyncio
    async def test_get_dashboard_success(
        self,
        test_client: AsyncClient,
        auth_headers,
        sample_analytics_data,
    ):
        """Test successful dashboard data retrieval."""
        with patch("app.api.v1.endpoints.analytics.AnalyticsService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.get_dashboard_overview = AsyncMock(
                return_value=Mock(dict=lambda: sample_analytics_data)
            )

            # Make request
            response = await test_client.get(
                "/api/v1/analytics/dashboard?date_range=last_30_days",
                headers=auth_headers,
            )

            # Verify response
            assert response.status_code == 200
            data = response.json()
            assert "overview" in data
            assert "metrics" in data
            assert "charts" in data

    @pytest.mark.asyncio
    async def test_get_dashboard_unauthorized(self, test_client: AsyncClient):
        """Test dashboard access without authentication."""
        response = await test_client.get("/api/v1/analytics/dashboard")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_dashboard_forbidden(
        self,
        test_client: AsyncClient,
        test_user,
        test_token,
    ):
        """Test dashboard access without required permission."""
        # Create token without analytics.view permission
        from core.security import create_access_token

        token = create_access_token(
            data={
                "sub": test_user.email,
                "user_id": test_user.id,
                "org_id": test_user.org_id,
                "role": "member",
                "permissions": [],  # No analytics.view
            }
        )
        headers = {"Authorization": f"Bearer {token}"}

        response = await test_client.get("/api/v1/analytics/dashboard", headers=headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_volunteer_metrics(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test volunteer metrics endpoint."""
        with patch("app.api.v1.endpoints.analytics.AnalyticsService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.get_volunteer_metrics = AsyncMock(
                return_value={
                    "total": 100,
                    "active": 80,
                    "new_this_month": 15,
                }
            )

            response = await test_client.get(
                "/api/v1/analytics/volunteers?date_range=last_30_days",
                headers=auth_headers,
            )

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 100
            assert data["active"] == 80

    @pytest.mark.asyncio
    async def test_get_event_metrics(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test event metrics endpoint."""
        with patch("app.api.v1.endpoints.analytics.AnalyticsService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.get_event_metrics = AsyncMock(
                return_value={
                    "total": 50,
                    "upcoming": 10,
                    "total_attendance": 2500,
                }
            )

            response = await test_client.get(
                "/api/v1/analytics/events", headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 50

    @pytest.mark.asyncio
    async def test_get_donation_metrics(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test donation metrics endpoint."""
        with patch("app.api.v1.endpoints.analytics.AnalyticsService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.get_donation_metrics = AsyncMock(
                return_value={
                    "total_amount": 50000.0,
                    "donor_count": 200,
                    "average_donation": 250.0,
                }
            )

            response = await test_client.get(
                "/api/v1/analytics/donations", headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["total_amount"] == 50000.0

    @pytest.mark.asyncio
    async def test_export_dashboard_csv(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test dashboard export to CSV."""
        with patch("app.api.v1.endpoints.analytics.ExportService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.export_dashboard_data = AsyncMock(
                return_value={
                    "job_id": "export-123",
                    "status": "processing",
                    "format": "csv",
                }
            )

            response = await test_client.post(
                "/api/v1/analytics/export",
                headers=auth_headers,
                json={
                    "date_range": "last_30_days",
                    "format": "csv",
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["job_id"] == "export-123"
            assert data["format"] == "csv"

    @pytest.mark.asyncio
    async def test_export_dashboard_pdf(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test dashboard export to PDF."""
        with patch("app.api.v1.endpoints.analytics.ExportService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.export_dashboard_data = AsyncMock(
                return_value={
                    "job_id": "export-456",
                    "status": "processing",
                    "format": "pdf",
                }
            )

            response = await test_client.post(
                "/api/v1/analytics/export",
                headers=auth_headers,
                json={
                    "date_range": "last_90_days",
                    "format": "pdf",
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["format"] == "pdf"

    @pytest.mark.asyncio
    async def test_export_without_permission(
        self,
        test_client: AsyncClient,
        test_user,
    ):
        """Test export without required permission."""
        # Create token without analytics.export permission
        from core.security import create_access_token

        token = create_access_token(
            data={
                "sub": test_user.email,
                "user_id": test_user.id,
                "org_id": test_user.org_id,
                "role": "member",
                "permissions": ["analytics.view"],  # Has view but not export
            }
        )
        headers = {"Authorization": f"Bearer {token}"}

        response = await test_client.post(
            "/api/v1/analytics/export",
            headers=headers,
            json={"date_range": "last_30_days", "format": "csv"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_export_status(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test getting export job status."""
        job_id = "export-789"

        with patch("app.api.v1.endpoints.analytics.ExportService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.get_export_status = AsyncMock(
                return_value={
                    "job_id": job_id,
                    "status": "completed",
                    "format": "csv",
                    "download_url": "https://example.com/export.csv",
                }
            )

            response = await test_client.get(
                f"/api/v1/analytics/export/{job_id}", headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "completed"
            assert data["download_url"] == "https://example.com/export.csv"

    @pytest.mark.asyncio
    async def test_get_export_status_not_found(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test getting status for non-existent export job."""
        with patch("app.api.v1.endpoints.analytics.ExportService") as mock_service:
            # Mock service response
            mock_instance = mock_service.return_value
            mock_instance.get_export_status = AsyncMock(return_value=None)

            response = await test_client.get(
                "/api/v1/analytics/export/nonexistent", headers=auth_headers
            )

            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_invalid_date_range(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test invalid date range parameter."""
        response = await test_client.get(
            "/api/v1/analytics/dashboard?date_range=invalid", headers=auth_headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_rate_limiting(
        self,
        test_client: AsyncClient,
        auth_headers,
    ):
        """Test rate limiting on analytics endpoints."""
        # This would test rate limiting if implemented
        # For now, just verify endpoints are accessible
        endpoints = [
            "/api/v1/analytics/dashboard",
            "/api/v1/analytics/volunteers",
            "/api/v1/analytics/events",
            "/api/v1/analytics/donations",
        ]

        for endpoint in endpoints:
            response = await test_client.get(
                f"{endpoint}?date_range=last_30_days", headers=auth_headers
            )
            assert response.status_code in [200, 429]  # 429 if rate limited
