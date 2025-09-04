# DEPLOY TO WR-STAGING NOW

## Service Details
- **Service ID:** srv-d2epsjvdiees7384uf10  
- **Name:** wr-staging
- **URL:** https://one-0-war-room-ibqc.onrender.com
- **Status:** 502 - Need to deploy

## Required Settings for wr-staging:

### Build Command:
```bash
pip install -r requirements.txt && rm -rf node_modules package-lock.json && npm install && npm run build
```

### Start Command:
```bash
cd src/backend && python serve_bulletproof.py
```

### Environment Variables:
```
PYTHON_VERSION=3.11.9
NODE_VERSION=20.11.1
RENDER_ENV=staging
SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbnJhZndza3hheGhhY3p2d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2MTQsImV4cCI6MjA2NzY0MzYxNH0.d7lM7Jp6CVxPesip1JVYPMUEkifQ39biLQNzEhNfd-w
```

### Branch:
```
aug12-working-deployment
```

## Deploy Steps:

1. **Go to Dashboard:** https://dashboard.render.com/web/srv-d2epsjvdiees7384uf10/settings
2. **Verify Build Command** (should include frontend build)
3. **Check Environment Variables** (Python version, etc.)
4. **Trigger Deploy:** Manual Deploy → Deploy Latest Commit
5. **Monitor:** https://dashboard.render.com/web/srv-d2epsjvdiees7384uf10/deploys

## Expected Results:
- ✅ Service comes online (no more 502)
- ✅ Slate theme visible (gray gradient backgrounds)
- ✅ No page headers (clean Command Center)
- ✅ Text-only navigation (no icons)

## Current Commit:
- **Hash:** 23b319ea6 (Latest with Rollup 4.13.0 pin)
- **Message:** "fix: pin rollup to 4.13.0 to avoid native binary issues"

Deploy this now to get wr-staging working with the slate theme!