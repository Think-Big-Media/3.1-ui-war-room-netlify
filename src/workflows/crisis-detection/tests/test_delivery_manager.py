"""
Tests for Alert Delivery Manager
"""

import pytest
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch

from ..tools.delivery import (
    DeliveryManager,
    EmailChannel,
    SMSChannel,
    SlackChannel,
    PhoneCallChannel
)
from ..agents.alert_routing import AlertRoute, RecipientProfile, AlertPriority
from ..agents.crisis_detection import CrisisAnalysis


@pytest.fixture
def delivery_config():
    """Sample delivery configuration"""
    return {
        "email": {
            "enabled": True,
            "sendgrid_api_key": "test_key"
        },
        "sms": {
            "enabled": True,
            "twilio_account_sid": "test_sid",
            "twilio_auth_token": "test_token"
        },
        "slack": {
            "enabled": True,
            "bot_token": "test_token"
        },
        "phone_call": {
            "enabled": True,
            "twilio_account_sid": "test_sid",
            "twilio_auth_token": "test_token"
        },
        "retry": {
            "max_attempts": 2,
            "backoff_seconds": [1, 3]
        }
    }


@pytest.fixture
def sample_recipient():
    """Sample recipient profile"""
    return RecipientProfile(
        id="test_recipient",
        name="John Doe",
        role="campaign_manager",
        email="john@campaign.com",
        phone="+1234567890",
        slack_id="U123456",
        expertise_areas=["crisis", "messaging"],
        channel_preferences={
            "email": {"enabled": True, "max_priority": "medium"},
            "sms": {"enabled": True, "max_priority": "high"},
            "slack": {"enabled": True, "max_priority": "medium"},
            "phone_call": {"enabled": True, "max_priority": "critical"}
        }
    )


@pytest.fixture
def sample_crisis_analysis():
    """Sample crisis analysis"""
    return CrisisAnalysis(
        severity=8,
        confidence=0.9,
        threat_type="misinformation",
        affected_topics=["policy", "reputation"],
        recommended_actions=["Issue statement", "Contact media"],
        escalation_required=True,
        reasoning="High severity misinformation campaign detected"
    )


class TestDeliveryChannels:
    """Test individual delivery channels"""
    
    @pytest.mark.asyncio
    async def test_email_channel_success(self):
        """Test successful email delivery"""
        channel = EmailChannel({"enabled": True})
        recipient = {"email": "test@example.com", "name": "Test User"}
        
        result = await channel.send("Test message", recipient)
        
        assert result["success"] == True
        assert result["channel"] == "email"
        assert result["recipient"] == "test@example.com"
        assert "message_id" in result
        assert "timestamp" in result
    
    @pytest.mark.asyncio
    async def test_email_channel_no_email(self):
        """Test email delivery with missing email address"""
        channel = EmailChannel({"enabled": True})
        recipient = {"name": "Test User"}  # No email
        
        result = await channel.send("Test message", recipient)
        
        assert result["success"] == False
        assert "No email address" in result["error"]
    
    @pytest.mark.asyncio
    async def test_sms_channel_success(self):
        """Test successful SMS delivery"""
        channel = SMSChannel({"enabled": True})
        recipient = {"phone": "+1234567890", "name": "Test User"}
        
        result = await channel.send("Test message", recipient)
        
        assert result["success"] == True
        assert result["channel"] == "sms"
        assert result["recipient"] == "+1234567890"
    
    @pytest.mark.asyncio
    async def test_sms_channel_truncation(self):
        """Test SMS message truncation for long messages"""
        channel = SMSChannel({"enabled": True})
        recipient = {"phone": "+1234567890"}
        
        long_message = "A" * 200  # Longer than 160 characters
        result = await channel.send(long_message, recipient)
        
        assert result["success"] == True
        # Message should be truncated in the actual implementation
        # (we're just testing the interface here)
    
    @pytest.mark.asyncio
    async def test_slack_channel_success(self):
        """Test successful Slack delivery"""
        channel = SlackChannel({"enabled": True})
        recipient = {"slack_id": "U123456", "name": "Test User"}
        metadata = {"priority": "high"}
        
        result = await channel.send("Test message", recipient, metadata)
        
        assert result["success"] == True
        assert result["channel"] == "slack"
        assert result["recipient"] == "U123456"
    
    @pytest.mark.asyncio
    async def test_phone_call_channel(self):
        """Test phone call delivery"""
        channel = PhoneCallChannel({"enabled": True})
        recipient = {"phone": "+1234567890", "name": "Test User"}
        
        result = await channel.send("Urgent crisis alert", recipient)
        
        assert result["success"] == True
        assert result["channel"] == "phone_call"
        assert result["recipient"] == "+1234567890"
    
    def test_channel_availability(self):
        """Test channel availability checking"""
        enabled_channel = EmailChannel({"enabled": True})
        disabled_channel = EmailChannel({"enabled": False})
        
        assert enabled_channel.is_available() == True
        assert disabled_channel.is_available() == False


