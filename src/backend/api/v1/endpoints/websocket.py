"""
WebSocket endpoint for real-time analytics updates.
Handles authentication via query parameters and broadcasts updates to connected clients.
"""
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect, Query, Depends, status
from jose import JWTError, jwt
from datetime import datetime
import asyncio
import json

from core.config import settings
from core.websocket import manager
from services.analytics_service import analytics_service
from models.analytics import WebSocketMessage
from core.security import verify_token


async def get_current_user_websocket(token: str = Query(...)) -> Dict[str, str]:
    """
    Validate JWT token from WebSocket query parameter.

    Args:
        token: JWT token passed as query parameter

    Returns:
        Decoded token payload with user info

    Raises:
        WebSocketException: If token is invalid
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        org_id = payload.get("orgId")

        if not user_id or not org_id:
            raise JWTError("Invalid token payload")

        return {
            "user_id": user_id,
            "org_id": org_id,
            "email": payload.get("email"),
            "role": payload.get("role"),
            "permissions": payload.get("permissions", []),
        }
    except JWTError:
        return None


async def analytics_websocket(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time analytics updates.

    Handles:
    - JWT authentication via query parameters
    - Connection lifecycle management
    - Real-time metric broadcasting
    - Heartbeat/keepalive mechanism
    """
    # Validate token
    user_data = await get_current_user_websocket(token)
    if not user_data:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Check analytics permission
    if "analytics.view" not in user_data.get("permissions", []):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = user_data["user_id"]
    org_id = user_data["org_id"]

    # Accept connection and add to manager
    await manager.connect(websocket, user_id, org_id)

    try:
        # Send initial connection success message
        await websocket.send_json(
            {
                "type": "connection",
                "data": {
                    "status": "connected",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                },
            }
        )

        # Start background task for sending periodic updates
        update_task = asyncio.create_task(send_periodic_updates(websocket, org_id))

        # Handle incoming messages (mainly for heartbeat)
        while True:
            try:
                # Wait for client messages with timeout
                message = await asyncio.wait_for(
                    websocket.receive_text(), timeout=settings.WS_HEARTBEAT_INTERVAL
                )

                # Handle different message types
                data = json.loads(message)
                message_type = data.get("type")

                if message_type == "ping":
                    # Respond to heartbeat
                    await websocket.send_json(
                        {"type": "pong", "timestamp": datetime.utcnow().isoformat()}
                    )
                elif message_type == "subscribe":
                    # Handle subscription to specific metrics
                    metrics = data.get("metrics", [])
                    await handle_subscription(websocket, org_id, metrics)

            except asyncio.TimeoutError:
                # Send ping to check if client is still alive
                try:
                    await websocket.send_json(
                        {"type": "ping", "timestamp": datetime.utcnow().isoformat()}
                    )
                except:
                    break

    except WebSocketDisconnect:
        # Clean disconnect
        pass
    except Exception as e:
        # Log error
        print(f"WebSocket error for user {user_id}: {str(e)}")
    finally:
        # Cancel update task
        update_task.cancel()
        # Remove from manager
        manager.disconnect(user_id)

        # Send notification to other org members about user disconnect
        await manager.broadcast_to_org(
            org_id,
            WebSocketMessage(
                type="user_status",
                data={
                    "user_id": user_id,
                    "status": "offline",
                    "timestamp": datetime.utcnow().isoformat(),
                },
            ).model_dump(),
            exclude_user=user_id,
        )


async def send_periodic_updates(websocket: WebSocket, org_id: str):
    """
    Send periodic analytics updates to connected client.

    Args:
        websocket: WebSocket connection
        org_id: Organization ID for filtering data
    """
    try:
        while True:
            # Wait for update interval
            await asyncio.sleep(settings.ANALYTICS_UPDATE_INTERVAL)

            # Get latest metrics
            latest_metrics = await analytics_service.get_real_time_metrics(org_id)

            # Send update
            await websocket.send_json(
                {
                    "type": "metrics_update",
                    "data": latest_metrics,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )

    except asyncio.CancelledError:
        # Task cancelled, clean exit
        pass
    except Exception as e:
        print(f"Error sending periodic updates: {str(e)}")


async def handle_subscription(websocket: WebSocket, org_id: str, metrics: list):
    """
    Handle client subscription to specific metrics.

    Args:
        websocket: WebSocket connection
        org_id: Organization ID
        metrics: List of metric names to subscribe to
    """
    # Validate requested metrics
    valid_metrics = [
        "volunteers",
        "events",
        "donations",
        "reach",
        "activity_feed",
        "geographic_data",
    ]

    requested_metrics = [m for m in metrics if m in valid_metrics]

    if requested_metrics:
        # Get initial data for requested metrics
        initial_data = await analytics_service.get_specific_metrics(
            org_id, requested_metrics
        )

        # Send initial data
        await websocket.send_json(
            {
                "type": "subscription_data",
                "data": initial_data,
                "metrics": requested_metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        # Confirm subscription
        await websocket.send_json(
            {
                "type": "subscription_confirmed",
                "metrics": requested_metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )


async def broadcast_analytics_update(org_id: str, update_type: str, data: dict):
    """
    Broadcast analytics updates to all connected users in an organization.

    This is called by other services when data changes.

    Args:
        org_id: Organization ID
        update_type: Type of update (e.g., "volunteer_added", "event_created")
        data: Update data
    """
    message = WebSocketMessage(
        type="analytics_update",
        data={"update_type": update_type, "payload": data, "org_id": org_id},
    )

    await manager.broadcast_to_org(org_id, message.model_dump())


# Activity feed updates
async def broadcast_activity(org_id: str, activity: dict):
    """
    Broadcast new activity feed items.

    Args:
        org_id: Organization ID
        activity: Activity data
    """
    message = WebSocketMessage(type="activity_feed", data=activity)

    await manager.broadcast_to_org(org_id, message.model_dump())
