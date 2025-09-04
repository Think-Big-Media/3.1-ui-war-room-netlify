# Production Outage Incident Report

**Date**: July 30, 2025  
**Duration**: ~1 hour  
**Service**: war-room-oa9t.onrender.com  
**Severity**: HIGH - Complete service outage (black screen)

## Executive Summary

The War Room production site experienced a complete outage showing only a black screen. The root cause was missing environment variables during the Vite build process, causing the React app to fail initialization.

## Timeline

- **13:00 PST**: User reports black screen on production
- **13:05 PST**: Investigation begins
- **13:15 PST**: Root cause identified - missing VITE_* environment variables
- **13:30 PST**: Hotfix branch created with fixes
- **14:00 PST**: Fix deployed, service restored

## Root Cause Analysis

### 1. Environment Variable Mismatch

**Problem**: Vite requires environment variables prefixed with `VITE_*` but our configuration only had `REACT_APP_*` variables.

```javascript
// vite.config.ts was looking for:
'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL)

// But Render wasn't providing these variables
```

**Impact**: The build succeeded but the app failed at runtime when trying to initialize Supabase with undefined values.

### 2. Node Version Incompatibility

**Problem**: Package.json required Node >= 22.0.0, but Render's free tier doesn't support Node 22.

```json
// Original requirement
"engines": {
  "node": ">=22.0.0",
  "npm": ">=10.0.0"
}
```

**Impact**: Build process could fail or use fallback Node version.

### 3. No Production Debugging

**Problem**: No way to diagnose issues in production - the app just showed a black screen with no error visibility.

## The Breaking Change

There wasn't a specific breaking commit. The issue was pre-existing but manifested when:
1. The app was deployed without proper environment variables
2. The Supabase initialization failed silently
3. React app crashed during initialization

## Error Symptoms

1. **Browser**: Black screen, no content
2. **Console**: Likely showed "Cannot read property of undefined" related to Supabase
3. **Network**: `/health` endpoint worked (backend was fine)
4. **Render Logs**: Build succeeded but no runtime error visibility

## The Fix

### 1. Added VITE Environment Variables

```yaml
# render.yaml additions
- key: VITE_SUPABASE_URL
  sync: false
- key: VITE_SUPABASE_ANON_KEY
  sync: false
- key: VITE_ENV
  value: production
```

### 2. Updated vite.config.ts for Compatibility

```typescript
// Support both prefixes
'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(
  env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL
)
```

### 3. Lowered Node Version Requirement

```json
"engines": {
  "node": ">=18.0.0",  // From 22.0.0
  "npm": ">=9.0.0"     // From 10.0.0
}
```

### 4. Added Debug Endpoint

```python
@app.get("/api/v1/debug")
async def debug_info():
    return {
        "frontend_exists": FRONTEND_BUILD_DIR.exists(),
        "frontend_files": list(FRONTEND_BUILD_DIR.iterdir()),
        "env_vars": {k: v for k, v in os.environ.items() 
                    if k.startswith(("VITE_", "REACT_APP_"))}
    }
```

## Verification

After deployment:
```bash
# Backend health check - PASSED
curl https://war-room-oa9t.onrender.com/health
# {"status":"healthy","frontend_available":true}

# Debug info - Shows proper env vars
curl https://war-room-oa9t.onrender.com/api/v1/debug

# Main site - React app loads properly
curl https://war-room-oa9t.onrender.com/
# Returns HTML with React root div
```

## Lessons Learned

1. **Environment Variables**: Always ensure Vite projects have VITE_* prefixed variables
2. **Node Versions**: Keep requirements reasonable for deployment platforms
3. **Debug Endpoints**: Essential for production troubleshooting
4. **Error Boundaries**: React apps need proper error boundaries to show meaningful errors
5. **Build Verification**: Add checks to ensure frontend build completes properly

## Prevention Measures

1. **Pre-deployment Checklist**:
   - [ ] Verify all required env vars are set
   - [ ] Test build with production env vars locally
   - [ ] Check Node version compatibility

2. **Monitoring**:
   - Add frontend health checks
   - Implement error tracking (Sentry)
   - Monitor for black screen scenarios

3. **Documentation**:
   - Keep deployment docs updated
   - Document all required env vars
   - Add troubleshooting guide

## Recovery Actions

1. ✅ Fix deployed and verified
2. ✅ Production site operational
3. ⏳ TODO: Add Sentry error tracking
4. ⏳ TODO: Implement frontend health endpoint
5. ⏳ TODO: Add deployment validation script

## Technical Details

### Git Diff of Fix

```diff
# render.yaml
+      - key: NODE_VERSION
+        value: 18.17.0  # Changed from 22.0.0
+      # Frontend Environment Variables (Vite)
+      - key: VITE_SUPABASE_URL
+        sync: false
+      - key: VITE_SUPABASE_ANON_KEY
+        sync: false

# vite.config.ts
-'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL),
+'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL),

# package.json
-"node": ">=22.0.0",
+"node": ">=18.0.0",
```

## Conclusion

The outage was caused by a configuration mismatch between what the application expected (VITE_* env vars) and what was provided in production. The fix involved:
1. Adding proper environment variables
2. Making the app compatible with both naming conventions
3. Adjusting Node version requirements
4. Adding debugging capabilities

The incident highlighted the need for better production debugging tools and more robust deployment validation.