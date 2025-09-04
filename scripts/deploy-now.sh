#!/bin/bash

# Emergency Rollup Fix Deployment
# This script commits and pushes the fix to trigger deployment

echo "🚀 DEPLOYING WAR ROOM WITH ROLLUP FIX"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create deployment marker
cat > ROLLUP_FIX_DEPLOY.md << 'EOF'
# Rollup Fix Deployment

## Build Command (Copy this to Render):
```
cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install --verbose --omit=optional && rm -rf node_modules/rollup/dist/native.js && npm run build
```

## Environment Variable Required:
- ROLLUP_SKIP_NODE_BUILD = true

## Deployment Triggered: 
EOF

echo "$(date)" >> ROLLUP_FIX_DEPLOY.md

# Commit and push
git add -A
git commit -m "🔥 CRITICAL: Delete Rollup native.js to fix build

- Removes node_modules/rollup/dist/native.js entirely
- Forces Rollup to use JavaScript fallbacks
- Fixes: Cannot find module @rollup/rollup-linux-x64-gnu
- Fixes: Missing exports xxhashBase16, xxhashBase64Url, xxhashBase36"

git push origin main --force-with-lease

echo ""
echo -e "${GREEN}✅ CODE PUSHED - NOW UPDATE RENDER${NC}"
echo ""
echo -e "${YELLOW}IMMEDIATE ACTIONS REQUIRED:${NC}"
echo ""
echo "1. OPEN: https://dashboard.render.com"
echo ""
echo "2. SELECT YOUR SERVICE (War Room AI workspace)"
echo ""
echo "3. Go to: Settings → Build & Deploy"
echo ""
echo "4. REPLACE Build Command with:"
echo -e "${GREEN}cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install --verbose --omit=optional && rm -rf node_modules/rollup/dist/native.js && npm run build${NC}"
echo ""
echo "5. Add Environment Variable (if not exists):"
echo "   ROLLUP_SKIP_NODE_BUILD = true"
echo ""
echo "6. Click 'Save Changes'"
echo ""
echo "7. Click 'Manual Deploy' → 'Deploy latest commit'"
echo ""
echo -e "${YELLOW}MONITOR DEPLOYMENT:${NC}"
echo "- Logs: Check build output for errors"
echo "- If build succeeds, app will be live at your Render URL"
echo ""