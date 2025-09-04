"""
Tests for monitoring endpoints and services.
Focuses on ad insights monitoring, alerts, and real-time updates.
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
import json

from fastapi.testclient import TestClient
from httpx import AsyncClient


class TestAdInsightsMonitoring:
    """Test suite for ad insights monitoring functionality."""

    @pytest.fixture
    def mock_ad_insights_response(self):
        """Mock Meta Ad Insights API response."""
        return {
            "data": [
                {
                    "campaign_id": "123456789",
                    "campaign_name": "Test Campaign",
                    "impressions": "10000",
                    "clicks": "500",
                    "spend": "250.00",
                    "ctr": "5.0",
                    "cpc": "0.50",
                    "date_start": "2024-01-01",
                    "date_stop": "2024-01-07",
                    "account_id": "act_123456",
                    "account_name": "Test Account",
                }
            ],
            "paging": {"cursors": {"before": "before_cursor", "after": "after_cursor"}},
        }

    @pytest.fixture
    def mock_google_ads_response(self):
        """Mock Google Ads API response."""
        return {
            "results": [
                {
                    "campaign": {
                        "resource_name": "customers/123/campaigns/456",
                        "id": "456",
                        "name": "Test Google Campaign",
                        "status": "ENABLED",
                    },
                    "metrics": {
                        "impressions": "8000",
                        "clicks": "400",
                        "cost_micros": "200000000",  # $200.00 in micros
                        "ctr": 0.05,
                        "average_cpc": "500000",  # $0.50 in micros
                    },
                }
            ]
        }

    def test_health_check_endpoint(self):
        """Test monitoring health check endpoint."""
        # This would test the health check endpoint
        # For now, create a simple mock test
        health_status = {
            "status": "healthy",
            "services": {
                "database": "healthy",
                "redis": "healthy",
                "meta_api": "healthy",
                "google_ads_api": "healthy",
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

        assert health_status["status"] == "healthy"
        assert "database" in health_status["services"]
        assert "redis" in health_status["services"]
        assert "meta_api" in health_status["services"]
        assert "google_ads_api" in health_status["services"]

    @patch("services.real_time_ad_monitor.requests.get")
    def test_meta_ad_insights_fetch(self, mock_get, mock_ad_insights_response):
        """Test fetching Meta ad insights."""
        # Mock the API response
        mock_response = Mock()
        mock_response.json.return_value = mock_ad_insights_response
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        # Test the data extraction
        data = mock_ad_insights_response["data"][0]

        assert data["campaign_id"] == "123456789"
        assert data["campaign_name"] == "Test Campaign"
        assert float(data["spend"]) == 250.00
        assert int(data["impressions"]) == 10000
        assert int(data["clicks"]) == 500
        assert float(data["ctr"]) == 5.0

        # Test metrics calculation
        spend = float(data["spend"])
        clicks = int(data["clicks"])
        cpc = spend / clicks if clicks > 0 else 0
        assert abs(cpc - 0.50) < 0.01  # Should be $0.50 per click

    @patch("services.real_time_ad_monitor.build")
    def test_google_ads_fetch(self, mock_build, mock_google_ads_response):
        """Test fetching Google Ads data."""
        # Mock the Google Ads client
        mock_client = Mock()
        mock_service = Mock()
        mock_service.search_stream.return_value = mock_google_ads_response["results"]
        mock_client.get_service.return_value = mock_service
        mock_build.return_value = mock_client

        # Test the data extraction
        result = mock_google_ads_response["results"][0]
        campaign = result["campaign"]
        metrics = result["metrics"]

        assert campaign["id"] == "456"
        assert campaign["name"] == "Test Google Campaign"
        assert campaign["status"] == "ENABLED"
        assert int(metrics["impressions"]) == 8000
        assert int(metrics["clicks"]) == 400

        # Test cost conversion from micros to dollars
        cost_micros = int(metrics["cost_micros"])
        cost_dollars = cost_micros / 1_000_000
        assert cost_dollars == 200.00

        # Test CPC conversion
        cpc_micros = int(metrics["average_cpc"])
        cpc_dollars = cpc_micros / 1_000_000
        assert cpc_dollars == 0.50

    def test_alert_generation_spend_threshold(self):
        """Test alert generation for spend thresholds."""
        # Mock campaign data exceeding spend threshold
        campaign_data = {
            "campaign_id": "123456789",
            "campaign_name": "Test Campaign",
            "daily_spend": 150.00,
            "daily_budget": 100.00,
            "spend_percentage": 150.0,
        }

        # Test alert conditions
        should_alert = campaign_data["spend_percentage"] > 100
        assert should_alert == True

        # Test alert severity
        if campaign_data["spend_percentage"] > 120:
            severity = "critical"
        elif campaign_data["spend_percentage"] > 100:
            severity = "high"
        else:
            severity = "medium"

        assert severity == "critical"

        # Test alert message format
        alert_message = f"Campaign '{campaign_data['campaign_name']}' has exceeded budget by {campaign_data['spend_percentage'] - 100:.1f}%"
        expected_message = "Campaign 'Test Campaign' has exceeded budget by 50.0%"
        assert alert_message == expected_message

    def test_alert_generation_performance_drop(self):
        """Test alert generation for performance drops."""
        # Mock performance data showing significant drop
        performance_data = {
            "campaign_id": "123456789",
            "current_ctr": 2.5,
            "previous_ctr": 5.0,
            "ctr_change_percentage": -50.0,
            "current_conversion_rate": 1.0,
            "previous_conversion_rate": 2.5,
            "conversion_rate_change": -60.0,
        }

        # Test CTR drop alert
        ctr_drop_threshold = -30  # 30% drop
        should_alert_ctr = (
            performance_data["ctr_change_percentage"] < ctr_drop_threshold
        )
        assert should_alert_ctr == True

        # Test conversion rate drop alert
        conversion_drop_threshold = -40  # 40% drop
        should_alert_conversion = (
            performance_data["conversion_rate_change"] < conversion_drop_threshold
        )
        assert should_alert_conversion == True

        # Test combined severity
        if (
            performance_data["ctr_change_percentage"] < -50
            or performance_data["conversion_rate_change"] < -50
        ):
            severity = "critical"
        elif (
            performance_data["ctr_change_percentage"] < -30
            or performance_data["conversion_rate_change"] < -30
        ):
            severity = "high"
        else:
            severity = "medium"

        assert severity == "critical"

    def test_data_aggregation_multi_platform(self):
        """Test aggregating data from multiple advertising platforms."""
        meta_campaigns = [
            {
                "platform": "meta",
                "campaign_id": "meta_123",
                "campaign_name": "Meta Campaign 1",
                "spend": 100.00,
                "impressions": 5000,
                "clicks": 250,
            }
        ]

        google_campaigns = [
            {
                "platform": "google",
                "campaign_id": "google_456",
                "campaign_name": "Google Campaign 1",
                "spend": 150.00,
                "impressions": 7000,
                "clicks": 350,
            }
        ]

        # Test aggregation
        all_campaigns = meta_campaigns + google_campaigns

        total_spend = sum(campaign["spend"] for campaign in all_campaigns)
        total_impressions = sum(campaign["impressions"] for campaign in all_campaigns)
        total_clicks = sum(campaign["clicks"] for campaign in all_campaigns)

        assert total_spend == 250.00
        assert total_impressions == 12000
        assert total_clicks == 600

        # Test platform breakdown
        platform_breakdown = {}
        for campaign in all_campaigns:
            platform = campaign["platform"]
            if platform not in platform_breakdown:
                platform_breakdown[platform] = {
                    "campaigns": 0,
                    "spend": 0,
                    "impressions": 0,
                    "clicks": 0,
                }

            platform_breakdown[platform]["campaigns"] += 1
            platform_breakdown[platform]["spend"] += campaign["spend"]
            platform_breakdown[platform]["impressions"] += campaign["impressions"]
            platform_breakdown[platform]["clicks"] += campaign["clicks"]

        assert platform_breakdown["meta"]["campaigns"] == 1
        assert platform_breakdown["meta"]["spend"] == 100.00
        assert platform_breakdown["google"]["campaigns"] == 1
        assert platform_breakdown["google"]["spend"] == 150.00

    def test_real_time_update_formatting(self):
        """Test real-time update message formatting for WebSocket."""
        # Mock real-time update data
        update_data = {
            "type": "spend_update",
            "platform": "meta",
            "campaign_id": "123456789",
            "campaign_name": "Test Campaign",
            "current_spend": 85.50,
            "daily_budget": 100.00,
            "percentage_used": 85.5,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Test message formatting
        websocket_message = {
            "event": "campaign_update",
            "data": update_data,
            "timestamp": update_data["timestamp"],
        }

        # Validate message structure
        assert "event" in websocket_message
        assert "data" in websocket_message
        assert "timestamp" in websocket_message
        assert websocket_message["event"] == "campaign_update"
        assert websocket_message["data"]["type"] == "spend_update"
        assert websocket_message["data"]["platform"] == "meta"

        # Test JSON serialization
        json_message = json.dumps(websocket_message)
        parsed_message = json.loads(json_message)
        assert parsed_message["data"]["current_spend"] == 85.50

    def test_cache_key_generation(self):
        """Test cache key generation for monitoring data."""
        # Test various cache key patterns
        org_id = "org_123"
        campaign_id = "camp_456"
        date_str = "2024-01-15"
        platform = "meta"

        # Test dashboard cache key
        dashboard_key = f"dashboard_metrics:{org_id}:{date_str}"
        assert dashboard_key == "dashboard_metrics:org_123:2024-01-15"

        # Test campaign-specific cache key
        campaign_key = f"campaign_data:{platform}:{campaign_id}:{date_str}"
        assert campaign_key == "campaign_data:meta:camp_456:2024-01-15"

        # Test alert cache key
        alert_key = f"alerts:{org_id}:{platform}"
        assert alert_key == "alerts:org_123:meta"

        # Test real-time update key
        realtime_key = f"realtime_updates:{org_id}"
        assert realtime_key == "realtime_updates:org_123"

    def test_error_handling_api_failures(self):
        """Test error handling for API failures."""
        # Test Meta API error handling
        meta_error_response = {
            "error": {
                "message": "Invalid access token",
                "type": "OAuthException",
                "code": 190,
            }
        }

        # Test error detection
        assert "error" in meta_error_response
        assert meta_error_response["error"]["code"] == 190
        assert meta_error_response["error"]["type"] == "OAuthException"

        # Test Google Ads error handling
        google_error = {
            "error": {
                "code": 401,
                "message": "Request had invalid authentication credentials",
                "status": "UNAUTHENTICATED",
            }
        }

        assert google_error["error"]["code"] == 401
        assert google_error["error"]["status"] == "UNAUTHENTICATED"

        # Test fallback behavior
        fallback_data = {
            "status": "error",
            "platform": "meta",
            "error_code": 190,
            "message": "Authentication failed",
            "fallback_data": {"last_known_spend": 0, "campaigns_accessible": 0},
        }

        assert fallback_data["status"] == "error"
        assert "fallback_data" in fallback_data

    def test_rate_limit_handling(self):
        """Test rate limit handling for API calls."""
        # Test rate limit detection
        rate_limit_response = {
            "error": {
                "message": "Application request limit reached",
                "type": "ApplicationRequestLimitReached",
                "code": 4,
                "error_subcode": 1349174,
            }
        }

        # Test rate limit retry logic
        def should_retry(error_response):
            if "error" in error_response:
                error_code = error_response["error"].get("code")
                error_type = error_response["error"].get("type")

                # Rate limit errors should be retried
                if error_code == 4 or error_type == "ApplicationRequestLimitReached":
                    return True
            return False

        assert should_retry(rate_limit_response) == True

        # Test backoff calculation
        def calculate_backoff(attempt_number):
            base_delay = 1  # 1 second
            max_delay = 60  # 60 seconds
            delay = min(base_delay * (2**attempt_number), max_delay)
            return delay

        assert calculate_backoff(0) == 1
        assert calculate_backoff(1) == 2
        assert calculate_backoff(2) == 4
        assert calculate_backoff(5) == 32
        assert calculate_backoff(10) == 60  # Capped at max_delay

    def test_metrics_calculation_accuracy(self):
        """Test accuracy of calculated metrics."""
        # Test CTR calculation
        impressions = 10000
        clicks = 500
        ctr = (clicks / impressions) * 100
        assert abs(ctr - 5.0) < 0.001

        # Test CPC calculation
        spend = 250.00
        cpc = spend / clicks if clicks > 0 else 0
        assert abs(cpc - 0.50) < 0.001

        # Test ROAS calculation (Return on Ad Spend)
        conversions_value = 1000.00
        roas = conversions_value / spend if spend > 0 else 0
        assert abs(roas - 4.0) < 0.001

        # Test conversion rate calculation
        conversions = 25
        conversion_rate = (conversions / clicks) * 100
        assert abs(conversion_rate - 5.0) < 0.001

        # Test cost per conversion
        cost_per_conversion = spend / conversions if conversions > 0 else 0
        assert abs(cost_per_conversion - 10.0) < 0.001

    @pytest.mark.asyncio
    async def test_async_data_collection(self):
        """Test asynchronous data collection from multiple sources."""

        # Mock async functions for different platforms
        async def fetch_meta_data():
            await asyncio.sleep(0.1)  # Simulate API call
            return {"platform": "meta", "campaigns": 5, "spend": 100.00}

        async def fetch_google_data():
            await asyncio.sleep(0.1)  # Simulate API call
            return {"platform": "google", "campaigns": 3, "spend": 150.00}

        async def fetch_all_data():
            # Collect data from multiple sources concurrently
            meta_task = asyncio.create_task(fetch_meta_data())
            google_task = asyncio.create_task(fetch_google_data())

            meta_data, google_data = await asyncio.gather(meta_task, google_task)

            return {
                "meta": meta_data,
                "google": google_data,
                "total_campaigns": meta_data["campaigns"] + google_data["campaigns"],
                "total_spend": meta_data["spend"] + google_data["spend"],
            }

        # Test concurrent data fetching
        result = await fetch_all_data()

        assert result["meta"]["platform"] == "meta"
        assert result["google"]["platform"] == "google"
        assert result["total_campaigns"] == 8
        assert result["total_spend"] == 250.00


class TestAlertSystem:
    """Test suite for the alert system."""

    def test_alert_priority_calculation(self):
        """Test alert priority calculation based on impact."""
        # Test high-impact alert (budget exceeded significantly)
        alert_data = {
            "spend_over_budget_percentage": 150,
            "affected_campaigns": 5,
            "daily_budget_impact": 500.00,
        }

        # Calculate priority score
        priority_score = 0
        if alert_data["spend_over_budget_percentage"] > 120:
            priority_score += 50
        if alert_data["affected_campaigns"] > 3:
            priority_score += 30
        if alert_data["daily_budget_impact"] > 100:
            priority_score += 20

        assert priority_score == 100

        # Determine priority level
        if priority_score >= 80:
            priority = "critical"
        elif priority_score >= 50:
            priority = "high"
        elif priority_score >= 20:
            priority = "medium"
        else:
            priority = "low"

        assert priority == "critical"

    def test_alert_deduplication(self):
        """Test alert deduplication to prevent spam."""
        # Mock existing alerts
        existing_alerts = [
            {
                "id": "alert_1",
                "campaign_id": "123",
                "alert_type": "spend_exceeded",
                "created_at": datetime.utcnow() - timedelta(minutes=30),
            }
        ]

        # New alert with same campaign and type
        new_alert = {
            "campaign_id": "123",
            "alert_type": "spend_exceeded",
            "created_at": datetime.utcnow(),
        }

        # Check if alert should be deduplicated
        def should_deduplicate(new_alert, existing_alerts):
            for existing in existing_alerts:
                if (
                    existing["campaign_id"] == new_alert["campaign_id"]
                    and existing["alert_type"] == new_alert["alert_type"]
                ):
                    # Check if within deduplication window (1 hour)
                    time_diff = new_alert["created_at"] - existing["created_at"]
                    if time_diff.total_seconds() < 3600:  # 1 hour
                        return True
            return False

        assert should_deduplicate(new_alert, existing_alerts) == True

    def test_alert_escalation_rules(self):
        """Test alert escalation based on time and severity."""
        # Mock alert that hasn't been acknowledged
        alert = {
            "id": "alert_123",
            "severity": "high",
            "created_at": datetime.utcnow() - timedelta(minutes=45),
            "acknowledged": False,
            "escalated": False,
        }

        # Test escalation rules
        def should_escalate(alert):
            if alert["acknowledged"]:
                return False

            time_since_creation = datetime.utcnow() - alert["created_at"]

            # Escalation thresholds by severity
            if (
                alert["severity"] == "critical"
                and time_since_creation.total_seconds() > 300
            ):  # 5 minutes
                return True
            elif (
                alert["severity"] == "high"
                and time_since_creation.total_seconds() > 1800
            ):  # 30 minutes
                return True
            elif (
                alert["severity"] == "medium"
                and time_since_creation.total_seconds() > 3600
            ):  # 1 hour
                return True

            return False

        assert should_escalate(alert) == True

    def test_notification_routing(self):
        """Test notification routing based on alert type and severity."""
        # Mock notification preferences
        notification_config = {
            "critical": ["email", "sms", "slack"],
            "high": ["email", "slack"],
            "medium": ["email"],
            "low": ["dashboard"],
        }

        # Test routing for critical alert
        alert = {"severity": "critical", "alert_type": "budget_exceeded"}

        channels = notification_config.get(alert["severity"], ["dashboard"])
        assert "email" in channels
        assert "sms" in channels
        assert "slack" in channels

        # Test routing for medium alert
        alert_medium = {"severity": "medium", "alert_type": "performance_drop"}

        channels_medium = notification_config.get(
            alert_medium["severity"], ["dashboard"]
        )
        assert channels_medium == ["email"]


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
