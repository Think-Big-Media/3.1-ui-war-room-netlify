"""Apple Watch Notification Service via Push Notifications"""
import os
import json
import httpx
from typing import Optional
from datetime import datetime


class AppleNotificationService:
    """Send push notifications to iPhone/Apple Watch"""

    def __init__(self):
        # Using Pushover API for simplicity (alternative to Firebase)
        self.pushover_token = os.getenv("PUSHOVER_APP_TOKEN", "")
        self.pushover_user = os.getenv("PUSHOVER_USER_KEY", "")
        self.webhook_url = os.getenv("APPLE_WEBHOOK_URL", "")

    async def send_approval_notification(
        self, title: str, message: str, priority: int = 1, sound: str = "pushover"
    ) -> bool:
        """
        Send push notification that shows on iPhone and Apple Watch

        Priority levels:
        -2: Silent, no notification
        -1: Quiet, no sound/vibration
        0: Normal priority
        1: High priority (bypass quiet hours)
        2: Emergency (requires acknowledgment)
        """

        # Option 1: Pushover API (easiest, $5 one-time purchase)
        if self.pushover_token and self.pushover_user:
            return await self._send_pushover(title, message, priority, sound)

        # Option 2: Custom webhook (if you have your own iOS app)
        if self.webhook_url:
            return await self._send_webhook(title, message, priority)

        # Option 3: Email fallback
        return await self._send_email_notification(title, message)

    async def _send_pushover(
        self, title: str, message: str, priority: int, sound: str
    ) -> bool:
        """Send via Pushover API"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://api.pushover.net/1/messages.json",
                    data={
                        "token": self.pushover_token,
                        "user": self.pushover_user,
                        "title": title,
                        "message": message,
                        "priority": priority,
                        "sound": sound,
                        "timestamp": int(datetime.now().timestamp()),
                    },
                )
                return response.status_code == 200
            except Exception as e:
                print(f"Pushover error: {e}")
                return False

    async def _send_webhook(self, title: str, message: str, priority: int) -> bool:
        """Send to custom webhook endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.webhook_url,
                    json={
                        "title": title,
                        "body": message,
                        "priority": priority,
                        "timestamp": datetime.now().isoformat(),
                    },
                )
                return response.status_code in [200, 201]
            except Exception as e:
                print(f"Webhook error: {e}")
                return False

    async def _send_email_notification(self, title: str, message: str) -> bool:
        """Fallback: Send email to Apple ID"""
        # This would use your existing email service
        # Email notifications show on Apple Watch
        pass

    # Pre-configured notification types
    async def notify_approval_batch(self, batch_size: int, batch_type: str):
        """Notify about approval batch"""
        return await self.send_approval_notification(
            title="🔔 Claude Code Approval",
            message=f"{batch_size} {batch_type} ready for approval",
            priority=1,
            sound="tugboat",  # Distinctive sound
        )

    async def notify_task_complete(self, task_name: str):
        """Notify task completion"""
        return await self.send_approval_notification(
            title="✅ Task Complete",
            message=f"{task_name} finished - review needed",
            priority=0,
            sound="cosmic",
        )

    async def notify_error(self, error_msg: str):
        """Notify about errors"""
        return await self.send_approval_notification(
            title="❌ Error Occurred",
            message=error_msg,
            priority=2,  # Emergency
            sound="persistent",
        )
