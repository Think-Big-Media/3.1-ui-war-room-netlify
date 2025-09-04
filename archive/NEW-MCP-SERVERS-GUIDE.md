# New MCP Servers Installation Guide

## ✅ Successfully Installed MCP Servers

### 1. REF - Smart Documentation Retrieval
- **Status**: ✅ Installed
- **Command**: `npx ref-tools-mcp`
- **Purpose**: Pulls only relevant documentation sections instead of entire docs
- **Usage in Claude**: "Using REF, find the latest OpenAI streaming API parameters"
- **Benefits**: Reduces token usage by 85%, prevents hallucinated functions

### 2. Semgrep - Security Vulnerability Scanner
- **Status**: ✅ Installed
- **Command**: `semgrep-mcp`
- **Purpose**: Scans for 2,000+ security vulnerabilities with context awareness
- **Usage in Claude**: "Use Semgrep to scan the War Room project for security vulnerabilities"
- **Benefits**: SOC-2 compliance, FEC compliance, prevents critical vulnerabilities

### 3. Exa (formerly ExoArch) - Developer Search
- **Status**: ✅ Installed (needs API key)
- **Command**: `npx exa-mcp-server`
- **API Key Required**: Get from https://dashboard.exa.ai
- **Purpose**: Developer-focused search for current best practices
- **Usage in Claude**: "Using Exa, research modern RAG implementation patterns"
- **Benefits**: Current technical information, not outdated training data

### 4. Playwright - UI Testing & Screenshots
- **Status**: ✅ Installed
- **Command**: `npx @playwright/mcp`
- **Purpose**: AI-graded self-improving UIs with screenshot analysis
- **Usage in Claude**: "Use Playwright to screenshot the dashboard and analyze UX"
- **Benefits**: Automated UI improvements, accessibility checks

### 5. Pieces - Developer Memory Graph
- **Status**: ✅ Configured (requires desktop app)
- **Desktop App**: Download from https://pieces.app
- **MCP Endpoint**: `http://localhost:39300/model_context_protocol/2024-1`
- **Purpose**: Remembers past problems, solutions, and development context
- **Usage**: Copy solutions from Pieces app and paste to Claude
- **Benefits**: Turn hours of debugging into minutes of retrieval

## 🔑 API Keys Needed

### Exa API Key
1. Sign up at: https://dashboard.exa.ai
2. Get your API key
3. Update in MCP config: `"EXA_API_KEY": "your-key-here"`

### TestSprite Password
1. Login at: https://testsprite.com/login
2. Set your password
3. Update in MCP config: `"TESTSPRITE_PASSWORD": "your-password"`

## 🚨 Sourcegraph Admin Access

I've created a guide at `SOURCEGRAPH-ADMIN-FIX.md` with steps to become Site Admin:
1. Try: https://badaboost.sourcegraph.app/site-admin/init
2. If that fails, contact support@sourcegraph.com

## 🚀 Next Steps

1. **Restart Claude Desktop** to activate all new MCP servers
2. **Get API Keys**:
   - Exa: https://dashboard.exa.ai
   - TestSprite: Update password in config
3. **Install Pieces Desktop**: https://pieces.app
4. **Fix Sourcegraph Admin**: Follow SOURCEGRAPH-ADMIN-FIX.md

## 💪 What You Can Do Now

### Security Scanning
```
"Claude, use Semgrep to scan for security vulnerabilities and provide fixes"
```

### Smart Documentation
```
"Claude, using REF, find the latest Pinecone vector search best practices"
```

### Developer Search
```
"Claude, using Exa, research current agentic RAG architectures"
```

### UI Analysis
```
"Claude, use Playwright to analyze the War Room dashboard UI"
```

### Memory Retrieval
```
"I had this Tailwind error before, let me check Pieces..."
[Copy solution from Pieces and paste to Claude]
```

## 🎯 All Services Summary

### Existing Services (Already Working)
- ✅ GitHub MCP
- ✅ TestSprite MCP (monitoring 24/7)
- ✅ Perplexity MCP
- ✅ Notion MCP
- ✅ Render MCP
- ✅ Sourcegraph React Prop MCP
- ✅ Context Engineering MCP
- ✅ IDE (VS Code) MCP

### New Power Tools (Just Added)
- ✅ REF - Smart docs
- ✅ Semgrep - Security 
- ✅ Exa - Dev search
- ✅ Playwright - UI testing
- ✅ Pieces - Memory graph

Your War Room project now has enterprise-grade security scanning, intelligent documentation retrieval, and AI-powered UI improvements!