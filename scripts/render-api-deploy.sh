#!/bin/bash

# Render API deployment script
# This applies the Rollup fix via Render API

echo "🚀 Applying Rollup fix via Render API..."
echo "========================================="

# Check for Render API key
if [ -z "$RENDER_API_KEY" ]; then
    echo "❌ RENDER_API_KEY not set!"
    echo ""
    echo "To use this script:"
    echo "1. Get your API key from: https://dashboard.render.com/u/settings/api"
    echo "2. Run: export RENDER_API_KEY='your-key-here'"
    echo "3. Run this script again"
    echo ""
    echo "Alternative: Apply the fix manually in Render dashboard"
    exit 1
fi

SERVICE_ID="srv-cqqhd5q3esus73fivqdg"
API_URL="https://api.render.com/v1"

echo "📝 Updating build command..."
# Update service with fixed build command
curl -X PATCH "$API_URL/services/$SERVICE_ID" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "buildCommand": "cd src/backend && pip install -r requirements.txt && cd ../.. && rm -rf node_modules package-lock.json && npm install && npm run build",
    "envVars": [
      {"key": "ROLLUP_SKIP_NODE_BUILD", "value": "true"},
      {"key": "PYTHON_VERSION", "value": "3.11.0"},
      {"key": "NODE_VERSION", "value": "20"},
      {"key": "PORT", "value": "10000"}
    ]
  }'

echo ""
echo "🔄 Triggering deployment..."
# Trigger a new deployment
curl -X POST "$API_URL/services/$SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""
echo "✅ Deployment triggered!"
echo ""
echo "📊 Monitor progress at:"
echo "https://dashboard.render.com/web/$SERVICE_ID/logs"
echo ""
echo "🔍 Check status in 10 minutes at:"
echo "https://war-room-app-2025.onrender.com/health"