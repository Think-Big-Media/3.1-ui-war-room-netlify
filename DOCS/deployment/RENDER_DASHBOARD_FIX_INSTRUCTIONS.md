# URGENT: Render Dashboard Configuration Fix Required

## ⚠️ CRITICAL ISSUE IDENTIFIED

The war-room-2025 service on Render is **rebuilding the frontend** instead of using our pre-built files. This is causing the blank page issue.

## 🔴 Current Problem

1. **Build Command in Render Dashboard**: Currently running npm build commands
2. **Result**: Old code without fixes is being deployed
3. **Evidence**: 
   - JS hash: `index-df482586.js` (wrong)
   - Should be: `index-76cc1466.js` (our fixed version)
   - Missing our Supabase crash fix

## ✅ REQUIRED DASHBOARD CHANGES

### Step 1: Access Render Dashboard
1. Go to: https://dashboard.render.com
2. Select: **war-room** service
3. Navigate to: **Settings** → **Build & Deploy**

### Step 2: Update Build Command
**CHANGE FROM:**
```bash
cd src/backend && pip install -r requirements.txt
cd ../.. && npm ci && npm run build
```

**CHANGE TO:**
```bash
cd src/backend && pip install -r requirements.txt
```

⚠️ **CRITICAL**: Remove ALL npm/node commands!

### Step 3: Verify Other Settings
- **Root Directory**: Leave BLANK (or set to `.`)
- **Start Command**: `cd src/backend && python serve_bulletproof.py`
- **Runtime**: Python
- **Python Version**: 3.11

### Step 4: Add Environment Variables
Go to **Environment** tab and add:
```
VITE_SUPABASE_URL=https://ksnrafwskxaxhaczvwjs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PYTHON_VERSION=3.11
```

### Step 5: Clear Cache and Redeploy
1. Click **Manual Deploy** button
2. Select: **Clear build cache & deploy**
3. Wait for deployment to complete

## 📋 Verification Checklist

After deployment, verify:
- [ ] Site loads (not blank): https://war-room-2025.onrender.com
- [ ] JS hash changed from `df482586` to something new
- [ ] Console shows no Supabase errors
- [ ] All features working

## 🚨 If Still Broken After Above Steps

### Nuclear Option:
1. **Delete** the war-room service completely
2. **Create new service** with these settings:
   - Service Type: Web Service
   - Repository: Think-Big-Media/1.0-war-room
   - Branch: main
   - Runtime: Python
   - Build Command: `cd src/backend && pip install -r requirements.txt`
   - Start Command: `cd src/backend && python serve_bulletproof.py`
   - NO npm commands anywhere!

## 📞 Support Information

- Working example: https://war-room-oa9t.onrender.com
- Repository: https://github.com/Think-Big-Media/1.0-war-room
- Latest commit with fixes: `9b522a4fe`

## 🎯 Root Cause

Render is ignoring the `render.yaml` file and using dashboard settings that include npm build commands. This causes it to rebuild the frontend with Rollup 4.x (which fails) instead of using our pre-built files with Rollup 3.29.4.

---

**Time Sensitive**: These changes must be made in the Render Dashboard ASAP to restore service.

*Generated: August 12, 2025 9:46 PM PST*