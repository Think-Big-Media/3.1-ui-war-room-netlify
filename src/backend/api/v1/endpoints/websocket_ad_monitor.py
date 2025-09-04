# WebSocket endpoint for real-time ad monitoring

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import List
import json
import logging
from datetime import datetime

from services.real_time_ad_monitor import real_time_monitor, SpendAlert

router = APIRouter(prefix="/ws", tags=["WebSocket Ad Monitoring"])
logger = logging.getLogger(__name__)


@router.websocket("/ad-monitor")
async def websocket_ad_monitor(websocket: WebSocket):
    """WebSocket endpoint for real-time ad spend monitoring"""
    await real_time_monitor.connect_client(websocket)

    try:
        # Start monitoring if not already active
        if not real_time_monitor.monitoring_active:
            import asyncio

            asyncio.create_task(real_time_monitor.start_monitoring())

        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await handle_client_message(websocket, message)
            except json.JSONDecodeError:
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "Invalid JSON format"})
                )

    except WebSocketDisconnect:
        await real_time_monitor.disconnect_client(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await real_time_monitor.disconnect_client(websocket)


async def handle_client_message(websocket: WebSocket, message: dict):
    """Handle messages from WebSocket clients"""
    message_type = message.get("type")

    if message_type == "dismiss_alert":
        alert_id = message.get("alert_id")
        if alert_id:
            dismissed_alert = await real_time_monitor.dismiss_alert(alert_id)
            if dismissed_alert:
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "alert_dismissed_ack",
                            "alert_id": alert_id,
                            "timestamp": datetime.now(),
                        },
                        default=str,
                    )
                )

    elif message_type == "get_current_alerts":
        alerts = await real_time_monitor.get_current_alerts()
        await websocket.send_text(
            json.dumps(
                {
                    "type": "current_alerts",
                    "alerts": [alert.dict() for alert in alerts],
                    "timestamp": datetime.now(),
                },
                default=str,
            )
        )

    elif message_type == "get_stats":
        stats = await real_time_monitor.get_monitoring_stats()
        await websocket.send_text(
            json.dumps(
                {
                    "type": "monitoring_stats",
                    "stats": stats,
                    "timestamp": datetime.now(),
                },
                default=str,
            )
        )

    elif message_type == "ping":
        await websocket.send_text(
            json.dumps({"type": "pong", "timestamp": datetime.now()}, default=str)
        )

    else:
        await websocket.send_text(
            json.dumps(
                {"type": "error", "message": f"Unknown message type: {message_type}"}
            )
        )


# REST endpoints for ad monitoring
@router.get("/ad-monitor/alerts", response_model=List[SpendAlert])
async def get_current_alerts():
    """Get all current active alerts via REST API"""
    return await real_time_monitor.get_current_alerts()


@router.post("/ad-monitor/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    """Dismiss a specific alert"""
    dismissed_alert = await real_time_monitor.dismiss_alert(alert_id)
    if not dismissed_alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return {
        "message": "Alert dismissed successfully",
        "alert_id": alert_id,
        "timestamp": datetime.now(),
    }


@router.get("/ad-monitor/stats")
async def get_monitoring_stats():
    """Get monitoring service statistics"""
    return await real_time_monitor.get_monitoring_stats()


@router.post("/ad-monitor/start")
async def start_monitoring():
    """Start the monitoring service"""
    if real_time_monitor.monitoring_active:
        return {"message": "Monitoring is already active"}

    import asyncio

    asyncio.create_task(real_time_monitor.start_monitoring())

    return {"message": "Monitoring started successfully", "timestamp": datetime.now()}


@router.post("/ad-monitor/stop")
async def stop_monitoring():
    """Stop the monitoring service"""
    await real_time_monitor.stop_monitoring()

    return {"message": "Monitoring stopped successfully", "timestamp": datetime.now()}
