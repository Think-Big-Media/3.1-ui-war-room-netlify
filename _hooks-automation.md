# Hooks & Automation System - Background Intelligence
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🤖 Hook System Overview

### **Hook Philosophy**
- **Background Intelligence**: Hooks run silently, announce execution, report results
- **Human-in-the-Loop**: Notify without interrupting workflow
- **Evidence Collection**: Gather data for decision making
- **Proactive Assistance**: Anticipate needs before requests

## 🔄 Core Hook Types

### **1. Daily Summary Hook**
```javascript
// Trigger: 6pm daily or on-demand
const dailySummaryHook = {
  frequency: "daily",
  time: "18:00",
  channels: ["console", "slack", "linear", "file"],
  
  process: [
    "Collect commit history",
    "Analyze code changes",
    "Review test coverage",
    "Check deployment status",
    "Generate insights report"
  ],
  
  output: "/docs/daily-reports/summary-YYYY-MM-DD.md"
};
```

### **2. Problem Solver Hook**
```javascript
// Auto-trigger: After 3+ attempts at same issue
const problemSolverHook = {
  trigger: "repeated_failures >= 3",
  workflow: [
    "Search 5-7 authoritative sources",
    "Identify 1-2 most likely solutions", 
    "Create detailed logs",
    "Implement fix with verification",
    "Document solution for future"
  ],
  
  sources: [
    "Official documentation",
    "Stack Overflow top answers",
    "GitHub issues", 
    "Framework-specific guides",
    "Community best practices"
  ]
};
```

### **3. Notification Hook**
```javascript
// Trigger: Task completion, errors, milestones
const notificationHook = {
  channels: {
    whatsapp: "Critical errors, major milestones",
    slack: "Task completion, warnings",
    console: "All events",
    linear: "Issue updates, progress"
  },
  
  messageTypes: {
    success: "✅ Task completed successfully",
    warning: "⚠️ Potential issue detected", 
    error: "🔴 Critical error requires attention",
    milestone: "🎉 Major milestone achieved"
  }
};
```

### **4. Monitoring Hook (Proof of Life)**
```javascript
// Trigger: Every 15 minutes heartbeat
const monitoringHook = {
  frequency: "*/15 * * * *",
  checks: [
    "Context usage percentage",
    "MCP server health",
    "System uptime",
    "Active task progress",
    "Error rate trends"
  ],
  
  alerts: {
    contextHigh: "Context > 85% - prepare for rewind",
    mcpDown: "MCP server offline - attempting restart",
    errorSpike: "Error rate increased 3x - investigating"
  }
};
```

### **5. Dev Logger Hook**
```javascript
// Trigger: Complex problems solved (3+ attempts)
const devLoggerHook = {
  trigger: "problem_complexity >= 3",
  captureData: [
    "Complete error messages",
    "Attempted solutions", 
    "Working solution with code",
    "Time investment",
    "Key insights learned"
  ],
  
  output: {
    location: "/docs/solutions/",
    format: "problem-YYYYMMDD-brief-description.md",
    indexing: "Auto-add to solutions index"
  }
};
```

## 🎯 Hook Execution Patterns

### **Announcement Protocol**
```javascript
// All hooks announce when they execute
console.log('🔔 Hook: [Hook Name] executing...');
console.log('📊 Context: 67% usage, 4 active tasks');
console.log('⏱️ Estimated completion: 2-3 minutes');

// Completion announcement
console.log('✅ Hook: [Hook Name] completed');
console.log('📋 Results: [brief summary]');
console.log('📁 Output: [file location if applicable]');
```

### **Error Recovery**
```javascript
const errorRecoveryPattern = {
  onFailure: [
    "Log detailed error information",
    "Attempt automatic retry (max 3)",
    "Fall back to manual notification",
    "Create issue in linear if critical"
  ],
  
  gracefulDegradation: [
    "Continue core workflow",
    "Skip non-essential features",
    "Notify user of reduced functionality"
  ]
};
```

## 🔧 Automation Systems

