# Agent System - 18 Commands, 9 Personas, 4 MCPs
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🤖 SuperClaude Agent Architecture

### **System Overview**
- **18 Core Commands** with intelligent workflows
- **9 Specialized Personas** for different expertise areas
- **4 MCP Servers** with smart caching and parallel execution
- **Universal Flag System** with inheritance patterns
- **Evidence-Based Development** with prohibited/required language patterns

## 🎭 The 9 Specialized Personas

### **Development Personas**
```yaml
--persona-frontend: "UI/UX focus, accessibility, React/Vue components"
  When: Building user interfaces, design systems, accessibility work
  Use with: Magic MCP, Puppeteer testing, --magic flag
  
--persona-backend: "API design, scalability, reliability engineering"  
  When: Building APIs, databases, server architecture
  Use with: Context7 for patterns, --seq for complex analysis
  
--persona-architect: "System design, scalability, long-term thinking"
  When: Designing architecture, making technology decisions
  Use with: Sequential MCP, --ultrathink for complex systems
```

### **Quality Personas**
```yaml
--persona-analyzer: "Root cause analysis, evidence-based investigation"
  When: Debugging complex issues, investigating problems
  Use with: All MCPs for comprehensive analysis
  
--persona-security: "Threat modeling, vulnerability assessment"
  When: Security audits, compliance, penetration testing
  Use with: --scan --security, Sequential for threat analysis
  
--persona-qa: "Testing, quality assurance, edge cases"
  When: Writing tests, quality validation, coverage analysis
  Use with: Puppeteer for E2E testing, --coverage flag
  
--persona-performance: "Optimization, profiling, bottlenecks"
  When: Performance issues, optimization opportunities
  Use with: Puppeteer metrics, --profile flag
```

### **Improvement Personas**
```yaml
--persona-refactorer: "Code quality, technical debt, maintainability"
  When: Cleaning up code, reducing technical debt
  Use with: --improve --quality, Sequential analysis
  
--persona-mentor: "Teaching, documentation, knowledge transfer"
  When: Creating tutorials, explaining concepts, onboarding
  Use with: Context7 for official docs, --depth flag
```

## 🔌 The 4 MCP Servers

### **Context7 (Library Documentation)**
```yaml
Purpose: "Official library documentation & examples"
When_to_Use:
  - External library integration
  - API documentation lookup  
  - Framework pattern research
  - Version compatibility checking
  
Best_For: "Research-first methodology, evidence-based implementation"
Token_Cost: "Low-Medium"
Caching: "1 hour TTL"
```

### **Sequential (Complex Analysis)**
```yaml
Purpose: "Multi-step problem solving & architectural thinking"
When_to_Use:
  - Complex system design
  - Root cause analysis
  - Performance investigation
  - Architecture review
  
Best_For: "Complex technical analysis, systematic reasoning"
Token_Cost: "Medium-High"
Caching: "Session duration"
```

### **Magic (UI Components)**
```yaml
Purpose: "UI component generation & design system integration"
When_to_Use:
  - React/Vue component building
  - Design system implementation
  - UI pattern consistency
  - Rapid prototyping
  
Best_For: "Consistent design implementation, quality components"
Token_Cost: "Medium"
Caching: "2 hours TTL"
```

### **Puppeteer (Browser Automation)**
```yaml
Purpose: "E2E testing, performance validation, browser automation"
When_to_Use:
  - End-to-end testing
  - Performance monitoring
  - Visual validation
  - User interaction testing
  
Best_For: "Quality assurance, performance validation, UX testing"
Token_Cost: "Low (action-based)"
Caching: "No caching (real-time)"
```

## ⚡ The 18 Core Commands

### **Analysis Commands**
```yaml
/analyze: "Comprehensive codebase analysis"
  Flags: --code --arch --security --performance --c7 --seq
  When: Understanding codebase, identifying issues, research
  
/troubleshoot: "Systematic problem investigation"  
  Flags: --investigate --seq --evidence
  When: Debugging complex issues, root cause analysis
  
/scan: "Security, quality, and compliance scanning"
  Flags: --security --owasp --deps --validate
  When: Security audits, vulnerability assessment
```

### **Development Commands**
```yaml
/build: "Feature implementation & project creation"
  Flags: --init --feature --react --api --magic --tdd
  When: Building features, creating projects, implementing
  
/design: "Architectural design & system planning"
  Flags: --api --ddd --microservices --seq --ultrathink
  When: System architecture, API design, planning
  
/test: "Comprehensive testing & validation"
  Flags: --coverage --e2e --pup --validate
  When: Quality assurance, test coverage, validation
```

### **Quality Commands**  
```yaml
/improve: "Code quality & performance optimization"
  Flags: --quality --performance --security --iterate
  When: Refactoring, optimization, quality improvements
  
/cleanup: "Technical debt & maintenance"
  Flags: --code --all --dry-run
  When: Removing unused code, cleaning up technical debt
```

