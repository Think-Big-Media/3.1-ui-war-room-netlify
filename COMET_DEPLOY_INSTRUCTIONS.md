# COMET BROWSER: DEPLOY WAR ROOM WITH ROLLUP FIX

## Step 1: Open Render Dashboard
1. Go to: https://dashboard.render.com
2. Select workspace: "War Room" (NOT Think Big Media)
3. Click on service: `war-room-app-2025`

## Step 2: Update Build Settings
1. Click "Settings" tab
2. Scroll to "Build & Deploy" section
3. Click "Edit" next to Build Command
4. **DELETE everything and paste this exactly:**
```
cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install && npm run build
```
5. Click "Save Changes"

## Step 3: Add Environment Variable
1. Click "Environment" tab
2. Click "Add Environment Variable"
3. Add:
   - Key: `ROLLUP_SKIP_NODE_BUILD`
   - Value: `true`
4. Click "Save"

## Step 4: Verify Start Command
1. In Settings, verify Start Command is:
```
cd src/backend && python3 serve_bulletproof.py
```

## Step 5: Trigger Deployment
1. Click "Manual Deploy" button (top right)
2. Select "Deploy latest commit"
3. Click "Deploy"

## Step 6: Monitor Build
1. Click "Events" tab
2. Watch for "Build started" event
3. Click on it to see live logs
4. **EXPECTED**: Build will take 5-10 minutes
5. **SUCCESS SIGNS**:
   - "Building wheel for..."
   - "npm install" (NOT npm ci)
   - "vite v5.4.11 building for production"
   - "✓ XXX modules transformed"

## Step 7: Verify Success (after 10 min)
Open these URLs:
1. https://war-room-app-2025.onrender.com/health
   - Should show: `"version": "2.0.0"`
2. https://war-room-app-2025.onrender.com/settings
   - Scroll to bottom
   - Should see "Advertising Account Integration" section
   - Meta and Google Ads OAuth buttons should be visible

## If Build Fails
Look for error message. If it mentions Rollup:
1. Double-check ROLLUP_SKIP_NODE_BUILD env var is set
2. Ensure build command has `rm -rf node_modules package-lock.json`

## CRITICAL REMINDERS
✅ Backend starts from `src/backend` (NOT root)
✅ Remove package-lock.json before npm install
✅ ROLLUP_SKIP_NODE_BUILD=true is required
✅ Use "War Room" workspace, not "Think Big Media"