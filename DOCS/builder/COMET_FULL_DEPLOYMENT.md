# Comet Browser: Complete War Room Deployment

## Objective
Deploy war-room-2025 with all required environment variables and correct Python version.

## Step 1: Navigate to Render Dashboard
- Go to: https://dashboard.render.com/web/srv-d2dm57mmcj7s73c76dh0/env

## Step 2: Add ALL Environment Variables
Click "Add Environment Variable" and add each of these (copy-paste exactly):

### Core Supabase Variables
```
VITE_SUPABASE_URL = https://ksnrafwskxaxhaczvwjs.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbnJhZndza3hheGhhY3p2d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2MTQsImV4cCI6MjA2NzY0MzYxNH0.d7lM7Jp6CVxPesip1JVYPMUEkifQ39biLQNzEhNfd-w
SUPABASE_URL = https://ksnrafwskxaxhaczvwjs.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbnJhZndza3hheGhhY3p2d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjc2MTQsImV4cCI6MjA2NzY0MzYxNH0.d7lM7Jp6CVxPesip1JVYPMUEkifQ39biLQNzEhNfd-w
```

### Security Keys
```
SECRET_KEY = 8ad7e844d08e6519193877ab935038a947cee14085b1ec7770c0b4861775f8bb
JWT_SECRET = b1afadd1ec7a8b68d4f347dca2cf85f6
JWT_ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

### Database Configuration
```
DATABASE_URL = postgresql://warroom:warroom@dpg-cr6q2fbv2p9s73b0gnmg-a.oregon-postgres.render.com/warroom_db
```

### Application Settings
```
ENVIRONMENT = production
RENDER_ENV = production
PYTHON_VERSION = 3.11.0
PORT = 10000
```

### CORS and API Configuration
```
BACKEND_CORS_ORIGINS = https://war-room-2025.onrender.com,https://war-room-oa9t.onrender.com,http://localhost:5173,http://localhost:3000
API_V1_STR = /api/v1
PROJECT_NAME = War Room Platform
VERSION = 1.0.0
```

### Frontend URLs
```
VITE_API_URL = https://war-room-2025.onrender.com
FRONTEND_URL = https://war-room-2025.onrender.com
```

## Step 3: Fix Python Version
**IMPORTANT**: Update PYTHON_VERSION to:
```
PYTHON_VERSION = 3.11.0
```
(Not just "3.11" - it needs the patch version .0)

## Step 4: Save All Variables
- After adding all variables, click "Save Changes"
- This will trigger an automatic deployment

## Step 5: Monitor Deployment
- Go to: https://dashboard.render.com/web/srv-d2dm57mmcj7s73c76dh0/deploys
- Wait for deployment to show "Live" status (5-10 minutes)

## Step 6: Verify Success
Once deployment is complete:
1. Open: https://war-room-2025.onrender.com
2. Check that the login page loads
3. Open browser console (F12) and verify no errors
4. Try navigating to different pages

## Expected Results
- ✅ Site loads without blank page
- ✅ Login form appears
- ✅ No console errors about missing environment variables
- ✅ API health check works: https://war-room-2025.onrender.com/health

## If Issues Occur
- Check deployment logs for any Python errors
- Verify all environment variables were saved
- Ensure PYTHON_VERSION has all three parts (3.11.0)
- Make sure Build Command is still: `cd src/backend && pip install -r requirements.txt`

## Success Confirmation
The deployment is successful when:
- Site displays login page
- Console has no errors
- Health endpoint returns: `{"status": "healthy", "frontend_available": true}`