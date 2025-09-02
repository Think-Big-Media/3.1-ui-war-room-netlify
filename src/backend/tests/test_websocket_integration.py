"""
Tests for WebSocket integration and real-time features.
Tests connection management, message handling, and real-time updates.
"""
import pytest
import asyncio
import json
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime


class TestWebSocketConnection:
    """Test suite for WebSocket connection management."""

    @pytest.fixture
    def mock_websocket(self):
        """Mock WebSocket connection."""
        websocket = AsyncMock()
        websocket.accept = AsyncMock()
        websocket.close = AsyncMock()
        websocket.send_text = AsyncMock()
        websocket.send_json = AsyncMock()
        websocket.receive_text = AsyncMock()
        websocket.receive_json = AsyncMock()
        return websocket

    @pytest.fixture
    def mock_connection_manager(self):
        """Mock WebSocket connection manager."""
        manager = Mock()
        manager.active_connections = {}
        manager.organization_connections = {}
        manager.connect = AsyncMock()
        manager.disconnect = AsyncMock()
        manager.send_personal_message = AsyncMock()
        manager.broadcast_to_org = AsyncMock()
        manager.broadcast = AsyncMock()
        return manager

    @pytest.mark.asyncio
    async def test_websocket_connection_lifecycle(
        self, mock_websocket, mock_connection_manager
    ):
        """Test WebSocket connection and disconnection."""
        # Test connection establishment
        user_id = "user_123"
        org_id = "org_456"

        # Simulate connection
        await mock_connection_manager.connect(mock_websocket, user_id, org_id)

        # Verify connection was established
        mock_connection_manager.connect.assert_called_once_with(
            mock_websocket, user_id, org_id
        )
        mock_websocket.accept.assert_called_once()

        # Test connection tracking
        mock_connection_manager.active_connections[user_id] = mock_websocket
        assert user_id in mock_connection_manager.active_connections

        # Test disconnection
        await mock_connection_manager.disconnect(mock_websocket, user_id)
        mock_connection_manager.disconnect.assert_called_once()

    @pytest.mark.asyncio
    async def test_message_sending(self, mock_websocket, mock_connection_manager):
        """Test sending messages through WebSocket."""
        user_id = "user_123"
        test_message = {
            "type": "campaign_update",
            "data": {"campaign_id": "camp_789", "spend": 150.00, "budget": 200.00},
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Test personal message
        await mock_connection_manager.send_personal_message(user_id, test_message)
        mock_connection_manager.send_personal_message.assert_called_once_with(
            user_id, test_message
        )

        # Test JSON message format
        json_message = json.dumps(test_message)
        parsed_message = json.loads(json_message)

        assert parsed_message["type"] == "campaign_update"
        assert parsed_message["data"]["campaign_id"] == "camp_789"
        assert "timestamp" in parsed_message

    @pytest.mark.asyncio
    async def test_organization_broadcasting(self, mock_connection_manager):
        """Test broadcasting messages to organization members."""
        org_id = "org_456"
        broadcast_message = {
            "type": "org_announcement",
            "data": {
                "title": "System Maintenance",
                "message": "Scheduled maintenance in 30 minutes",
                "priority": "high",
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Test organization broadcast
        await mock_connection_manager.broadcast_to_org(org_id, broadcast_message)
        mock_connection_manager.broadcast_to_org.assert_called_once_with(
            org_id, broadcast_message
        )

        # Test global broadcast
        global_message = {
            "type": "system_alert",
            "data": {"message": "System update completed"},
            "timestamp": datetime.utcnow().isoformat(),
        }

        await mock_connection_manager.broadcast(global_message)
        mock_connection_manager.broadcast.assert_called_once()

    def test_message_validation(self):
        """Test WebSocket message validation."""

        def validate_message(message):
            required_fields = ["type", "data", "timestamp"]

            if not isinstance(message, dict):
                return False

            for field in required_fields:
                if field not in message:
                    return False

            # Validate message types
            valid_types = [
                "campaign_update",
                "spend_alert",
                "performance_update",
                "system_alert",
                "org_announcement",
                "connection_status",
            ]

            if message["type"] not in valid_types:
                return False

            return True

        # Test valid message
        valid_message = {
            "type": "campaign_update",
            "data": {"campaign_id": "123", "spend": 100.00},
            "timestamp": datetime.utcnow().isoformat(),
        }

        assert validate_message(valid_message) == True

        # Test invalid messages
        invalid_messages = [
            {"type": "campaign_update", "data": {}},  # Missing timestamp
            {"data": {}, "timestamp": "2024-01-15"},  # Missing type
            {
                "type": "invalid_type",
                "data": {},
                "timestamp": "2024-01-15",
            },  # Invalid type
            "not a dict",  # Wrong format
        ]

        for invalid_msg in invalid_messages:
            assert validate_message(invalid_msg) == False

    @pytest.mark.asyncio
    async def test_connection_error_handling(self, mock_websocket):
        """Test WebSocket connection error handling."""

        # Test connection timeout
        async def simulate_connection_timeout():
            await asyncio.sleep(0.01)  # Simulate timeout
            raise asyncio.TimeoutError("Connection timeout")

        with pytest.raises(asyncio.TimeoutError):
            await simulate_connection_timeout()

        # Test disconnection handling
        async def handle_disconnect(websocket, user_id, connection_manager):
            try:
                await connection_manager.disconnect(websocket, user_id)
                return True
            except Exception as e:
                # Log error and clean up
                return False

        mock_manager = AsyncMock()
        mock_manager.disconnect = AsyncMock()

        result = await handle_disconnect(mock_websocket, "user_123", mock_manager)
        assert result == True

    def test_heartbeat_mechanism(self):
        """Test WebSocket heartbeat/ping-pong mechanism."""

        class HeartbeatManager:
            def __init__(self, interval=30):
                self.interval = interval
                self.last_ping = {}
                self.last_pong = {}

            def send_ping(self, connection_id):
                self.last_ping[connection_id] = datetime.utcnow()
                return {
                    "type": "ping",
                    "timestamp": self.last_ping[connection_id].isoformat(),
                }

            def receive_pong(self, connection_id):
                self.last_pong[connection_id] = datetime.utcnow()
                return True

            def is_connection_alive(self, connection_id):
                if connection_id not in self.last_ping:
                    return False

                last_ping = self.last_ping.get(connection_id)
                last_pong = self.last_pong.get(connection_id)

                if not last_ping:
                    return False

                # Connection is alive if pong received after ping
                if last_pong and last_pong > last_ping:
                    return True

                # Or if ping was sent recently (within 2x interval)
                time_since_ping = (datetime.utcnow() - last_ping).total_seconds()
                return time_since_ping < (self.interval * 2)

        # Test heartbeat manager
        heartbeat = HeartbeatManager(interval=30)
        connection_id = "conn_123"

        # Test ping
        ping_message = heartbeat.send_ping(connection_id)
        assert ping_message["type"] == "ping"
        assert "timestamp" in ping_message

        # Test pong response
        pong_result = heartbeat.receive_pong(connection_id)
        assert pong_result == True

        # Test connection alive check
        assert heartbeat.is_connection_alive(connection_id) == True


class TestAdMonitoringWebSocket:
    """Test suite for ad monitoring WebSocket functionality."""

    @pytest.fixture
    def mock_ad_monitor_ws(self):
        """Mock ad monitoring WebSocket service."""
        ws = Mock()
        ws.subscribe_to_alerts = AsyncMock()
        ws.request_spend_update = AsyncMock()
        ws.dismiss_alert = AsyncMock()
        ws.send_json_message = AsyncMock()
        return ws

    def test_alert_subscription_message(self):
        """Test alert subscription message format."""
        subscription_message = {
            "type": "subscribe_alerts",
            "platforms": ["meta", "google"],
            "severity_levels": ["high", "critical"],
            "campaign_ids": ["camp_123", "camp_456"],
        }

        # Validate subscription message
        assert subscription_message["type"] == "subscribe_alerts"
        assert "meta" in subscription_message["platforms"]
        assert "google" in subscription_message["platforms"]
        assert "high" in subscription_message["severity_levels"]
        assert len(subscription_message["campaign_ids"]) == 2

    def test_spend_alert_message(self):
        """Test spend alert message structure."""
        spend_alert = {
            "type": "spend_alert",
            "alert_id": "alert_789",
            "platform": "meta",
            "campaign_id": "camp_123",
            "campaign_name": "Test Campaign",
            "current_spend": 150.00,
            "daily_budget": 100.00,
            "spend_percentage": 150.0,
            "severity": "critical",
            "message": "Campaign has exceeded daily budget by 50%",
            "timestamp": datetime.utcnow().isoformat(),
            "actions": ["pause_campaign", "increase_budget", "dismiss"],
        }

        # Validate alert structure
        assert spend_alert["type"] == "spend_alert"
        assert spend_alert["severity"] == "critical"
        assert spend_alert["spend_percentage"] > 100
        assert "pause_campaign" in spend_alert["actions"]
        assert len(spend_alert["alert_id"]) > 0

    def test_performance_update_message(self):
        """Test performance update message structure."""
        performance_update = {
            "type": "performance_update",
            "platform": "meta",
            "campaign_id": "camp_123",
            "metrics": {
                "ctr": 3.5,
                "cpc": 0.65,
                "roas": 4.2,
                "conversion_rate": 2.1,
                "impressions": 8000,
                "clicks": 280,
                "spend": 182.00,
            },
            "changes": {"ctr_change": -30.0, "cpc_change": 30.0, "roas_change": -30.0},
            "alert_triggered": True,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Validate performance update
        assert performance_update["type"] == "performance_update"
        assert "metrics" in performance_update
        assert "changes" in performance_update
        assert performance_update["alert_triggered"] == True

        # Check significant performance drops
        ctr_drop = performance_update["changes"]["ctr_change"]
        roas_drop = performance_update["changes"]["roas_change"]

        assert ctr_drop < -20  # Significant CTR drop
        assert roas_drop < -20  # Significant ROAS drop

    @pytest.mark.asyncio
    async def test_alert_dismissal(self, mock_ad_monitor_ws):
        """Test alert dismissal functionality."""
        alert_id = "alert_789"
        dismiss_message = {
            "type": "dismiss_alert",
            "alert_id": alert_id,
            "user_id": "user_123",
            "reason": "Budget adjusted",
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Test dismissal
        await mock_ad_monitor_ws.dismiss_alert(alert_id)
        mock_ad_monitor_ws.dismiss_alert.assert_called_once_with(alert_id)

        # Validate dismiss message structure
        assert dismiss_message["type"] == "dismiss_alert"
        assert dismiss_message["alert_id"] == alert_id
        assert "reason" in dismiss_message

    @pytest.mark.asyncio
    async def test_spend_update_request(self, mock_ad_monitor_ws):
        """Test requesting spend updates."""
        update_request = {
            "type": "request_spend_update",
            "platform": "meta",
            "campaign_ids": ["camp_123", "camp_456"],
            "requested_by": "user_123",
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Test spend update request
        await mock_ad_monitor_ws.request_spend_update("meta")
        mock_ad_monitor_ws.request_spend_update.assert_called_once()

        # Validate request structure
        assert update_request["type"] == "request_spend_update"
        assert update_request["platform"] == "meta"
        assert len(update_request["campaign_ids"]) == 2

    def test_real_time_data_aggregation(self):
        """Test real-time data aggregation from multiple platforms."""
        # Mock real-time data from different platforms
        meta_data = {
            "platform": "meta",
            "campaigns": [
                {"id": "meta_123", "spend": 100.00, "budget": 120.00},
                {"id": "meta_456", "spend": 85.00, "budget": 100.00},
            ],
            "total_spend": 185.00,
            "total_budget": 220.00,
        }

        google_data = {
            "platform": "google",
            "campaigns": [{"id": "google_789", "spend": 150.00, "budget": 180.00}],
            "total_spend": 150.00,
            "total_budget": 180.00,
        }

        # Test aggregation
        def aggregate_platform_data(platform_data_list):
            aggregated = {
                "total_spend": 0,
                "total_budget": 0,
                "total_campaigns": 0,
                "platforms": {},
                "spend_percentage": 0,
            }

            for platform_data in platform_data_list:
                platform = platform_data["platform"]
                aggregated["platforms"][platform] = platform_data
                aggregated["total_spend"] += platform_data["total_spend"]
                aggregated["total_budget"] += platform_data["total_budget"]
                aggregated["total_campaigns"] += len(platform_data["campaigns"])

            if aggregated["total_budget"] > 0:
                aggregated["spend_percentage"] = (
                    aggregated["total_spend"] / aggregated["total_budget"] * 100
                )

            return aggregated

        result = aggregate_platform_data([meta_data, google_data])

        assert result["total_spend"] == 335.00  # 185 + 150
        assert result["total_budget"] == 400.00  # 220 + 180
        assert result["total_campaigns"] == 3  # 2 + 1
        assert abs(result["spend_percentage"] - 83.75) < 0.01
        assert "meta" in result["platforms"]
        assert "google" in result["platforms"]

    def test_websocket_message_queuing(self):
        """Test message queuing for offline/disconnected clients."""

        class MessageQueue:
            def __init__(self, max_size=100):
                self.queues = {}
                self.max_size = max_size

            def add_message(self, user_id, message):
                if user_id not in self.queues:
                    self.queues[user_id] = []

                # Add message to queue
                self.queues[user_id].append(
                    {"message": message, "queued_at": datetime.utcnow(), "attempts": 0}
                )

                # Trim queue if too large
                if len(self.queues[user_id]) > self.max_size:
                    self.queues[user_id] = self.queues[user_id][-self.max_size :]

            def get_queued_messages(self, user_id):
                return self.queues.get(user_id, [])

            def clear_queue(self, user_id):
                if user_id in self.queues:
                    del self.queues[user_id]

        # Test message queuing
        queue = MessageQueue(max_size=5)
        user_id = "user_123"

        # Add messages to queue
        for i in range(7):  # More than max_size
            message = {
                "type": "test_message",
                "data": {"count": i},
                "timestamp": datetime.utcnow().isoformat(),
            }
            queue.add_message(user_id, message)

        # Check queue size is limited
        queued_messages = queue.get_queued_messages(user_id)
        assert len(queued_messages) == 5  # Should be trimmed to max_size

        # Check that latest messages are kept
        last_message = queued_messages[-1]
        assert last_message["message"]["data"]["count"] == 6

        # Test queue clearing
        queue.clear_queue(user_id)
        assert len(queue.get_queued_messages(user_id)) == 0


class TestWebSocketSecurity:
    """Test suite for WebSocket security features."""

    def test_connection_authentication(self):
        """Test WebSocket connection authentication."""

        def authenticate_websocket_token(token):
            # Mock JWT validation
            if not token or not token.startswith("Bearer "):
                return None

            # Extract token
            jwt_token = token[7:]  # Remove "Bearer " prefix

            # Mock token validation (in real implementation, use JWT library)
            if jwt_token == "valid_token_123":
                return {
                    "user_id": "user_123",
                    "org_id": "org_456",
                    "role": "admin",
                    "permissions": ["websocket.connect", "analytics.view"],
                }

            return None

        # Test valid token
        valid_auth = authenticate_websocket_token("Bearer valid_token_123")
        assert valid_auth is not None
        assert valid_auth["user_id"] == "user_123"
        assert "websocket.connect" in valid_auth["permissions"]

        # Test invalid tokens
        invalid_tokens = [None, "", "invalid_token", "Bearer invalid_token_456"]

        for token in invalid_tokens:
            auth_result = authenticate_websocket_token(token)
            assert auth_result is None

    def test_message_rate_limiting(self):
        """Test rate limiting for WebSocket messages."""
        from collections import defaultdict, deque
        import time

        class WebSocketRateLimiter:
            def __init__(self, max_messages=60, time_window=60):
                self.max_messages = max_messages
                self.time_window = time_window
                self.message_counts = defaultdict(deque)

            def is_allowed(self, connection_id):
                now = time.time()
                message_times = self.message_counts[connection_id]

                # Remove old messages outside time window
                while message_times and now - message_times[0] > self.time_window:
                    message_times.popleft()

                # Check if under limit
                if len(message_times) < self.max_messages:
                    message_times.append(now)
                    return True

                return False

            def get_remaining_quota(self, connection_id):
                now = time.time()
                message_times = self.message_counts[connection_id]

                # Clean old messages
                while message_times and now - message_times[0] > self.time_window:
                    message_times.popleft()

                return max(0, self.max_messages - len(message_times))

        # Test rate limiter
        limiter = WebSocketRateLimiter(max_messages=5, time_window=60)
        connection_id = "conn_123"

        # Test within limits
        for i in range(5):
            assert limiter.is_allowed(connection_id) == True

        # Test exceeding limits
        assert limiter.is_allowed(connection_id) == False

        # Test quota checking
        remaining = limiter.get_remaining_quota(connection_id)
        assert remaining == 0

    def test_message_sanitization(self):
        """Test WebSocket message sanitization."""
        import html

        def sanitize_websocket_message(message):
            if not isinstance(message, dict):
                return None

            sanitized = {}

            for key, value in message.items():
                # Sanitize keys
                if not isinstance(key, str) or len(key) > 100:
                    continue

                # Sanitize string values
                if isinstance(value, str):
                    # HTML escape
                    value = html.escape(value)
                    # Limit length
                    if len(value) > 1000:
                        value = value[:1000] + "..."
                elif isinstance(value, dict):
                    # Recursively sanitize nested objects
                    value = sanitize_websocket_message(value)
                elif isinstance(value, list):
                    # Sanitize list items
                    value = [
                        html.escape(item) if isinstance(item, str) else item
                        for item in value[:50]  # Limit list size
                    ]

                sanitized[key] = value

            return sanitized

        # Test message sanitization
        dangerous_message = {
            "type": "user_message",
            "content": "<script>alert('xss')</script>Hello",
            "metadata": {"user_input": "<img src=x onerror=alert(1)>"},
            "tags": ["<script>", "normal_tag"],
            "long_key_" + "x" * 200: "value",  # Too long key
        }

        sanitized = sanitize_websocket_message(dangerous_message)

        # Check HTML escaping
        assert "&lt;script&gt;" in sanitized["content"]
        assert "alert('xss')" not in sanitized["content"]

        # Check nested sanitization
        assert "&lt;img" in sanitized["metadata"]["user_input"]

        # Check list sanitization
        assert "&lt;script&gt;" in sanitized["tags"][0]

        # Check long key removal
        long_key = "long_key_" + "x" * 200
        assert long_key not in sanitized


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
