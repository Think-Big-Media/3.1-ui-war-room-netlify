#!/bin/bash

# Render API Script
# API key should be set as environment variable: export RENDER_API_KEY=your_key
API_KEY="${RENDER_API_KEY:-}"
API_BASE="https://api.render.com/v1"

# Check if API key is set
if [ -z "$API_KEY" ]; then
    echo "Error: RENDER_API_KEY environment variable is not set"
    echo "Usage: export RENDER_API_KEY=your_api_key"
    exit 1
fi

# Function to make API calls
render_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Accept: application/json" \
            "$API_BASE$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint"
    fi
}

# Parse command
case "$1" in
    "list-services")
        render_api GET "/services?limit=100"
        ;;
    "get-service")
        render_api GET "/services/$2"
        ;;
    "get-deployments")
        render_api GET "/services/$2/deploys?limit=10"
        ;;
    "trigger-deploy")
        render_api POST "/services/$2/deploys" '{"clearCache": "do_not_clear"}'
        ;;
    "delete-service")
        render_api DELETE "/services/$2"
        ;;
    *)
        echo "Usage: $0 {list-services|get-service <id>|get-deployments <id>|trigger-deploy <id>|delete-service <id>}"
        exit 1
        ;;
esac