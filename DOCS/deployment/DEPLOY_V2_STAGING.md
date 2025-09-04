# War Room V2 Staging Deployment Instructions

## Service Creation Steps

### 1. Go to Render Dashboard
Navigate to https://dashboard.render.com/

### 2. Create New Web Service
Click "New +" → "Web Service"

### 3. Connect Repository
- Select: `Think-Big-Media/1.0-war-room`
- Branch: `feature/dashboard-terminology-update`

### 4. Configure Service Settings

**Name:** `war-room-v2-staging`

**Region:** Oregon (US West)

**Branch:** `feature/dashboard-terminology-update`

**Root Directory:** Leave blank (use repository root)

**Runtime:** Python 3

**Build Command:**
```bash
pip install -r requirements.txt && cd src/frontend && npm install && npm run build
```

**Start Command:**
```bash
cd src/backend && python serve_bulletproof.py
```

### 5. Environment Variables
Add these critical variables:

```
PYTHON_VERSION=3.11
NODE_VERSION=20.11.1
PORT=10000
DATABASE_URL=your_database_url_here
REDIS_URL=your_redis_url_here
JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 6. Instance Type
- Select: **Starter** ($7/month) or higher
- DO NOT use Free tier (it has limitations)

### 7. Auto-Deploy
- Enable: **Auto-Deploy** from branch

### 8. Create Service
Click "Create Web Service"

## Verification Checklist

After deployment completes (5-10 minutes):

1. **Check Build Logs**
   - Confirm both `pip install` AND `npm install` run
   - Verify `npm run build` creates dist folder
   - No Python-only mode warnings

2. **Test Frontend**
   - Visit: `https://war-room-v2-staging.onrender.com`
   - Should see slate/gray theme (NOT purple)
   - No page headers visible
   - No navigation icons

3. **Test API**
   - Visit: `https://war-room-v2-staging.onrender.com/api/health`
   - Should return: `{"status":"healthy"}`

## Important Notes

- **DO NOT** add `runtime.txt` file
- **DO NOT** use any _DEFUNKT services
- **ENSURE** both Python and Node.js build steps run
- The build command is ONE LINE with `&&` separators

## If Issues Occur

1. Check build logs for both stacks building
2. Verify environment variables are set
3. Ensure using Python 3.11+ runtime
4. Clear build cache if needed (Settings → Clear build cache)

## Success Indicators

✅ Build logs show: "Installing Python dependencies"
✅ Build logs show: "Installing Node dependencies"  
✅ Build logs show: "Building frontend assets"
✅ Site loads with slate theme
✅ API health check returns 200