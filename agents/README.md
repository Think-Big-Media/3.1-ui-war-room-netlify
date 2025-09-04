# AI Agent Orchestration

Custom agent logic and coordination for War Room development.

## Agent Types

### Specialist Agents
- **RAG Agent**: Document ingestion and vector operations
- **Code Agent**: Frontend and backend implementation
- **Planning Agent**: Architecture and task coordination
- **Security Agent**: Compliance and security validation
- **Integration Agent**: External API and webhook management

### Orchestrator Agent
- Multi-agent task coordination
- Context sharing between agents
- Progress tracking and reporting
- Conflict resolution and prioritization

## Agent Architecture

```
orchestrator.py          # Main coordination logic
├── base_agent.py        # Abstract agent foundation
├── specialist_agents/   # Domain-specific agents
│   ├── rag_agent.py
│   ├── code_agent.py
│   ├── planning_agent.py
│   ├── security_agent.py
│   └── integration_agent.py
├── context_manager.py   # Shared context management
└── tools.py            # Common agent tools
```

## Context Engineering

### Context Sharing
- Shared project state
- Task dependencies
- Progress coordination
- Knowledge base updates

### Agent Communication
- Message passing protocols
- Status updates
- Error reporting
- Task handoffs

## Implementation Guidelines

### Agent Specialization
- Clear domain boundaries
- Specific skill sets
- Focused responsibilities
- Expert knowledge areas

### Coordination Patterns
- Task decomposition
- Parallel execution
- Sequential dependencies
- Quality validation

---

*This directory implements the Archon pattern for multi-agent coordination in AI-augmented development.*