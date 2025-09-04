# 🚨 CLAUDE DEPLOYMENT TROUBLESHOOTING PROMPT

Use this prompt when deployment issues arise to avoid repeating the same mistakes.

---

## URGENT DEPLOYMENT CONTEXT

I'm having deployment issues. Before we start debugging, here's what you MUST check first based on past mistakes:

### IMMEDIATE BLOCKERS TO CHECK:
1. **SHOW ME THE LOGS**: Don't guess - demand deployment logs from dashboard/CLI immediately
2. **COUNT SERVICES**: Check if multiple duplicate services are deploying simultaneously 
3. **VERIFY DIRECTORIES**: Confirm which frontend directory is being served (/src vs /src/frontend vs /dist)
4. **CHECK BUILD COMMANDS**: Verify the exact build command being used in production
5. **ENVIRONMENT VARIABLES**: List all env vars, especially Node/Python versions and any custom flags

### COMMON ISSUES FROM TODAY:
- **Multiple Services**: 5+ services deploying at once causing resource conflicts and 30-min delays
- **Wrong Frontend Path**: Production serving stale `/src/frontend/` instead of `/src/`
- **Rollup Build Error**: `Cannot find module @rollup/rollup-linux-x64-gnu` due to optional dependencies
- **Package Lock Issues**: npm ci failing where npm install works
- **Dashboard vs YAML**: Render using dashboard config instead of render.yaml
- **Directory Confusion**: Backend running from wrong directory, missing serve_bulletproof.py
- **Auto-deploy Delays**: Changes pushed but not appearing for 20+ minutes

### MISTAKES TO AVOID:
- ❌ Don't spend time on code changes before checking basic deployment status
- ❌ Don't assume "it should work" - always verify the actual running configuration  
- ❌ Don't debug symptoms - find the root cause first (logs, service count, paths)
- ❌ Don't make multiple changes simultaneously - fix one thing at a time
- ❌ Don't trust that "auto-deploy" means "immediately deployed"

### HUMAN-IN-THE-LOOP TRIGGERS:
If ANY of these occur, STOP and ask the human to provide logs/screenshots:
- 502/503 errors lasting >5 minutes
- Build taking >15 minutes  
- Multiple services showing "Deploying" status
- Changes not appearing after 10+ minutes
- Any error mentioning "optional dependencies" or "node_modules"

### FIRST ACTIONS (ALWAYS DO THIS):
1. **Request screenshot of deployment dashboard showing all services**
2. **Ask for recent build logs (last 50 lines minimum)**  
3. **Verify the exact URL that should be working**
4. **Check git log to confirm latest commit is what's expected**
5. **Test a simple endpoint (like /health) before debugging complex features**

### NUCLEAR OPTIONS (WHEN NOTHING ELSE WORKS):
- Delete all but one service
- Remove package-lock.json and node_modules
- Use npm install instead of npm ci
- Add ROLLUP_SKIP_NODE_BUILD=true
- Create entirely new service with clean slate

---

**REMEMBER**: Always ask "Can you show me the deployment logs?" before making any code changes. Logs reveal the truth, code changes are just guesses.

## EXAMPLE OPENING RESPONSE:
"Before I start debugging, I need to see what's actually happening. Can you:
1. Screenshot your deployment dashboard showing all services
2. Share the last 50 lines of build logs from the failing deployment  
3. Confirm which URL should be working
This will save us hours of guessing and prevent repeating today's mistakes."