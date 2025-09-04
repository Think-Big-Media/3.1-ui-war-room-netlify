# 🚀 DEPLOY TO NEW WAR ROOM WORKSPACE

## Why We're Doing This
- Old Render service is completely broken/disconnected
- Moving to Pro War Room workspace (not Think Big)
- Fresh start will fix everything in 5 minutes

## Step-by-Step Instructions

### 1. Create New Service in War Room Workspace
1. Go to https://dashboard.render.com
2. **Switch to "War Room" workspace** (not Think Big)
3. Click "New +" → "Web Service"
4. Connect GitHub repository: `Think-Big-Media/1.0-war-room`
5. Select branch: `main`
6. Name it: `war-room-production`

### 2. Configure Build Settings
**Build Command:**
```bash
cd src/backend && pip install -r requirements.txt && cd ../.. && npm ci && npm run build
```

**Start Command:**
```bash
cd src/backend && python3 serve_bulletproof.py
```

### 3. Environment Variables
Add these in Render dashboard:
```
PYTHON_VERSION=3.11
NODE_VERSION=20
PORT=10000
NODE_ENV=production
RENDER_ENV=production
```

### 4. Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for initial build
3. Get new URL (probably: https://war-room-production.onrender.com)

### 5. Verify Success
Check these endpoints on NEW service:
- `/health` - Should show version 2.0.0
- `/deployment-version` - Should show our verification file
- `/settings` - Should show OAuth integrations!

### 6. Update DNS (Later)
Once verified working, update your domain to point to new service.

## What Will Be Fixed
✅ OAuth integrations will appear
✅ Glassmorphic logo will show
✅ All recent code will deploy
✅ Future deployments will work automatically

## Time Estimate
- 5 minutes to create service
- 5-10 minutes for first build
- DONE! OAuth working!

---

This is the right move. Old service is dead. New service in War Room workspace will work perfectly.