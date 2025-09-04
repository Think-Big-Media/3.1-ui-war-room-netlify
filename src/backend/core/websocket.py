"""
WebSocket connection management for real-time analytics updates.
Handles authentication, connection lifecycle, and message broadcasting.
"""
import json
import asyncio
from typing import Dict, Set, Optional, Any
from datetime import datetime, timedelta
import logging
from contextlib import asynccontextmanager

from fastapi import WebSocket, WebSocketDisconnect, Query, status
from starlette.websockets import WebSocketDisconnect as StarletteWebSocketDisconnect
from jose import JWTError, jwt
import redis.asyncio as redis

from .config import settings


logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections with authentication and broadcasting."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # org_id -> connections
        self.user_connections: Dict[str, WebSocket] = {}  # user_id -> connection
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        self.redis_client: Optional[redis.Redis] = None
        self.heartbeat_tasks: Dict[WebSocket, asyncio.Task] = {}
        # Lock for preventing race conditions in connection management
        self._connection_lock = asyncio.Lock()
        # Set to track connections currently being cleaned up
        self._cleanup_in_progress: Set[WebSocket] = set()

    async def initialize(self):
        """Initialize Redis connection for pub/sub."""
        self.redis_client = await redis.from_url(
            settings.redis_url_with_db["websocket"],
            encoding="utf-8",
            decode_responses=True,
        )

    @asynccontextmanager
    async def cleanup_context(self, websocket: WebSocket):
        """Context manager for safe WebSocket connection cleanup to prevent race conditions."""
        async with self._connection_lock:
            if websocket in self._cleanup_in_progress:
                # Already being cleaned up by another process
                return
            self._cleanup_in_progress.add(websocket)

        try:
            yield
        finally:
            # Remove from cleanup tracking
            async with self._connection_lock:
                self._cleanup_in_progress.discard(websocket)

    async def connect(
        self,
        websocket: WebSocket,
        user_id: str,
        org_id: str,
        client_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Authenticate and establish WebSocket connection.

        Returns user info if authenticated, None otherwise.
        """
        try:
            # Accept connection
            await websocket.accept()

            # Store connection
            if org_id not in self.active_connections:
                self.active_connections[org_id] = set()
            self.active_connections[org_id].add(websocket)
            self.user_connections[user_id] = websocket

            # Store metadata
            self.connection_metadata[websocket] = {
                "user_id": user_id,
                "org_id": org_id,
                "client_id": client_id,
                "connected_at": datetime.utcnow(),
                "last_heartbeat": datetime.utcnow(),
            }

            # Start heartbeat
            self.heartbeat_tasks[websocket] = asyncio.create_task(
                self._heartbeat_loop(websocket)
            )

            # Notify connection
            await self._notify_connection_change(org_id, user_id, "connected")

            logger.info(f"WebSocket connected: user={user_id}, org={org_id}")

            return {"user_id": user_id, "org_id": org_id}

        except JWTError as e:
            logger.error(f"WebSocket JWT error: {e}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
            return None

    async def disconnect(self, websocket: WebSocket):
        """Clean up WebSocket connection."""
        async with self._cleanup_lock:
            metadata = self.connection_metadata.get(websocket)

            if metadata:
                org_id = metadata["org_id"]
                user_id = metadata["user_id"]

                # Cancel heartbeat task first with proper cleanup using context manager
                async with self._connection_lock:
                    if websocket in self.heartbeat_tasks:
                        task = self.heartbeat_tasks[websocket]
                        if not task.done():
                            task.cancel()
                            try:
                                await asyncio.wait_for(task, timeout=0.5)
                            except (asyncio.CancelledError, asyncio.TimeoutError):
                                pass  # Expected when cancelling
                            except Exception as e:
                                logger.error(f"Error cancelling heartbeat task: {e}")
                        
                        # Safe removal with double-check
                        if websocket in self.heartbeat_tasks:
                            del self.heartbeat_tasks[websocket]

                # Remove from active connections
                if org_id in self.active_connections:
                    self.active_connections[org_id].discard(websocket)
                    if not self.active_connections[org_id]:
                        del self.active_connections[org_id]

                # Remove from user connections
                if user_id in self.user_connections and self.user_connections[user_id] == websocket:
                    del self.user_connections[user_id]

                # Clean up metadata
                del self.connection_metadata[websocket]

                # Notify disconnection
                try:
                    if self.redis_client:
                        await self._notify_connection_change(org_id, user_id, "disconnected")
                except Exception as e:
                    logger.error(f"Error notifying disconnection: {e}")

                logger.info(f"WebSocket disconnected: user={user_id}, org={org_id}")

    async def send_personal_message(self, user_id: str, message: Dict[str, Any]):
        """Send message to specific user."""
        websocket = self.user_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_json(
                    {
                        "type": "personal",
                        "data": message,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )
            except (WebSocketDisconnect, ConnectionError) as e:
                logger.info(f"Connection closed while sending message: {e}")
                await self.disconnect(websocket)
            except Exception as e:
                logger.error(f"Error sending personal message: {e}")
                await self.disconnect(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        all_connections = set()
        for org_connections in self.active_connections.values():
            all_connections.update(org_connections)
        
        dead_connections = set()
        for websocket in all_connections:
            try:
                await websocket.send_json(message)
            except (WebSocketDisconnect, ConnectionError) as e:
                logger.info(f"Connection closed during broadcast: {e}")
                dead_connections.add(websocket)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                dead_connections.add(websocket)
        
        # Clean up dead connections
        disconnect_tasks = [self.disconnect(ws) for ws in dead_connections]
        if disconnect_tasks:
            await asyncio.gather(*disconnect_tasks, return_exceptions=True)

    async def broadcast_to_org(self, org_id: str, message: Dict[str, Any]):
        """Broadcast message to all connections in an organization."""
        connections = self.active_connections.get(org_id, set()).copy()  # Create copy to avoid modification during iteration
        dead_connections = set()

        for websocket in connections:
            try:
                await websocket.send_json(
                    {
                        "type": "broadcast",
                        "data": message,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )
            except (WebSocketDisconnect, ConnectionError) as e:
                logger.info(f"Connection closed during broadcast: {e}")
                dead_connections.add(websocket)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                dead_connections.add(websocket)

        # Clean up dead connections
        disconnect_tasks = [self.disconnect(ws) for ws in dead_connections]
        if disconnect_tasks:
            await asyncio.gather(*disconnect_tasks, return_exceptions=True)

    async def send_analytics_update(self, org_id: str, update_type: str, data: Any):
        """Send analytics update to organization."""
        message = {"update_type": update_type, "data": data}
        await self.broadcast_to_org(org_id, message)

        # Also publish to Redis for other instances
        if self.redis_client:
            await self.redis_client.publish(
                f"analytics:updates:{org_id}", json.dumps(message)
            )

    async def handle_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Handle incoming WebSocket message."""
        metadata = self.connection_metadata.get(websocket)
        if not metadata:
            return

        message_type = message.get("type")

        if message_type == "heartbeat":
            # Update heartbeat timestamp
            metadata["last_heartbeat"] = datetime.utcnow()
            await websocket.send_json({"type": "heartbeat_ack"})

        elif message_type == "subscribe":
            # Handle subscription to specific metrics
            metrics = message.get("metrics", [])
            metadata["subscriptions"] = metrics
            await websocket.send_json(
                {"type": "subscription_confirmed", "metrics": metrics}
            )

        elif message_type == "filter_update":
            # Handle filter updates
            filters = message.get("filters", {})
            metadata["filters"] = filters
            # Trigger data refresh with new filters
            await self.send_personal_message(
                metadata["user_id"], {"type": "filters_applied", "filters": filters}
            )

    async def _heartbeat_loop(self, websocket: WebSocket):
        """Send periodic heartbeat to detect disconnections."""
        should_disconnect = False
        try:
            while True:
                await asyncio.sleep(settings.WS_HEARTBEAT_INTERVAL)
                
                # Check if connection still exists
                metadata = self.connection_metadata.get(websocket)
                if not metadata:
                    # Connection already cleaned up
                    logger.debug("Connection metadata not found, stopping heartbeat")
                    break

                # Check for heartbeat timeout
                last_heartbeat = metadata["last_heartbeat"]
                if datetime.utcnow() - last_heartbeat > timedelta(
                    seconds=settings.WS_HEARTBEAT_INTERVAL * 2
                ):
                    logger.warning(
                        f"WebSocket heartbeat timeout: {metadata['user_id']}"
                    )
                    should_disconnect = True
                    break

                # Try to send heartbeat
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except (WebSocketDisconnect, ConnectionError, RuntimeError) as e:
                    # Connection closed by client or runtime error
                    logger.info(f"WebSocket closed: {metadata.get('user_id', 'unknown')} - {type(e).__name__}")
                    should_disconnect = True
                    break
                except Exception as e:
                    logger.error(f"Unexpected error sending heartbeat: {e}")
                    should_disconnect = True
                    break

        except asyncio.CancelledError:
            # Task was cancelled, this is expected during cleanup
            logger.debug("Heartbeat task cancelled gracefully")
            return  # Don't trigger disconnect, it's already being handled
        except Exception as e:
            logger.error(f"Unexpected heartbeat loop error: {e}")
            should_disconnect = True
        finally:
            # Only trigger disconnect if needed and connection still exists - prevent race conditions
            if should_disconnect and websocket in self.connection_metadata:
                async with self._connection_lock:
                    # Double-check connection still exists and not already in cleanup
                    if (websocket in self.connection_metadata and 
                        websocket not in self._cleanup_in_progress):
                        # Use cleanup context to prevent concurrent disconnections
                        asyncio.create_task(self._safe_disconnect(websocket))

    async def _safe_disconnect(self, websocket: WebSocket):
        """Safe disconnect method that prevents race conditions."""
        async with self.cleanup_context(websocket):
            await self.disconnect(websocket)

    async def _notify_connection_change(self, org_id: str, user_id: str, status: str):
        """Notify about connection status changes."""
        if self.redis_client:
            await self.redis_client.publish(
                f"analytics:connections:{org_id}",
                json.dumps(
                    {
                        "user_id": user_id,
                        "status": status,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ),
            )

    async def get_connection_stats(self, org_id: str) -> Dict[str, Any]:
        """Get connection statistics for an organization."""
        connections = self.active_connections.get(org_id, set())

        stats = {
            "total_connections": len(connections),
            "users": [],
            "last_update": datetime.utcnow().isoformat(),
        }

        for websocket in connections:
            metadata = self.connection_metadata.get(websocket)
            if metadata:
                stats["users"].append(
                    {
                        "user_id": metadata["user_id"],
                        "connected_at": metadata["connected_at"].isoformat(),
                        "last_heartbeat": metadata["last_heartbeat"].isoformat(),
                    }
                )

        return stats

    async def disconnect_all(self):
        """Disconnect all active connections."""
        all_websockets = list(self.connection_metadata.keys())
        disconnect_tasks = []
        
        for websocket in all_websockets:
            disconnect_tasks.append(self.disconnect(websocket))
        
        # Wait for all disconnections to complete
        if disconnect_tasks:
            await asyncio.gather(*disconnect_tasks, return_exceptions=True)
    
    async def cleanup(self):
        """Clean up all resources. Call this when shutting down."""
        # Cancel all heartbeat tasks first
        tasks_to_cancel = []
        for websocket, task in list(self.heartbeat_tasks.items()):
            if not task.done():
                task.cancel()
                tasks_to_cancel.append(task)
        
        # Wait for all tasks to complete with timeout
        if tasks_to_cancel:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*tasks_to_cancel, return_exceptions=True),
                    timeout=2.0
                )
            except asyncio.TimeoutError:
                logger.warning("Some heartbeat tasks did not complete in time")
        
        # Clear heartbeat tasks
        self.heartbeat_tasks.clear()
        
        # Clear all connections
        await self.disconnect_all()
        
        # Close Redis connection if exists
        if self.redis_client:
            try:
                await self.redis_client.close()
            except Exception as e:
                logger.error(f"Error closing Redis connection: {e}")

    @property
    def active_connections_count(self) -> int:
        """Get total number of active connections."""
        return len(self.connection_metadata)

    @property
    def has_active_connections(self) -> bool:
        """Check if there are any active connections."""
        return len(self.connection_metadata) > 0


# Global connection manager instance
manager = ConnectionManager()
