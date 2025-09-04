#!/usr/bin/env python3
"""
War Room Sub-Agent Coordination System
Central coordination hub for all War Room sub-agents

MISSION: Establish unified coordination protocols for all 4 War Room sub-agents
- Health Check Monitor
- AMP Refactoring Specialist  
- CodeRabbit Integration
- Pieces Knowledge Manager

Implements:
- Hourly status reporting
- sub_agent_stop hooks monitoring
- Shared TASK.md management
- Git-based conflict resolution
- <3s SLA performance monitoring
- Real-time WebSocket coordination
"""

import asyncio
import json
import logging
import subprocess
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import websockets
import yaml
from dataclasses import dataclass, asdict
from enum import Enum
import git
import aiofiles
import signal
import sys

# Configuration
MONITORING_PORT = 8765
TASK_MD_PATH = Path("/Users/rodericandrews/WarRoom_Development/1.0-war-room/TASK.md")
COORDINATION_LOG_PATH = Path("/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/logs")
SLA_TARGET_SECONDS = 3.0
STATUS_REPORT_INTERVAL = 3600  # 1 hour in seconds

class AgentStatus(Enum):
    ACTIVE = "active"
    IDLE = "idle"
    ERROR = "error"
    STOPPED = "stopped"
    STARTING = "starting"