### **Operations Commands**
```yaml
/deploy: "Production deployment & operations"
  Flags: --env --validate --monitor --checkpoint
  When: Deploying to production, operational tasks
  
/migrate: "Data & schema migrations"
  Flags: --database --validate --dry-run --rollback
  When: Database changes, data migrations
```

## 🎛 Universal Flags (Always Available)

### **Planning & Execution**
```yaml
--plan: "Show execution plan before running"
--dry-run: "Preview changes without execution"
--force: "Override safety checks"
--interactive: "Step-by-step guided process"
```

### **Thinking Modes**
```yaml
--think: "Multi-file analysis (4K tokens)"
--think-hard: "Deep architectural analysis (10K tokens)"  
--ultrathink: "Critical system redesign (32K tokens)"
```

### **Compression & Performance**
```yaml
--uc: "UltraCompressed mode (~70% token reduction)"
--profile: "Detailed performance profiling"
--watch: "Continuous monitoring"
```

### **MCP Control**
```yaml
--c7: "Enable Context7 documentation lookup"
--seq: "Enable Sequential complex analysis"
--magic: "Enable Magic UI component generation"
--pup: "Enable Puppeteer browser automation"
--all-mcp: "Enable all MCP servers"
--no-mcp: "Disable all MCP servers"
```

## 🚀 Decision Matrix: When to Use What

| **Scenario** | **Persona** | **MCP** | **Command** | **Flags** |
|--------------|-------------|---------|-------------|-----------|
| **New React Feature** | `--persona-frontend` | `--magic --c7` | `/build --feature` | `--react --tdd` |
| **API Design** | `--persona-architect` | `--seq --c7` | `/design --api` | `--ddd --ultrathink` |
| **Security Audit** | `--persona-security` | `--seq` | `/scan --security` | `--owasp --strict` |
| **Performance Issue** | `--persona-performance` | `--pup --seq` | `/analyze --performance` | `--profile --iterate` |
| **Bug Investigation** | `--persona-analyzer` | `--all-mcp` | `/troubleshoot` | `--investigate --seq` |
| **Code Cleanup** | `--persona-refactorer` | `--seq` | `/improve --quality` | `--iterate --threshold` |
| **E2E Testing** | `--persona-qa` | `--pup` | `/test --e2e` | `--coverage --validate` |
| **Documentation** | `--persona-mentor` | `--c7` | `/document --user` | `--examples --visual` |

## ⚡ Performance Optimization

### **UltraCompressed Mode**
```yaml
Activation: "--uc flag | 'compress' keywords | Auto at >75% context"
Benefits: "~70% token reduction | Faster responses | Cost efficiency"
Use_When: "Large codebases | Long sessions | Token budget constraints"
```

### **Model Selection**
- **Simple**: Sonnet (basic tasks, quick responses)
- **Complex**: Sonnet-4 (multi-step analysis, architecture)
- **Critical**: Opus-4 (high-stakes decisions, complex systems)

### **MCP Caching & Parallel Execution**
- **Context7**: 1 hour TTL for library documentation
- **Sequential**: Session duration for analysis results
- **Magic**: 2 hours TTL for component templates
- **Parallel Execution**: Independent MCP calls run simultaneously

## 🔒 Evidence-Based Development

### **Prohibited Language**
`best|optimal|faster|secure|better|improved|enhanced|always|never|guaranteed`

### **Required Language**
`may|could|potentially|typically|often|sometimes|measured|documented`

### **Evidence Requirements**
- "testing confirms" | "metrics show" | "benchmarks prove"
- "data indicates" | "documentation states"
- Official documentation required
- Version compatibility verified
- Sources documented

## 🎮 Quick Start Examples

### **New Project Setup**
```bash
/build --init --feature --react --magic --c7
# Creates React project with Magic components and Context7 documentation
```

### **Security Audit**
```bash
/scan --security --owasp --deps --strict
/analyze --security --seq
/improve --security --harden
```

### **Performance Investigation**
```bash
/analyze --performance --pup --profile
/troubleshoot --seq --evidence  
/improve --performance --iterate
```

### **Feature Development**
```bash
/analyze --code --c7
/design --api --seq
/build --feature --tdd --magic
/test --coverage --e2e --pup
```

## 🤖 Auto-Activation Rules

### **File Type Detection**
```yaml
tsx_jsx: "→frontend persona"
py_js: "→appropriate stack"
sql: "→data operations"
Docker: "→devops workflows"
test: "→qa persona"
api: "→backend focus"
```

### **Keyword Triggers**
```yaml
bug_error_issue: "→analyzer persona"
optimize_performance: "→performance persona"
secure_auth_vulnerability: "→security persona"
refactor_clean: "→refactorer persona"
explain_document_tutorial: "→mentor persona"
design_architecture: "→architect persona"
```

---

**The Agent System provides unprecedented power and flexibility for AI-assisted development. Use personas to match expertise to your task, leverage MCP servers for specialized capabilities, and apply appropriate flags for optimal results.**