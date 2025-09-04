#!/bin/bash

# OAuth Health Check Script
# Tests if OAuth is properly configured on the live site

echo "=========================================="
echo "🔍 OAuth Health Check for War Room"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PRODUCTION_URL="https://war-room-oa9t.onrender.com"

echo "Testing: $PRODUCTION_URL"
echo ""

# Function to check URL response
check_url() {
    local url=$1
    local description=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $description: OK (HTTP $response)${NC}"
        return 0
    elif [ "$response" = "404" ]; then
        echo -e "${RED}❌ $description: NOT FOUND (HTTP $response)${NC}"
        return 1
    elif [ "$response" = "302" ] || [ "$response" = "301" ]; then
        echo -e "${YELLOW}⚠️  $description: REDIRECT (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: ERROR (HTTP $response)${NC}"
        return 1
    fi
}

echo "1. Checking main site..."
check_url "$PRODUCTION_URL" "Main site"

echo ""
echo "2. Checking login page..."
check_url "$PRODUCTION_URL/login" "Login page"

echo ""
echo "3. Checking auth callback route..."
check_url "$PRODUCTION_URL/auth/callback" "Auth callback"

echo ""
echo "4. Checking API health..."
check_url "$PRODUCTION_URL/api/health" "API health"

echo ""
echo "=========================================="
echo "📋 OAuth Configuration Checklist"
echo "=========================================="
echo ""

echo "Please verify in your provider dashboards:"
echo ""

echo "🔵 GOOGLE (https://console.cloud.google.com):"
echo "   ✓ OAuth 2.0 Client ID created"
echo "   ✓ Redirect URI added: $PRODUCTION_URL/auth/callback"
echo "   ✓ JavaScript origins includes: $PRODUCTION_URL"
echo ""

echo "🔵 FACEBOOK (https://developers.facebook.com):"
echo "   ✓ App created and in production mode"
echo "   ✓ Facebook Login product added"
echo "   ✓ Valid OAuth Redirect URI: $PRODUCTION_URL/auth/callback"
echo "   ✓ App domains includes: war-room-oa9t.onrender.com"
echo ""

echo "🟢 SUPABASE (https://app.supabase.com):"
echo "   ✓ Google provider enabled with credentials"
echo "   ✓ Facebook provider enabled with credentials"
echo "   ✓ Site URL set to: $PRODUCTION_URL"
echo "   ✓ Redirect URLs includes: $PRODUCTION_URL/auth/callback"
echo ""

echo "=========================================="
echo "🧪 Manual Test Steps"
echo "=========================================="
echo ""

echo "1. Open: $PRODUCTION_URL/login"
echo "2. Click on Google login button"
echo "3. Verify Google OAuth flow works"
echo "4. Sign out and repeat with Facebook"
echo ""

echo "If any OAuth flow fails, check:"
echo "• Browser console for errors"
echo "• Network tab for failed requests"
echo "• Render logs for server errors"
echo ""

echo "=========================================="
echo "✅ Next Steps"
echo "=========================================="
echo ""

echo "1. If all checks pass, OAuth is ready!"
echo "2. Take screenshots of the working login page"
echo "3. Document the OAuth flow for users"
echo ""

echo "Done!"