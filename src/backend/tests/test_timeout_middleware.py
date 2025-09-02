"""
Test Timeout Middleware
Verifies server-side request timeout behavior
"""

import asyncio
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app
from middleware.timeout_middleware import TimeoutConfig, TimeoutMiddleware


class TestTimeoutConfiguration:
    """Test timeout configuration"""

    def test_default_timeout(self):
        """Test default timeout value"""
        assert TimeoutConfig.DEFAULT == 30.0

    def test_fast_endpoints(self):
        """Test fast endpoint timeouts"""
        assert TimeoutConfig.get_timeout("/health") == 5.0
        assert TimeoutConfig.get_timeout("/api/v1/health") == 5.0
        assert TimeoutConfig.get_timeout("/api/v1/auth/me") == 10.0

    def test_standard_endpoints(self):
        """Test standard endpoint timeouts"""
        assert TimeoutConfig.get_timeout("/api/v1/campaigns") == 20.0
        assert TimeoutConfig.get_timeout("/api/v1/analytics") == 25.0

    def test_slow_endpoints(self):
        """Test slow endpoint timeouts"""
        assert TimeoutConfig.get_timeout("/api/v1/reports") == 60.0
        assert TimeoutConfig.get_timeout("/api/v1/upload") == 120.0

    def test_external_endpoints(self):
        """Test external API proxy timeouts"""
        assert TimeoutConfig.get_timeout("/api/v1/meta/campaigns") == 45.0
        assert TimeoutConfig.get_timeout("/api/v1/google/ads") == 45.0

    def test_unknown_endpoint(self):
        """Test unknown endpoint gets default timeout"""
        assert TimeoutConfig.get_timeout("/api/v1/unknown") == 30.0


@pytest.mark.asyncio
class TestTimeoutMiddleware:
    """Test timeout middleware behavior"""

    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)

    async def test_fast_endpoint_success(self):
        """Test fast endpoint completes within timeout"""
        response = self.client.get("/health")

        assert response.status_code == 200
        assert "X-Request-Duration" in response.headers
        assert "X-Timeout-Limit" in response.headers
        assert float(response.headers["X-Timeout-Limit"]) == 5.0

    async def test_timeout_error_response(self):
        """Test timeout error response format"""
        # Use test endpoint with long delay
        response = self.client.post(
            "/api/v1/timeout/test-timeout/35",
            headers={"Authorization": "Bearer test-token"},
        )

        # Should timeout (30s limit)
        assert response.status_code == 504
        assert response.json()["detail"] == "Request timeout"
        assert "X-Timeout-Error" in response.headers

    async def test_websocket_bypass(self):
        """Test WebSocket connections bypass timeout"""
        # WebSocket connections should not be affected by timeout middleware
        # This is tested by checking the middleware logic
        middleware = TimeoutMiddleware(MagicMock())

        # Mock request with WebSocket path
        mock_request = MagicMock()
        mock_request.url.path = "/ws/analytics"

        # Should call next without timeout
        mock_call_next = MagicMock()
        await middleware.dispatch(mock_request, mock_call_next)

        mock_call_next.assert_called_once_with(mock_request)

    async def test_timeout_statistics(self):
        """Test timeout statistics tracking"""
        middleware = TimeoutMiddleware(MagicMock())

        # Track some requests
        middleware._track_request("/api/v1/test", 5.0, "success")
        middleware._track_request("/api/v1/test", 7.0, "success")
        middleware._track_request("/api/v1/test", 35.0, "timeout")

        stats = middleware.get_stats("/api/v1/test")

        assert stats["count"] == 3
        assert stats["timeouts"] == 1
        assert stats["avg_duration"] == pytest.approx(15.67, 0.01)
        assert stats["timeout_rate"] == pytest.approx(0.33, 0.01)

    async def test_slow_endpoints_detection(self):
        """Test detection of slow endpoints"""
        middleware = TimeoutMiddleware(MagicMock())

        # Track requests with varying durations
        middleware._track_request("/api/v1/slow", 15.0, "success")
        middleware._track_request("/api/v1/slow", 20.0, "success")
        middleware._track_request("/api/v1/fast", 2.0, "success")
        middleware._track_request("/api/v1/fast", 3.0, "success")

        slow_endpoints = middleware.get_slow_endpoints(threshold=10.0)

        assert len(slow_endpoints) == 1
        assert slow_endpoints[0]["path"] == "/api/v1/slow"
        assert slow_endpoints[0]["avg_duration"] == 17.5

    async def test_response_headers(self):
        """Test response headers are set correctly"""
        response = self.client.get("/api/v1/health")

        # Check timeout-related headers
        assert "X-Request-Duration" in response.headers
        assert "X-Timeout-Limit" in response.headers

        duration = float(response.headers["X-Request-Duration"])
        limit = float(response.headers["X-Timeout-Limit"])

        assert duration < limit
        assert limit == 5.0  # Health endpoint timeout


@pytest.mark.asyncio
class TestTimeoutStatsAPI:
    """Test timeout statistics API endpoints"""

    def setup_method(self):
        """Setup test client"""
        self.client = TestClient(app)
        self.headers = {"Authorization": "Bearer test-token"}

    @patch("api.v1.endpoints.timeout_stats.get_current_active_user")
    async def test_get_timeout_stats(self, mock_auth):
        """Test getting timeout statistics"""
        mock_auth.return_value = MagicMock(id=1)

        response = self.client.get(
            "/api/v1/timeout/timeout-stats", headers=self.headers
        )

        assert response.status_code in [200, 503]  # 503 if middleware not initialized

    @patch("api.v1.endpoints.timeout_stats.get_current_active_user")
    async def test_get_slow_endpoints(self, mock_auth):
        """Test getting slow endpoints"""
        mock_auth.return_value = MagicMock(id=1)

        response = self.client.get(
            "/api/v1/timeout/slow-endpoints?threshold=5.0", headers=self.headers
        )

        assert response.status_code in [200, 503]

    @patch("api.v1.endpoints.timeout_stats.get_current_active_user")
    async def test_get_timeout_config(self, mock_auth):
        """Test getting timeout configuration"""
        mock_auth.return_value = MagicMock(id=1)

        response = self.client.get(
            "/api/v1/timeout/timeout-config", headers=self.headers
        )

        assert response.status_code == 200

        config = response.json()
        assert "default" in config
        assert "fast" in config
        assert "standard" in config
        assert "slow" in config
        assert "external" in config

        assert config["default"] == 30.0
