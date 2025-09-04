# 🚨 RENDER DASHBOARD - IMMEDIATE ACTIONS NEEDED

## Current Problem
Your war-room-app-2025 service is showing 502 Bad Gateway because of the Rollup build error.

## Fix Instructions (Do This Now)

### 1. Open Render Dashboard
Go to: https://dashboard.render.com/web/srv-cqqhd5q3esus73fivqdg/settings

### 2. Update Build Command
In the "Build Command" field, replace whatever is there with this EXACT command:

```bash
cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install && npm run build
```

**IMPORTANT**: The key changes are:
- `rm -rf node_modules package-lock.json` - Removes the problematic lock file
- `npm install` instead of `npm ci` - Fresh dependency resolution

### 3. Add Environment Variable
Click "Add Environment Variable" and add:
- **Key**: `ROLLUP_SKIP_NODE_BUILD`
- **Value**: `true`

Make sure these other variables are also set:
- PYTHON_VERSION = 3.11.0
- NODE_VERSION = 20
- PORT = 10000

### 4. Save Changes
Click the blue "Save Changes" button at the bottom.

### 5. Trigger Manual Deploy
1. Go to the "Manual Deploy" section
2. Click "Deploy latest commit"
3. The deployment will start immediately

## What Will Happen
1. Build will take 8-10 minutes
2. The Rollup error will NOT occur this time
3. Service will come online with OAuth integrations visible

## Verification URLs
Once deployed (check after 10 minutes):
- ✅ Health Check: https://war-room-app-2025.onrender.com/health
- ✅ OAuth Settings: https://war-room-app-2025.onrender.com/settings
- ✅ Main App: https://war-room-app-2025.onrender.com

## Build Logs
Watch the build progress here:
https://dashboard.render.com/web/srv-cqqhd5q3esus73fivqdg/logs

## If It Still Fails
If you still see a Rollup error, try this alternative build command:
```bash
cd src/backend && pip install -r requirements.txt && cd ../.. && npm install --force --no-optional && npm run build
```

## Success Indicators
You'll know it worked when:
1. Build completes without Rollup errors
2. Service shows "Live" status
3. /health endpoint returns version 2.0.0
4. Settings page shows OAuth integrations at the bottom

---
**DO THIS NOW** - The fix is ready, just needs to be applied in the Render dashboard!