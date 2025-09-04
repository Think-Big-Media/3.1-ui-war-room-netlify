#!/bin/bash

# War Room Deployment Verification Script
# Checks if Render has deployed the latest build

echo "🔍 War Room Deployment Verification"
echo "===================================="

# Get local build hash
LOCAL_BUNDLE=$(ls dist/assets/index-*.js 2>/dev/null | head -1 | sed 's/.*index-//;s/\.js//')

if [ -z "$LOCAL_BUNDLE" ]; then
    echo "❌ No local build found. Run 'npm run build' first."
    exit 1
fi

echo "📦 Local build hash: $LOCAL_BUNDLE"

# Get production build hash
PROD_BUNDLE=$(curl -s https://war-room-3-ui.onrender.com 2>/dev/null | grep -o 'index-[^"]*\.js' | head -1 | sed 's/index-//;s/\.js//')

if [ -z "$PROD_BUNDLE" ]; then
    echo "❌ Could not fetch production site"
    exit 1
fi

echo "🌐 Production hash: $PROD_BUNDLE"

# Compare
if [ "$LOCAL_BUNDLE" = "$PROD_BUNDLE" ]; then
    echo "✅ Deployment is up to date!"
    
    # Test if site loads
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://war-room-3-ui.onrender.com)
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Site is responding (HTTP 200)"
    else
        echo "⚠️  Site returned HTTP $HTTP_STATUS"
    fi
else
    echo "⚠️  Deployment is outdated!"
    echo "    Render needs to rebuild and deploy the latest code."
    echo ""
    echo "📋 Next steps:"
    echo "   1. Check https://dashboard.render.com for build status"
    echo "   2. Look for any build errors in the logs"
    echo "   3. If build is stuck, click 'Manual Deploy' > 'Clear build cache & deploy'"
    echo ""
    echo "⏱️  Deployments typically take 2-3 minutes"
fi

echo ""
echo "🔗 Live site: https://war-room-3-ui.onrender.com"
