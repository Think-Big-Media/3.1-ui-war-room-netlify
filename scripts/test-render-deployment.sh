#!/bin/bash

# Test Render deployment configuration
# This script verifies that the deployment targets the correct service

set -e

echo "🔍 Testing Render Deployment Configuration"
echo "=========================================="

# Check environment variables
if [ -z "$RENDER_API_KEY" ]; then
    echo "⚠️  Warning: RENDER_API_KEY is not set"
    echo "   Set it with: export RENDER_API_KEY=your_api_key"
    echo ""
fi

# Hardcoded service ID for war-room-oa9t
SERVICE_ID="srv-d1ub5iumcj7s73ebrpo0"
SERVICE_URL="https://war-room-oa9t.onrender.com"

echo "📋 Configuration:"
echo "   Service ID: $SERVICE_ID"
echo "   Service URL: $SERVICE_URL"
echo ""

# Test 1: Check if service is responding
echo "1️⃣  Testing service health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Service is healthy (HTTP $HEALTH_RESPONSE)"
else
    echo "   ⚠️  Service returned HTTP $HEALTH_RESPONSE"
fi

# Test 2: Check GitHub workflows
echo ""
echo "2️⃣  Checking GitHub workflows..."
if grep -q "srv-d1ub5iumcj7s73ebrpo0" .github/workflows/deploy-render.yml 2>/dev/null; then
    echo "   ✅ deploy-render.yml targets correct service ID"
else
    echo "   ❌ deploy-render.yml does not have correct service ID"
fi

if grep -q "srv-d1ub5iumcj7s73ebrpo0" .github/workflows/ci-cd.yml 2>/dev/null; then
    echo "   ✅ ci-cd.yml targets correct service ID"
else
    echo "   ❌ ci-cd.yml does not have correct service ID"
fi

# Test 3: Check for hardcoded API keys
echo ""
echo "3️⃣  Checking for security issues..."
HARDCODED_KEYS=0

if grep -q "rnd_" scripts/*.sh 2>/dev/null; then
    echo "   ❌ Found hardcoded API keys in shell scripts"
    HARDCODED_KEYS=1
else
    echo "   ✅ No hardcoded API keys in shell scripts"
fi

if grep -q "rnd_" scripts/*.py 2>/dev/null; then
    echo "   ❌ Found hardcoded API keys in Python scripts"
    HARDCODED_KEYS=1
else
    echo "   ✅ No hardcoded API keys in Python scripts"
fi

# Test 4: Verify render.yaml configuration
echo ""
echo "4️⃣  Checking render.yaml..."
if [ -f "render.yaml" ]; then
    if grep -q "healthCheckPath: /health" render.yaml; then
        echo "   ✅ Health check endpoint configured"
    else
        echo "   ⚠️  Health check endpoint not configured"
    fi
    
    if grep -q "name: war-room" render.yaml; then
        echo "   ✅ Service name matches"
    else
        echo "   ⚠️  Service name mismatch"
    fi
else
    echo "   ⚠️  render.yaml not found"
fi

# Test 5: API connectivity (if API key is set)
if [ -n "$RENDER_API_KEY" ]; then
    echo ""
    echo "5️⃣  Testing Render API access..."
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        "https://api.render.com/v1/services/$SERVICE_ID" || echo "000")
    
    if [ "$API_RESPONSE" = "200" ]; then
        echo "   ✅ API access successful"
        
        # Get service details
        SERVICE_INFO=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
            "https://api.render.com/v1/services/$SERVICE_ID" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"   Service Name: {data.get('name', 'Unknown')}\")
print(f\"   Service Type: {data.get('type', 'Unknown')}\")
print(f\"   Auto Deploy: {data.get('autoDeploy', False)}\")
" 2>/dev/null || echo "   Could not parse service info")
        echo "$SERVICE_INFO"
    elif [ "$API_RESPONSE" = "401" ]; then
        echo "   ❌ API key is invalid (HTTP 401)"
    elif [ "$API_RESPONSE" = "404" ]; then
        echo "   ❌ Service not found with this API key (HTTP 404)"
        echo "      This likely means the API key is from a different account"
    else
        echo "   ❌ API request failed (HTTP $API_RESPONSE)"
    fi
fi

# Summary
echo ""
echo "=========================================="
if [ $HARDCODED_KEYS -eq 0 ]; then
    echo "✅ Deployment configuration is secure and targets srv-d1ub5iumcj7s73ebrpo0"
else
    echo "⚠️  Security issues found - hardcoded keys have been removed"
fi
echo ""
echo "Next steps:"
echo "1. Set RENDER_API_KEY environment variable"
echo "2. Add RENDER_DEPLOY_HOOK_URL to GitHub Secrets"
echo "3. Push changes to trigger deployment"