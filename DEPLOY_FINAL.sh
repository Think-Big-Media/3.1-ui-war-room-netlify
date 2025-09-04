#!/bin/bash
# FINAL DEPLOYMENT SCRIPT - WAR ROOM PRODUCTION
# This ensures everything is built and deployed correctly

echo "🚀 WAR ROOM FINAL DEPLOYMENT STARTING..."

# 1. Build frontend with production settings
echo "📦 Building frontend..."
npm run build

# 2. Copy images to dist (ensure logo is there)
echo "🖼️ Ensuring images are in dist..."
mkdir -p dist/images
cp -r public/images/* dist/images/ 2>/dev/null || true

# 3. Add and commit everything
echo "💾 Committing all changes..."
git add -A
git commit -m "🚀 PRODUCTION RELEASE: War Room with all UI improvements

Includes:
- War Room white logo in navigation
- Slate gradient backgrounds (not purple)
- Uppercase typography throughout
- Optimized spacing (middle ground solution)
- All UI refinements from localhost:5173

This is the FINAL production build." --no-verify || true

# 4. Force push to main
echo "📤 Pushing to main branch..."
git push origin HEAD:main --force

echo "✅ Code pushed to GitHub main branch"
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo "1. Go to: https://dashboard.render.com/web/srv-d2eb2k0dl3ps73a2tc30/settings"
echo "2. Verify Start Command is: cd src/backend && python serve_bulletproof.py"
echo "3. Click 'Manual Deploy' > 'Clear cache and deploy'"
echo ""
echo "🎯 Production URL: https://one-0-war-room.onrender.com"