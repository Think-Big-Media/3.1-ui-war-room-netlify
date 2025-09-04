# Comet Browser Automation: Fix Render Deployment

## Objective
Fix the war-room-2025 deployment on Render by removing npm build commands from the dashboard settings.

## Steps to Execute

### 1. Login to Render
- Go to https://dashboard.render.com
- Login if needed (credentials should be saved)

### 2. Navigate to Service
- Find and click on the "war-room" or "war-room-2025" service
- It should show as a Web Service with Python runtime

### 3. Go to Settings
- Click on "Settings" tab
- Scroll down to "Build & Deploy" section

### 4. Update Build Command
**CRITICAL: This is the fix that's needed**

Current Build Command (WRONG - causes the issue):
```bash
cd src/backend && pip install -r requirements.txt
cd ../.. && npm ci && npm run build
```

Change it to (CORRECT - Python only):
```bash
cd src/backend && pip install -r requirements.txt
```

**Important**: Remove ALL npm, node, or frontend build commands. Only keep the Python pip install.

### 5. Verify Other Settings
Ensure these settings are correct:
- **Root Directory**: Leave blank or set to `.` (not `src/backend`)
- **Start Command**: `cd src/backend && python serve_bulletproof.py`
- **Runtime**: Python
- **Python Version**: 3.11

### 6. Add Environment Variables (if missing)
Go to "Environment" tab and ensure these are set:
```
PYTHON_VERSION=3.11
RENDER_ENV=production
```

### 7. Trigger Deployment
After saving the Build Command changes:
1. Click "Manual Deploy" button
2. Select "Clear build cache & deploy"
3. Click "Deploy"

### 8. Verify Success
After deployment completes (5-10 minutes):
- Check https://war-room-2025.onrender.com
- The page should load (not blank)
- In browser console, there should be no Supabase errors

## Expected Result
The site should display properly instead of showing a blank page. The deployment will use our pre-built frontend files instead of trying to rebuild with npm.

## If Issues Persist
If the deployment still fails after these changes:
1. Check the deployment logs for any Python errors
2. Verify the Start Command is exactly: `cd src/backend && python serve_bulletproof.py`
3. Make sure no npm commands remain in any configuration

## Success Indicators
- Site loads without blank page
- Browser console shows no "Missing Supabase environment" errors
- Deployment logs show "Build complete - using pre-built frontend"
- JS file hash will be different from `index-df482586.js`

---
**Note**: This fix addresses the root cause - Render is rebuilding the frontend with npm instead of using our pre-built files. By removing npm commands, it will use the committed dist folder.