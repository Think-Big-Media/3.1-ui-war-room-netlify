"""
Alert Delivery Manager - Multi-channel alert distribution
"""

import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import json

from ..agents.alert_routing import AlertRoute, AlertPriority
from ..agents.crisis_detection import CrisisAnalysis
from ..utils.rate_limiter import MultiServiceRateLimiter, create_default_rate_limiter

logger = logging.getLogger(__name__)


class DeliveryChannel:
    """Base class for delivery channels"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.enabled = config.get("enabled", True)
    
    async def send(self, message: str, recipient: Dict, metadata: Dict = None) -> Dict:
        """Send message through this channel"""
        raise NotImplementedError
    
    def is_available(self) -> bool:
        """Check if channel is available"""
        return self.enabled


class EmailChannel(DeliveryChannel):
    """Email delivery via SendGrid"""
    
    async def send(self, message: str, recipient: Dict, metadata: Dict = None) -> Dict:
        """Send email via SendGrid API"""
        if not recipient.get("email"):
            return {"success": False, "error": "No email address"}
        
        try:
            # In production, integrate with SendGrid
            logger.info(f"Email sent to {recipient['email']}: {message[:50]}...")
            
            return {
                "success": True,
                "channel": "email",
                "recipient": recipient["email"],
                "timestamp": datetime.now().isoformat(),
                "message_id": f"email_{datetime.now().timestamp()}"
            }
        except Exception as e:
            logger.error(f"Email delivery failed: {e}")
            return {"success": False, "error": str(e)}


class SMSChannel(DeliveryChannel):
    """SMS delivery via Twilio"""
    
    async def send(self, message: str, recipient: Dict, metadata: Dict = None) -> Dict:
        """Send SMS via Twilio"""
        if not recipient.get("phone"):
            return {"success": False, "error": "No phone number"}
        
        try:
            # Truncate message for SMS (160 char limit)
            sms_message = message[:160] + "..." if len(message) > 160 else message
            
            # In production, integrate with Twilio
            logger.info(f"SMS sent to {recipient['phone']}: {sms_message}")
            
            return {
                "success": True,
                "channel": "sms", 
                "recipient": recipient["phone"],
                "timestamp": datetime.now().isoformat(),
                "message_id": f"sms_{datetime.now().timestamp()}"
            }
        except Exception as e:
            logger.error(f"SMS delivery failed: {e}")
            return {"success": False, "error": str(e)}


class SlackChannel(DeliveryChannel):
    """Slack delivery via Web API"""
    
    async def send(self, message: str, recipient: Dict, metadata: Dict = None) -> Dict:
        """Send Slack message"""
        if not recipient.get("slack_id"):
            return {"success": False, "error": "No Slack ID"}
        
        try:
            # Format message for Slack
            priority = metadata.get("priority", "medium") if metadata else "medium"
            priority_emoji = {
                "critical": "🚨",
                "high": "⚠️", 
                "medium": "📢",
                "low": "ℹ️"
            }
            
            slack_message = f"{priority_emoji.get(priority, '📢')} *Crisis Alert*\n\n{message}"
            
            # In production, use Slack Web API
            logger.info(f"Slack message sent to {recipient['slack_id']}: {message[:50]}...")
            
            return {
                "success": True,
                "channel": "slack",
                "recipient": recipient["slack_id"],
                "timestamp": datetime.now().isoformat(),
                "message_id": f"slack_{datetime.now().timestamp()}"
            }
        except Exception as e:
            logger.error(f"Slack delivery failed: {e}")
            return {"success": False, "error": str(e)}


class PhoneCallChannel(DeliveryChannel):
    """Phone call delivery via Twilio Voice"""
    
    async def send(self, message: str, recipient: Dict, metadata: Dict = None) -> Dict:
        """Initiate phone call"""
        if not recipient.get("phone"):
            return {"success": False, "error": "No phone number"}
        
        try:
            # Convert message to speech (truncate for call)
            call_message = message[:200] + "..." if len(message) > 200 else message
            
            # In production, use Twilio Voice API with TTS
            logger.info(f"Phone call initiated to {recipient['phone']}")
            
            return {
                "success": True,
                "channel": "phone_call",
                "recipient": recipient["phone"],
                "timestamp": datetime.now().isoformat(),
                "message_id": f"call_{datetime.now().timestamp()}"
            }
        except Exception as e:
            logger.error(f"Phone call failed: {e}")
            return {"success": False, "error": str(e)}


class PushNotificationChannel(DeliveryChannel):
    """Push notifications via Firebase/APNs"""
    
    async def send(self, message: str, recipient: Dict, metadata: Dict = None) -> Dict:
        """Send push notification"""
        device_token = recipient.get("device_token")
        if not device_token:
            return {"success": False, "error": "No device token"}
        
        try:
            # Format for push
            title = "Crisis Alert"
            body = message[:100] + "..." if len(message) > 100 else message
            
            # In production, integrate with Firebase/APNs
            logger.info(f"Push notification sent to device: {body}")
            
            return {
                "success": True,
                "channel": "push",
                "recipient": device_token,
                "timestamp": datetime.now().isoformat(),
                "message_id": f"push_{datetime.now().timestamp()}"
            }
        except Exception as e:
            logger.error(f"Push notification failed: {e}")
            return {"success": False, "error": str(e)}


class DeliveryManager:
    """Manages multi-channel alert delivery with retry and fallback"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.rate_limiter = create_default_rate_limiter()
        
        # Initialize channels
        self.channels = {
            "email": EmailChannel(config.get("email", {})),
            "sms": SMSChannel(config.get("sms", {})),
            "slack": SlackChannel(config.get("slack", {})),
            "phone_call": PhoneCallChannel(config.get("phone_call", {})),
            "push": PushNotificationChannel(config.get("push", {}))
        }
        
        # Delivery tracking
        self.delivery_history: List[Dict] = []
        self.retry_config = config.get("retry", {
            "max_attempts": 3,
            "backoff_seconds": [1, 5, 15]
        })
    
    async def deliver_multi_channel(
        self,
        route: AlertRoute,
        crisis_analysis: CrisisAnalysis
    ) -> Dict[str, Any]:
        """Deliver alert through multiple channels with fallback"""
        
        results = {
            "route_id": route.recipient.id,
            "channels_attempted": [],
            "successful_channels": [],
            "failed_channels": [],
            "total_success": False,
            "delivery_time": datetime.now().isoformat()
        }
        
        # Prepare message metadata
        metadata = {
            "priority": route.priority.value,
            "severity": crisis_analysis.severity,
            "threat_type": crisis_analysis.threat_type,
            "escalation_required": crisis_analysis.escalation_required
        }
        
        # Try each channel in order
        for channel_name in route.channels:
            if channel_name not in self.channels:
                logger.warning(f"Unknown channel: {channel_name}")
                continue
            
            channel = self.channels[channel_name]
            if not channel.is_available():
                logger.warning(f"Channel {channel_name} is not available")
                continue
            
            results["channels_attempted"].append(channel_name)
            
            # Apply rate limiting
            service_name = self._get_service_name(channel_name)
            await self.rate_limiter.wait_for_capacity(service_name)
            
            # Attempt delivery with retry
            delivery_result = await self._deliver_with_retry(
                channel=channel,
                message=route.message,
                recipient=route.recipient.dict(),
                metadata=metadata
            )
            
            if delivery_result["success"]:
                results["successful_channels"].append(channel_name)
                results["total_success"] = True
                logger.info(f"Successfully delivered via {channel_name} to {route.recipient.id}")
            else:
                results["failed_channels"].append({
                    "channel": channel_name,
                    "error": delivery_result.get("error", "Unknown error")
                })
                logger.error(f"Failed to deliver via {channel_name}: {delivery_result.get('error')}")
        
        # Store delivery record
        self._record_delivery(route, results, crisis_analysis)
        
        # Handle escalation if all channels failed
        if not results["total_success"] and route.escalation_plan:
            logger.warning(f"All channels failed for {route.recipient.id}, triggering escalation")
            await self._trigger_escalation(route, results)
        
        return results
    
    async def _deliver_with_retry(
        self,
        channel: DeliveryChannel,
        message: str,
        recipient: Dict,
        metadata: Dict
    ) -> Dict:
        """Deliver message with retry logic"""
        
        last_error = None
        
        for attempt in range(self.retry_config["max_attempts"]):
            try:
                result = await channel.send(message, recipient, metadata)
                if result.get("success"):
                    if attempt > 0:
                        logger.info(f"Delivery succeeded on attempt {attempt + 1}")
                    return result
                else:
                    last_error = result.get("error", "Unknown error")
                    
            except Exception as e:
                last_error = str(e)
                logger.error(f"Delivery attempt {attempt + 1} failed: {e}")
            
            # Wait before retry (exponential backoff)
            if attempt < self.retry_config["max_attempts"] - 1:
                wait_time = self.retry_config["backoff_seconds"][
                    min(attempt, len(self.retry_config["backoff_seconds"]) - 1)
                ]
                await asyncio.sleep(wait_time)
        
        return {"success": False, "error": f"Failed after {self.retry_config['max_attempts']} attempts: {last_error}"}
    
    def _get_service_name(self, channel_name: str) -> str:
        """Map channel name to service name for rate limiting"""
        mapping = {
            "email": "sendgrid",
            "sms": "twilio",
            "phone_call": "twilio",
            "slack": "slack",
            "push": "firebase"
        }
        return mapping.get(channel_name, channel_name)
    
    def _record_delivery(
        self,
        route: AlertRoute,
        results: Dict,
        crisis_analysis: CrisisAnalysis
    ) -> None:
        """Record delivery attempt for analytics"""
        record = {
            "timestamp": datetime.now().isoformat(),
            "recipient_id": route.recipient.id,
            "recipient_role": route.recipient.role,
            "priority": route.priority.value,
            "crisis_severity": crisis_analysis.severity,
            "threat_type": crisis_analysis.threat_type,
            "channels_attempted": results["channels_attempted"],
            "successful_channels": results["successful_channels"],
            "total_success": results["total_success"],
            "delivery_time_ms": (datetime.now() - datetime.fromisoformat(results["delivery_time"])).total_seconds() * 1000
        }
        
        self.delivery_history.append(record)
        
        # In production, persist to database for analytics
        logger.info(f"Recorded delivery: {record['recipient_id']} - Success: {record['total_success']}")
    
    async def _trigger_escalation(self, route: AlertRoute, failed_results: Dict) -> None:
        """Trigger escalation when all channels fail"""
        if not route.escalation_plan:
            return
        
        escalation_message = (
            f"ESCALATION: Failed to deliver crisis alert to {route.recipient.name} "
            f"({route.recipient.role}). All channels failed: "
            f"{', '.join([f['channel'] for f in failed_results['failed_channels']])}"
        )
        
        # In production, create escalation task or notify escalation contact
        logger.critical(f"ESCALATION TRIGGERED: {escalation_message}")
    
    def get_delivery_stats(self) -> Dict[str, Any]:
        """Get delivery statistics"""
        if not self.delivery_history:
            return {"total_deliveries": 0}
        
        total = len(self.delivery_history)
        successful = sum(1 for record in self.delivery_history if record["total_success"])
        
        # Channel success rates
        channel_stats = {}
        for record in self.delivery_history:
            for channel in record["successful_channels"]:
                if channel not in channel_stats:
                    channel_stats[channel] = {"attempts": 0, "successes": 0}
                channel_stats[channel]["successes"] += 1
            
            for channel in record["channels_attempted"]:
                if channel not in channel_stats:
                    channel_stats[channel] = {"attempts": 0, "successes": 0}
                channel_stats[channel]["attempts"] += 1
        
        # Calculate success rates
        for channel in channel_stats:
            stats = channel_stats[channel]
            stats["success_rate"] = stats["successes"] / stats["attempts"] if stats["attempts"] > 0 else 0
        
        return {
            "total_deliveries": total,
            "successful_deliveries": successful,
            "overall_success_rate": successful / total,
            "channel_stats": channel_stats,
            "avg_delivery_time_ms": sum(
                record["delivery_time_ms"] for record in self.delivery_history
            ) / total if total > 0 else 0
        }