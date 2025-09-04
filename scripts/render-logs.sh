#!/bin/bash

# Render API script to get deployment logs
# Set these as environment variables for security
API_KEY="${RENDER_API_KEY:-}"
SERVICE_ID="${RENDER_SERVICE_ID:-srv-d1ub5iumcj7s73ebrpo0}"
DEPLOY_ID="${1:-}"  # Pass deploy ID as first argument

# Check if API key is set
if [ -z "$API_KEY" ]; then
    echo "Error: RENDER_API_KEY environment variable is not set"
    exit 1
fi

# Check if deploy ID is provided
if [ -z "$DEPLOY_ID" ]; then
    echo "Usage: $0 <deploy_id>"
    echo "Example: $0 dep-d1v32dh2n1us73d1u1e0"
    exit 1
fi

echo "🔍 Fetching deployment logs from Render..."

# Get deployment logs
curl -s -H "Authorization: Bearer $API_KEY" \
  -H "Accept: application/json" \
  "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID" | jq '.'

echo -e "\n📋 Fetching live logs..."
# Note: Render API doesn't provide direct log access, need to use dashboard

echo -e "\n🌐 Direct links:"
echo "Dashboard: https://dashboard.render.com/web/$SERVICE_ID/deploys/$DEPLOY_ID"
echo "Logs: https://dashboard.render.com/web/$SERVICE_ID/logs"