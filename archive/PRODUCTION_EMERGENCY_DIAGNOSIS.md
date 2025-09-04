# 🚨 PRODUCTION EMERGENCY DIAGNOSIS

**Date**: July 30, 2025  
**Issue**: war-room-oa9t.onrender.com showing black screen  
**Status**: INVESTIGATING

## 🔍 Findings

### 1. Git Status
- Currently on `feature/api-integration-pipeline` branch (SAFE)
- Main branch last commit: `836d2688` - "Create test-testsprite-integration.yml"
- No breaking changes were pushed to main

### 2. Deployment Configuration
- **Platform**: Render.com (NOT Railway)
- **Build Command**: 
  ```bash
  cd src/backend && pip install -r requirements.txt
  cd ../frontend && npm install && npm run build
  ```
- **Start Command**: `cd src/backend && python serve_bulletproof.py`
- **Health Check**: `/health`

### 3. Potential Issues Identified

#### Issue #1: Frontend Build Location
The `serve_bulletproof.py` expects frontend at:
- `src/frontend/dist/`

But the build might not be creating files in the correct location.

#### Issue #2: Environment Variables
The .env.example shows REACT_APP_* variables, but Vite uses VITE_* prefix. This mismatch could cause:
- Missing Supabase configuration
- App failing to initialize
- Black screen due to JS errors

#### Issue #3: Node Version
- package.json requires Node >= 22.0.0
- Render.yaml specifies NODE_VERSION=22.0.0
- This might not be available on Render

## 🔧 IMMEDIATE FIXES

### Fix #1: Update Environment Variable Names
In render.yaml, add these environment variables:
```yaml
- key: VITE_SUPABASE_URL
  value: [YOUR_SUPABASE_URL]
- key: VITE_SUPABASE_ANON_KEY  
  value: [YOUR_SUPABASE_ANON_KEY]
```

### Fix #2: Update vite.config.ts to handle both prefixes
```typescript
// Support both REACT_APP_ and VITE_ prefixes
const supabaseUrl = env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY;
```

### Fix #3: Add Debug Endpoint
Add to serve_bulletproof.py:
```python
@app.get("/api/debug")
async def debug_info():
    return {
        "frontend_dir": str(FRONTEND_BUILD_DIR),
        "frontend_exists": FRONTEND_BUILD_DIR.exists(),
        "files": list(FRONTEND_BUILD_DIR.glob("*")) if FRONTEND_BUILD_DIR.exists() else [],
        "env_vars": {k: v for k, v in os.environ.items() if k.startswith(("VITE_", "REACT_APP_"))}
    }
```

## 🚀 EMERGENCY DEPLOYMENT STEPS

### Option 1: Quick Fix (Revert if needed)
```bash
# If last deployment was working
git checkout main
git revert 836d2688  # Revert latest commit
git push origin main
# Trigger manual deploy on Render
```

### Option 2: Fix Forward
1. Create hotfix branch:
   ```bash
   git checkout -b hotfix/production-black-screen
   ```

2. Update render.yaml with correct env vars
3. Update vite.config.ts to support both prefixes
4. Commit and push:
   ```bash
   git add .
   git commit -m "Fix: Production black screen - env vars and build path"
   git push origin hotfix/production-black-screen
   git checkout main
   git merge hotfix/production-black-screen
   git push origin main
   ```

## 📊 Diagnostics Commands

### Check Production Health
```bash
curl https://war-room-oa9t.onrender.com/health
curl https://war-room-oa9t.onrender.com/api/v1/status
```

### Check if Frontend is Served
```bash
curl -I https://war-room-oa9t.onrender.com/
# Should return HTML content-type, not JSON
```

## 🎯 Root Cause Analysis

Most likely cause: **Missing environment variables**
- Vite build expects VITE_* prefixed variables
- Render deployment might not have these set
- App crashes on load due to missing Supabase config
- Results in black screen

## ⚡ Quick Test

Visit: https://war-room-oa9t.onrender.com/health
- If this returns JSON, backend is working
- Problem is frontend-specific

Visit: https://war-room-oa9t.onrender.com/api/v1/test  
- If this works, API is operational
- Confirms frontend issue