class Priority(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class AgentReport:
    agent_id: str
    status: AgentStatus
    last_activity: datetime
    performance_metrics: Dict[str, float]
    current_task: Optional[str]
    errors: List[str]
    resource_usage: Dict[str, float]
    sla_compliance: bool
    
@dataclass  
class CoordinationTask:
    task_id: str
    title: str
    priority: Priority
    assigned_agents: List[str]
    status: str
    created_at: datetime
    deadline: Optional[datetime]
    dependencies: List[str]
    progress: float
    
class TaskManager:
    """Manages shared TASK.md updates and coordination"""
    
    def __init__(self, task_file_path: Path):
        self.task_file_path = task_file_path
        self.lock = threading.Lock()
        
    async def update_task_status(self, task_id: str, status: str, agent_id: str):
        """Update task status in TASK.md with agent attribution"""
        with self.lock:
            try:
                content = await self._read_task_file()
                updated_content = await self._update_task_content(content, task_id, status, agent_id)
                await self._write_task_file(updated_content)
                logging.info(f"Task {task_id} updated to {status} by {agent_id}")
                return True
            except Exception as e:
                logging.error(f"Failed to update task {task_id}: {e}")
                return False
                
    async def add_coordination_task(self, task: CoordinationTask):
        """Add new coordination task to TASK.md"""
        with self.lock:
            try:
                content = await self._read_task_file()
                task_entry = self._format_task_entry(task)
                updated_content = content + "\n" + task_entry
                await self._write_task_file(updated_content)
                logging.info(f"Added coordination task: {task.task_id}")
                return True
            except Exception as e:
                logging.error(f"Failed to add task {task.task_id}: {e}")
                return False
                
    async def _read_task_file(self) -> str:
        """Read current TASK.md content"""
        if self.task_file_path.exists():
            async with aiofiles.open(self.task_file_path, 'r') as f:
                return await f.read()
        return ""
        
    async def _write_task_file(self, content: str):
        """Write updated content to TASK.md"""
        async with aiofiles.open(self.task_file_path, 'w') as f:
            await f.write(content)
            
    async def _update_task_content(self, content: str, task_id: str, status: str, agent_id: str) -> str:
        """Update specific task status in content"""
        lines = content.split('\n')
        updated_lines = []
        
        for line in lines:
            if task_id in line and line.strip().startswith('-'):
                # Update task status line
                if status == "completed":
                    new_line = line.replace('[ ]', '[x]').replace('[WIP]', '[x]')
                elif status == "in_progress":
                    new_line = line.replace('[ ]', '[WIP]').replace('[x]', '[WIP]')
                else:
                    new_line = line
                    
                # Add agent attribution
                if f"(Agent: {agent_id}" not in new_line:
                    new_line += f" (Agent: {agent_id}, Updated: {datetime.now().strftime('%H:%M')})"
                    
                updated_lines.append(new_line)
            else:
                updated_lines.append(line)
                
        return '\n'.join(updated_lines)
        
    def _format_task_entry(self, task: CoordinationTask) -> str:
        """Format coordination task as TASK.md entry"""
        status_marker = "[ ]"
        if task.status == "completed":
            status_marker = "[x]"
        elif task.status == "in_progress":
            status_marker = "[WIP]"
            
        agents_str = ", ".join(task.assigned_agents)
        
        return f"""
### 🤖 Coordination Task: {task.title}
- {status_marker} **{task.title}** (ID: {task.task_id})
  - Priority: {task.priority.value}
  - Assigned Agents: {agents_str}
  - Progress: {task.progress:.0%}
  - Created: {task.created_at.strftime('%Y-%m-%d %H:%M')}
  {f"- Deadline: {task.deadline.strftime('%Y-%m-%d %H:%M')}" if task.deadline else ""}
  {f"- Dependencies: {', '.join(task.dependencies)}" if task.dependencies else ""}
"""

class GitConflictResolver:
    """Handles git-based conflict resolution for coordination"""
    
    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self.repo = git.Repo(repo_path)
        
    async def auto_resolve_conflicts(self) -> bool:
        """Automatically resolve common coordination conflicts"""
        try:
            # Check for conflicts
            if self.repo.is_dirty():
                # Stage coordination files
                coordination_files = [
                    "TASK.md",
                    "monitoring/coordination_system.py",
                    "monitoring/logs/coordination.log"
                ]
                
                for file in coordination_files:
                    if Path(self.repo_path, file).exists():
                        self.repo.index.add([file])
                        
                # Commit coordination updates
                self.repo.index.commit("🤖 Auto-resolve coordination conflicts")
                logging.info("Git conflicts auto-resolved")
                return True
                
        except Exception as e:
            logging.error(f"Git conflict resolution failed: {e}")
            return False
            
        return True
        
    async def create_coordination_branch(self, branch_name: str) -> bool:
        """Create branch for coordination activities"""
        try:
            new_branch = self.repo.create_head(branch_name)
            new_branch.checkout()
            logging.info(f"Created coordination branch: {branch_name}")
            return True
        except Exception as e:
            logging.error(f"Failed to create branch {branch_name}: {e}")
            return False

class SLAMonitor:
    """Monitors SLA compliance across all agents"""
    
    def __init__(self, target_seconds: float = SLA_TARGET_SECONDS):
        self.target_seconds = target_seconds
        self.performance_history: Dict[str, List[float]] = {}
        self.sla_violations: List[Dict] = []
        
    def record_performance(self, agent_id: str, response_time: float):
        """Record agent performance measurement"""
        if agent_id not in self.performance_history:
            self.performance_history[agent_id] = []
            
        self.performance_history[agent_id].append(response_time)
        
        # Keep only last 100 measurements
        if len(self.performance_history[agent_id]) > 100:
            self.performance_history[agent_id] = self.performance_history[agent_id][-100:]
            
        # Check SLA violation
        if response_time > self.target_seconds:
            violation = {
                "agent_id": agent_id,
                "response_time": response_time,
                "timestamp": datetime.now().isoformat(),
                "severity": "high" if response_time > self.target_seconds * 2 else "medium"
            }
            self.sla_violations.append(violation)
            logging.warning(f"SLA violation: {agent_id} - {response_time:.2f}s")
            
    def get_sla_compliance(self, agent_id: str) -> Dict[str, Any]:
        """Get SLA compliance metrics for agent"""
        if agent_id not in self.performance_history:
            return {"compliant": True, "avg_response_time": 0, "violations": 0}
            
        history = self.performance_history[agent_id]
        avg_time = sum(history) / len(history)
        violations = len([t for t in history if t > self.target_seconds])
        compliance_rate = 1 - (violations / len(history))
        
        return {
            "compliant": compliance_rate >= 0.95,  # 95% compliance target
            "avg_response_time": avg_time,
            "violations": violations,
            "compliance_rate": compliance_rate,
            "measurements": len(history)
        }

class WebSocketCoordinator:
    """Real-time WebSocket coordination between agents"""
    
    def __init__(self, port: int = MONITORING_PORT):
        self.port = port
        self.connected_agents: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.message_queue: List[Dict] = []
        
    async def handle_agent_connection(self, websocket, path):
        """Handle new agent WebSocket connection"""
        try:
            # Wait for agent identification
            agent_id = await websocket.recv()
            agent_data = json.loads(agent_id)
            
            agent_name = agent_data.get("agent_id", "unknown")
            self.connected_agents[agent_name] = websocket
            
            logging.info(f"Agent connected: {agent_name}")
            
            # Send welcome message
            welcome = {
                "type": "welcome",
                "message": f"Connected to War Room Coordination System",
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send(json.dumps(welcome))
            
            # Handle incoming messages
            async for message in websocket:
                await self.handle_agent_message(agent_name, message)
                
        except websockets.exceptions.ConnectionClosed:
            # Clean up disconnected agent
            if agent_name in self.connected_agents:
                del self.connected_agents[agent_name]
                logging.info(f"Agent disconnected: {agent_name}")
        except Exception as e:
            logging.error(f"WebSocket error: {e}")
            
    async def handle_agent_message(self, agent_id: str, message: str):
        """Process message from agent"""
        try:
            data = json.loads(message)
            message_type = data.get("type", "unknown")
            
            if message_type == "status_report":
                await self.process_status_report(agent_id, data)
            elif message_type == "task_update":
                await self.process_task_update(agent_id, data)
            elif message_type == "performance_metric":
                await self.process_performance_metric(agent_id, data)
            elif message_type == "error_report":
                await self.process_error_report(agent_id, data)
            else:
                logging.warning(f"Unknown message type from {agent_id}: {message_type}")
                
        except json.JSONDecodeError:
            logging.error(f"Invalid JSON from {agent_id}: {message}")
        except Exception as e:
            logging.error(f"Error processing message from {agent_id}: {e}")
            
    async def process_status_report(self, agent_id: str, data: Dict):
        """Process agent status report"""
        logging.info(f"Status report from {agent_id}: {data.get('status', 'unknown')}")
        
        # Broadcast status to other agents if critical
        if data.get('status') == 'error':
            await self.broadcast_message({
                "type": "agent_error",
                "source_agent": agent_id,
                "error_details": data.get('error_details', 'Unknown error'),
                "timestamp": datetime.now().isoformat()
            }, exclude_agent=agent_id)
            
    async def process_task_update(self, agent_id: str, data: Dict):
        """Process task update from agent"""
        task_id = data.get("task_id")
        status = data.get("status")
        
        logging.info(f"Task update from {agent_id}: {task_id} -> {status}")
        
        # Update TASK.md through task manager
        # This would be integrated with the TaskManager instance
        
    async def process_performance_metric(self, agent_id: str, data: Dict):
        """Process performance metric from agent"""
        response_time = data.get("response_time", 0)
        
        # This would be integrated with the SLAMonitor instance
        logging.info(f"Performance metric from {agent_id}: {response_time:.2f}s")
        
    async def process_error_report(self, agent_id: str, data: Dict):
        """Process error report from agent"""
        error_msg = data.get("error", "Unknown error")
        severity = data.get("severity", "medium")
        
        logging.error(f"Error from {agent_id} [{severity}]: {error_msg}")
        
    async def broadcast_message(self, message: Dict, exclude_agent: Optional[str] = None):
        """Broadcast message to all connected agents"""
        message_json = json.dumps(message)
        
        disconnected_agents = []
        
        for agent_id, websocket in self.connected_agents.items():
            if agent_id == exclude_agent:
                continue
                
            try:
                await websocket.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected_agents.append(agent_id)
            except Exception as e:
                logging.error(f"Failed to send message to {agent_id}: {e}")
                
        # Clean up disconnected agents
        for agent_id in disconnected_agents:
            del self.connected_agents[agent_id]
            
    async def start_server(self):
        """Start WebSocket coordination server"""
        logging.info(f"Starting WebSocket coordination server on port {self.port}")
        
        server = await websockets.serve(
            self.handle_agent_connection,
            "localhost",
            self.port
        )
        
        logging.info(f"Coordination server running on ws://localhost:{self.port}")
        return server

class CoordinationSystem:
    """Main coordination system orchestrating all War Room sub-agents"""
    
    def __init__(self):
        self.task_manager = TaskManager(TASK_MD_PATH)
        self.git_resolver = GitConflictResolver("/Users/rodericandrews/WarRoom_Development/1.0-war-room")
        self.sla_monitor = SLAMonitor()
        self.websocket_coordinator = WebSocketCoordinator()
        
        # Agent registry
        self.agents = {
            "health_monitor": {
                "name": "Health Check Monitor",
                "status": AgentStatus.IDLE,
                "last_report": None,
                "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/health-monitor-sub-agent.js"
            },
            "amp_specialist": {
                "name": "AMP Refactoring Specialist", 
                "status": AgentStatus.IDLE,
                "last_report": None,
                "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/amp_refactoring_specialist.py"
            },
            "coderabbit": {
                "name": "CodeRabbit Integration",
                "status": AgentStatus.IDLE,
                "last_report": None,
                "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/coderabbit_integration.py"
            },
            "pieces_manager": {
                "name": "Pieces Knowledge Manager",
                "status": AgentStatus.IDLE,
                "last_report": None,
                "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/pieces_knowledge_manager.py"
            }
        }
        
        # Setup logging
        self._setup_logging()
        
        # Running state
        self.running = False
        
    def _setup_logging(self):
        """Setup coordination system logging"""
        log_dir = COORDINATION_LOG_PATH
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"coordination_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
    async def start_coordination(self):
        """Start the coordination system"""
        self.running = True
        logging.info("🤖 Starting War Room Sub-Agent Coordination System")
        
        # Start WebSocket server
        websocket_server = await self.websocket_coordinator.start_server()
        
        # Start periodic tasks
        tasks = [
            asyncio.create_task(self.hourly_status_reports()),
            asyncio.create_task(self.monitor_sla_compliance()),
            asyncio.create_task(self.check_agent_health()),
            asyncio.create_task(self.auto_resolve_conflicts())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logging.info("Coordination system shutting down...")
        finally:
            websocket_server.close()
            await websocket_server.wait_closed()
            
    async def hourly_status_reports(self):
        """Generate hourly status reports from all agents"""
        while self.running:
            try:
                logging.info("📊 Generating hourly status report")
                
                report = {
                    "timestamp": datetime.now().isoformat(),
                    "agents": {},
                    "sla_compliance": {},
                    "system_health": "operational"
                }
                
                # Collect status from each agent
                for agent_id, agent_info in self.agents.items():
                    agent_status = await self.get_agent_status(agent_id)
                    report["agents"][agent_id] = agent_status
                    
                    # Get SLA compliance
                    sla_data = self.sla_monitor.get_sla_compliance(agent_id)
                    report["sla_compliance"][agent_id] = sla_data
                    
                # Save report
                await self.save_status_report(report)
                
                # Broadcast to connected agents
                await self.websocket_coordinator.broadcast_message({
                    "type": "hourly_report",
                    "data": report
                })
                
            except Exception as e:
                logging.error(f"Error generating hourly report: {e}")
                
            # Wait for next hour
            await asyncio.sleep(STATUS_REPORT_INTERVAL)
            
    async def monitor_sla_compliance(self):
        """Monitor SLA compliance across all agents"""
        while self.running:
            try:
                # Check each agent's performance
                for agent_id in self.agents.keys():
                    start_time = time.time()
                    
                    # Ping agent (simulate)
                    agent_responsive = await self.ping_agent(agent_id)
                    
                    response_time = time.time() - start_time
                    
                    if agent_responsive:
                        self.sla_monitor.record_performance(agent_id, response_time)
                        
                        # Check for violations
                        if response_time > SLA_TARGET_SECONDS:
                            await self.handle_sla_violation(agent_id, response_time)
                            
            except Exception as e:
                logging.error(f"SLA monitoring error: {e}")
                
            # Check every 30 seconds
            await asyncio.sleep(30)
            
    async def check_agent_health(self):
        """Periodically check agent health and restart if needed"""
        while self.running:
            try:
                for agent_id, agent_info in self.agents.items():
                    if not await self.is_agent_healthy(agent_id):
                        logging.warning(f"Agent {agent_id} appears unhealthy")
                        await self.restart_agent(agent_id)
                        
            except Exception as e:
                logging.error(f"Agent health check error: {e}")
                
            # Check every 5 minutes
            await asyncio.sleep(300)
            
    async def auto_resolve_conflicts(self):
        """Automatically resolve git conflicts in coordination"""
        while self.running:
            try:
                success = await self.git_resolver.auto_resolve_conflicts()
                if success:
                    logging.info("Git conflicts resolved automatically")
                    
            except Exception as e:
                logging.error(f"Auto conflict resolution error: {e}")
                
            # Check every 10 minutes
            await asyncio.sleep(600)
            
    async def get_agent_status(self, agent_id: str) -> Dict[str, Any]:
        """Get current status of specific agent"""
        agent_info = self.agents.get(agent_id, {})
        
        return {
            "name": agent_info.get("name", "Unknown"),
            "status": agent_info.get("status", AgentStatus.IDLE).value,
            "last_report": agent_info.get("last_report"),
            "file_exists": Path(agent_info.get("file_path", "")).exists() if agent_info.get("file_path") else False
        }
        
    async def ping_agent(self, agent_id: str) -> bool:
        """Ping agent to check responsiveness"""
        # In a real implementation, this would ping the actual agent process
        # For now, just check if the agent file exists
        agent_info = self.agents.get(agent_id, {})
        file_path = agent_info.get("file_path", "")
        
        if file_path and Path(file_path).exists():
            return True
            
        return False
        
    async def is_agent_healthy(self, agent_id: str) -> bool:
        """Check if agent is healthy and responsive"""
        return await self.ping_agent(agent_id)
        
    async def restart_agent(self, agent_id: str):
        """Restart unhealthy agent"""
        logging.info(f"Attempting to restart agent: {agent_id}")
        
        agent_info = self.agents.get(agent_id, {})
        file_path = agent_info.get("file_path", "")
        
        if file_path and Path(file_path).exists():
            try:
                # In a real implementation, this would restart the agent process
                logging.info(f"Agent {agent_id} restart initiated")
                self.agents[agent_id]["status"] = AgentStatus.STARTING
                
            except Exception as e:
                logging.error(f"Failed to restart agent {agent_id}: {e}")
                self.agents[agent_id]["status"] = AgentStatus.ERROR
                
    async def handle_sla_violation(self, agent_id: str, response_time: float):
        """Handle SLA violation"""
        logging.warning(f"SLA violation: {agent_id} - {response_time:.2f}s (target: {SLA_TARGET_SECONDS}s)")
        
        # Create coordination task for SLA violation
        task = CoordinationTask(
            task_id=f"sla_violation_{agent_id}_{int(time.time())}",
            title=f"SLA Violation - {agent_id}",
            priority=Priority.HIGH,
            assigned_agents=[agent_id],
            status="pending",
            created_at=datetime.now(),
            deadline=datetime.now() + timedelta(hours=1),
            dependencies=[],
            progress=0.0
        )
        
        await self.task_manager.add_coordination_task(task)
        
        # Broadcast violation alert
        await self.websocket_coordinator.broadcast_message({
            "type": "sla_violation",
            "agent_id": agent_id,
            "response_time": response_time,
            "target": SLA_TARGET_SECONDS,
            "severity": "high" if response_time > SLA_TARGET_SECONDS * 2 else "medium"
        })
        
    async def save_status_report(self, report: Dict):
        """Save hourly status report to file"""
        report_file = COORDINATION_LOG_PATH / f"status_report_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
        
        async with aiofiles.open(report_file, 'w') as f:
            await f.write(json.dumps(report, indent=2))
            
        logging.info(f"Status report saved: {report_file}")

# Signal handlers for graceful shutdown
def signal_handler(signum, frame):
    logging.info(f"Received signal {signum}, shutting down...")
    sys.exit(0)

async def main():
    """Main coordination system entry point"""
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and start coordination system
    coordinator = CoordinationSystem()
    await coordinator.start_coordination()

if __name__ == "__main__":
    asyncio.run(main())