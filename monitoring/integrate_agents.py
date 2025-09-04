#!/usr/bin/env python3
"""
Agent Integration Script
Integrates coordination system with existing War Room sub-agents

This script:
1. Injects coordination hooks into existing agent files
2. Updates agent configurations for WebSocket communication
3. Sets up monitoring and reporting capabilities
4. Validates integration success
"""

import os
import re
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
import shutil
from datetime import datetime

# Agent configurations
AGENTS_CONFIG = {
    "health_monitor": {
        "name": "Health Check Monitor",
        "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/health-monitor-sub-agent.js",
        "language": "javascript",
        "hooks_needed": ["start", "stop", "error", "performance"]
    },
    "amp_specialist": {
        "name": "AMP Refactoring Specialist", 
        "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/amp_refactoring_specialist.py",
        "language": "python",
        "hooks_needed": ["start", "stop", "progress", "error"]
    },
    "coderabbit": {
        "name": "CodeRabbit Integration",
        "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/coderabbit_integration.py", 
        "language": "python",
        "hooks_needed": ["start", "stop", "performance", "error"]
    },
    "pieces_manager": {
        "name": "Pieces Knowledge Manager",
        "file_path": "/Users/rodericandrews/WarRoom_Development/1.0-war-room/agents/pieces_knowledge_manager.py",
        "language": "python", 
        "hooks_needed": ["start", "stop", "progress", "error"]
    }
}

COORDINATION_URL = "ws://localhost:8765"
BACKUP_DIR = "/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/agent_backups"

