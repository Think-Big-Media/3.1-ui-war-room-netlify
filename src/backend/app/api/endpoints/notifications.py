"""Notification endpoints for Apple Watch integration"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from app.services.apple_notification_service import AppleNotificationService
from core.deps import get_current_user

router = APIRouter()


class NotificationRequest(BaseModel):
    title: str
    message: str
    priority: Optional[int] = 1
    notification_type: Optional[str] = "approval"


@router.post("/apple-watch")
async def send_apple_watch_notification(
    notification: NotificationRequest, current_user=Depends(get_current_user)
):
    """Send notification to Apple Watch via iPhone"""

    service = AppleNotificationService()

    # Map notification types to methods
    if notification.notification_type == "approval":
        success = await service.send_approval_notification(
            title=notification.title,
            message=notification.message,
            priority=notification.priority,
        )
    else:
        success = await service.send_approval_notification(
            title=notification.title,
            message=notification.message,
            priority=notification.priority,
        )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send notification")

    return {
        "status": "sent",
        "title": notification.title,
        "message": notification.message,
    }


@router.post("/test-apple-watch")
async def test_apple_watch(current_user=Depends(get_current_user)):
    """Test Apple Watch notification"""

    service = AppleNotificationService()
    success = await service.send_approval_notification(
        title="🎉 Test Notification",
        message="Your Apple Watch integration is working!",
        priority=1,
        sound="magic",
    )

    return {
        "status": "sent" if success else "failed",
        "message": "Check your Apple Watch!",
    }
