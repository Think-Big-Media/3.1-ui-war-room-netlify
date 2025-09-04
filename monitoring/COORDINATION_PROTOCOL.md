# War Room Sub-Agent Coordination Protocol
## Unified Communication Framework for All War Room Sub-Agents

**Version**: 1.0  
**Last Updated**: August 7, 2025  
**Target Agents**: Health Check Monitor, AMP Refactoring Specialist, CodeRabbit Integration, Pieces Knowledge Manager

---

## 🎯 Mission Statement

Establish unified coordination protocols for all 4 War Room sub-agents with:
- Hourly status reporting
- Real-time WebSocket communication
- Shared TASK.md management
- Git-based conflict resolution
- <3s performance SLA monitoring

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COORDINATION SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Task Manager  │    │  SLA Monitor    │    │ Git Resolver │ │
│  │   (TASK.md)     │    │  (<3s Target)   │    │ (Auto-merge) │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              WebSocket Coordination Hub                      │ │
│  │                  (ws://localhost:8765)                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
    ┌───────────┐      ┌──────────────┐     ┌─────────────────┐
    │  Health   │      │     AMP      │     │   CodeRabbit    │
    │ Monitor   │      │ Refactoring  │     │ Integration     │
    │Sub-Agent  │      │ Specialist   │     │   Sub-Agent     │
    └───────────┘      └──────────────┘     └─────────────────┘
          │
    ┌─────────────────┐
    │    Pieces       │
    │  Knowledge      │
    │   Manager       │
    └─────────────────┘
```

---

## 📡 WebSocket Communication Protocol

### Connection Setup

Each sub-agent connects to the coordination WebSocket server:

```javascript
// Connection URL
ws://localhost:8765

// Initial handshake message
{
  "agent_id": "health_monitor|amp_specialist|coderabbit|pieces_manager",
  "name": "Human-readable agent name",
  "version": "1.0.0",
  "capabilities": ["monitoring", "refactoring", "review", "knowledge"]
}
```

### Message Format

All WebSocket messages follow this JSON structure:

```json
{
  "type": "message_type",
  "agent_id": "sending_agent_id", 
  "timestamp": "ISO8601_timestamp",
  "data": {
    "payload_specific_data": "value"
  },
  "priority": "critical|high|medium|low",
  "correlation_id": "optional_request_id"
}
```

### Message Types

#### 1. Status Report Messages

**Type**: `status_report`  
**Frequency**: Hourly  
**Purpose**: Regular health and activity updates

```json
{
  "type": "status_report",
  "agent_id": "health_monitor",
  "timestamp": "2025-08-07T10:30:00Z",
  "data": {
    "status": "active|idle|error|maintenance",
    "current_task": "task_description_or_null",
    "resource_usage": {
      "cpu_percent": 45.2,
      "memory_mb": 256,
      "disk_mb": 1024
    },
    "performance_metrics": {
      "avg_response_time": 1.2,
      "requests_processed": 147,
      "errors_count": 0
    },
    "last_activity": "2025-08-07T10:29:45Z",
    "uptime_seconds": 86400,
    "health_check_passed": true
  }
}
```

#### 2. Task Update Messages

**Type**: `task_update`  
**Frequency**: On task state changes  
**Purpose**: Update shared TASK.md with progress

```json
{
  "type": "task_update", 
  "agent_id": "amp_specialist",
  "timestamp": "2025-08-07T10:30:00Z",
  "data": {
    "task_id": "refactor_component_xyz",
    "title": "Refactor React component for performance",
    "status": "pending|in_progress|completed|blocked|error",
    "progress": 0.75,
    "priority": "high",
    "estimated_completion": "2025-08-07T11:00:00Z",
    "blocking_issues": [],
    "dependencies": ["task_id_1", "task_id_2"]
  }
}
```

#### 3. Performance Metric Messages

**Type**: `performance_metric`  
**Frequency**: Real-time (on completion of operations)  
**Purpose**: SLA compliance monitoring

```json
{
  "type": "performance_metric",
  "agent_id": "coderabbit", 
  "timestamp": "2025-08-07T10:30:00Z",
  "data": {
    "operation": "code_review",
    "response_time": 2.1,
    "success": true,
    "endpoint": "/api/review",
    "payload_size_bytes": 4096,
    "error_message": null,
    "sla_compliant": true
  }
}
```

#### 4. Hook Event Messages

**Type**: `hook_event`  
**Frequency**: On agent lifecycle events  
**Purpose**: Track agent start/stop/progress via hooks

```json
{
  "type": "hook_event",
  "agent_id": "pieces_manager",
  "timestamp": "2025-08-07T10:30:00Z", 
  "data": {
    "event": "start|stop|progress|error|health_check",
    "task_id": "knowledge_indexing_123",
    "progress": 0.5,
    "hook_data": {
      "sub_agent_stop_reason": "task_completed",
      "exit_code": 0,
      "duration_seconds": 45.2
    }
  }
}
```

#### 5. Error Report Messages

**Type**: `error_report`  
**Frequency**: On errors/exceptions  
**Purpose**: Centralized error tracking and alerting

```json
{
  "type": "error_report",
  "agent_id": "health_monitor",
  "timestamp": "2025-08-07T10:30:00Z",
  "priority": "critical",
  "data": {
    "error_type": "connection_timeout|processing_error|resource_exhausted",
    "error_message": "Detailed error description",
    "stack_trace": "optional_stack_trace",
    "task_id": "related_task_id_if_applicable",
    "recovery_action": "restart|retry|escalate|ignore",
    "affected_endpoints": ["/health", "/status"],
    "estimated_impact": "low|medium|high|critical"
  }
}
```

#### 6. Coordination Command Messages

**Type**: `coordination_command`  
**Frequency**: As needed  
**Purpose**: Inter-agent coordination and control

```json
{
  "type": "coordination_command",
  "agent_id": "coordination_system",
  "timestamp": "2025-08-07T10:30:00Z",
  "data": {
    "command": "restart|pause|resume|scale|migrate",
    "target_agents": ["health_monitor", "amp_specialist"],
    "parameters": {
      "reason": "sla_violation",
      "timeout_seconds": 30
    },
    "correlation_id": "cmd_12345"
  }
}
```

---

## 🔄 Sub-Agent Stop Hooks Implementation

### Hook Installation

Each sub-agent script is automatically injected with coordination hooks:

```python
# Auto-injected coordination hooks
class CoordinationHooks:
    def sub_agent_stop(self, task_id=None, status="completed", progress=1.0):
        """Called when sub-agent stops or completes task"""
        
    def sub_agent_start(self, task_id=None):
        """Called when sub-agent starts task"""
        
    def sub_agent_progress(self, task_id, progress, status="in_progress"):  
        """Called for progress updates"""
        
    def sub_agent_error(self, error, task_id=None):
        """Called on agent error"""
```

### Hook Usage Examples

```python
# At task start
sub_agent_start(task_id="refactor_component_123")

# During progress updates
sub_agent_progress(task_id="refactor_component_123", progress=0.5)

# On task completion
sub_agent_stop(task_id="refactor_component_123", status="completed", progress=1.0)

# On error
try:
    # Agent work
    pass
except Exception as e:
    sub_agent_error(error=e, task_id="refactor_component_123")
```

---

## 📋 TASK.md Management Protocol

### Central TASK.md Updates

All agents coordinate through shared TASK.md updates:

1. **Task Status Format**:
```markdown
- [ ] Task description (ID: task_123)
- [WIP] Task in progress (Agent: health_monitor, Updated: 10:30)
- [x] Completed task (Agent: amp_specialist, Updated: 09:45)
```

2. **Coordination Sections**:
```markdown
## 🤖 Coordination Tasks: [Current Date]

### Active Coordination
- [WIP] **SLA Monitoring Setup** (ID: coord_001)
  - Priority: high
  - Assigned Agents: health_monitor, coordination_system
  - Progress: 75%
  - Updated: health_monitor, 10:30

### Pending Coordination  
- [ ] **Multi-Agent Refactoring** (ID: coord_002)
  - Priority: medium
  - Assigned Agents: amp_specialist, coderabbit
  - Dependencies: coord_001
```

3. **Auto-Update Rules**:
   - Only assigned agents can update their tasks
   - Progress updates include agent ID and timestamp
   - Conflicts auto-resolved via git merge strategies
   - Coordination tasks get priority in TASK.md

---

## 🛠️ Git Conflict Resolution

### Automatic Resolution Strategy

1. **Coordination File Priority**:
   - `TASK.md` conflicts auto-resolved via merge strategies
   - Agent-specific files get branch-based resolution
   - Coordination logs always appended (no conflicts)

2. **Merge Strategy**:
```bash
# Auto-resolution for coordination files
git merge --strategy-option=ours TASK.md       # Keep local changes
git merge --strategy-option=theirs logs/       # Accept remote logs  
git merge --strategy-option=recursive coordination_system.py
```

3. **Conflict Prevention**:
   - Each agent updates specific TASK.md sections
   - Timestamps prevent concurrent edit conflicts
   - Agent-specific log files (no shared writes)

---

## 📊 SLA Monitoring Requirements

### Performance Targets

- **Response Time SLA**: < 3.0 seconds
- **Availability SLA**: > 99.5% uptime
- **Error Rate SLA**: < 0.1% of requests

### Monitoring Metrics

1. **Response Time Tracking**:
```json
{
  "agent_id": "health_monitor",
  "endpoint": "/health",
  "response_time": 1.2,
  "timestamp": "2025-08-07T10:30:00Z",
  "sla_compliant": true
}
```

2. **SLA Violation Handling**:
   - Immediate alert on >3s response time
   - Auto-escalation on repeated violations  
   - Dashboard notification to all agents
   - Automatic task re-assignment if needed

### Dashboard Access

SLA monitoring dashboard available at:
- **URL**: `http://localhost:8766`
- **Real-time updates**: WebSocket connection
- **Historical data**: 7-day retention
- **Export**: JSON/CSV formats

---

## 🔧 Agent Integration Guide

### For Health Check Monitor

```javascript
// health-monitor-sub-agent.js integration
const WebSocket = require('ws');

class HealthMonitorCoordination {
    constructor() {
        this.ws = new WebSocket('ws://localhost:8765');
        this.agentId = 'health_monitor';
    }
    
    async sendStatusReport() {
        const report = {
            type: 'status_report',
            agent_id: this.agentId,
            timestamp: new Date().toISOString(),
            data: {
                status: 'active',
                current_task: this.getCurrentTask(),
                performance_metrics: await this.getPerformanceMetrics(),
                health_check_passed: await this.runHealthCheck()
            }
        };
        
        this.ws.send(JSON.stringify(report));
    }
}
```

### For AMP Refactoring Specialist

```python
# amp_refactoring_specialist.py integration
import asyncio
import websockets
import json
from datetime import datetime

class AMPCoordination:
    def __init__(self):
        self.agent_id = 'amp_specialist'
        self.coordination_url = 'ws://localhost:8765'
        
    async def report_refactoring_progress(self, task_id, progress):
        message = {
            'type': 'task_update',
            'agent_id': self.agent_id,
            'timestamp': datetime.now().isoformat(),
            'data': {
                'task_id': task_id,
                'status': 'in_progress',
                'progress': progress,
                'operation': 'component_refactoring'
            }
        }
        
        await self.send_coordination_message(message)
```

### For CodeRabbit Integration

```python
# coderabbit_integration.py integration  
from coordination_hooks import CoordinationHooks

class CodeRabbitAgent:
    def __init__(self):
        self.hooks = CoordinationHooks('coderabbit')
        
    async def review_code(self, pr_data):
        task_id = f"review_{pr_data['pr_id']}"
        
        # Start task
        self.hooks.sub_agent_start(task_id)
        
        try:
            # Perform review
            start_time = time.time()
            review_result = await self.perform_review(pr_data)
            response_time = time.time() - start_time
            
            # Report performance  
            await self.hooks.send_performance_metric(
                operation='code_review',
                response_time=response_time,
                success=True
            )
            
            # Complete task
            self.hooks.sub_agent_stop(task_id, status='completed')
            
        except Exception as e:
            self.hooks.sub_agent_error(e, task_id)
```

### For Pieces Knowledge Manager

```python
# pieces_knowledge_manager.py integration
class PiecesKnowledgeAgent:
    def __init__(self):
        self.coordination = CoordinationHooks('pieces_manager')
        
    async def index_knowledge(self, documents):
        task_id = f"index_{len(documents)}_docs"
        
        self.coordination.sub_agent_start(task_id)
        
        try:
            total_docs = len(documents)
            for i, doc in enumerate(documents):
                await self.process_document(doc)
                
                # Report progress every 10%
                progress = (i + 1) / total_docs
                if progress % 0.1 < 0.01:
                    self.coordination.sub_agent_progress(task_id, progress)
                    
            self.coordination.sub_agent_stop(task_id, status='completed')
            
        except Exception as e:
            self.coordination.sub_agent_error(e, task_id)
```

---

## 🚀 Deployment Instructions

### 1. Start Coordination System

```bash
# Start main coordination hub
cd /Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring
python coordination_system.py
```

### 2. Start Hook Monitor

```bash
# Start sub-agent hook monitoring
python sub_agent_hooks.py
```

### 3. Start SLA Dashboard

```bash
# Start performance monitoring dashboard  
python sla_dashboard.py
```

### 4. Verify Integration

```bash
# Check coordination WebSocket
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
     http://localhost:8765

# Check SLA dashboard
open http://localhost:8766

# Verify TASK.md updates
tail -f /Users/rodericandrews/WarRoom_Development/1.0-war-room/TASK.md
```

---

## 📈 Success Metrics

### Coordination Efficiency
- **Sub-agent sync time**: < 5 seconds
- **TASK.md update latency**: < 1 second  
- **Hook event processing**: < 500ms
- **Git conflict resolution**: < 10 seconds

### Reliability Targets
- **WebSocket uptime**: 99.9%
- **Hook delivery rate**: 99.5%
- **SLA monitoring accuracy**: 100%
- **Automatic recovery rate**: 95%

### Performance Benchmarks
- **System resource usage**: < 5% CPU, < 200MB RAM
- **Network overhead**: < 1KB/minute per agent
- **Database growth rate**: < 10MB/day
- **Dashboard load time**: < 2 seconds

---

## 🆘 Troubleshooting Guide

### Common Issues

1. **WebSocket Connection Failures**:
```bash
# Check if coordination system is running
ps aux | grep coordination_system

# Test WebSocket connectivity  
nc -z localhost 8765

# Check firewall/port availability
lsof -i :8765
```

2. **TASK.md Merge Conflicts**:
```bash
# Manual conflict resolution
cd /Users/rodericandrews/WarRoom_Development/1.0-war-room
git status
git add TASK.md
git commit -m "Resolve coordination conflicts"
```

3. **Agent Hook Failures**:
```bash
# Check hook injection status
grep "COORDINATION_HOOKS_INJECTED" agents/*.py

# Re-inject hooks if missing
python sub_agent_hooks.py --reinject-all
```

4. **SLA Dashboard Issues**:
```bash
# Check dashboard logs
tail -f monitoring/logs/sla_dashboard_*.log

# Verify database connectivity
sqlite3 monitoring/sla_monitoring.db ".tables"

# Test performance monitoring
curl http://localhost:8766/api/stats
```

---

## 🔄 Protocol Versioning

**Current Version**: 1.0  
**Backward Compatibility**: N/A (initial version)  
**Breaking Changes**: None  

### Future Enhancements (v1.1)
- Multi-tenant agent isolation
- Advanced conflict resolution strategies  
- ML-based performance prediction
- Cross-datacenter coordination

---

**Last Updated**: August 7, 2025  
**Maintained By**: War Room Coordination Team  
**Review Schedule**: Monthly