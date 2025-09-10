# Context Management - The Patrick Hack
**Referenced by**: CLAUDE.md  
**Source**: Universal Claude System

## 🧠 Never Use /compact - Smart Context Management Instead

### **The Problem with /compact**
- **Makes Claude "dumb"** - Oversimplifies complex details
- **Loses nuance** - Critical context gets compressed away
- **Disrupts workflow** - Unexpected triggering breaks flow
- **Poor summaries** - AI-generated summaries miss important details

## 🎯 The Patrick Hack Solution

### **Monitoring Thresholds**
```javascript
const contextThresholds = {
  warning: 85,      // Start preparing
  action: 95,       // Trigger documentation
  rewind: 40,       // Target after reset
  danger: 60        // Avoid complex tasks above this
}
```

### **Visual Context Indicator**
```
Context Usage Monitor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0%    20%   40%   60%   80%   100%
[████████████░░░░░░░░░░░░░░░░░░░] 42%
         ↑ Current (Optimal)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Zones:
🟢 0-40%:   Peak performance
🟢 40-60%:  Good for most tasks
🟡 60-80%:  Simple tasks only
🟠 80-95%:  Prepare to rewind
🔴 95-100%: Auto-document & reset
```

## 📋 The Patrick Hack Process

### **1. Continuous Monitoring (Every 30 seconds)**
- Check current context usage percentage
- Display visual indicator
- Alert at critical thresholds
- Suggest appropriate actions

### **2. At 85% Usage - Warning Phase**
```
⚠️ Context at 85% - Prepare for documentation
Recommendations:
- Finish current simple tasks
- Avoid starting complex operations
- Consider documenting progress soon
```

### **3. At 95% Usage - Auto-Documentation**
```
╔══════════════════════════════════════════╗
║ 🚨 CONTEXT AT 95% - DOCUMENTING NOW      ║
║                                          ║
║ Creating comprehensive summary...        ║
║ This preserves quality before degradation║
╚══════════════════════════════════════════╝
```

**Auto-generate documentation covering:**
- Key decisions made
- Code changes implemented  
- Problems solved
- Current state of the project
- Next steps planned
- Important context to preserve

### **4. Rewind Process to 40%**
```
╔══════════════════════════════════════════╗
║ 🔄 EXECUTING REWIND TO 40%               ║
╚══════════════════════════════════════════╝

Steps:
1. Copy the comprehensive summary
2. Start new session (Cmd+K → 'New Chat')
3. Paste summary as first message
4. Continue from where you left off
```

## 📊 Usage Patterns & Best Practices

### **For Complex Tasks (Refactoring, Multi-file)**
- **Before starting**: Check context usage
- **If >60%**: Document and rewind first
- **Complex tasks need "working memory"** for:
  - Tracking relationships
  - Managing dependencies  
  - Multi-file coordination

### **Session Health Management**
```javascript
const sessionReminders = {
  30: "✅ Great context health",
  50: "📝 Consider documenting progress",
  70: "⚠️ Plan to wrap up complex tasks",
  85: "🔄 Prepare for rewind soon",
  95: "🚨 Documentation triggered"
}
```

## 📝 Smart Summarization Templates

### **Code Session Summary Template**
```markdown
## Session Summary - [timestamp]

### Completed
- [List of completed features/fixes]

### Key Decisions
- [Architectural choices made]
- [Libraries/tools selected]

### Code Changes
```
[Critical code snippets to remember]
```

### Current State
- [What's working]
- [What's in progress]
- [Known issues]

### Next Steps
1. [Immediate next task]
2. [Following tasks]

### Important Context
- [Any special considerations]
- [Dependencies to watch]
```

## 🎮 Commands

```bash
/context          # Show current usage
/context-health   # Detailed analysis
/document-now     # Force documentation
/rewind          # Start rewind process
/autosave        # Save current state
/session-history # View past summaries
```

## ⚡ Integration with Other Systems

### **With EPE Framework**
- **Before Explore**: Ensure < 40% context
- **Before Plan**: Ensure < 60% context  
- **Before Execute**: Check context health
- **After Feature**: Consider rewind if > 80%

### **With Testing Agent**
- **Before Full Suite**: Require < 50% context
- **After Coverage**: Document if > 85%

## 🔧 Best Practices

1. **Never use /compact** - Always use Patrick Hack
2. **Document at 95%** - Before degradation
3. **Rewind to 40%** - Optimal headroom
4. **Monitor continuously** - Watch the indicator
5. **Save summaries** - Build knowledge base
6. **Plan complex tasks** - Do them under 60%
7. **Use external notes** - For reference material

## 🚨 Critical Rules

- **Complex operations** (3+ files, architectural changes) → Start under 60%
- **Long sessions** → Document every 10 minutes of context
- **Before major decisions** → Ensure adequate working memory
- **Emergency documentation** → Any unexpected crash or issue

---

**The Patrick Hack keeps Claude smart by managing context intelligently, not by dumbing it down.**