#!/bin/bash

# Deploy script with Rollup fix
# This script triggers a deployment with the correct build command

echo "🚀 Deploying War Room with Rollup fix..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we have the render CLI (if not, we'll use git push)
if ! command -v render &> /dev/null; then
    echo -e "${YELLOW}Render CLI not found. Using git push to trigger auto-deploy...${NC}"
    
    # Create a deployment marker file to trigger rebuild
    echo "Deployment triggered at $(date)" > DEPLOYMENT_TRIGGER.txt
    echo "Build command fix: Remove package-lock.json before npm install" >> DEPLOYMENT_TRIGGER.txt
    echo "Environment: ROLLUP_SKIP_NODE_BUILD=true" >> DEPLOYMENT_TRIGGER.txt
    
    git add DEPLOYMENT_TRIGGER.txt
    git commit -m "trigger: force deployment with Rollup fix

- Removes package-lock.json before build
- Uses npm install instead of npm ci  
- Requires ROLLUP_SKIP_NODE_BUILD=true env var
- Fixes: Cannot find module @rollup/rollup-linux-x64-gnu"
    
    git push origin main
    
    echo -e "${GREEN}✅ Deployment triggered via git push${NC}"
    echo ""
    echo "IMPORTANT: You must now update the Render dashboard:"
    echo "1. Go to: https://dashboard.render.com"
    echo "2. Select the war-room-app-2025 service"
    echo "3. Go to Settings → Build & Deploy"
    echo "4. Update Build Command to:"
    echo "   cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install --verbose --omit=optional && rm -rf node_modules/rollup/dist/native.js && npm run build"
    echo "5. Add Environment Variable:"
    echo "   ROLLUP_SKIP_NODE_BUILD = true"
    echo "6. Click 'Save Changes'"
    echo "7. Go to 'Manual Deploy' → 'Deploy latest commit'"
    
else
    echo -e "${GREEN}Render CLI found. Attempting direct deployment...${NC}"
    # If render CLI is available, use it
    render deploy --service-id war-room-app-2025
fi

echo ""
echo "📊 Deployment Status URLs:"
echo "- Dashboard: https://dashboard.render.com/web/srv-cqqhd5q3esus73fivqdg"  
echo "- Logs: https://dashboard.render.com/web/srv-cqqhd5q3esus73fivqdg/logs"
echo ""
echo "🔍 After deployment (10 minutes), check:"
echo "- Health: https://war-room-app-2025.onrender.com/health"
echo "- OAuth: https://war-room-app-2025.onrender.com/settings"
echo ""
echo "If deployment fails with Rollup error, ensure:"
echo "1. Build command includes: rm -rf node_modules package-lock.json"
echo "2. Environment variable ROLLUP_SKIP_NODE_BUILD=true is set"