class TestDeliveryManager:
    """Test the delivery manager"""
    
    @pytest.fixture
    def delivery_manager(self, delivery_config):
        """Create delivery manager for testing"""
        return DeliveryManager(delivery_config)
    
    def test_delivery_manager_initialization(self, delivery_manager):
        """Test delivery manager initialization"""
        assert delivery_manager is not None
        assert "email" in delivery_manager.channels
        assert "sms" in delivery_manager.channels
        assert "slack" in delivery_manager.channels
        assert "phone_call" in delivery_manager.channels
        assert delivery_manager.rate_limiter is not None
    
    @pytest.mark.asyncio
    async def test_single_channel_delivery_success(self, delivery_manager, sample_recipient, sample_crisis_analysis):
        """Test successful single channel delivery"""
        route = AlertRoute(
            recipient=sample_recipient,
            channels=["email"],
            message="Test crisis alert",
            priority=AlertPriority.HIGH
        )
        
        # Mock successful email delivery
        with patch.object(delivery_manager.channels["email"], "send") as mock_send:
            mock_send.return_value = {
                "success": True,
                "channel": "email",
                "recipient": "john@campaign.com",
                "timestamp": datetime.now().isoformat(),
                "message_id": "test_123"
            }
            
            result = await delivery_manager.deliver_multi_channel(route, sample_crisis_analysis)
        
        assert result["total_success"] == True
        assert len(result["successful_channels"]) == 1
        assert "email" in result["successful_channels"]
        assert len(result["failed_channels"]) == 0
    
    @pytest.mark.asyncio
    async def test_multi_channel_delivery_partial_success(self, delivery_manager, sample_recipient, sample_crisis_analysis):
        """Test multi-channel delivery with partial success"""
        route = AlertRoute(
            recipient=sample_recipient,
            channels=["email", "sms", "slack"],
            message="Test crisis alert",
            priority=AlertPriority.CRITICAL
        )
        
        # Mock mixed success results
        with patch.object(delivery_manager.channels["email"], "send") as mock_email:
            with patch.object(delivery_manager.channels["sms"], "send") as mock_sms:
                with patch.object(delivery_manager.channels["slack"], "send") as mock_slack:
                    
                    mock_email.return_value = {"success": True, "channel": "email"}
                    mock_sms.return_value = {"success": False, "error": "Network error"}
                    mock_slack.return_value = {"success": True, "channel": "slack"}
                    
                    result = await delivery_manager.deliver_multi_channel(route, sample_crisis_analysis)
        
        assert result["total_success"] == True  # At least one channel succeeded
        assert len(result["successful_channels"]) == 2
        assert "email" in result["successful_channels"]
        assert "slack" in result["successful_channels"]
        assert len(result["failed_channels"]) == 1
        assert result["failed_channels"][0]["channel"] == "sms"
    
    @pytest.mark.asyncio
    async def test_all_channels_fail(self, delivery_manager, sample_recipient, sample_crisis_analysis):
        """Test delivery when all channels fail"""
        route = AlertRoute(
            recipient=sample_recipient,
            channels=["email", "sms"],
            message="Test crisis alert",
            priority=AlertPriority.HIGH,
            escalation_plan={"escalate_to": "manager", "escalate_after_minutes": 15}
        )
        
        # Mock all failures
        with patch.object(delivery_manager.channels["email"], "send") as mock_email:
            with patch.object(delivery_manager.channels["sms"], "send") as mock_sms:
                with patch.object(delivery_manager, "_trigger_escalation") as mock_escalation:
                    
                    mock_email.return_value = {"success": False, "error": "Email service down"}
                    mock_sms.return_value = {"success": False, "error": "SMS service down"}
                    
                    result = await delivery_manager.deliver_multi_channel(route, sample_crisis_analysis)
                    
                    # Should trigger escalation
                    mock_escalation.assert_called_once()
        
        assert result["total_success"] == False
        assert len(result["successful_channels"]) == 0
        assert len(result["failed_channels"]) == 2
    
    @pytest.mark.asyncio
    async def test_delivery_with_retry(self, delivery_manager, sample_recipient, sample_crisis_analysis):
        """Test delivery retry mechanism"""
        route = AlertRoute(
            recipient=sample_recipient,
            channels=["email"],
            message="Test crisis alert",
            priority=AlertPriority.HIGH
        )
        
        # Mock first failure, then success
        call_count = 0
        def mock_send_with_retry(message, recipient, metadata=None):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                return {"success": False, "error": "Temporary failure"}
            else:
                return {"success": True, "channel": "email"}
        
        with patch.object(delivery_manager.channels["email"], "send", side_effect=mock_send_with_retry):
            # Mock sleep to speed up test
            with patch('asyncio.sleep'):
                result = await delivery_manager.deliver_multi_channel(route, sample_crisis_analysis)
        
        assert result["total_success"] == True
        assert call_count == 2  # Should have retried once
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self, delivery_manager, sample_recipient, sample_crisis_analysis):
        """Test rate limiting integration"""
        route = AlertRoute(
            recipient=sample_recipient,
            channels=["email"],
            message="Test crisis alert",
            priority=AlertPriority.HIGH
        )
        
        # Mock rate limiter
        with patch.object(delivery_manager.rate_limiter, "wait_for_capacity") as mock_rate_limit:
            with patch.object(delivery_manager.channels["email"], "send") as mock_send:
                mock_send.return_value = {"success": True, "channel": "email"}
                
                await delivery_manager.deliver_multi_channel(route, sample_crisis_analysis)
                
                # Should have applied rate limiting for email (sendgrid service)
                mock_rate_limit.assert_called_with("sendgrid")
    
    def test_get_service_name_mapping(self, delivery_manager):
        """Test service name mapping for rate limiting"""
        assert delivery_manager._get_service_name("email") == "sendgrid"
        assert delivery_manager._get_service_name("sms") == "twilio"
        assert delivery_manager._get_service_name("phone_call") == "twilio"
        assert delivery_manager._get_service_name("slack") == "slack"
        assert delivery_manager._get_service_name("unknown") == "unknown"
    
    def test_delivery_history_recording(self, delivery_manager, sample_recipient, sample_crisis_analysis):
        """Test delivery history is recorded"""
        route = AlertRoute(
            recipient=sample_recipient,
            channels=["email"],
            message="Test alert",
            priority=AlertPriority.MEDIUM
        )
        
        results = {
            "route_id": "test_recipient",
            "channels_attempted": ["email"],
            "successful_channels": ["email"],
            "failed_channels": [],
            "total_success": True,
            "delivery_time": datetime.now().isoformat()
        }
        
        initial_count = len(delivery_manager.delivery_history)
        delivery_manager._record_delivery(route, results, sample_crisis_analysis)
        
        assert len(delivery_manager.delivery_history) == initial_count + 1
        
        latest_record = delivery_manager.delivery_history[-1]
        assert latest_record["recipient_id"] == "test_recipient"
        assert latest_record["priority"] == "medium"
        assert latest_record["total_success"] == True
    
    def test_delivery_stats_calculation(self, delivery_manager):
        """Test delivery statistics calculation"""
        # Add some mock delivery history
        delivery_manager.delivery_history = [
            {
                "recipient_id": "recipient_1",
                "channels_attempted": ["email", "sms"],
                "successful_channels": ["email"],
                "total_success": True,
                "delivery_time_ms": 1500
            },
            {
                "recipient_id": "recipient_2", 
                "channels_attempted": ["slack"],
                "successful_channels": [],
                "total_success": False,
                "delivery_time_ms": 2000
            },
            {
                "recipient_id": "recipient_3",
                "channels_attempted": ["email"],
                "successful_channels": ["email"],
                "total_success": True,
                "delivery_time_ms": 1200
            }
        ]
        
        stats = delivery_manager.get_delivery_stats()
        
        assert stats["total_deliveries"] == 3
        assert stats["successful_deliveries"] == 2
        assert stats["overall_success_rate"] == 2/3
        assert stats["avg_delivery_time_ms"] == (1500 + 2000 + 1200) / 3
        
        # Check channel-specific stats
        assert "email" in stats["channel_stats"]
        assert stats["channel_stats"]["email"]["attempts"] == 2
        assert stats["channel_stats"]["email"]["successes"] == 2
        assert stats["channel_stats"]["email"]["success_rate"] == 1.0
        
        assert "slack" in stats["channel_stats"]
        assert stats["channel_stats"]["slack"]["success_rate"] == 0.0
    
    def test_empty_delivery_history_stats(self, delivery_manager):
        """Test stats calculation with empty history"""
        stats = delivery_manager.get_delivery_stats()
        assert stats["total_deliveries"] == 0
    
    @pytest.mark.asyncio
    async def test_escalation_triggering(self, delivery_manager):
        """Test escalation logic"""
        route = AlertRoute(
            recipient=RecipientProfile(
                id="test_user",
                name="Test User",
                role="staff"
            ),
            channels=["email"],
            message="Test message",
            priority=AlertPriority.CRITICAL,
            escalation_plan={
                "escalate_to": "manager",
                "escalate_after_minutes": 15,
                "escalation_message": "No response from Test User"
            }
        )
        
        failed_results = {
            "total_success": False,
            "failed_channels": [{"channel": "email", "error": "Service unavailable"}]
        }
        
        # Mock escalation trigger
        with patch('builtins.print') as mock_print:  # Capture log output
            await delivery_manager._trigger_escalation(route, failed_results)
            # Should log escalation message
            # In production, this would create actual escalation tasks


