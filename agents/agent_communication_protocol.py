"""Inter-Agent Communication Protocol

Advanced communication system for War Room sub-agents to share patterns,
coordinate activities, and exchange knowledge seamlessly.
"""

import asyncio
import json
import logging
import uuid
import time
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime, timedelta
import aiohttp
import websockets
from pathlib import Path

logger = logging.getLogger(__name__)

class MessageType(Enum):
    """Types of inter-agent messages"""
    PATTERN_SHARE = "pattern_share"
    PATTERN_REQUEST = "pattern_request"
    PATTERN_FEEDBACK = "pattern_feedback"
    KNOWLEDGE_QUERY = "knowledge_query"
    RECOMMENDATION_REQUEST = "recommendation_request"
    STATUS_UPDATE = "status_update"
    COORDINATION_REQUEST = "coordination_request"
    INSIGHT_BROADCAST = "insight_broadcast"
    HEALTH_CHECK = "health_check"
    SYSTEM_ALERT = "system_alert"

class MessagePriority(Enum):
    """Message priority levels"""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

class AgentRole(Enum):
    """Roles of War Room agents"""
    KNOWLEDGE_MANAGER = "knowledge_manager"
    HEALTH_MONITOR = "health_monitor"
    AMP_REFACTORING = "amp_refactoring"
    CODERABBIT_INTEGRATION = "coderabbit_integration"
    SECURITY_ANALYZER = "security_analyzer"
    PERFORMANCE_MONITOR = "performance_monitor"

@dataclass
class AgentMessage:
    """Standard message format for inter-agent communication"""
    id: str
    sender_id: str
    receiver_id: Optional[str]  # None for broadcast
    message_type: MessageType
    priority: MessagePriority
    payload: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    correlation_id: Optional[str] = None
    reply_to: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

@dataclass
class AgentRegistration:
    """Agent registration information"""
    agent_id: str
    agent_role: AgentRole
    agent_name: str
    capabilities: List[str]
    endpoint: str
    status: str = "active"
    last_heartbeat: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class PatternSharePayload:
    """Payload for pattern sharing messages"""
    pattern_id: str
    pattern_name: str
    pattern_description: str
    pattern_content: str
    category: str
    language: Optional[str]
    tags: List[str]
    metadata: Dict[str, Any]
    confidence_score: float
    source_context: str

@dataclass
class RecommendationRequestPayload:
    """Payload for recommendation requests"""
    context: str
    problem_description: str
    preferred_categories: List[str]
    language_preference: Optional[str]
    urgency_level: str
    additional_constraints: Dict[str, Any]

