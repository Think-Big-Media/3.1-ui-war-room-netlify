#!/bin/bash

# Fix Render Deployment Script
# This script ensures Render uses the correct build configuration

echo "==================================="
echo "WAR ROOM RENDER DEPLOYMENT FIX"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PROBLEM IDENTIFIED:${NC}"
echo "Render is using dashboard configuration instead of render.yaml"
echo "Evidence: Production shows old logo, but OAuth code is in bundle"
echo ""

echo -e "${GREEN}SOLUTION:${NC}"
echo "You need to update Render dashboard settings to match render.yaml"
echo ""

echo "==================================="
echo "RENDER DASHBOARD SETTINGS NEEDED:"
echo "==================================="

echo -e "${YELLOW}Build Command:${NC}"
cat << 'BUILD_CMD'
cd src/backend && pip install --no-cache-dir -r requirements.txt && cd ../.. && rm -rf node_modules dist .parcel-cache && npm ci --force && npm run build && echo "=== Verifying OAuth components ===" && if grep -r "Google Ads\|Meta Business Suite" dist/ 2>/dev/null; then echo "✅ OAuth found"; else echo "⚠️ OAuth missing"; fi && ls -la dist/
BUILD_CMD

echo ""
echo -e "${YELLOW}Start Command:${NC}"
echo "cd src/backend && python3 serve_bulletproof.py"

echo ""
echo "==================================="
echo "MANUAL STEPS TO FIX:"
echo "==================================="
echo ""
echo "1. Go to https://dashboard.render.com"
echo "2. Select the 'war-room-oa9t' service"
echo "3. Go to Settings tab"
echo "4. Update Build Command (copy from above)"
echo "5. Update Start Command (copy from above)"
echo "6. Click 'Save Changes'"
echo "7. Click 'Manual Deploy' > 'Deploy latest commit'"
echo ""

echo -e "${GREEN}VERIFICATION:${NC}"
echo "After deployment, check these endpoints:"
echo ""
echo "1. Health check with version info:"
echo "   curl https://war-room-oa9t.onrender.com/health | jq"
echo ""
echo "2. Verify OAuth components are present:"
echo "   curl -s https://war-room-oa9t.onrender.com/settings | grep -c 'Advertising Platform'"
echo ""
echo "3. Check logo type (should be glassmorphic WR, not image):"
echo "   curl -s https://war-room-oa9t.onrender.com | grep -o 'WR</span>'"
echo ""

echo "==================================="
echo "ALTERNATIVE: Clear Cache & Redeploy"
echo "==================================="
echo ""
echo "If updating settings doesn't work:"
echo "1. In Render dashboard, go to Environment tab"
echo "2. Add a dummy variable: CACHE_BUST=$(date +%s)"
echo "3. This forces a complete rebuild"
echo "4. Then trigger manual deploy"
echo ""

echo -e "${YELLOW}Current local version hash:${NC}"
LOCAL_HASH=$(md5sum src/backend/serve_bulletproof.py | cut -c1-8)
echo "  $LOCAL_HASH"
echo ""
echo "After deploy, production should match this hash at /health endpoint"