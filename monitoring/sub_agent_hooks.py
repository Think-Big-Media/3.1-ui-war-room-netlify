#!/usr/bin/env python3
"""
Sub-Agent Stop Hooks Monitoring System
Implements monitoring hooks for War Room sub-agent lifecycle events

Monitors:
- Agent startup/shutdown events
- Progress tracking through sub_agent_stop hooks
- Real-time status updates via WebSocket
- Agent health and performance metrics
"""

import asyncio
import json
import logging
import time
import psutil
import websockets
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from enum import Enum
import signal
import threading
import subprocess

# Hook event types
class HookEvent(Enum):
    START = "start"
    STOP = "stop" 
    PROGRESS = "progress"
    ERROR = "error"
    HEALTH_CHECK = "health_check"
    TASK_COMPLETE = "task_complete"
    RESOURCE_WARNING = "resource_warning"

@dataclass
class AgentHookData:
    agent_id: str
    event: HookEvent
    timestamp: datetime
    data: Dict[str, Any]
    process_id: Optional[int] = None
    resource_usage: Optional[Dict[str, float]] = None
    performance_metrics: Optional[Dict[str, float]] = None

class SubAgentHookMonitor:
    """Monitors sub-agent lifecycle events and progress via hooks"""
    
    def __init__(self, coordination_websocket_url: str = "ws://localhost:8765"):
        self.coordination_url = coordination_websocket_url
        self.monitored_agents: Dict[str, Dict] = {}
        self.hook_handlers: Dict[HookEvent, List[Callable]] = {
            event: [] for event in HookEvent
        }
        self.running = False
        self.websocket_connection = None
        
        # Process monitoring
        self.process_monitor_interval = 10  # seconds
        self.resource_threshold = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "disk_usage_percent": 90.0
        }
        
        # Setup logging
        self._setup_logging()
        
    def _setup_logging(self):
        """Setup hook monitoring logging"""
        log_dir = Path("/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/logs")
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"hook_monitor_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
    def register_agent(self, agent_id: str, process_id: Optional[int] = None, 
                      script_path: Optional[str] = None):
        """Register agent for hook monitoring"""
        self.monitored_agents[agent_id] = {
            "process_id": process_id,
            "script_path": script_path,
            "last_activity": datetime.now(),
            "status": "active",
            "hooks_registered": True,
            "resource_warnings": 0,
            "performance_history": []
        }
        
        logging.info(f"Registered agent for monitoring: {agent_id}")
        
        # Install hooks for this agent
        self._install_agent_hooks(agent_id)
        
    def _install_agent_hooks(self, agent_id: str):
        """Install monitoring hooks for specific agent"""
        agent_data = self.monitored_agents[agent_id]
        script_path = agent_data.get("script_path")
        
        if script_path and Path(script_path).exists():
            # Add hook injection to agent script
            self._inject_hooks_into_script(agent_id, script_path)
            
    def _inject_hooks_into_script(self, agent_id: str, script_path: str):
        """Inject monitoring hooks into agent script"""
        try:
            with open(script_path, 'r') as f:
                content = f.read()
                
            # Check if hooks already injected
            if "# COORDINATION_HOOKS_INJECTED" in content:
                logging.info(f"Hooks already injected in {script_path}")
                return
                
            # Inject hook code at the beginning
            hook_code = self._generate_hook_code(agent_id)
            
            # Add after imports
            lines = content.split('\n')
            import_end = 0
            
            for i, line in enumerate(lines):
                if (line.startswith('import ') or line.startswith('from ') or 
                    line.strip().startswith('#') or line.strip() == ''):
                    import_end = i + 1
                else:
                    break
                    
            # Insert hook code
            lines.insert(import_end, hook_code)
            
            # Write back to file
            with open(script_path, 'w') as f:
                f.write('\n'.join(lines))
                
            logging.info(f"Injected monitoring hooks into {script_path}")
            
        except Exception as e:
            logging.error(f"Failed to inject hooks into {script_path}: {e}")
            
    def _generate_hook_code(self, agent_id: str) -> str:
        """Generate hook injection code for agent"""
        return f"""
# COORDINATION_HOOKS_INJECTED
import sys
import time
import json
import asyncio
import websockets
from datetime import datetime

class CoordinationHooks:
    def __init__(self, agent_id="{agent_id}"):
        self.agent_id = agent_id
        self.coordination_url = "ws://localhost:8765"
        self.websocket = None
        
    async def connect_coordination(self):
        try:
            self.websocket = await websockets.connect(self.coordination_url)
            # Send identification
            await self.websocket.send(json.dumps({{"agent_id": self.agent_id}}))
        except Exception as e:
            print(f"Failed to connect to coordination system: {{e}}")
            
    async def send_hook_event(self, event, data):
        if self.websocket:
            try:
                message = {{
                    "type": "hook_event",
                    "agent_id": self.agent_id,
                    "event": event,
                    "timestamp": datetime.now().isoformat(),
                    "data": data
                }}
                await self.websocket.send(json.dumps(message))
            except Exception as e:
                print(f"Failed to send hook event: {{e}}")
                
    def sub_agent_stop(self, task_id=None, status="completed", progress=1.0):
        '''Hook called when sub-agent stops or completes task'''
        asyncio.create_task(self.send_hook_event("stop", {{
            "task_id": task_id,
            "status": status,
            "progress": progress,
            "timestamp": datetime.now().isoformat()
        }}))
        
    def sub_agent_start(self, task_id=None):
        '''Hook called when sub-agent starts task'''
        asyncio.create_task(self.send_hook_event("start", {{
            "task_id": task_id,
            "timestamp": datetime.now().isoformat()
        }}))
        
    def sub_agent_progress(self, task_id, progress, status="in_progress"):
        '''Hook called for progress updates'''
        asyncio.create_task(self.send_hook_event("progress", {{
            "task_id": task_id,
            "progress": progress,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }}))
        
    def sub_agent_error(self, error, task_id=None):
        '''Hook called on agent error'''
        asyncio.create_task(self.send_hook_event("error", {{
            "error": str(error),
            "task_id": task_id,
            "timestamp": datetime.now().isoformat()
        }}))

# Initialize coordination hooks
_coordination_hooks = CoordinationHooks()
asyncio.create_task(_coordination_hooks.connect_coordination())

# Make hooks globally available
sub_agent_stop = _coordination_hooks.sub_agent_stop
sub_agent_start = _coordination_hooks.sub_agent_start
sub_agent_progress = _coordination_hooks.sub_agent_progress
sub_agent_error = _coordination_hooks.sub_agent_error
"""

    def register_hook_handler(self, event: HookEvent, handler: Callable):
        """Register handler for specific hook event"""
        self.hook_handlers[event].append(handler)
        logging.info(f"Registered handler for {event.value} events")
        
    async def process_hook_event(self, hook_data: AgentHookData):
        """Process incoming hook event from agent"""
        agent_id = hook_data.agent_id
        event = hook_data.event
        
        logging.info(f"Hook event: {agent_id} - {event.value}")
        
        # Update agent status
        if agent_id in self.monitored_agents:
            self.monitored_agents[agent_id]["last_activity"] = hook_data.timestamp
            
            if event == HookEvent.START:
                self.monitored_agents[agent_id]["status"] = "active"
            elif event == HookEvent.STOP:
                self.monitored_agents[agent_id]["status"] = "idle" 
            elif event == HookEvent.ERROR:
                self.monitored_agents[agent_id]["status"] = "error"
                
        # Call registered handlers
        for handler in self.hook_handlers[event]:
            try:
                await handler(hook_data)
            except Exception as e:
                logging.error(f"Hook handler error: {e}")
                
        # Forward to coordination system
        if self.websocket_connection:
            await self._send_to_coordination(hook_data)
            
    async def _send_to_coordination(self, hook_data: AgentHookData):
        """Send hook event to coordination system"""
        try:
            message = {
                "type": "hook_event",
                "data": asdict(hook_data)
            }
            message["data"]["timestamp"] = hook_data.timestamp.isoformat()
            
            await self.websocket_connection.send(json.dumps(message))
            
        except Exception as e:
            logging.error(f"Failed to send to coordination: {e}")
            
    async def monitor_process_resources(self):
        """Monitor resource usage of registered agent processes"""
        while self.running:
            try:
                for agent_id, agent_data in self.monitored_agents.items():
                    process_id = agent_data.get("process_id")
                    
                    if process_id:
                        try:
                            process = psutil.Process(process_id)
                            
                            # Get resource metrics
                            cpu_percent = process.cpu_percent()
                            memory_info = process.memory_info()
                            memory_percent = process.memory_percent()
                            
                            resource_data = {
                                "cpu_percent": cpu_percent,
                                "memory_percent": memory_percent,
                                "memory_rss": memory_info.rss,
                                "memory_vms": memory_info.vms,
                                "pid": process_id
                            }
                            
                            # Check for resource warnings
                            warnings = []
                            if cpu_percent > self.resource_threshold["cpu_percent"]:
                                warnings.append(f"High CPU usage: {cpu_percent:.1f}%")
                                
                            if memory_percent > self.resource_threshold["memory_percent"]:
                                warnings.append(f"High memory usage: {memory_percent:.1f}%")
                                
                            if warnings:
                                hook_data = AgentHookData(
                                    agent_id=agent_id,
                                    event=HookEvent.RESOURCE_WARNING,
                                    timestamp=datetime.now(),
                                    data={"warnings": warnings},
                                    process_id=process_id,
                                    resource_usage=resource_data
                                )
                                
                                await self.process_hook_event(hook_data)
                                
                                # Increment warning counter
                                agent_data["resource_warnings"] += 1
                                
                        except psutil.NoSuchProcess:
                            logging.warning(f"Process {process_id} for agent {agent_id} not found")
                            agent_data["process_id"] = None
                            
                        except Exception as e:
                            logging.error(f"Error monitoring process {process_id}: {e}")
                            
            except Exception as e:
                logging.error(f"Resource monitoring error: {e}")
                
            await asyncio.sleep(self.process_monitor_interval)
            
    async def start_monitoring(self):
        """Start the hook monitoring system"""
        self.running = True
        logging.info("🔗 Starting Sub-Agent Hook Monitoring System")
        
        # Connect to coordination system
        try:
            self.websocket_connection = await websockets.connect(self.coordination_url)
            # Identify as hook monitor
            await self.websocket_connection.send(json.dumps({
                "agent_id": "hook_monitor",
                "type": "monitor_system"
            }))
            logging.info("Connected to coordination system")
            
        except Exception as e:
            logging.error(f"Failed to connect to coordination: {e}")
            
        # Start monitoring tasks
        tasks = [
            asyncio.create_task(self.monitor_process_resources()),
            asyncio.create_task(self.check_agent_health()),
            asyncio.create_task(self.cleanup_inactive_agents())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logging.info("Hook monitoring shutting down...")
        finally:
            if self.websocket_connection:
                await self.websocket_connection.close()
                
    async def check_agent_health(self):
        """Periodically check agent health via hooks"""
        while self.running:
            try:
                current_time = datetime.now()
                
                for agent_id, agent_data in self.monitored_agents.items():
                    last_activity = agent_data["last_activity"]
                    time_since_activity = current_time - last_activity
                    
                    # If no activity for 10 minutes, send health check
                    if time_since_activity > timedelta(minutes=10):
                        hook_data = AgentHookData(
                            agent_id=agent_id,
                            event=HookEvent.HEALTH_CHECK,
                            timestamp=current_time,
                            data={"time_since_activity": time_since_activity.total_seconds()}
                        )
                        
                        await self.process_hook_event(hook_data)
                        
            except Exception as e:
                logging.error(f"Health check error: {e}")
                
            # Check every 5 minutes
            await asyncio.sleep(300)
            
    async def cleanup_inactive_agents(self):
        """Clean up inactive agents from monitoring"""
        while self.running:
            try:
                current_time = datetime.now()
                inactive_agents = []
                
                for agent_id, agent_data in self.monitored_agents.items():
                    last_activity = agent_data["last_activity"]
                    time_since_activity = current_time - last_activity
                    
                    # Remove agents inactive for more than 1 hour
                    if time_since_activity > timedelta(hours=1):
                        inactive_agents.append(agent_id)
                        
                for agent_id in inactive_agents:
                    logging.info(f"Removing inactive agent from monitoring: {agent_id}")
                    del self.monitored_agents[agent_id]
                    
            except Exception as e:
                logging.error(f"Cleanup error: {e}")
                
            # Cleanup every 30 minutes
            await asyncio.sleep(1800)
            
    def get_agent_statistics(self) -> Dict[str, Any]:
        """Get statistics for all monitored agents"""
        stats = {
            "total_agents": len(self.monitored_agents),
            "active_agents": 0,
            "error_agents": 0,
            "idle_agents": 0,
            "total_resource_warnings": 0,
            "agents": {}
        }
        
        for agent_id, agent_data in self.monitored_agents.items():
            status = agent_data["status"]
            
            if status == "active":
                stats["active_agents"] += 1
            elif status == "error":
                stats["error_agents"] += 1
            elif status == "idle":
                stats["idle_agents"] += 1
                
            stats["total_resource_warnings"] += agent_data.get("resource_warnings", 0)
            
            stats["agents"][agent_id] = {
                "status": status,
                "last_activity": agent_data["last_activity"].isoformat(),
                "resource_warnings": agent_data.get("resource_warnings", 0),
                "process_id": agent_data.get("process_id")
            }
            
        return stats

# Default hook handlers
async def default_stop_handler(hook_data: AgentHookData):
    """Default handler for stop events"""
    task_id = hook_data.data.get("task_id", "unknown")
    status = hook_data.data.get("status", "completed")
    progress = hook_data.data.get("progress", 1.0)
    
    logging.info(f"Agent {hook_data.agent_id} stopped task {task_id}: {status} ({progress:.0%})")

async def default_error_handler(hook_data: AgentHookData):
    """Default handler for error events"""
    error = hook_data.data.get("error", "Unknown error")
    task_id = hook_data.data.get("task_id", "unknown")
    
    logging.error(f"Agent {hook_data.agent_id} error in task {task_id}: {error}")

async def default_resource_warning_handler(hook_data: AgentHookData):
    """Default handler for resource warning events"""
    warnings = hook_data.data.get("warnings", [])
    
    for warning in warnings:
        logging.warning(f"Agent {hook_data.agent_id}: {warning}")

async def main():
    """Main hook monitor entry point"""
    monitor = SubAgentHookMonitor()
    
    # Register default handlers
    monitor.register_hook_handler(HookEvent.STOP, default_stop_handler)
    monitor.register_hook_handler(HookEvent.ERROR, default_error_handler)
    monitor.register_hook_handler(HookEvent.RESOURCE_WARNING, default_resource_warning_handler)
    
    # Register War Room agents
    agents_config = [
        {
            "agent_id": "health_monitor",
            "script_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/health-monitor-sub-agent.js"
        },
        {
            "agent_id": "amp_specialist", 
            "script_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/amp_refactoring_specialist.py"
        },
        {
            "agent_id": "coderabbit",
            "script_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/coderabbit_integration.py"
        },
        {
            "agent_id": "pieces_manager",
            "script_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/pieces_knowledge_manager.py"
        }
    ]
    
    for config in agents_config:
        monitor.register_agent(config["agent_id"], script_path=config["script_path"])
        
    await monitor.start_monitoring()

if __name__ == "__main__":
    asyncio.run(main())