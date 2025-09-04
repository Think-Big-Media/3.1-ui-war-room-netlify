# RENDER DEPLOYMENT - FINAL FIX

## The Problem
Rollup build fails with: "Cannot find module @rollup/rollup-linux-x64-gnu"

## The Solution

### 1. Build Command (COPY THIS EXACTLY):
```bash
cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install && npm run build
```

### 2. Environment Variables:
```
PYTHON_VERSION=3.11.0
NODE_VERSION=20
PORT=10000
ROLLUP_SKIP_NODE_BUILD=true
```

### 3. Start Command:
```bash
cd src/backend && python3 serve_bulletproof.py
```

## Why This Works
- `rm -rf node_modules package-lock.json` - Removes npm bug with optional deps
- `npm install` instead of `npm ci` - Fresh dependency resolution
- `ROLLUP_SKIP_NODE_BUILD=true` - Forces JavaScript fallback for Rollup

## Verification URLs
After deployment (10 minutes):
- Health: https://war-room-app-2025.onrender.com/health
- OAuth: https://war-room-app-2025.onrender.com/settings

## If Still Fails
Try this build command instead:
```bash
cd src/backend && pip install -r requirements.txt && cd ../.. && npm install --force --no-optional && npm run build
```