class AgentCommunicationHub:
    """Central communication hub for War Room agents"""
    
    def __init__(self, hub_port: int = 8765):
        self.hub_port = hub_port
        self.agents: Dict[str, AgentRegistration] = {}
        self.message_handlers: Dict[MessageType, List[Callable]] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.active_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        
        # Message routing and filtering
        self.message_filters: List[Callable] = []
        self.routing_rules: Dict[str, List[str]] = {}  # sender -> list of receivers
        
        # Statistics
        self.stats = {
            "messages_sent": 0,
            "messages_received": 0,
            "messages_failed": 0,
            "agents_registered": 0,
            "active_connections": 0,
            "last_activity": None
        }
        
        # Configuration
        self.heartbeat_interval = 30  # seconds
        self.message_retention_hours = 24
        self.max_queue_size = 1000
        
        # Initialize handlers
        self._setup_default_handlers()
    
    def _setup_default_handlers(self):
        """Setup default message handlers"""
        self.register_handler(MessageType.HEALTH_CHECK, self._handle_health_check)
        self.register_handler(MessageType.STATUS_UPDATE, self._handle_status_update)
        self.register_handler(MessageType.SYSTEM_ALERT, self._handle_system_alert)
    
    async def start_hub(self):
        """Start the communication hub"""
        logger.info(f"Starting Agent Communication Hub on port {self.hub_port}")
        
        # Start WebSocket server
        self.server = await websockets.serve(
            self._handle_client_connection,
            "localhost",
            self.hub_port
        )
        
        # Start background tasks
        asyncio.create_task(self._message_processor())
        asyncio.create_task(self._heartbeat_monitor())
        asyncio.create_task(self._cleanup_expired_messages())
        
        logger.info("Agent Communication Hub started successfully")
    
    async def stop_hub(self):
        """Stop the communication hub"""
        logger.info("Stopping Agent Communication Hub")
        
        if hasattr(self, 'server'):
            self.server.close()
            await self.server.wait_closed()
        
        # Close all connections
        for connection in self.active_connections.values():
            await connection.close()
        
        logger.info("Agent Communication Hub stopped")
    
    async def _handle_client_connection(self, websocket, path):
        """Handle new agent connection"""
        try:
            agent_id = None
            
            # Wait for agent registration
            registration_msg = await websocket.recv()
            registration_data = json.loads(registration_msg)
            
            if registration_data.get("type") == "register":
                agent_id = registration_data.get("agent_id")
                agent_info = registration_data.get("agent_info", {})
                
                # Register the agent
                registration = AgentRegistration(
                    agent_id=agent_id,
                    agent_role=AgentRole(agent_info.get("role", "knowledge_manager")),
                    agent_name=agent_info.get("name", agent_id),
                    capabilities=agent_info.get("capabilities", []),
                    endpoint=f"ws://localhost:{self.hub_port}",
                    metadata=agent_info.get("metadata", {})
                )
                
                await self.register_agent(registration)
                self.active_connections[agent_id] = websocket
                
                # Send registration confirmation
                await websocket.send(json.dumps({
                    "type": "registration_confirmed",
                    "agent_id": agent_id,
                    "timestamp": datetime.utcnow().isoformat()
                }))
                
                logger.info(f"Agent {agent_id} connected and registered")
                
                # Handle incoming messages
                async for message in websocket:
                    try:
                        await self._process_incoming_message(agent_id, message)
                    except Exception as e:
                        logger.error(f"Error processing message from {agent_id}: {e}")
            
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Agent {agent_id} disconnected")
        except Exception as e:
            logger.error(f"Connection handling error: {e}")
        finally:
            if agent_id and agent_id in self.active_connections:
                del self.active_connections[agent_id]
                await self.unregister_agent(agent_id)
    
    async def _process_incoming_message(self, sender_id: str, message_data: str):
        """Process incoming message from agent"""
        try:
            msg_dict = json.loads(message_data)
            
            # Create AgentMessage object
            message = AgentMessage(
                id=msg_dict.get("id", str(uuid.uuid4())),
                sender_id=sender_id,
                receiver_id=msg_dict.get("receiver_id"),
                message_type=MessageType(msg_dict.get("message_type")),
                priority=MessagePriority(msg_dict.get("priority", MessagePriority.MEDIUM.value)),
                payload=msg_dict.get("payload", {}),
                correlation_id=msg_dict.get("correlation_id"),
                reply_to=msg_dict.get("reply_to")
            )
            
            # Add to message queue
            await self.message_queue.put(message)
            self.stats["messages_received"] += 1
            self.stats["last_activity"] = datetime.utcnow().isoformat()
            
        except Exception as e:
            logger.error(f"Error processing incoming message: {e}")
    
    async def _message_processor(self):
        """Process messages from the queue"""
        while True:
            try:
                message = await self.message_queue.get()
                
                # Apply message filters
                if not await self._apply_message_filters(message):
                    continue
                
                # Route message
                await self._route_message(message)
                
                # Execute handlers
                await self._execute_message_handlers(message)
                
                self.stats["messages_sent"] += 1
                
            except Exception as e:
                logger.error(f"Message processing error: {e}")
                self.stats["messages_failed"] += 1
            
            await asyncio.sleep(0.01)  # Brief pause to prevent CPU overload
    
    async def _route_message(self, message: AgentMessage):
        """Route message to appropriate recipients"""
        try:
            # Determine recipients
            recipients = []
            
            if message.receiver_id:
                # Direct message
                recipients = [message.receiver_id]
            else:
                # Broadcast or filtered broadcast
                recipients = list(self.active_connections.keys())
                
                # Apply routing rules
                if message.sender_id in self.routing_rules:
                    allowed_receivers = self.routing_rules[message.sender_id]
                    recipients = [r for r in recipients if r in allowed_receivers]
            
            # Send message to recipients
            for recipient_id in recipients:
                if recipient_id in self.active_connections:
                    try:
                        websocket = self.active_connections[recipient_id]
                        message_json = json.dumps(asdict(message), default=str)
                        await websocket.send(message_json)
                    except Exception as e:
                        logger.error(f"Failed to send message to {recipient_id}: {e}")
            
        except Exception as e:
            logger.error(f"Message routing error: {e}")
    
    async def _execute_message_handlers(self, message: AgentMessage):
        """Execute registered handlers for message type"""
        try:
            handlers = self.message_handlers.get(message.message_type, [])
            
            for handler in handlers:
                try:
                    await handler(message)
                except Exception as e:
                    logger.error(f"Handler execution error: {e}")
        
        except Exception as e:
            logger.error(f"Error executing message handlers: {e}")
    
    async def _apply_message_filters(self, message: AgentMessage) -> bool:
        """Apply message filters to determine if message should be processed"""
        try:
            for filter_func in self.message_filters:
                if not await filter_func(message):
                    return False
            return True
        except Exception as e:
            logger.error(f"Message filter error: {e}")
            return True  # Default to allowing message
    
    async def register_agent(self, registration: AgentRegistration):
        """Register a new agent"""
        self.agents[registration.agent_id] = registration
        self.stats["agents_registered"] = len(self.agents)
        logger.info(f"Registered agent: {registration.agent_id} ({registration.agent_role.value})")
    
    async def unregister_agent(self, agent_id: str):
        """Unregister an agent"""
        if agent_id in self.agents:
            del self.agents[agent_id]
            self.stats["agents_registered"] = len(self.agents)
            logger.info(f"Unregistered agent: {agent_id}")
    
    def register_handler(self, message_type: MessageType, handler: Callable):
        """Register a message handler"""
        if message_type not in self.message_handlers:
            self.message_handlers[message_type] = []
        self.message_handlers[message_type].append(handler)
    
    def add_message_filter(self, filter_func: Callable):
        """Add a message filter"""
        self.message_filters.append(filter_func)
    
    def set_routing_rule(self, sender_id: str, allowed_receivers: List[str]):
        """Set routing rules for an agent"""
        self.routing_rules[sender_id] = allowed_receivers
    
    async def send_message(self, message: AgentMessage):
        """Send a message through the hub"""
        await self.message_queue.put(message)
    
    async def broadcast_message(self, sender_id: str, message_type: MessageType, 
                             payload: Dict[str, Any], priority: MessagePriority = MessagePriority.MEDIUM):
        """Broadcast a message to all agents"""
        message = AgentMessage(
            id=str(uuid.uuid4()),
            sender_id=sender_id,
            receiver_id=None,  # Broadcast
            message_type=message_type,
            priority=priority,
            payload=payload
        )
        await self.send_message(message)
    
    # Default message handlers
    
    async def _handle_health_check(self, message: AgentMessage):
        """Handle health check messages"""
        logger.debug(f"Health check from {message.sender_id}")
        
        if message.sender_id in self.agents:
            self.agents[message.sender_id].last_heartbeat = datetime.utcnow()
    
    async def _handle_status_update(self, message: AgentMessage):
        """Handle status update messages"""
        agent_id = message.sender_id
        new_status = message.payload.get("status", "unknown")
        
        if agent_id in self.agents:
            self.agents[agent_id].status = new_status
            logger.info(f"Agent {agent_id} status updated to: {new_status}")
    
    async def _handle_system_alert(self, message: AgentMessage):
        """Handle system alert messages"""
        alert_type = message.payload.get("alert_type", "unknown")
        alert_message = message.payload.get("message", "No details")
        
        logger.warning(f"System alert from {message.sender_id}: {alert_type} - {alert_message}")
        
        # Broadcast critical alerts to all agents
        if message.priority == MessagePriority.CRITICAL:
            await self.broadcast_message(
                sender_id="communication_hub",
                message_type=MessageType.SYSTEM_ALERT,
                payload=message.payload,
                priority=MessagePriority.CRITICAL
            )
    
    # Background tasks
    
    async def _heartbeat_monitor(self):
        """Monitor agent heartbeats"""
        while True:
            try:
                current_time = datetime.utcnow()
                timeout_threshold = current_time - timedelta(seconds=self.heartbeat_interval * 2)
                
                inactive_agents = []
                for agent_id, agent in self.agents.items():
                    if agent.last_heartbeat < timeout_threshold:
                        inactive_agents.append(agent_id)
                
                # Mark inactive agents
                for agent_id in inactive_agents:
                    if self.agents[agent_id].status != "inactive":
                        self.agents[agent_id].status = "inactive"
                        logger.warning(f"Agent {agent_id} marked as inactive")
                
                # Update connection stats
                self.stats["active_connections"] = len(self.active_connections)
                
            except Exception as e:
                logger.error(f"Heartbeat monitoring error: {e}")
            
            await asyncio.sleep(self.heartbeat_interval)
    
    async def _cleanup_expired_messages(self):
        """Clean up expired messages and old data"""
        while True:
            try:
                # This would clean up message history if we were storing it
                logger.debug("Message cleanup task running")
                
            except Exception as e:
                logger.error(f"Message cleanup error: {e}")
            
            await asyncio.sleep(3600)  # Run every hour
    
    def get_hub_statistics(self) -> Dict[str, Any]:
        """Get hub statistics"""
        return {
            **self.stats,
            "registered_agents": len(self.agents),
            "active_agents": len([a for a in self.agents.values() if a.status == "active"]),
            "message_types_handled": len(self.message_handlers),
            "routing_rules": len(self.routing_rules),
            "message_filters": len(self.message_filters)
        }

