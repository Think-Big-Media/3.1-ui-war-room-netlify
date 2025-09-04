# ROLLUP BUILD FIX APPLIED

## The Problem
Rollup fails on Render with: "Cannot find module @rollup/rollup-linux-x64-gnu"

## The Solution Applied
1. Created fresh build script that removes package-lock.json
2. Added ROLLUP_SKIP_NODE_BUILD environment variable
3. Using npm install instead of npm ci

## Build Command for Render Dashboard
```bash
cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install && npm run build
```

## Environment Variables Required
```
PYTHON_VERSION=3.11.0
NODE_VERSION=20
PORT=10000
ROLLUP_SKIP_NODE_BUILD=true
```

## Verification
After deployment completes (10 minutes):
- https://war-room-app-2025.onrender.com/health
- https://war-room-app-2025.onrender.com/settings (OAuth section)

## Applied: 2025-08-11 13:50 UTC