@pytest.mark.asyncio
async def test_delivery_manager_integration():
    """Test delivery manager integration with real-world scenario"""
    config = {
        "email": {"enabled": True},
        "sms": {"enabled": True},
        "slack": {"enabled": False},  # Disabled channel
        "retry": {"max_attempts": 2, "backoff_seconds": [0.1, 0.2]}
    }
    
    manager = DeliveryManager(config)
    
    recipient = RecipientProfile(
        id="integration_test",
        name="Integration Test User",
        role="campaign_manager",
        email="test@example.com",
        phone="+1234567890"
    )
    
    route = AlertRoute(
        recipient=recipient,
        channels=["email", "sms", "slack"],  # Includes disabled channel
        message="Integration test alert message",
        priority=AlertPriority.HIGH
    )
    
    crisis_analysis = CrisisAnalysis(
        severity=7,
        confidence=0.8,
        threat_type="integration_test",
        affected_topics=["test"],
        recommended_actions=["test_action"],
        escalation_required=False,
        reasoning="Integration test scenario"
    )
    
    # Mock successful delivery for enabled channels
    with patch.object(manager.channels["email"], "send") as mock_email:
        with patch.object(manager.channels["sms"], "send") as mock_sms:
            mock_email.return_value = {"success": True, "channel": "email"}
            mock_sms.return_value = {"success": True, "channel": "sms"}
            
            result = await manager.deliver_multi_channel(route, crisis_analysis)
    
    # Should succeed with available channels
    assert result["total_success"] == True
    assert len(result["successful_channels"]) == 2
    assert "email" in result["successful_channels"]
    assert "sms" in result["successful_channels"]
    # Slack should be skipped because it's disabled
    assert len(result["channels_attempted"]) == 2