class AgentCommunicationClient:
    """Client for agents to communicate through the hub"""
    
    def __init__(self, agent_id: str, agent_role: AgentRole, hub_url: str = "ws://localhost:8765"):
        self.agent_id = agent_id
        self.agent_role = agent_role
        self.hub_url = hub_url
        self.websocket = None
        self.message_handlers: Dict[MessageType, List[Callable]] = {}
        self.is_connected = False
        
        # Agent info
        self.capabilities = []
        self.metadata = {}
        
        # Statistics
        self.stats = {
            "messages_sent": 0,
            "messages_received": 0,
            "connection_attempts": 0,
            "last_heartbeat": None
        }
    
    async def connect(self, capabilities: List[str] = None, metadata: Dict[str, Any] = None):
        """Connect to the communication hub"""
        try:
            self.capabilities = capabilities or []
            self.metadata = metadata or {}
            
            self.websocket = await websockets.connect(self.hub_url)
            self.stats["connection_attempts"] += 1
            
            # Send registration
            registration_msg = {
                "type": "register",
                "agent_id": self.agent_id,
                "agent_info": {
                    "role": self.agent_role.value,
                    "name": self.agent_id,
                    "capabilities": self.capabilities,
                    "metadata": self.metadata
                }
            }
            
            await self.websocket.send(json.dumps(registration_msg))
            
            # Wait for confirmation
            response = await self.websocket.recv()
            response_data = json.loads(response)
            
            if response_data.get("type") == "registration_confirmed":
                self.is_connected = True
                logger.info(f"Agent {self.agent_id} connected to communication hub")
                
                # Start background tasks
                asyncio.create_task(self._message_listener())
                asyncio.create_task(self._heartbeat_sender())
                
                return True
            else:
                logger.error("Registration not confirmed")
                return False
                
        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from the hub"""
        try:
            if self.websocket:
                await self.websocket.close()
            self.is_connected = False
            logger.info(f"Agent {self.agent_id} disconnected from communication hub")
        except Exception as e:
            logger.error(f"Disconnection error: {e}")
    
    async def send_message(self, receiver_id: Optional[str], message_type: MessageType,
                          payload: Dict[str, Any], priority: MessagePriority = MessagePriority.MEDIUM,
                          correlation_id: Optional[str] = None, reply_to: Optional[str] = None):
        """Send a message through the hub"""
        try:
            if not self.is_connected:
                logger.error("Not connected to communication hub")
                return False
            
            message = {
                "id": str(uuid.uuid4()),
                "receiver_id": receiver_id,
                "message_type": message_type.value,
                "priority": priority.value,
                "payload": payload,
                "correlation_id": correlation_id,
                "reply_to": reply_to
            }
            
            await self.websocket.send(json.dumps(message, default=str))
            self.stats["messages_sent"] += 1
            return True
            
        except Exception as e:
            logger.error(f"Send message error: {e}")
            return False
    
    async def broadcast_message(self, message_type: MessageType, payload: Dict[str, Any],
                              priority: MessagePriority = MessagePriority.MEDIUM):
        """Broadcast a message to all agents"""
        return await self.send_message(None, message_type, payload, priority)
    
    async def share_pattern(self, pattern_data: Dict[str, Any], target_agent: Optional[str] = None):
        """Share a pattern with other agents"""
        payload = PatternSharePayload(
            pattern_id=pattern_data.get("id", str(uuid.uuid4())),
            pattern_name=pattern_data.get("name", "Unnamed Pattern"),
            pattern_description=pattern_data.get("description", ""),
            pattern_content=pattern_data.get("content", ""),
            category=pattern_data.get("category", "general"),
            language=pattern_data.get("language"),
            tags=pattern_data.get("tags", []),
            metadata=pattern_data.get("metadata", {}),
            confidence_score=pattern_data.get("confidence_score", 0.5),
            source_context=pattern_data.get("source_context", "")
        )
        
        return await self.send_message(
            target_agent,
            MessageType.PATTERN_SHARE,
            asdict(payload),
            MessagePriority.MEDIUM
        )
    
    async def request_recommendations(self, context: str, problem_description: str,
                                    preferred_categories: List[str] = None,
                                    language_preference: str = None,
                                    urgency_level: str = "medium"):
        """Request pattern recommendations"""
        payload = RecommendationRequestPayload(
            context=context,
            problem_description=problem_description,
            preferred_categories=preferred_categories or [],
            language_preference=language_preference,
            urgency_level=urgency_level,
            additional_constraints={}
        )
        
        return await self.send_message(
            "PiecesKnowledgeManager",  # Send to knowledge manager
            MessageType.RECOMMENDATION_REQUEST,
            asdict(payload),
            MessagePriority.HIGH if urgency_level == "critical" else MessagePriority.MEDIUM
        )
    
    async def send_pattern_feedback(self, pattern_id: str, success: bool, 
                                  feedback_details: str = "", target_agent: str = "PiecesKnowledgeManager"):
        """Send feedback about a pattern's effectiveness"""
        payload = {
            "pattern_id": pattern_id,
            "success": success,
            "feedback_details": feedback_details,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.send_message(
            target_agent,
            MessageType.PATTERN_FEEDBACK,
            payload,
            MessagePriority.MEDIUM
        )
    
    async def send_status_update(self, status: str, details: Dict[str, Any] = None):
        """Send status update to hub"""
        payload = {
            "status": status,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.send_message(
            None,  # Broadcast
            MessageType.STATUS_UPDATE,
            payload,
            MessagePriority.LOW
        )
    
    def register_message_handler(self, message_type: MessageType, handler: Callable):
        """Register a handler for specific message types"""
        if message_type not in self.message_handlers:
            self.message_handlers[message_type] = []
        self.message_handlers[message_type].append(handler)
    
    async def _message_listener(self):
        """Listen for incoming messages"""
        try:
            async for message_data in self.websocket:
                try:
                    message_dict = json.loads(message_data)
                    
                    # Convert to AgentMessage object
                    message = AgentMessage(
                        id=message_dict.get("id"),
                        sender_id=message_dict.get("sender_id"),
                        receiver_id=message_dict.get("receiver_id"),
                        message_type=MessageType(message_dict.get("message_type")),
                        priority=MessagePriority(message_dict.get("priority", MessagePriority.MEDIUM.value)),
                        payload=message_dict.get("payload", {}),
                        timestamp=datetime.fromisoformat(message_dict.get("timestamp", datetime.utcnow().isoformat())),
                        correlation_id=message_dict.get("correlation_id"),
                        reply_to=message_dict.get("reply_to")
                    )
                    
                    # Execute handlers
                    await self._execute_handlers(message)
                    self.stats["messages_received"] += 1
                    
                except Exception as e:
                    logger.error(f"Error processing received message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            self.is_connected = False
            logger.info(f"Connection closed for agent {self.agent_id}")
        except Exception as e:
            logger.error(f"Message listener error: {e}")
    
    async def _execute_handlers(self, message: AgentMessage):
        """Execute registered handlers for received message"""
        try:
            handlers = self.message_handlers.get(message.message_type, [])
            
            for handler in handlers:
                try:
                    await handler(message)
                except Exception as e:
                    logger.error(f"Handler execution error: {e}")
        
        except Exception as e:
            logger.error(f"Error executing handlers: {e}")
    
    async def _heartbeat_sender(self):
        """Send periodic heartbeat messages"""
        while self.is_connected:
            try:
                await self.send_message(
                    None,
                    MessageType.HEALTH_CHECK,
                    {"timestamp": datetime.utcnow().isoformat()},
                    MessagePriority.LOW
                )
                self.stats["last_heartbeat"] = datetime.utcnow().isoformat()
                
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
            
            await asyncio.sleep(30)  # Send heartbeat every 30 seconds

# Export main classes
__all__ = [
    'AgentCommunicationHub', 
    'AgentCommunicationClient', 
    'AgentMessage', 
    'MessageType', 
    'MessagePriority',
    'AgentRole',
    'PatternSharePayload',
    'RecommendationRequestPayload'
]