"""
Multi-channel Notification Service
Handles SMS, Email, WhatsApp, and Browser notifications for the War Room platform.
"""

import asyncio
import aiohttp
import logging
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from enum import Enum

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client as TwilioClient

from sqlalchemy.orm import Session
from core.database import get_db
from models.automation import NotificationDelivery

logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    """Supported notification channels."""

    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    BROWSER = "browser"
    SLACK = "slack"


class NotificationPriority(str, Enum):
    """Notification priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class NotificationService:
    """
    Multi-channel notification service that handles various
    communication channels for crisis alerts and workflow actions.
    """

    def __init__(self, db: Session, config: Dict[str, Any]):
        self.db = db
        self.config = config

        # Provider configurations
        self.email_config = config.get("email", {})
        self.twilio_config = config.get("twilio", {})
        self.firebase_config = config.get("firebase", {})
        self.slack_config = config.get("slack", {})

        # Initialize clients
        self.twilio_client = None
        if self.twilio_config.get("account_sid") and self.twilio_config.get(
            "auth_token"
        ):
            self.twilio_client = TwilioClient(
                self.twilio_config["account_sid"], self.twilio_config["auth_token"]
            )

        # Rate limiting
        self.rate_limits = {
            NotificationChannel.EMAIL: {"per_minute": 60, "per_hour": 1000},
            NotificationChannel.SMS: {"per_minute": 10, "per_hour": 100},
            NotificationChannel.WHATSAPP: {"per_minute": 10, "per_hour": 100},
            NotificationChannel.BROWSER: {"per_minute": 100, "per_hour": 2000},
            NotificationChannel.SLACK: {"per_minute": 30, "per_hour": 500},
        }

        # Template storage
        self.templates = {}

    async def send_notification(
        self,
        channel: NotificationChannel,
        recipient: str,
        subject: str,
        content: str,
        organization_id: str,
        workflow_execution_id: Optional[str] = None,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Send notification through specified channel.
        Returns notification delivery ID.
        """
        # Create delivery record
        delivery = NotificationDelivery(
            organization_id=organization_id,
            workflow_execution_id=workflow_execution_id,
            channel=channel.value,
            recipient=recipient,
            subject=subject,
            content=content,
            status="pending",
        )

        self.db.add(delivery)
        self.db.commit()
        self.db.refresh(delivery)

        # Send through appropriate channel
        try:
            if channel == NotificationChannel.EMAIL:
                await self._send_email(delivery, template_data)
            elif channel == NotificationChannel.SMS:
                await self._send_sms(delivery, template_data)
            elif channel == NotificationChannel.WHATSAPP:
                await self._send_whatsapp(delivery, template_data)
            elif channel == NotificationChannel.BROWSER:
                await self._send_browser_notification(delivery, template_data)
            elif channel == NotificationChannel.SLACK:
                await self._send_slack_message(delivery, template_data)
            else:
                raise ValueError(f"Unsupported notification channel: {channel}")

            delivery.sent_at = datetime.utcnow()
            delivery.status = "sent"

        except Exception as e:
            delivery.status = "failed"
            delivery.error_message = str(e)
            logger.error(f"Failed to send {channel} notification: {e}")

        finally:
            self.db.commit()

        return delivery.id

    async def _send_email(
        self,
        delivery: NotificationDelivery,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Send email notification."""
        smtp_server = self.email_config.get("smtp_server", "smtp.gmail.com")
        smtp_port = self.email_config.get("smtp_port", 587)
        username = self.email_config.get("username")
        password = self.email_config.get("password")
        from_email = self.email_config.get("from_email", username)

        if not all([username, password]):
            raise ValueError("Email configuration incomplete")

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = delivery.subject
        msg["From"] = from_email
        msg["To"] = delivery.recipient

        # Apply template if provided
        content = delivery.content
        if template_data:
            content = self._apply_template(content, template_data)

        # Add HTML and text parts
        text_part = MIMEText(content, "plain")
        html_part = MIMEText(self._text_to_html(content), "html")

        msg.attach(text_part)
        msg.attach(html_part)

        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(msg)

        delivery.provider = "smtp"
        delivery.delivered_at = datetime.utcnow()
        delivery.status = "delivered"

        logger.info(f"Email sent to {delivery.recipient}")

    async def _send_sms(
        self,
        delivery: NotificationDelivery,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Send SMS notification via Twilio."""
        if not self.twilio_client:
            raise ValueError("Twilio configuration incomplete")

        from_number = self.twilio_config.get("from_number")
        if not from_number:
            raise ValueError("Twilio from_number not configured")

        # Apply template if provided
        content = delivery.content
        if template_data:
            content = self._apply_template(content, template_data)

        # Send SMS
        message = self.twilio_client.messages.create(
            body=content, from_=from_number, to=delivery.recipient
        )

        delivery.provider = "twilio"
        delivery.provider_id = message.sid
        delivery.provider_response = {
            "sid": message.sid,
            "status": message.status,
            "direction": message.direction,
            "price": message.price,
            "price_unit": message.price_unit,
        }
        delivery.delivered_at = datetime.utcnow()
        delivery.status = "delivered"

        logger.info(f"SMS sent to {delivery.recipient} (SID: {message.sid})")

    async def _send_whatsapp(
        self,
        delivery: NotificationDelivery,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Send WhatsApp message via Twilio."""
        if not self.twilio_client:
            raise ValueError("Twilio configuration incomplete")

        from_number = self.twilio_config.get("whatsapp_from", "whatsapp:+14155238886")

        # Apply template if provided
        content = delivery.content
        if template_data:
            content = self._apply_template(content, template_data)

        # Format recipient for WhatsApp
        to_number = delivery.recipient
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"

        # Send WhatsApp message
        message = self.twilio_client.messages.create(
            body=content, from_=from_number, to=to_number
        )

        delivery.provider = "twilio_whatsapp"
        delivery.provider_id = message.sid
        delivery.provider_response = {
            "sid": message.sid,
            "status": message.status,
            "direction": message.direction,
        }
        delivery.delivered_at = datetime.utcnow()
        delivery.status = "delivered"

        logger.info(f"WhatsApp sent to {delivery.recipient} (SID: {message.sid})")

    async def _send_browser_notification(
        self,
        delivery: NotificationDelivery,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Send browser push notification via Firebase."""
        server_key = self.firebase_config.get("server_key")
        if not server_key:
            raise ValueError("Firebase server key not configured")

        # Apply template if provided
        content = delivery.content
        if template_data:
            content = self._apply_template(content, template_data)

        # Prepare FCM payload
        payload = {
            "to": delivery.recipient,  # FCM token
            "notification": {
                "title": delivery.subject,
                "body": content,
                "icon": "/icons/war-room-icon.png",
                "badge": "/icons/war-room-badge.png",
                "click_action": self.firebase_config.get("click_action", "/dashboard"),
            },
            "data": {
                "organization_id": delivery.organization_id,
                "workflow_execution_id": delivery.workflow_execution_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        }

        headers = {
            "Authorization": f"key={server_key}",
            "Content-Type": "application/json",
        }

        # Send to FCM
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://fcm.googleapis.com/fcm/send", headers=headers, json=payload
            ) as response:
                result = await response.json()

                if response.status == 200 and result.get("success", 0) > 0:
                    delivery.provider = "firebase"
                    delivery.provider_id = result.get("multicast_id")
                    delivery.provider_response = result
                    delivery.delivered_at = datetime.utcnow()
                    delivery.status = "delivered"
                else:
                    raise Exception(f"FCM error: {result}")

        logger.info(f"Browser notification sent to {delivery.recipient[:20]}...")

    async def _send_slack_message(
        self,
        delivery: NotificationDelivery,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Send Slack message via webhook."""
        webhook_url = self.slack_config.get("webhook_url")
        if not webhook_url:
            raise ValueError("Slack webhook URL not configured")

        # Apply template if provided
        content = delivery.content
        if template_data:
            content = self._apply_template(content, template_data)

        # Prepare Slack payload
        payload = {
            "channel": delivery.recipient,  # Channel name or user ID
            "text": delivery.subject,
            "attachments": [
                {
                    "color": "warning"
                    if "crisis" in delivery.subject.lower()
                    else "good",
                    "text": content,
                    "footer": "War Room Platform",
                    "ts": int(datetime.utcnow().timestamp()),
                }
            ],
        }

        # Send to Slack
        async with aiohttp.ClientSession() as session:
            async with session.post(webhook_url, json=payload) as response:
                if response.status == 200:
                    delivery.provider = "slack"
                    delivery.delivered_at = datetime.utcnow()
                    delivery.status = "delivered"
                else:
                    response_text = await response.text()
                    raise Exception(f"Slack error {response.status}: {response_text}")

        logger.info(f"Slack message sent to {delivery.recipient}")

    def _apply_template(self, content: str, template_data: Dict[str, Any]) -> str:
        """Apply template variables to content."""
        try:
            return content.format(**template_data)
        except KeyError as e:
            logger.warning(f"Template variable not found: {e}")
            return content
        except Exception as e:
            logger.error(f"Template application failed: {e}")
            return content

    def _text_to_html(self, text: str) -> str:
        """Convert plain text to basic HTML."""
        # Simple text to HTML conversion
        html = text.replace("\n", "<br>")
        html = f"<html><body>{html}</body></html>"
        return html

    async def send_bulk_notifications(
        self,
        notifications: List[Dict[str, Any]],
        organization_id: str,
        batch_size: int = 50,
    ) -> List[str]:
        """
        Send multiple notifications in batches.
        Returns list of delivery IDs.
        """
        delivery_ids = []

        # Process in batches to avoid overwhelming providers
        for i in range(0, len(notifications), batch_size):
            batch = notifications[i : i + batch_size]

            tasks = []
            for notification in batch:
                task = self.send_notification(
                    channel=NotificationChannel(notification["channel"]),
                    recipient=notification["recipient"],
                    subject=notification["subject"],
                    content=notification["content"],
                    organization_id=organization_id,
                    workflow_execution_id=notification.get("workflow_execution_id"),
                    priority=NotificationPriority(
                        notification.get("priority", "medium")
                    ),
                    template_data=notification.get("template_data"),
                )
                tasks.append(task)

            # Execute batch
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"Bulk notification failed: {result}")
                else:
                    delivery_ids.append(result)

            # Rate limiting delay between batches
            if i + batch_size < len(notifications):
                await asyncio.sleep(1)

        return delivery_ids

    def get_delivery_status(self, delivery_id: str) -> Optional[Dict[str, Any]]:
        """Get notification delivery status."""
        delivery = (
            self.db.query(NotificationDelivery)
            .filter(NotificationDelivery.id == delivery_id)
            .first()
        )

        if not delivery:
            return None

        return delivery.to_dict()

    def get_organization_delivery_stats(
        self, organization_id: str, days: int = 30
    ) -> Dict[str, Any]:
        """Get delivery statistics for organization."""
        from sqlalchemy import func
        from datetime import timedelta

        start_date = datetime.utcnow() - timedelta(days=days)

        # Get delivery counts by channel and status
        query = (
            self.db.query(
                NotificationDelivery.channel,
                NotificationDelivery.status,
                func.count(NotificationDelivery.id).label("count"),
            )
            .filter(
                NotificationDelivery.organization_id == organization_id,
                NotificationDelivery.created_at >= start_date,
            )
            .group_by(NotificationDelivery.channel, NotificationDelivery.status)
        )

        results = query.all()

        # Format statistics
        stats = {
            "total_sent": 0,
            "total_delivered": 0,
            "total_failed": 0,
            "by_channel": {},
            "success_rate": 0.0,
        }

        for channel, status, count in results:
            if channel not in stats["by_channel"]:
                stats["by_channel"][channel] = {
                    "sent": 0,
                    "delivered": 0,
                    "failed": 0,
                    "pending": 0,
                }

            stats["by_channel"][channel][status] = count

            if status == "sent":
                stats["total_sent"] += count
            elif status == "delivered":
                stats["total_delivered"] += count
            elif status == "failed":
                stats["total_failed"] += count

        # Calculate success rate
        total_notifications = (
            stats["total_sent"] + stats["total_delivered"] + stats["total_failed"]
        )
        if total_notifications > 0:
            stats["success_rate"] = (
                (stats["total_sent"] + stats["total_delivered"]) / total_notifications
            ) * 100

        return stats

    async def test_notification_channels(self, organization_id: str) -> Dict[str, Any]:
        """Test all configured notification channels."""
        test_results = {}

        test_cases = [
            {
                "channel": NotificationChannel.EMAIL,
                "recipient": self.email_config.get("test_email"),
                "subject": "War Room Test Email",
                "content": "This is a test email from War Room platform.",
            },
            {
                "channel": NotificationChannel.SMS,
                "recipient": self.twilio_config.get("test_phone"),
                "subject": "War Room Test",
                "content": "This is a test SMS from War Room platform.",
            },
            {
                "channel": NotificationChannel.BROWSER,
                "recipient": self.firebase_config.get("test_token"),
                "subject": "War Room Test Notification",
                "content": "This is a test browser notification from War Room platform.",
            },
            {
                "channel": NotificationChannel.SLACK,
                "recipient": self.slack_config.get("test_channel", "#general"),
                "subject": "War Room Test Message",
                "content": "This is a test Slack message from War Room platform.",
            },
        ]

        for test_case in test_cases:
            if not test_case["recipient"]:
                test_results[test_case["channel"].value] = {
                    "success": False,
                    "error": "No test recipient configured",
                }
                continue

            try:
                delivery_id = await self.send_notification(
                    channel=test_case["channel"],
                    recipient=test_case["recipient"],
                    subject=test_case["subject"],
                    content=test_case["content"],
                    organization_id=organization_id,
                    priority=NotificationPriority.LOW,
                )

                test_results[test_case["channel"].value] = {
                    "success": True,
                    "delivery_id": delivery_id,
                }

            except Exception as e:
                test_results[test_case["channel"].value] = {
                    "success": False,
                    "error": str(e),
                }

        return test_results
