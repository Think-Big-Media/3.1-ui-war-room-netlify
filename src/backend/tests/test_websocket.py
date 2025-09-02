"""
Unit tests for WebSocket functionality.
"""
import pytest
import json
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

# Import only what's needed from the ConnectionManager
# The endpoint tests will be skipped if the module doesn't exist
from core.websocket import ConnectionManager
from core.security import create_access_token
from datetime import datetime, timedelta


class MockWebSocket:
    """Mock WebSocket for testing."""

    def __init__(self):
        self.messages_sent = []
        self.state = WebSocketState.CONNECTED
        self.accepted = False
        self.close_code = None

    async def accept(self):
        self.accepted = True

    async def send_json(self, data):
        self.messages_sent.append(data)

    async def receive_json(self):
        return {"type": "ping"}

    async def close(self, code=1000):
        self.close_code = code
        self.state = WebSocketState.DISCONNECTED


class TestConnectionManager:
    """Test suite for ConnectionManager."""

    @pytest.fixture
    async def connection_manager(self):
        """Create connection manager instance with proper cleanup."""
        manager = ConnectionManager()
        yield manager
        # Cleanup after each test
        await manager.cleanup()

    @pytest.mark.asyncio
    async def test_connect(self, connection_manager):
        """Test WebSocket connection."""
        websocket = MockWebSocket()
        user_id = "test-user-123"
        org_id = "test-org-123"

        result = await connection_manager.connect(websocket, user_id, org_id)

        # Verify connection stored
        assert org_id in connection_manager.active_connections
        assert websocket in connection_manager.active_connections[org_id]
        assert user_id in connection_manager.user_connections
        assert connection_manager.user_connections[user_id] == websocket
        assert result == {"user_id": user_id, "org_id": org_id}

    @pytest.mark.asyncio
    async def test_disconnect(self, connection_manager):
        """Test WebSocket disconnection."""
        websocket = MockWebSocket()
        user_id = "test-user-123"
        org_id = "test-org-123"

        # Connect first
        await connection_manager.connect(websocket, user_id, org_id)
        
        # Wait for heartbeat task to start
        await asyncio.sleep(0.1)

        # Disconnect
        await connection_manager.disconnect(websocket)

        # Verify disconnection
        assert user_id not in connection_manager.user_connections
        assert websocket not in connection_manager.connection_metadata
        assert websocket not in connection_manager.heartbeat_tasks

    @pytest.mark.asyncio
    async def test_send_personal_message(self, connection_manager):
        """Test sending personal message."""
        websocket = MockWebSocket()
        user_id = "test-user-123"
        org_id = "test-org-123"
        message = {"type": "update", "data": {"value": 42}}

        # Connect first
        await connection_manager.connect(websocket, user_id, org_id)

        # Send message
        await connection_manager.send_personal_message(user_id, message)

        # Verify message sent (with wrapper)
        assert len(websocket.messages_sent) == 1
        sent_msg = websocket.messages_sent[0]
        assert sent_msg["type"] == "personal"
        assert sent_msg["data"] == message
        assert "timestamp" in sent_msg

    @pytest.mark.asyncio
    async def test_send_personal_message_no_connection(self, connection_manager):
        """Test sending message to non-connected user."""
        user_id = "nonexistent-user"
        message = {"type": "update"}

        # Should not raise exception
        await connection_manager.send_personal_message(user_id, message)

    @pytest.mark.asyncio
    async def test_broadcast(self, connection_manager):
        """Test broadcasting to all connections."""
        # Connect multiple users
        users = []
        for i in range(3):
            websocket = MockWebSocket()
            user_id = f"user-{i}"
            org_id = "test-org-123"
            users.append((websocket, user_id))
            await connection_manager.connect(websocket, user_id, org_id)

        # Broadcast message
        message = {"type": "broadcast", "data": "Hello all!"}
        await connection_manager.broadcast(message)

        # Verify all received message
        for websocket, _ in users:
            assert len(websocket.messages_sent) == 1
            assert websocket.messages_sent[0] == message

    @pytest.mark.asyncio
    async def test_broadcast_to_org(self, connection_manager):
        """Test broadcasting to organization."""
        # Connect users from different orgs
        org1_users = []
        org2_users = []

        for i in range(2):
            # Org 1 users
            ws1 = MockWebSocket()
            user1 = f"org1-user-{i}"
            org1_users.append((ws1, user1))
            await connection_manager.connect(ws1, user1, "org-1")

            # Org 2 users
            ws2 = MockWebSocket()
            user2 = f"org2-user-{i}"
            org2_users.append((ws2, user2))
            await connection_manager.connect(ws2, user2, "org-2")

        # Broadcast to org 1 only
        message = {"type": "org_update", "data": "Org 1 only"}
        await connection_manager.broadcast_to_org("org-1", message)

        # Verify org 1 users received message (with wrapper)
        for websocket, _ in org1_users:
            assert len(websocket.messages_sent) == 1
            sent_msg = websocket.messages_sent[0]
            assert sent_msg["type"] == "broadcast"
            assert sent_msg["data"] == message
            assert "timestamp" in sent_msg

        # Verify org 2 users did not receive message
        for websocket, _ in org2_users:
            assert len(websocket.messages_sent) == 0

    @pytest.mark.asyncio
    async def test_connection_error_handling(self, connection_manager):
        """Test error handling during message send."""
        websocket = MockWebSocket()
        user_id = "test-user-123"
        org_id = "test-org-123"

        # Connect
        await connection_manager.connect(websocket, user_id, org_id)

        # Mock send error
        websocket.send_json = AsyncMock(side_effect=WebSocketDisconnect())

        # Try to send message
        await connection_manager.send_personal_message(user_id, {"test": "data"})
        
        # Wait for async cleanup to complete
        await asyncio.sleep(0.1)

        # User should be disconnected
        assert user_id not in connection_manager.user_connections

    def test_has_active_connections_property(self, connection_manager):
        """Test has_active_connections property."""
        # Initially no connections
        assert not connection_manager.has_active_connections

        # Add a connection
        websocket = MockWebSocket()
        connection_manager.connection_metadata[websocket] = {
            "user_id": "user-1",
            "org_id": "org-1",
            "connected_at": datetime.utcnow(),
            "last_heartbeat": datetime.utcnow(),
        }

        # Now has connections
        assert connection_manager.has_active_connections
    
    @pytest.mark.asyncio
    async def test_heartbeat_task_cancellation(self, connection_manager):
        """Test heartbeat task is properly cancelled on disconnect."""
        websocket = MockWebSocket()
        user_id = "test-user-123"
        org_id = "test-org-123"
        
        # Connect
        await connection_manager.connect(websocket, user_id, org_id)
        
        # Verify heartbeat task exists and is running
        assert websocket in connection_manager.heartbeat_tasks
        heartbeat_task = connection_manager.heartbeat_tasks[websocket]
        assert not heartbeat_task.done()
        
        # Disconnect
        await connection_manager.disconnect(websocket)
        
        # Verify heartbeat task is cancelled and removed
        assert websocket not in connection_manager.heartbeat_tasks
        assert heartbeat_task.done()
    
    @pytest.mark.asyncio
    async def test_cleanup_all_connections(self, connection_manager):
        """Test cleanup method properly cleans all connections."""
        # Connect multiple users
        websockets = []
        for i in range(3):
            ws = MockWebSocket()
            websockets.append(ws)
            await connection_manager.connect(ws, f"user-{i}", "test-org")
        
        # Verify connections exist
        assert connection_manager.active_connections_count == 3
        assert len(connection_manager.heartbeat_tasks) == 3
        
        # Run cleanup
        await connection_manager.cleanup()
        
        # Verify all cleaned up
        assert connection_manager.active_connections_count == 0
        assert len(connection_manager.heartbeat_tasks) == 0
        assert len(connection_manager.active_connections) == 0
    
    @pytest.mark.asyncio
    async def test_heartbeat_timeout_detection(self, connection_manager):
        """Test heartbeat timeout triggers disconnection."""
        # Mock settings for faster testing
        with patch('core.websocket.settings.WS_HEARTBEAT_INTERVAL', 0.1):
            websocket = MockWebSocket()
            user_id = "test-user-123"
            org_id = "test-org-123"
            
            # Connect
            await connection_manager.connect(websocket, user_id, org_id)
            
            # Set last heartbeat to past time to trigger timeout
            connection_manager.connection_metadata[websocket]["last_heartbeat"] = (
                datetime.utcnow() - timedelta(seconds=10)
            )
            
            # Wait for heartbeat loop to detect timeout
            await asyncio.sleep(0.2)
            
            # Verify disconnection scheduled
            # Note: actual disconnection happens asynchronously
            await asyncio.sleep(0.1)
            
            # Should be disconnected
            assert websocket not in connection_manager.connection_metadata


