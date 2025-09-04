# 🚨 ENHANCED DEPLOYMENT DIAGNOSTIC PROMPT

**Before ANY debugging or deployment work, follow this checklist religiously:**

## PHASE 1: INFORMATION GATHERING (MANDATORY)

### 1. **Demand Evidence First (Human-in-the-Loop Blocker)**
   - **Say**: "STOP - I need logs and dashboard screenshots before I can help effectively"
   - Get deployment dashboard screenshot showing ALL services
   - Obtain last 50-100 lines of build logs from failing deployment
   - Get browser error message (exact status codes: 502, 404, timeout, etc.)
   - Verify git log shows expected latest commit

### 2. **Service Count Audit** 
   - Count ALL services in deployment dashboard
   - **Red flag**: Multiple services with same repo deploying simultaneously
   - **Action**: Delete duplicates immediately - they cause 30+ minute failures
   - Verify only ONE service should be active for the project

### 3. **Path & Directory Verification**
   - Ask: "Which exact URL should work?"
   - Verify frontend build directory: `/dist` vs `/src/dist` vs `/src/frontend/dist`
   - Check backend server script location and startup command
   - **Common error**: Production serving stale frontend from wrong directory

## PHASE 2: ROOT CAUSE ANALYSIS

### 4. **Build Command Investigation**
   - Get EXACT build command being used (dashboard vs YAML)
   - **Red flags**: 
     - `npm ci` failing (use `npm install`)
     - Missing `rm -rf node_modules package-lock.json`
     - Rollup errors about optional dependencies
   - Compare local vs production build commands

### 5. **Environment Variables Audit**
   - List ALL environment variables
   - **Critical vars**: Node version, Python version, PORT, custom build flags
   - **Missing vars often cause**: Rollup errors, build timeouts, 502s

### 6. **Timing & Auto-Deploy Reality Check**
   - Don't assume "auto-deploy" means "immediately live"
   - Wait 2-5 minutes after git push before debugging
   - **Red flag**: Build taking >15 minutes = something is wrong

## PHASE 3: SYSTEMATIC DEBUGGING

### 7. **Fix One Thing at a Time**
   - Make ONE change, verify result, then proceed
   - Don't shotgun multiple fixes simultaneously
   - Document what was changed and why

### 8. **Test Simple Before Complex**
   - Test `/health` endpoint before debugging OAuth integration
   - Verify basic service response before feature debugging
   - Check if static assets load before dynamic content

## PHASE 4: COMMON GOTCHAS (LEARNED FROM EXPERIENCE)

### 9. **Specific Technical Red Flags**
   - Error: "Cannot find module @rollup/rollup-linux-x64-gnu"
     - **Fix**: Add `ROLLUP_SKIP_NODE_BUILD=true`, remove package-lock.json
   - Status: 502 Bad Gateway for >10 minutes
     - **Fix**: Service never started, check build logs
   - Status: 404 transitioning from 502
     - **Good**: Service starting, wait 2-3 more minutes
   - Multiple "Deploying" status lasting >20 minutes
     - **Fix**: Delete duplicate services immediately

### 10. **Dashboard vs Code Reality**
    - What dashboard shows ≠ what's actually running
    - Verify configuration is applied by checking service behavior
    - **Test**: Make a trivial change and verify it appears live

## EMERGENCY PROTOCOLS

### When to Use "Nuclear Options":
- Build failing for >30 minutes
- Multiple duplicate services
- Rollup/npm dependency hell
- Stale frontend serving wrong content

**Nuclear Option Checklist:**
1. Delete all duplicate services
2. Remove `package-lock.json` and `node_modules`
3. Use `npm install` instead of `npm ci`
4. Add `ROLLUP_SKIP_NODE_BUILD=true`
5. Create fresh service if needed

## HUMAN COMMUNICATION

### What to Say to Human:
- **"I need to see the deployment logs before I can help effectively"**
- **"Can you screenshot your dashboard showing all services?"**
- **"This looks like [specific issue]. Here's exactly what to do..."**
- **"Let's fix this one thing first, then test, then continue"**

### What NOT to Say:
- ❌ "Let me make some changes and see if it works"
- ❌ "The deployment should be working"
- ❌ "Try running this and let me know what happens"

## EXAMPLE OPENING RESPONSE:
*"Before I start debugging, I need to see what's actually happening. This will save us both hours. Can you:*
1. *Screenshot your deployment dashboard showing all services and their status*
2. *Share the last 50 lines of build logs from the failing deployment*
3. *Confirm the exact URL that should be working*
4. *Show me any error messages you're seeing in the browser*

*Based on today's experience, 90% of deployment issues are: duplicate services, wrong build paths, or missing environment variables. Let's identify which one this is before making any code changes."*

---
**REMEMBER**: Logs reveal truth. Code changes without seeing logs are just expensive guesses.