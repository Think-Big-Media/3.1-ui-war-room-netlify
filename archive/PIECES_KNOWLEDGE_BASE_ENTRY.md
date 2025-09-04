# War Room Production Outage - Black Screen Fix

**Tags**: #production-outage #render-deployment #war-room #vite-env-vars #node-version

## Problem
War Room production site (war-room-oa9t.onrender.com) showed black screen due to missing environment variables.

## Root Cause
1. Vite requires `VITE_*` prefixed env vars, but only `REACT_APP_*` were configured
2. Node 22 requirement incompatible with Render free tier
3. No production debugging visibility

## Quick Fix

### 1. Update render.yaml
```yaml
envVars:
  - key: NODE_VERSION
    value: 18.17.0  # Down from 22.0.0
  - key: VITE_SUPABASE_URL
    sync: false
  - key: VITE_SUPABASE_ANON_KEY
    sync: false
  - key: VITE_ENV
    value: production
```

### 2. Update vite.config.ts
```typescript
// Support both REACT_APP_ and VITE_ prefixes
'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(
  env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL
),
```

### 3. Update package.json
```json
"engines": {
  "node": ">=18.0.0",  // From >=22.0.0
  "npm": ">=9.0.0"     // From >=10.0.0
}
```

### 4. Add Debug Endpoint
```python
@app.get("/api/v1/debug")
async def debug_info():
    return {
        "frontend_exists": FRONTEND_BUILD_DIR.exists(),
        "env_vars": {k: v for k, v in os.environ.items() 
                    if k.startswith(("VITE_", "REACT_APP_"))}
    }
```

## Deployment Steps
1. Create hotfix branch
2. Apply changes above
3. Commit and push to main
4. Add env vars in Render dashboard
5. Manual deploy

## Verification
```bash
# Check health
curl https://war-room-oa9t.onrender.com/health

# Check debug info  
curl https://war-room-oa9t.onrender.com/api/v1/debug

# Verify site loads
curl https://war-room-oa9t.onrender.com/
```

## Prevention
- Always use VITE_* prefix for Vite projects
- Test with production env vars locally
- Keep Node requirements reasonable
- Add error boundaries in React
- Implement monitoring/alerting

## Related Files
- `/render.yaml` - Deployment configuration
- `/src/frontend/vite.config.ts` - Vite configuration
- `/src/backend/serve_bulletproof.py` - Production server
- `/package.json` - Node version requirements

## Incident Details
- **Date**: July 30, 2025
- **Duration**: ~1 hour
- **Impact**: Complete frontend outage
- **Resolution**: Environment variable configuration fix

---

This knowledge prevents repeat failures. Always check env var prefixes when deploying Vite apps!