### **CIA (Customer Intelligence Arsenal)**
```javascript
const ciaAutomation = {
  trigger: "competitor_analysis_request",
  location: "~/.claude/automations/CIA/",
  
  process: [
    "Web scraping and data collection",
    "Social media sentiment analysis", 
    "Market positioning analysis",
    "Competitive feature comparison",
    "Pricing and strategy insights"
  ],
  
  usage: "cd ~/.claude/automations/CIA && ./run-cia.mjs --company 'Company' --website 'https://site.com'"
};
```

### **Cartwheel (Marketing Asset Generation)**
```javascript
const cartwheelAutomation = {
  trigger: "marketing_assets_needed",
  location: "~/.claude/automations/Cartwheel/",
  
  generates: [
    "120+ marketing asset variations",
    "Social media content templates",
    "Email campaign sequences",
    "Landing page copy variations",
    "Ad campaign materials"
  ],
  
  usage: "cd ~/.claude/automations/Cartwheel && ./run-cartwheel.mjs"
};
```

## 📊 MCP Integration Hooks

### **MCP Health Monitor**
```javascript
const mcpHealthHook = {
  monitors: {
    linear: "5-10 minute updates, issue sync",
    coderabbit: "Async code review, PR feedback",
    cody: "Code intelligence, search assistance",
    sourcegraph: "Repository analysis, code navigation"
  },
  
  healthChecks: {
    every2Hours: "Full system health validation",
    onFailure: "Auto-restart with exponential backoff",
    reporting: "Multi-channel status updates"
  }
};
```

### **Context Management Hook**
```javascript
const contextHook = {
  monitoring: "Continuous context usage tracking",
  thresholds: {
    warning: "85% - start preparing",
    action: "95% - trigger documentation", 
    rewind: "40% - target after reset"
  },
  
  patrickHack: [
    "Document comprehensive state at 95%",
    "Create new session with summary",
    "Preserve full context continuity",
    "Never use /compact - maintains intelligence"
  ]
};
```

## 🚀 Hook Configuration

### **Installation & Setup**
```bash
# Create hooks directory structure
mkdir -p ~/.claude/hooks/{daily,monitoring,problem-solving,notifications}

# Set execution permissions
chmod +x ~/.claude/hooks/**/*.js

# Configure environment variables
export CLAUDE_HOOKS_ENABLED=true
export CLAUDE_NOTIFICATION_CHANNELS="console,slack,linear"
export CLAUDE_MONITORING_INTERVAL=15
```

### **Hook Activation Patterns**
```javascript
// File type detection triggers
const fileTypeTriggers = {
  "tsx|jsx": "→ frontend hooks",
  "py|js": "→ appropriate stack hooks", 
  "sql": "→ database operation hooks",
  "docker": "→ devops workflow hooks",
  "test": "→ qa automation hooks"
};

// Keyword triggers
const keywordTriggers = {
  "bug|error|issue": "→ problem solver hook",
  "optimize|performance": "→ performance monitoring hook", 
  "secure|auth|vulnerability": "→ security audit hook",
  "deploy|release|ship": "→ deployment hooks"
};
```

## 🎛️ Configuration Examples

### **Project-Specific Hook Config**
```json
{
  "hooks": {
    "dailySummary": {
      "enabled": true,
      "time": "18:00",
      "channels": ["console", "linear"]
    },
    "problemSolver": {
      "enabled": true,
      "attempts_threshold": 3,
      "sources": 7
    },
    "monitoring": {
      "enabled": true,
      "interval": 15,
      "context_warning": 85
    }
  }
}
```

### **Notification Preferences**
```json
{
  "notifications": {
    "whatsapp": {
      "enabled": true,
      "critical_only": true
    },
    "slack": {
      "enabled": true,
      "channel": "#war-room-dev"
    },
    "console": {
      "enabled": true,
      "verbose": false
    }
  }
}
```

---

**The Hook System provides intelligent background assistance that enhances development velocity without interrupting flow. Hooks work silently to gather intelligence, solve problems, and maintain system health while keeping you informed of their activities.**