class AgentIntegrator:
    """Integrates coordination system with existing sub-agents"""
    
    def __init__(self):
        self.backup_dir = Path(BACKUP_DIR)
        self.backup_dir.mkdir(exist_ok=True)
        
        # Setup logging
        self._setup_logging()
        
    def _setup_logging(self):
        """Setup integration logging"""
        log_dir = Path("/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/logs")
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"agent_integration_{datetime.now().strftime('%Y%m%d_%H%M')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        
    def integrate_all_agents(self) -> bool:
        """Integrate coordination system with all agents"""
        logging.info("🚀 Starting War Room Agent Integration")
        
        success_count = 0
        total_agents = len(AGENTS_CONFIG)
        
        for agent_id, config in AGENTS_CONFIG.items():
            try:
                logging.info(f"Integrating {config['name']} ({agent_id})...")
                
                if self.integrate_agent(agent_id, config):
                    success_count += 1
                    logging.info(f"✅ Successfully integrated {agent_id}")
                else:
                    logging.error(f"❌ Failed to integrate {agent_id}")
                    
            except Exception as e:
                logging.error(f"❌ Error integrating {agent_id}: {e}")
                
        integration_success = success_count == total_agents
        
        if integration_success:
            logging.info(f"🎉 Successfully integrated all {total_agents} agents")
            self._create_integration_summary()
        else:
            logging.error(f"⚠️ Integration incomplete: {success_count}/{total_agents} agents")
            
        return integration_success
        
    def integrate_agent(self, agent_id: str, config: Dict) -> bool:
        """Integrate coordination system with specific agent"""
        file_path = Path(config["file_path"])
        
        if not file_path.exists():
            logging.warning(f"Agent file not found: {file_path}")
            return False
            
        # Create backup
        if not self._create_backup(file_path, agent_id):
            logging.error(f"Failed to create backup for {agent_id}")
            return False
            
        # Read current content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            logging.error(f"Failed to read {file_path}: {e}")
            return False
            
        # Check if already integrated
        if self._is_already_integrated(content):
            logging.info(f"Agent {agent_id} already integrated, skipping")
            return True
            
        # Inject coordination code
        language = config["language"]
        
        if language == "python":
            updated_content = self._inject_python_coordination(content, agent_id, config)
        elif language == "javascript":
            updated_content = self._inject_javascript_coordination(content, agent_id, config)
        else:
            logging.error(f"Unsupported language: {language}")
            return False
            
        if not updated_content:
            logging.error(f"Failed to generate coordination code for {agent_id}")
            return False
            
        # Write updated content
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            logging.info(f"Updated {file_path} with coordination hooks")
            return True
            
        except Exception as e:
            logging.error(f"Failed to write updated {file_path}: {e}")
            return False
            
    def _create_backup(self, file_path: Path, agent_id: str) -> bool:
        """Create backup of agent file before modification"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_name = f"{agent_id}_{timestamp}{file_path.suffix}"
            backup_path = self.backup_dir / backup_name
            
            shutil.copy2(file_path, backup_path)
            logging.info(f"Created backup: {backup_path}")
            return True
            
        except Exception as e:
            logging.error(f"Backup creation failed: {e}")
            return False
            
    def _is_already_integrated(self, content: str) -> bool:
        """Check if agent already has coordination integration"""
        markers = [
            "# COORDINATION_INTEGRATION",
            "// COORDINATION_INTEGRATION", 
            "CoordinationHooks",
            "COORDINATION_HOOKS_INJECTED"
        ]
        
        return any(marker in content for marker in markers)
        
    def _inject_python_coordination(self, content: str, agent_id: str, config: Dict) -> Optional[str]:
        """Inject coordination hooks into Python agent"""
        
        # Generate coordination class
        coordination_code = f'''
# COORDINATION_INTEGRATION - Auto-injected by integration script
import asyncio
import json
import time
import websockets
from datetime import datetime
from typing import Optional, Dict, Any

class CoordinationHooks:
    """War Room Agent Coordination Hooks"""
    
    def __init__(self, agent_id: str = "{agent_id}"):
        self.agent_id = agent_id
        self.coordination_url = "{COORDINATION_URL}"
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.connected = False
        self.last_status_report = datetime.now()
        
    async def connect_coordination(self):
        """Connect to coordination system"""
        try:
            self.websocket = await websockets.connect(self.coordination_url)
            
            # Send identification
            identification = {{
                "agent_id": self.agent_id,
                "name": "{config['name']}",
                "version": "1.0.0",
                "capabilities": {config['hooks_needed']}
            }}
            
            await self.websocket.send(json.dumps(identification))
            self.connected = True
            
            print(f"✅ Connected to coordination system: {{self.agent_id}}")
            
        except Exception as e:
            print(f"❌ Failed to connect to coordination system: {{e}}")
            self.connected = False
            
    async def send_coordination_message(self, message: Dict[str, Any]):
        """Send message to coordination system"""
        if not self.connected or not self.websocket:
            return False
            
        try:
            message["agent_id"] = self.agent_id
            message["timestamp"] = datetime.now().isoformat()
            
            await self.websocket.send(json.dumps(message))
            return True
            
        except Exception as e:
            print(f"Failed to send coordination message: {{e}}")
            self.connected = False
            return False
            
    def sub_agent_start(self, task_id: Optional[str] = None):
        """Hook: Called when sub-agent starts task"""
        message = {{
            "type": "hook_event",
            "data": {{
                "event": "start",
                "task_id": task_id,
                "timestamp": datetime.now().isoformat()
            }}
        }}
        
        if self.connected:
            asyncio.create_task(self.send_coordination_message(message))
        else:
            print(f"🔗 Agent start: {{task_id}} (coordination offline)")
            
    def sub_agent_stop(self, task_id: Optional[str] = None, status: str = "completed", progress: float = 1.0):
        """Hook: Called when sub-agent stops or completes task"""
        message = {{
            "type": "hook_event",
            "data": {{
                "event": "stop",
                "task_id": task_id,
                "status": status,
                "progress": progress,
                "timestamp": datetime.now().isoformat()
            }}
        }}
        
        if self.connected:
            asyncio.create_task(self.send_coordination_message(message))
        else:
            print(f"🏁 Agent stop: {{task_id}} - {{status}} ({{progress:.0%}})")
            
    def sub_agent_progress(self, task_id: str, progress: float, status: str = "in_progress"):
        """Hook: Called for progress updates"""
        message = {{
            "type": "hook_event", 
            "data": {{
                "event": "progress",
                "task_id": task_id,
                "progress": progress,
                "status": status,
                "timestamp": datetime.now().isoformat()
            }}
        }}
        
        if self.connected:
            asyncio.create_task(self.send_coordination_message(message))
        else:
            print(f"📊 Agent progress: {{task_id}} - {{progress:.0%}}")
            
    def sub_agent_error(self, error: Exception, task_id: Optional[str] = None):
        """Hook: Called on agent error"""
        message = {{
            "type": "error_report",
            "priority": "high",
            "data": {{
                "error_type": type(error).__name__,
                "error_message": str(error),
                "task_id": task_id,
                "timestamp": datetime.now().isoformat()
            }}
        }}
        
        if self.connected:
            asyncio.create_task(self.send_coordination_message(message))
        else:
            print(f"🚨 Agent error: {{error}} (task: {{task_id}})")
            
    async def send_performance_metric(self, operation: str, response_time: float, 
                                    success: bool = True, endpoint: str = "/api"):
        """Send performance metric for SLA monitoring"""
        message = {{
            "type": "performance_metric",
            "data": {{
                "operation": operation,
                "response_time": response_time,
                "success": success,
                "endpoint": endpoint,
                "sla_compliant": response_time <= 3.0,
                "timestamp": datetime.now().isoformat()
            }}
        }}
        
        await self.send_coordination_message(message)
        
    async def send_status_report(self):
        """Send hourly status report"""
        now = datetime.now()
        
        # Only send if it's been more than 50 minutes since last report
        if (now - self.last_status_report).total_seconds() < 3000:
            return
            
        message = {{
            "type": "status_report",
            "data": {{
                "status": "active",
                "current_task": getattr(self, 'current_task', None),
                "performance_metrics": {{
                    "avg_response_time": getattr(self, 'avg_response_time', 0.0),
                    "requests_processed": getattr(self, 'requests_processed', 0),
                    "errors_count": getattr(self, 'errors_count', 0)
                }},
                "last_activity": datetime.now().isoformat(),
                "health_check_passed": True
            }}
        }}
        
        if await self.send_coordination_message(message):
            self.last_status_report = now

# Initialize coordination hooks
_coordination_hooks = CoordinationHooks("{agent_id}")

# Make hooks globally available
sub_agent_start = _coordination_hooks.sub_agent_start
sub_agent_stop = _coordination_hooks.sub_agent_stop  
sub_agent_progress = _coordination_hooks.sub_agent_progress
sub_agent_error = _coordination_hooks.sub_agent_error

# Auto-connect to coordination system
async def _init_coordination():
    await _coordination_hooks.connect_coordination()

# Run coordination initialization
try:
    asyncio.create_task(_init_coordination())
except RuntimeError:
    # Handle case where event loop is not running
    pass

'''

        # Find insertion point (after imports)
        lines = content.split('\\n')
        insert_index = 0
        
        for i, line in enumerate(lines):
            if (line.startswith('import ') or line.startswith('from ') or 
                line.strip().startswith('#') or line.strip() == '' or
                line.startswith('"""') or line.startswith("'''")):
                insert_index = i + 1
            else:
                break
                
        # Insert coordination code
        lines.insert(insert_index, coordination_code)
        
        return '\\n'.join(lines)
        
    def _inject_javascript_coordination(self, content: str, agent_id: str, config: Dict) -> Optional[str]:
        """Inject coordination hooks into JavaScript agent"""
        
        coordination_code = f'''
// COORDINATION_INTEGRATION - Auto-injected by integration script
const WebSocket = require('ws');

class CoordinationHooks {{
    constructor(agentId = '{agent_id}') {{
        this.agentId = agentId;
        this.coordinationUrl = '{COORDINATION_URL}';
        this.ws = null;
        this.connected = false;
        this.lastStatusReport = new Date();
        this.requestsProcessed = 0;
        this.errorsCount = 0;
        
        this.connectCoordination();
    }}
    
    async connectCoordination() {{
        try {{
            this.ws = new WebSocket(this.coordinationUrl);
            
            this.ws.on('open', () => {{
                // Send identification
                const identification = {{
                    agent_id: this.agentId,
                    name: '{config["name"]}',
                    version: '1.0.0',
                    capabilities: {json.dumps(config["hooks_needed"])}
                }};
                
                this.ws.send(JSON.stringify(identification));
                this.connected = true;
                console.log(`✅ Connected to coordination system: ${{this.agentId}}`);
            }});
            
            this.ws.on('error', (error) => {{
                console.error(`❌ Coordination WebSocket error: ${{error}}`);
                this.connected = false;
            }});
            
            this.ws.on('close', () => {{
                console.log(`🔌 Coordination connection closed: ${{this.agentId}}`);
                this.connected = false;
            }});
            
        }} catch (error) {{
            console.error(`Failed to connect to coordination system: ${{error}}`);
            this.connected = false;
        }}
    }}
    
    sendCoordinationMessage(message) {{
        if (!this.connected || !this.ws) {{
            return false;
        }}
        
        try {{
            message.agent_id = this.agentId;
            message.timestamp = new Date().toISOString();
            
            this.ws.send(JSON.stringify(message));
            return true;
            
        }} catch (error) {{
            console.error(`Failed to send coordination message: ${{error}}`);
            this.connected = false;
            return false;
        }}
    }}
    
    subAgentStart(taskId = null) {{
        const message = {{
            type: 'hook_event',
            data: {{
                event: 'start',
                task_id: taskId,
                timestamp: new Date().toISOString()
            }}
        }};
        
        if (!this.sendCoordinationMessage(message)) {{
            console.log(`🔗 Agent start: ${{taskId}} (coordination offline)`);
        }}
    }}
    
    subAgentStop(taskId = null, status = 'completed', progress = 1.0) {{
        const message = {{
            type: 'hook_event',
            data: {{
                event: 'stop',
                task_id: taskId,
                status: status,
                progress: progress,
                timestamp: new Date().toISOString()
            }}
        }};
        
        if (!this.sendCoordinationMessage(message)) {{
            console.log(`🏁 Agent stop: ${{taskId}} - ${{status}} (${{Math.round(progress * 100)}}%)`);
        }}
    }}
    
    subAgentError(error, taskId = null) {{
        this.errorsCount++;
        
        const message = {{
            type: 'error_report',
            priority: 'high',
            data: {{
                error_type: error.constructor.name,
                error_message: error.message || String(error),
                task_id: taskId,
                timestamp: new Date().toISOString()
            }}
        }};
        
        if (!this.sendCoordinationMessage(message)) {{
            console.error(`🚨 Agent error: ${{error}} (task: ${{taskId}})`);
        }}
    }}
    
    sendPerformanceMetric(operation, responseTime, success = true, endpoint = '/api') {{
        this.requestsProcessed++;
        
        const message = {{
            type: 'performance_metric',
            data: {{
                operation: operation,
                response_time: responseTime,
                success: success,
                endpoint: endpoint,
                sla_compliant: responseTime <= 3.0,
                timestamp: new Date().toISOString()
            }}
        }};
        
        this.sendCoordinationMessage(message);
    }}
    
    async sendStatusReport() {{
        const now = new Date();
        
        // Only send if it's been more than 50 minutes since last report
        if ((now - this.lastStatusReport) < 50 * 60 * 1000) {{
            return;
        }}
        
        const message = {{
            type: 'status_report',
            data: {{
                status: 'active',
                current_task: this.currentTask || null,
                performance_metrics: {{
                    avg_response_time: this.avgResponseTime || 0.0,
                    requests_processed: this.requestsProcessed,
                    errors_count: this.errorsCount
                }},
                last_activity: new Date().toISOString(),
                health_check_passed: true
            }}
        }};
        
        if (this.sendCoordinationMessage(message)) {{
            this.lastStatusReport = now;
        }}
    }}
}}

// Initialize coordination hooks
const coordinationHooks = new CoordinationHooks('{agent_id}');

// Make hooks globally available
const subAgentStart = coordinationHooks.subAgentStart.bind(coordinationHooks);
const subAgentStop = coordinationHooks.subAgentStop.bind(coordinationHooks);
const subAgentError = coordinationHooks.subAgentError.bind(coordinationHooks);

// Auto-send status reports every hour
setInterval(() => {{
    coordinationHooks.sendStatusReport();
}}, 60 * 60 * 1000);

'''

        # Find insertion point (after requires/imports)
        lines = content.split('\\n')
        insert_index = 0
        
        for i, line in enumerate(lines):
            if (line.startswith('const ') or line.startswith('require(') or
                line.startswith('import ') or line.strip().startswith('//') or 
                line.strip() == ''):
                insert_index = i + 1
            else:
                break
                
        # Insert coordination code
        lines.insert(insert_index, coordination_code)
        
        return '\\n'.join(lines)
        
    def _create_integration_summary(self):
        """Create integration summary report"""
        summary = {
            "integration_timestamp": datetime.now().isoformat(),
            "coordination_url": COORDINATION_URL,
            "integrated_agents": {},
            "integration_status": "completed",
            "backup_location": str(self.backup_dir)
        }
        
        for agent_id, config in AGENTS_CONFIG.items():
            file_path = Path(config["file_path"])
            
            summary["integrated_agents"][agent_id] = {
                "name": config["name"],
                "file_path": str(file_path),
                "language": config["language"],
                "hooks_injected": config["hooks_needed"],
                "file_exists": file_path.exists(),
                "backup_created": True
            }
            
        # Write summary to file
        summary_file = Path("/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring/INTEGRATION_SUMMARY.json")
        
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
            
        logging.info(f"📄 Integration summary created: {summary_file}")
        
    def validate_integration(self) -> bool:
        """Validate that all agents have been properly integrated"""
        logging.info("🔍 Validating agent integration...")
        
        validation_results = {}
        all_valid = True
        
        for agent_id, config in AGENTS_CONFIG.items():
            file_path = Path(config["file_path"])
            
            if not file_path.exists():
                validation_results[agent_id] = {"valid": False, "reason": "File not found"}
                all_valid = False
                continue
                
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    
                # Check for integration markers
                has_coordination = self._is_already_integrated(content)
                has_hooks = all(hook in content for hook in ["sub_agent_start", "sub_agent_stop"])
                has_websocket = COORDINATION_URL in content
                
                valid = has_coordination and has_hooks and has_websocket
                
                validation_results[agent_id] = {
                    "valid": valid,
                    "has_coordination": has_coordination,
                    "has_hooks": has_hooks,
                    "has_websocket": has_websocket
                }
                
                if not valid:
                    all_valid = False
                    
            except Exception as e:
                validation_results[agent_id] = {"valid": False, "reason": str(e)}
                all_valid = False
                
        # Log validation results
        for agent_id, result in validation_results.items():
            if result["valid"]:
                logging.info(f"✅ {agent_id}: Integration valid")
            else:
                reason = result.get("reason", "Missing coordination components")
                logging.error(f"❌ {agent_id}: Integration invalid - {reason}")
                
        if all_valid:
            logging.info("🎉 All agent integrations validated successfully")
        else:
            logging.error("⚠️ Some agent integrations failed validation")
            
        return all_valid
        
    def rollback_integration(self, agent_id: str) -> bool:
        """Rollback integration for specific agent"""
        logging.info(f"🔄 Rolling back integration for {agent_id}")
        
        config = AGENTS_CONFIG.get(agent_id)
        if not config:
            logging.error(f"Unknown agent: {agent_id}")
            return False
            
        file_path = Path(config["file_path"])
        
        # Find most recent backup
        backups = list(self.backup_dir.glob(f"{agent_id}_*{file_path.suffix}"))
        
        if not backups:
            logging.error(f"No backup found for {agent_id}")
            return False
            
        latest_backup = max(backups, key=lambda p: p.stat().st_mtime)
        
        try:
            shutil.copy2(latest_backup, file_path)
            logging.info(f"✅ Restored {agent_id} from backup: {latest_backup}")
            return True
            
        except Exception as e:
            logging.error(f"❌ Rollback failed for {agent_id}: {e}")
            return False

def main():
    """Main integration script entry point"""
    import sys
    
    integrator = AgentIntegrator()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "integrate":
            success = integrator.integrate_all_agents()
            sys.exit(0 if success else 1)
            
        elif command == "validate":
            valid = integrator.validate_integration()
            sys.exit(0 if valid else 1)
            
        elif command == "rollback" and len(sys.argv) > 2:
            agent_id = sys.argv[2]
            success = integrator.rollback_integration(agent_id)
            sys.exit(0 if success else 1)
            
        else:
            print("Usage: python integrate_agents.py [integrate|validate|rollback <agent_id>]")
            sys.exit(1)
    else:
        # Default: integrate all agents
        success = integrator.integrate_all_agents()
        
        if success:
            print("\n🎉 Integration completed successfully!")
            print("Next steps:")
            print("1. Start coordination system: python coordination_system.py")
            print("2. Start hook monitor: python sub_agent_hooks.py") 
            print("3. Start SLA dashboard: python sla_dashboard.py")
            print("4. Test agent coordination")
        else:
            print("\n❌ Integration failed. Check logs for details.")
            
        sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()