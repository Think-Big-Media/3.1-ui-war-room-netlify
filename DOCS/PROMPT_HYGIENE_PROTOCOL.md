# War Room CTO Communication Protocol - Prompt Hygiene

## 🚨 CRITICAL: Communication Standards

This document defines the mandatory communication protocol for all War Room project interactions. Failure to follow these guidelines will result in rejected contributions and wasted development time.

## ⚡ Core Principles

### 1. NEVER Provide Raw Command Line Instructions

❌ **WRONG:**
```bash
npm install
npm run dev
```

✅ **CORRECT:**
```
CC main agent - Start the development server:
1. Install dependencies
2. Launch the frontend development server
3. Verify it's running on http://localhost:5173
```

### 2. NEVER Mix Prose with Code Blocks

❌ **WRONG:**
"To fix this issue, run the following command:
```bash
git checkout -b fix-branch
```
Then make your changes."

✅ **CORRECT:**
```
CC main agent - Create a new branch for the fix:
1. Create branch named 'fix-branch'
2. Switch to the new branch
3. Confirm branch creation was successful
```

### 3. Always Use Claude Code Prompts

All technical instructions must be formatted as Claude Code prompts:

```
CC main agent - [Task description]:
1. [Step 1]
2. [Step 2]
3. [Verification step]
```

### 4. Manual Actions Must Be Clearly Marked

When human intervention is required:

```
MANUAL ACTION REQUIRED:
1. Open your browser to https://console.render.com
2. Navigate to Environment Variables
3. Add the following variable:
   - Key: API_KEY
   - Value: [your-api-key]
4. Click "Save Changes"
```

### 5. Browser Automation Uses Comet

For browser-based tasks:

```
CC comet agent - Configure Render environment:
1. Navigate to https://console.render.com
2. Click on "war-room" service
3. Go to "Environment" tab
4. Add variable API_KEY with value from secure storage
5. Save and redeploy
```

## 📋 Common Task Templates

### Starting Development

```
CC main agent - Initialize development environment:
1. Install all dependencies for frontend and backend
2. Create .env.local file from template
3. Start both frontend and backend servers
4. Verify health endpoint at http://localhost:8000/health
5. Open browser to http://localhost:5173
```

### Running Tests

```
CC main agent - Execute test suite:
1. Navigate to frontend directory
2. Run all tests with coverage
3. Generate coverage report
4. Display summary of passed/failed tests
5. If failures exist, list failing test files
```

### Deployment Validation

```
CC main agent - Validate production deployment:
1. Run deployment validation script
2. Check all health endpoints
3. Verify frontend is serving correctly
4. Test API documentation accessibility
5. Generate validation report with timestamps
```

### Database Operations

```
CC main agent - Run database migrations:
1. Navigate to backend directory
2. Check current migration status
3. Apply pending migrations
4. Verify migration success
5. Display list of applied migrations
```

### Git Operations

```
CC main agent - Create feature branch and commit:
1. Create new branch 'feature/[feature-name]'
2. Stage all modified files
3. Create commit with message "[type]: [description]"
4. Display commit hash and changed files
5. Push to remote if requested
```

## 🔍 Prompt Hygiene Checklist

Before submitting any documentation or instructions, verify:

- [ ] NO raw command line instructions (no bare `npm`, `git`, `python` commands)
- [ ] NO mixed prose and code blocks
- [ ] ALL technical tasks use "CC main agent" format
- [ ] ALL browser tasks use "CC comet agent" format
- [ ] Manual actions clearly marked with "MANUAL ACTION REQUIRED:"
- [ ] Each prompt includes verification steps
- [ ] Complex tasks broken into numbered steps
- [ ] No assumptions about user's technical knowledge

## 🚫 Examples of Poor Hygiene

### Example 1: Mixed Instructions
❌ **WRONG:**
"First install the dependencies with `npm install`, then you need to set up your environment variables..."

✅ **CORRECT:**
```
CC main agent - Set up project dependencies:
1. Install all npm packages
2. Create environment configuration
3. Verify installation success
```

### Example 2: Unclear Manual Steps
❌ **WRONG:**
"Go to Render and add your API keys"

✅ **CORRECT:**
```
MANUAL ACTION REQUIRED:
1. Open https://dashboard.render.com
2. Select "war-room" service
3. Navigate to "Environment" section
4. Add the following keys:
   - OPENAI_API_KEY: [your-key]
   - META_API_KEY: [your-key]
5. Click "Save Changes"
6. Wait for automatic redeploy
```

### Example 3: Missing Verification
❌ **WRONG:**
```
CC main agent - Deploy to production
```

✅ **CORRECT:**
```
CC main agent - Deploy to production:
1. Push changes to main branch
2. Monitor Render dashboard for build progress
3. Run deployment validation script
4. Verify all health endpoints return 200
5. Test critical user flows
```

## 📚 Additional Resources

- For complex multi-step processes, use the Task agent
- For file searches, prefer Task agent over direct grep/find
- For API testing, always include expected response verification
- For error handling, provide clear recovery steps

## 🎯 Goal

The goal of prompt hygiene is to:
1. Reduce errors from misunderstood instructions
2. Enable smooth AI-assisted development
3. Maintain consistent communication standards
4. Prevent command-line confusion
5. Ensure reproducible results

Remember: **Every instruction should be executable by Claude Code without human interpretation.**

---

*This protocol is mandatory for all War Room contributors. Last updated: August 2025*