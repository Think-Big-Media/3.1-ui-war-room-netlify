# 🚀 CLEAN SLATE DEPLOYMENT STRATEGY

## The Problem
Render's auto-detection is broken due to conflicting project structure:
- `runtime.txt` → Forces Python-only mode
- `requirements.txt` in root → Confirms Python
- `package.json` in root → Gets ignored!

## The Solution: Fresh V2 Service

### Step 1: Clean Up Project
```bash
# Remove conflicting files
rm runtime.txt  # This is forcing Python-only mode!
```

### Step 2: Create New Service Structure
- Name: **war-room-v2**
- Branch: **aug12-working-deployment**
- **NO AUTO-DETECTION** - Manual config only

### Step 3: Explicit Build Commands
```bash
# Backend AND Frontend - BOTH REQUIRED
pip install -r requirements.txt && \
cd src/frontend && \
npm install && \
npm run build && \
cd ../..
```

### Step 4: What to Keep/Delete

**KEEP:**
- production-redis ✅
- production-database ✅

**DELETE (after V2 works):**
- staging (srv-d2eb2k0dl3ps73a2tc30) - Broken config
- war-room-2025 - Failed deploys
- war-room-production - Failed deploys

**CREATE NEW:**
- war-room-v2 - Fresh start with correct config

## Why This Will Work
1. No conflicting auto-detection signals
2. Explicit build commands from start
3. Clean service with no cached bad config
4. render.yaml ignored anyway - use dashboard

## Validation
After deployment, check for:
- Slate gray theme (not purple)
- No page headers
- No navigation icons
- Frontend assets loading