#!/bin/bash
# CRITICAL: Deploy to correct Render staging service
# Service ID: srv-d2eb2k0dl3ps73a2tc30
# URL: https://one-0-war-room.onrender.com

SERVICE_ID="srv-d2eb2k0dl3ps73a2tc30"
BRANCH="aug12-working-deployment"

echo "🎯 ========================================="
echo "🎯 DEPLOYING TO STAGING SERVICE"
echo "🎯 ========================================="
echo "📍 Service ID: $SERVICE_ID"
echo "🌿 Branch: $BRANCH"
echo "🔗 URL: https://one-0-war-room.onrender.com"
echo ""

# Ensure we're on the right branch
echo "🌿 Checking branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "⚠️  Switching to $BRANCH..."
    git checkout $BRANCH
fi

# Force a change to trigger deploy
echo "🔨 Creating deployment marker..."
echo "Deploy trigger: $(date)" > DEPLOY_MARKER.txt
git add DEPLOY_MARKER.txt
git commit -m "🚀 DEPLOY TO STAGING: srv-d2eb2k0dl3ps73a2tc30 at $(date +%H:%M:%S)

Target Service: $SERVICE_ID
Branch: $BRANCH
Frontend Build: REQUIRED (npm install && npm run build)
Backend Build: REQUIRED (pip install -r requirements.txt)

UI Changes to verify:
- Slate/gray theme (not purple)
- No page headers
- No navigation icons
- Tab overflow prevention" --no-verify

# Push to trigger deploy
echo "📤 Pushing to trigger deployment..."
git push origin $BRANCH

echo ""
echo "✅ Deployment triggered!"
echo "⏰ Monitor at: https://dashboard.render.com/web/$SERVICE_ID"
echo "🔍 Check build logs for frontend compilation"
echo ""