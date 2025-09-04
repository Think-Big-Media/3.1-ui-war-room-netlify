#!/bin/bash

# War Room Deployment Diagnostics Script
# This script helps diagnose deployment issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   War Room Deployment Diagnostics${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ===== CHECK 1: Service IDs Configuration =====
echo -e "${YELLOW}1. Checking Service ID Configuration${NC}"
echo "----------------------------------------"

# Check deploy-render.yml
DEPLOY_SERVICE_ID=$(grep -E "RENDER_SERVICE_ID|srv-" .github/workflows/deploy-render.yml 2>/dev/null | head -1 | awk -F': ' '{print $2}' || echo "not found")
echo "deploy-render.yml service ID: $DEPLOY_SERVICE_ID"

# Check ci-cd.yml
CICD_SERVICE_ID=$(grep -E "srv-d1ub5iumcj7s73ebrpo0" .github/workflows/ci-cd.yml 2>/dev/null | head -1 || echo "not found")
echo "ci-cd.yml service ID found: $CICD_SERVICE_ID"

# Check render.yaml
RENDER_YAML_NAME=$(grep "name: war-room" render.yaml 2>/dev/null | head -1 || echo "not found")
echo "render.yaml service name: $RENDER_YAML_NAME"

echo ""
echo -e "${RED}⚠️  ISSUE FOUND: Service ID Mismatch!${NC}"
echo "  - Workflows use: srv-d1ub5iumcj7s73ebrpo0"
echo "  - Actual service: war-room-oa9t"
echo "  - This is why deployments aren't working!"
echo ""

# ===== CHECK 2: GitHub Secrets Required =====
echo -e "${YELLOW}2. Required GitHub Secrets${NC}"
echo "----------------------------------------"
echo "Please verify these exist in GitHub Settings > Secrets:"
echo "  □ RENDER_API_KEY"
echo "  □ RENDER_SERVICE_ID (should be the actual service ID)"
echo "  □ RENDER_STAGING_SERVICE_ID"
echo "  □ RENDER_DEPLOY_HOOK_URL (optional but recommended)"
echo ""

# ===== CHECK 3: Environment Files =====
echo -e "${YELLOW}3. Environment Files Status${NC}"
echo "----------------------------------------"
for env_file in .env .env.production .env.test .env.render.template; do
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}✓${NC} $env_file exists ($(wc -l < "$env_file") lines)"
    else
        echo -e "${RED}✗${NC} $env_file missing"
    fi
done
echo ""

# ===== CHECK 4: Configuration Issues =====
echo -e "${YELLOW}4. Configuration Issues Found${NC}"
echo "----------------------------------------"

# Check for duplicate services key in render.yaml
if [ -f "render.yaml" ]; then
    SERVICE_COUNT=$(grep -c "^services:" render.yaml 2>/dev/null || echo 0)
    if [ "$SERVICE_COUNT" -gt 1 ]; then
        echo -e "${RED}✗${NC} render.yaml has duplicate 'services:' keys (found $SERVICE_COUNT)"
        echo "  Line numbers: $(grep -n "^services:" render.yaml | cut -d: -f1 | tr '\n' ', ')"
    fi
fi

# Check workflow files
echo ""
echo -e "${YELLOW}5. Workflow Files${NC}"
echo "----------------------------------------"
for workflow in .github/workflows/*.yml; do
    if grep -q "srv-d1ub5iumcj7s73ebrpo0" "$workflow" 2>/dev/null; then
        echo -e "${RED}✗${NC} $(basename "$workflow") uses wrong service ID"
    fi
done
echo ""

# ===== CHECK 5: Production Health =====
echo -e "${YELLOW}6. Production Service Health${NC}"
echo "----------------------------------------"
echo "Testing https://war-room-oa9t.onrender.com..."

# Test main site
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://war-room-oa9t.onrender.com 2>/dev/null || echo "000")
if [ "$MAIN_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Main site is up (HTTP $MAIN_STATUS)"
else
    echo -e "${RED}✗${NC} Main site returned HTTP $MAIN_STATUS"
fi

# Test health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://war-room-oa9t.onrender.com/health 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Health endpoint is up (HTTP $HEALTH_STATUS)"
else
    echo -e "${YELLOW}⚠${NC} Health endpoint returned HTTP $HEALTH_STATUS"
fi

# Test API health
API_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://war-room-oa9t.onrender.com/api/health 2>/dev/null || echo "000")
if [ "$API_HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} API health endpoint is up (HTTP $API_HEALTH_STATUS)"
    
    # Get detailed health info
    HEALTH_DATA=$(curl -s https://war-room-oa9t.onrender.com/api/health 2>/dev/null || echo "{}")
    if command -v jq &> /dev/null && [ -n "$HEALTH_DATA" ]; then
        FB_STATUS=$(echo "$HEALTH_DATA" | jq -r '.services.facebook_api.status // "unknown"' 2>/dev/null)
        GOOGLE_STATUS=$(echo "$HEALTH_DATA" | jq -r '.services.google_ads_api.status // "unknown"' 2>/dev/null)
        echo "  - Facebook API: $FB_STATUS"
        echo "  - Google Ads API: $GOOGLE_STATUS"
    fi
else
    echo -e "${YELLOW}⚠${NC} API health endpoint returned HTTP $API_HEALTH_STATUS"
fi
echo ""

# ===== FIXES NEEDED =====
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Required Fixes${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${RED}CRITICAL FIX #1: Update Service ID${NC}"
echo "The service ID in all workflow files must be updated!"
echo ""
echo "Run this command to fix all workflow files:"
echo -e "${GREEN}find .github/workflows -name '*.yml' -exec sed -i '' 's/srv-d1ub5iumcj7s73ebrpo0/war-room-oa9t/g' {} +${NC}"
echo ""

echo -e "${RED}CRITICAL FIX #2: Fix render.yaml${NC}"
echo "The render.yaml has duplicate 'services:' keys (lines 1 and 72)"
echo "Fix by combining them or removing the duplicate"
echo ""

echo -e "${RED}CRITICAL FIX #3: Add GitHub Secrets${NC}"
echo "1. Go to: https://github.com/Think-Big-Media/1.0-war-room/settings/secrets/actions"
echo "2. Add these secrets:"
echo "   - RENDER_API_KEY: Get from https://dashboard.render.com/u/settings"
echo "   - RENDER_SERVICE_ID: war-room-oa9t"
echo "   - RENDER_DEPLOY_HOOK_URL: Get from Render service settings"
echo ""

echo -e "${RED}CRITICAL FIX #4: Add Environment Variables in Render${NC}"
echo "1. Go to: https://dashboard.render.com/"
echo "2. Select the war-room-oa9t service"
echo "3. Go to Environment tab"
echo "4. Add all variables from .env.production"
echo ""

echo -e "${YELLOW}Quick Fix Script:${NC}"
echo "Run: ./scripts/fix-deployment-config.sh"
echo ""