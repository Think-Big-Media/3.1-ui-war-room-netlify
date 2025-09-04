#!/bin/bash

# 🎯 PRODUCTION DEPLOYMENT SCRIPT
# This script ensures we ALWAYS deploy to the correct production service

set -e

echo "🚀 WAR ROOM PRODUCTION DEPLOYMENT"
echo "================================="

# Verify we have API key
if [ -z "$RENDER_API_KEY" ]; then
    echo "❌ ERROR: RENDER_API_KEY not set"
    echo "Run: export RENDER_API_KEY='rnd_kM791PKT9Ms0ZqlNQPLd65hmUb5K'"
    exit 1
fi

# Production service constants (NEVER CHANGE THESE)
PRODUCTION_SERVICE_ID="srv-d2csi9juibrs738r02rg"
PRODUCTION_URL="https://war-room-app-2025.onrender.com"
PRODUCTION_SERVICE_NAME="war-room-production"

echo "📋 Deployment Details:"
echo "   Service: $PRODUCTION_SERVICE_NAME"
echo "   ID: $PRODUCTION_SERVICE_ID"
echo "   URL: $PRODUCTION_URL"
echo ""

# Verify we're on production branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "production" ]; then
    echo "⚠️  WARNING: You're on branch '$CURRENT_BRANCH', not 'production'"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Check service status
echo "🔍 Checking service status..."
SERVICE_STATUS=$(RENDER_API_KEY="$RENDER_API_KEY" ./scripts/render-api.sh get-service "$PRODUCTION_SERVICE_ID" | grep -o '"suspended":"[^"]*"' | cut -d'"' -f4)

if [ "$SERVICE_STATUS" = "suspended" ]; then
    echo "❌ ERROR: Production service is SUSPENDED!"
    echo "   Contact team to unsuspend service before deploying"
    exit 1
fi

echo "✅ Service is active and ready for deployment"

# Trigger deployment
echo ""
echo "🚀 Triggering production deployment..."
DEPLOY_RESULT=$(RENDER_API_KEY="$RENDER_API_KEY" ./scripts/render-api.sh trigger-deploy "$PRODUCTION_SERVICE_ID")

# Extract deployment ID
DEPLOY_ID=$(echo "$DEPLOY_RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "✅ Deployment triggered successfully!"
echo "   Deployment ID: $DEPLOY_ID"
echo "   Monitor at: https://dashboard.render.com/web/$PRODUCTION_SERVICE_ID"
echo "   Live URL: $PRODUCTION_URL"
echo ""
echo "🕐 Deployment typically takes 3-5 minutes"
echo "   You'll receive notification when complete"