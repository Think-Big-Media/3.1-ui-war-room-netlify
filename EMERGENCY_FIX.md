# 🚨 EMERGENCY FIX NEEDED

## The Problem
The staging service at https://one-0-war-room.onrender.com is misconfigured:
- **Current rootDir**: `src/backend` 
- **Current buildCommand**: Tries to `cd src/frontend` (doesn't exist!)
- **Result**: Build fails with "No such file or directory"

## The Solution
Update the staging service configuration in Render Dashboard:

### Go to: https://dashboard.render.com/web/srv-d2eb2k0dl3ps73a2tc30/settings

### Change these settings:

**Root Directory:**
```
(leave empty - just delete "src/backend")
```

**Build Command:**
```bash
pip install -r src/backend/requirements.txt && npm install && npm run build
```

**Start Command:**
```bash
cd src/backend && python serve_bulletproof.py
```

## Why This Works
- Frontend files are in `/src/` (NOT `/src/frontend/`)
- Backend files are in `/src/backend/`
- npm install/build runs from repository root where package.json exists
- Python server runs from src/backend where serve_bulletproof.py exists

## Alternative: Use war-room-2025.onrender.com
This service already has the correct configuration but uses serve_complete.py instead of serve_bulletproof.py