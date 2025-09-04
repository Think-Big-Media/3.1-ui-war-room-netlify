# 🚨 MISSING ENVIRONMENT VARIABLES - COMET BROWSER TASK

## Go to Render Dashboard
URL: https://dashboard.render.com/web/srv-d2csi9juibrs738r02rg/env

## Add These Critical Variables (MINIMUM REQUIRED):

### 1. Supabase (REQUIRED for frontend build):
```
VITE_SUPABASE_URL = [Get from Supabase dashboard]
VITE_SUPABASE_ANON_KEY = [Get from Supabase dashboard]
```

### 2. Database (REQUIRED for backend):
```
DATABASE_URL = postgresql://[user]:[password]@[host]:5432/[database]
REDIS_URL = redis://[redis-host]:6379
```

### 3. Authentication (REQUIRED):
```
JWT_SECRET = [Generate a random 32+ character string]
JWT_ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

### 4. OAuth Configuration (YOUR MAIN FEATURE):
```
GOOGLE_ADS_CLIENT_ID = [From Google Cloud Console]
GOOGLE_ADS_CLIENT_SECRET = [From Google Cloud Console]
META_APP_ID = [From Meta Developer Dashboard]
META_APP_SECRET = [From Meta Developer Dashboard]
API_BASE_URL = https://war-room-production.onrender.com
```

### 5. Build Variables (Already Added):
```
PYTHON_VERSION = 3.11.0
NODE_VERSION = 20
PORT = 10000
ROLLUP_SKIP_NODE_BUILD = true
```

## Where to Find These Values:
1. **Check the OLD deleted services** - They had these values
2. **Supabase Dashboard** - Project Settings → API
3. **Google Cloud Console** - APIs & Services → Credentials
4. **Meta Developer Dashboard** - App Settings
5. **Database URL** - From your PostgreSQL provider

## After Adding Variables:
1. Save all changes
2. Go to Manual Deploy
3. Deploy latest commit
4. Build should succeed this time

---
**THE PROBLEM**: We created a new service but never copied the configuration from the old ones!