@pytest.mark.skip(reason="WebSocket endpoint tests require endpoint module")
class TestWebSocketEndpoint:
    """Test suite for WebSocket endpoint."""

    @pytest.fixture
    def valid_token(self, test_user):
        """Create valid JWT token."""
        return create_access_token(
            data={
                "sub": test_user.email,
                "user_id": test_user.id,
                "org_id": test_user.org_id,
                "role": test_user.role,
                "permissions": test_user.permissions,
            }
        )

    @pytest.fixture
    def invalid_token(self):
        """Create invalid JWT token."""
        return "invalid.jwt.token"

    @pytest.mark.asyncio
    async def test_websocket_authentication_success(self, valid_token):
        """Test successful WebSocket authentication."""
        with patch("app.api.v1.endpoints.websocket.jwt.decode") as mock_decode:
            mock_decode.return_value = {
                "user_id": "test-user-123",
                "org_id": "test-org-123",
                "permissions": ["analytics.view"],
            }

            user = await get_current_user_websocket(valid_token)

            assert user["user_id"] == "test-user-123"
            assert user["org_id"] == "test-org-123"
            assert "analytics.view" in user["permissions"]

    @pytest.mark.asyncio
    async def test_websocket_authentication_failure(self, invalid_token):
        """Test failed WebSocket authentication."""
        with pytest.raises(Exception):
            await get_current_user_websocket(invalid_token)

    @pytest.mark.asyncio
    async def test_websocket_permission_denied(self, valid_token):
        """Test WebSocket connection denied without permission."""
        websocket = MockWebSocket()

        with patch(
            "app.api.v1.endpoints.websocket.get_current_user_websocket"
        ) as mock_auth:
            mock_auth.return_value = {
                "user_id": "test-user",
                "org_id": "test-org",
                "permissions": [],  # No analytics.view permission
            }

            await analytics_websocket(websocket, valid_token)

            assert websocket.accepted
            assert websocket.close_code == 4003  # Forbidden

    @pytest.mark.asyncio
    async def test_websocket_heartbeat(self, valid_token):
        """Test WebSocket heartbeat mechanism."""
        websocket = MockWebSocket()

        # Set up to receive ping and then disconnect
        ping_received = False

        async def mock_receive():
            nonlocal ping_received
            if not ping_received:
                ping_received = True
                return {"type": "ping"}
            else:
                raise WebSocketDisconnect()

        websocket.receive_json = mock_receive

        with patch(
            "app.api.v1.endpoints.websocket.get_current_user_websocket"
        ) as mock_auth:
            mock_auth.return_value = {
                "user_id": "test-user",
                "org_id": "test-org",
                "permissions": ["analytics.view"],
            }

            with patch(
                "app.api.v1.endpoints.websocket.connection_manager"
            ) as mock_manager:
                await analytics_websocket(websocket, valid_token)

                # Verify ping was handled
                assert ping_received
                assert any(msg["type"] == "pong" for msg in websocket.messages_sent)
