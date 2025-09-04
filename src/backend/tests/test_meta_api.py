"""
Tests for Meta Business API integration.
Tests ad insights, campaign management, and real-time monitoring.
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
import json
import requests


class TestMetaBusinessAPI:
    """Test suite for Meta Business API integration."""

    @pytest.fixture
    def mock_access_token(self):
        """Mock Meta access token."""
        return "EAABwzLixnjYBAOZBZBZCZCZC..."

    @pytest.fixture
    def mock_ad_account_id(self):
        """Mock Meta ad account ID."""
        return "act_123456789"

    @pytest.fixture
    def mock_campaign_data(self):
        """Mock Meta campaign data."""
        return {
            "data": [
                {
                    "id": "123456789",
                    "name": "Test Campaign",
                    "status": "ACTIVE",
                    "objective": "CONVERSIONS",
                    "created_time": "2024-01-01T00:00:00+0000",
                    "updated_time": "2024-01-15T10:30:00+0000",
                    "start_time": "2024-01-01T00:00:00+0000",
                    "stop_time": "2024-12-31T23:59:59+0000",
                    "daily_budget": "10000",  # $100.00 in cents
                    "lifetime_budget": "100000",  # $1000.00 in cents
                    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
                }
            ],
            "paging": {"cursors": {"before": "MAZDZD", "after": "NQZDZD"}},
        }

    @pytest.fixture
    def mock_insights_data(self):
        """Mock Meta ad insights data."""
        return {
            "data": [
                {
                    "campaign_id": "123456789",
                    "campaign_name": "Test Campaign",
                    "account_id": "act_123456789",
                    "account_name": "Test Account",
                    "impressions": "15000",
                    "clicks": "750",
                    "spend": "375.50",
                    "reach": "12000",
                    "frequency": "1.25",
                    "ctr": "5.0",
                    "cpc": "0.50",
                    "cpm": "25.03",
                    "cpp": "31.29",
                    "actions": [
                        {"action_type": "purchase", "value": "45"},
                        {"action_type": "add_to_cart", "value": "120"},
                    ],
                    "action_values": [{"action_type": "purchase", "value": "2250.00"}],
                    "date_start": "2024-01-01",
                    "date_stop": "2024-01-07",
                }
            ]
        }

    def test_api_url_construction(self, mock_ad_account_id):
        """Test Meta API URL construction."""
        base_url = "https://graph.facebook.com/v19.0"

        # Test campaigns endpoint
        campaigns_url = f"{base_url}/{mock_ad_account_id}/campaigns"
        expected_campaigns_url = (
            "https://graph.facebook.com/v19.0/act_123456789/campaigns"
        )
        assert campaigns_url == expected_campaigns_url

        # Test insights endpoint
        insights_url = f"{base_url}/{mock_ad_account_id}/insights"
        expected_insights_url = (
            "https://graph.facebook.com/v19.0/act_123456789/insights"
        )
        assert insights_url == expected_insights_url

        # Test campaign-specific insights
        campaign_id = "123456789"
        campaign_insights_url = f"{base_url}/{campaign_id}/insights"
        expected_campaign_insights_url = (
            "https://graph.facebook.com/v19.0/123456789/insights"
        )
        assert campaign_insights_url == expected_campaign_insights_url

    def test_request_parameters_construction(self, mock_access_token):
        """Test Meta API request parameters."""
        # Test basic parameters
        params = {
            "access_token": mock_access_token,
            "fields": "campaign_id,campaign_name,impressions,clicks,spend,ctr,cpc",
            "date_preset": "last_7d",
            "level": "campaign",
        }

        assert params["access_token"] == mock_access_token
        assert "campaign_id" in params["fields"]
        assert "impressions" in params["fields"]
        assert params["date_preset"] == "last_7d"
        assert params["level"] == "campaign"

        # Test custom date range parameters
        custom_params = {
            "access_token": mock_access_token,
            "fields": "impressions,clicks,spend",
            "time_range": json.dumps({"since": "2024-01-01", "until": "2024-01-07"}),
            "level": "campaign",
        }

        time_range = json.loads(custom_params["time_range"])
        assert time_range["since"] == "2024-01-01"
        assert time_range["until"] == "2024-01-07"

    @patch("requests.get")
    def test_campaigns_fetch(
        self, mock_get, mock_campaign_data, mock_access_token, mock_ad_account_id
    ):
        """Test fetching campaigns from Meta API."""
        # Mock the API response
        mock_response = Mock()
        mock_response.json.return_value = mock_campaign_data
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Simulate API call
        base_url = "https://graph.facebook.com/v19.0"
        url = f"{base_url}/{mock_ad_account_id}/campaigns"
        params = {
            "access_token": mock_access_token,
            "fields": "id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget",
            "limit": 100,
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        # Verify the response
        assert "data" in data
        campaigns = data["data"]
        assert len(campaigns) == 1

        campaign = campaigns[0]
        assert campaign["id"] == "123456789"
        assert campaign["name"] == "Test Campaign"
        assert campaign["status"] == "ACTIVE"
        assert campaign["objective"] == "CONVERSIONS"

        # Test budget conversion (cents to dollars)
        daily_budget_cents = int(campaign["daily_budget"])
        daily_budget_dollars = daily_budget_cents / 100
        assert daily_budget_dollars == 100.00

        lifetime_budget_cents = int(campaign["lifetime_budget"])
        lifetime_budget_dollars = lifetime_budget_cents / 100
        assert lifetime_budget_dollars == 1000.00

    @patch("requests.get")
    def test_insights_fetch(
        self, mock_get, mock_insights_data, mock_access_token, mock_ad_account_id
    ):
        """Test fetching ad insights from Meta API."""
        # Mock the API response
        mock_response = Mock()
        mock_response.json.return_value = mock_insights_data
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Simulate API call
        base_url = "https://graph.facebook.com/v19.0"
        url = f"{base_url}/{mock_ad_account_id}/insights"
        params = {
            "access_token": mock_access_token,
            "fields": "campaign_id,campaign_name,impressions,clicks,spend,ctr,cpc,actions,action_values",
            "date_preset": "last_7d",
            "level": "campaign",
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        # Verify the response
        insights = data["data"][0]
        assert insights["campaign_id"] == "123456789"
        assert insights["campaign_name"] == "Test Campaign"
        assert float(insights["spend"]) == 375.50
        assert int(insights["impressions"]) == 15000
        assert int(insights["clicks"]) == 750
        assert float(insights["ctr"]) == 5.0
        assert float(insights["cpc"]) == 0.50

    def test_actions_processing(self, mock_insights_data):
        """Test processing of Meta actions data."""
        insights = mock_insights_data["data"][0]
        actions = insights["actions"]
        action_values = insights["action_values"]

        # Process actions into a more usable format
        actions_dict = {}
        for action in actions:
            action_type = action["action_type"]
            count = int(action["value"])
            actions_dict[action_type] = count

        assert actions_dict["purchase"] == 45
        assert actions_dict["add_to_cart"] == 120

        # Process action values
        values_dict = {}
        for value_item in action_values:
            action_type = value_item["action_type"]
            value = float(value_item["value"])
            values_dict[action_type] = value

        assert values_dict["purchase"] == 2250.00

        # Calculate ROAS (Return on Ad Spend)
        spend = float(insights["spend"])
        purchase_value = values_dict.get("purchase", 0)
        roas = purchase_value / spend if spend > 0 else 0
        assert abs(roas - 5.99) < 0.01  # Should be ~6x ROAS

    def test_error_handling(self):
        """Test Meta API error handling."""
        # Test OAuth error
        oauth_error = {
            "error": {
                "message": "Invalid OAuth access token.",
                "type": "OAuthException",
                "code": 190,
                "error_subcode": 460,
                "fbtrace_id": "Abc123def456",
            }
        }

        assert oauth_error["error"]["code"] == 190
        assert oauth_error["error"]["type"] == "OAuthException"

        # Test rate limit error
        rate_limit_error = {
            "error": {
                "message": "Application request limit reached",
                "type": "ApplicationRequestLimitReached",
                "code": 4,
                "error_subcode": 1349174,
            }
        }

        assert rate_limit_error["error"]["code"] == 4
        assert rate_limit_error["error"]["type"] == "ApplicationRequestLimitReached"

        # Test permission error
        permission_error = {
            "error": {
                "message": "Insufficient privileges to access this endpoint",
                "type": "GraphMethodException",
                "code": 100,
            }
        }

        assert permission_error["error"]["code"] == 100
        assert permission_error["error"]["type"] == "GraphMethodException"

    def test_retry_logic(self):
        """Test retry logic for transient errors."""

        def should_retry(error_response, attempt_count, max_retries=3):
            if attempt_count >= max_retries:
                return False

            if "error" in error_response:
                error_code = error_response["error"].get("code")
                error_type = error_response["error"].get("type")

                # Retry on rate limits and server errors
                retryable_codes = [4, 1, 2]  # Rate limit, temporary, server error
                retryable_types = [
                    "ApplicationRequestLimitReached",
                    "TemporaryUnavailable",
                ]

                if error_code in retryable_codes or error_type in retryable_types:
                    return True

            return False

        # Test rate limit retry
        rate_limit_error = {
            "error": {"code": 4, "type": "ApplicationRequestLimitReached"}
        }

        assert should_retry(rate_limit_error, 1) == True
        assert should_retry(rate_limit_error, 3) == False  # Max retries reached

        # Test OAuth error (should not retry)
        oauth_error = {"error": {"code": 190, "type": "OAuthException"}}

        assert should_retry(oauth_error, 1) == False

    def test_pagination_handling(self, mock_campaign_data):
        """Test handling of paginated API responses."""
        # Test pagination cursors
        paging = mock_campaign_data["paging"]
        assert "cursors" in paging
        assert "before" in paging["cursors"]
        assert "after" in paging["cursors"]

        # Test next page URL construction
        def build_next_page_url(base_url, params, after_cursor):
            next_params = params.copy()
            next_params["after"] = after_cursor
            return base_url, next_params

        base_url = "https://graph.facebook.com/v19.0/act_123456789/campaigns"
        params = {"access_token": "token", "fields": "id,name", "limit": 25}
        after_cursor = paging["cursors"]["after"]

        next_url, next_params = build_next_page_url(base_url, params, after_cursor)

        assert next_params["after"] == after_cursor
        assert next_params["limit"] == 25
        assert "access_token" in next_params

    def test_real_time_data_structure(self):
        """Test real-time data structure for WebSocket updates."""
        # Test spend update message
        spend_update = {
            "type": "spend_update",
            "platform": "meta",
            "account_id": "act_123456789",
            "campaign_id": "123456789",
            "campaign_name": "Test Campaign",
            "current_spend": 145.75,
            "daily_budget": 100.00,
            "spend_percentage": 145.75,
            "currency": "USD",
            "timestamp": datetime.utcnow().isoformat(),
            "alert_level": "high",
        }

        # Validate structure
        required_fields = [
            "type",
            "platform",
            "campaign_id",
            "campaign_name",
            "current_spend",
            "daily_budget",
            "timestamp",
        ]

        for field in required_fields:
            assert field in spend_update

        assert spend_update["platform"] == "meta"
        assert spend_update["type"] == "spend_update"
        assert spend_update["spend_percentage"] > 100  # Over budget
        assert spend_update["alert_level"] == "high"

        # Test performance update message
        performance_update = {
            "type": "performance_update",
            "platform": "meta",
            "campaign_id": "123456789",
            "metrics": {"ctr": 3.5, "cpc": 0.65, "roas": 4.2, "conversion_rate": 2.8},
            "previous_metrics": {
                "ctr": 5.0,
                "cpc": 0.50,
                "roas": 6.0,
                "conversion_rate": 4.0,
            },
            "changes": {
                "ctr_change": -30.0,
                "cpc_change": 30.0,
                "roas_change": -30.0,
                "conversion_rate_change": -30.0,
            },
            "timestamp": datetime.utcnow().isoformat(),
            "alert_level": "medium",
        }

        # Validate performance changes
        assert performance_update["changes"]["ctr_change"] < 0  # CTR decreased
        assert performance_update["changes"]["cpc_change"] > 0  # CPC increased (bad)
        assert performance_update["changes"]["roas_change"] < 0  # ROAS decreased
        assert performance_update["alert_level"] == "medium"

    def test_webhook_verification(self):
        """Test Meta webhook verification process."""

        # Test webhook challenge verification
        def verify_webhook_challenge(challenge, verify_token, expected_token):
            if verify_token == expected_token:
                return challenge
            else:
                return None

        challenge = "test_challenge_123"
        verify_token = "my_verify_token"
        expected_token = "my_verify_token"

        result = verify_webhook_challenge(challenge, verify_token, expected_token)
        assert result == challenge

        # Test with wrong token
        wrong_token = "wrong_token"
        result_wrong = verify_webhook_challenge(challenge, wrong_token, expected_token)
        assert result_wrong is None

    def test_webhook_signature_validation(self):
        """Test Meta webhook signature validation."""
        import hmac
        import hashlib

        def validate_webhook_signature(payload, signature, app_secret):
            expected_signature = hmac.new(
                app_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
            ).hexdigest()

            # Facebook sends signature with 'sha256=' prefix
            if signature.startswith("sha256="):
                signature = signature[7:]

            return hmac.compare_digest(expected_signature, signature)

        # Test webhook signature validation
        payload = '{"test": "data"}'
        app_secret = "test_app_secret"

        # Generate valid signature
        valid_signature = hmac.new(
            app_secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        assert (
            validate_webhook_signature(payload, f"sha256={valid_signature}", app_secret)
            == True
        )
        assert (
            validate_webhook_signature(payload, "sha256=invalid_signature", app_secret)
            == False
        )

    def test_data_transformation(self, mock_insights_data):
        """Test transforming Meta API data for frontend consumption."""
        insights = mock_insights_data["data"][0]

        # Transform to frontend format
        transformed_data = {
            "campaignId": insights["campaign_id"],
            "campaignName": insights["campaign_name"],
            "accountId": insights["account_id"],
            "metrics": {
                "impressions": int(insights["impressions"]),
                "clicks": int(insights["clicks"]),
                "spend": float(insights["spend"]),
                "reach": int(insights["reach"]),
                "frequency": float(insights["frequency"]),
                "ctr": float(insights["ctr"]),
                "cpc": float(insights["cpc"]),
                "cpm": float(insights["cpm"]),
            },
            "conversions": {},
            "period": {
                "startDate": insights["date_start"],
                "endDate": insights["date_stop"],
            },
            "lastUpdated": datetime.utcnow().isoformat(),
        }

        # Process actions
        for action in insights["actions"]:
            action_type = action["action_type"]
            count = int(action["value"])
            transformed_data["conversions"][action_type] = {
                "count": count,
                "value": 0,  # Will be filled from action_values
            }

        # Process action values
        for value_item in insights["action_values"]:
            action_type = value_item["action_type"]
            value = float(value_item["value"])
            if action_type in transformed_data["conversions"]:
                transformed_data["conversions"][action_type]["value"] = value

        # Validate transformation
        assert transformed_data["campaignId"] == "123456789"
        assert transformed_data["metrics"]["impressions"] == 15000
        assert transformed_data["metrics"]["spend"] == 375.50
        assert transformed_data["conversions"]["purchase"]["count"] == 45
        assert transformed_data["conversions"]["purchase"]["value"] == 2250.00
        assert "lastUpdated" in transformed_data


class TestMetaAPIRealTimeUpdates:
    """Test real-time updates from Meta API."""

    @pytest.mark.asyncio
    async def test_async_polling_mechanism(self):
        """Test asynchronous polling for real-time updates."""
        import asyncio

        # Mock async API call
        async def fetch_latest_insights():
            await asyncio.sleep(0.1)  # Simulate API call
            return {
                "campaign_id": "123456789",
                "spend": 125.50,
                "timestamp": datetime.utcnow().isoformat(),
            }

        # Mock polling function
        async def poll_insights(interval_seconds=30):
            results = []
            for _ in range(3):  # Simulate 3 polling cycles
                data = await fetch_latest_insights()
                results.append(data)
                await asyncio.sleep(0.01)  # Short delay for test
            return results

        results = await poll_insights()
        assert len(results) == 3
        assert all("campaign_id" in result for result in results)
        assert all("spend" in result for result in results)

    def test_change_detection(self):
        """Test detecting significant changes in metrics."""
        # Previous data
        previous_data = {"spend": 100.00, "ctr": 5.0, "cpc": 0.50, "conversions": 20}

        # New data
        current_data = {
            "spend": 130.00,  # 30% increase
            "ctr": 3.5,  # 30% decrease
            "cpc": 0.65,  # 30% increase
            "conversions": 18,  # 10% decrease
        }

        def detect_significant_changes(previous, current, threshold=20):
            changes = {}
            for metric in previous:
                if metric in current:
                    prev_value = previous[metric]
                    curr_value = current[metric]

                    if prev_value > 0:
                        change_percent = ((curr_value - prev_value) / prev_value) * 100
                        if abs(change_percent) >= threshold:
                            changes[metric] = {
                                "previous": prev_value,
                                "current": curr_value,
                                "change_percent": change_percent,
                                "direction": "increase"
                                if change_percent > 0
                                else "decrease",
                            }
            return changes

        changes = detect_significant_changes(previous_data, current_data)

        # Should detect significant changes in spend, CTR, and CPC
        assert "spend" in changes
        assert "ctr" in changes
        assert "cpc" in changes
        assert "conversions" not in changes  # 10% change below 20% threshold

        assert changes["spend"]["direction"] == "increase"
        assert changes["ctr"]["direction"] == "decrease"
        assert abs(changes["spend"]["change_percent"] - 30.0) < 0.1


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
