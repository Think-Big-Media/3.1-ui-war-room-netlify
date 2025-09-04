#!/bin/bash

# Test API Health Checks Script
# This script tests both local and production API health endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_URL="http://localhost:8000"
PROD_URL="https://war-room-oa9t.onrender.com"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   War Room API Health Check Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    echo -e "${YELLOW}Testing $name: $endpoint${NC}"
    
    response=$(curl -s -w "\n%{http_code}" "$url$endpoint" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ $name returned 200 OK${NC}"
        
        # Parse and display key information
        if command -v jq &> /dev/null; then
            status=$(echo "$body" | jq -r '.status // "unknown"' 2>/dev/null || echo "parse_error")
            
            if [ "$endpoint" = "/api/health" ]; then
                # Display detailed health information
                echo "  Overall Status: $status"
                
                # Check each service
                for service in database redis facebook_api google_ads_api; do
                    service_status=$(echo "$body" | jq -r ".services.$service.status // 'unknown'" 2>/dev/null)
                    configured=$(echo "$body" | jq -r ".services.$service.configured // false" 2>/dev/null)
                    
                    if [ "$service_status" = "healthy" ]; then
                        echo -e "  ${GREEN}✓${NC} $service: $service_status (configured: $configured)"
                    elif [ "$service_status" = "warning" ]; then
                        echo -e "  ${YELLOW}⚠${NC} $service: $service_status (configured: $configured)"
                    else
                        echo -e "  ${RED}✗${NC} $service: $service_status (configured: $configured)"
                        
                        # Show error message if available
                        error_msg=$(echo "$body" | jq -r ".services.$service.message // ''" 2>/dev/null)
                        if [ -n "$error_msg" ] && [ "$error_msg" != "null" ]; then
                            echo "    Error: $error_msg"
                        fi
                    fi
                done
                
                # Show summary
                healthy=$(echo "$body" | jq -r '.summary.healthy_services // 0' 2>/dev/null)
                warning=$(echo "$body" | jq -r '.summary.warning_services // 0' 2>/dev/null)
                error=$(echo "$body" | jq -r '.summary.error_services // 0' 2>/dev/null)
                total=$(echo "$body" | jq -r '.summary.total_services // 0' 2>/dev/null)
                
                echo "  Summary: $healthy/$total healthy, $warning warnings, $error errors"
            elif [ "$endpoint" = "/api/health/apis" ]; then
                # Display API-specific information
                fb_status=$(echo "$body" | jq -r '.apis.facebook.status // "unknown"' 2>/dev/null)
                fb_configured=$(echo "$body" | jq -r '.apis.facebook.configured // false' 2>/dev/null)
                google_status=$(echo "$body" | jq -r '.apis.google_ads.status // "unknown"' 2>/dev/null)
                google_configured=$(echo "$body" | jq -r '.apis.google_ads.configured // false' 2>/dev/null)
                
                echo -e "  Facebook API: $fb_status (configured: $fb_configured)"
                echo -e "  Google Ads API: $google_status (configured: $google_configured)"
                
                # Show missing credentials if any
                fb_msg=$(echo "$body" | jq -r '.apis.facebook.message // ""' 2>/dev/null)
                google_missing=$(echo "$body" | jq -r '.apis.google_ads.missing // {}' 2>/dev/null)
                
                if [ -n "$fb_msg" ] && [ "$fb_msg" != "null" ] && [ "$fb_msg" != "" ]; then
                    echo -e "    ${YELLOW}Facebook: $fb_msg${NC}"
                fi
                
                if [ "$google_missing" != "{}" ] && [ "$google_missing" != "null" ]; then
                    echo -e "    ${YELLOW}Google Ads missing credentials:${NC}"
                    echo "$google_missing" | jq -r 'to_entries[] | select(.value == true) | "      - \(.key)"' 2>/dev/null
                fi
            fi
        else
            # If jq is not available, just show raw response
            echo "  Response: $(echo "$body" | head -c 200)..."
        fi
    elif [ "$http_code" = "000" ]; then
        echo -e "${RED}✗ $name - Connection failed (service may be down)${NC}"
    else
        echo -e "${RED}✗ $name returned HTTP $http_code${NC}"
        if [ -n "$body" ]; then
            echo "  Error: $(echo "$body" | head -c 200)..."
        fi
    fi
    
    echo ""
}

# Function to test environment
test_environment() {
    local env_name=$1
    local base_url=$2
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Testing $env_name Environment${NC}"
    echo -e "${BLUE}URL: $base_url${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Test endpoints
    test_endpoint "$env_name Simple Health" "$base_url" "/api/health/simple"
    test_endpoint "$env_name Full Health" "$base_url" "/api/health"
    test_endpoint "$env_name API Health" "$base_url" "/api/health/apis"
    test_endpoint "$env_name Facebook Health" "$base_url" "/api/health/facebook"
    test_endpoint "$env_name Google Health" "$base_url" "/api/health/google"
    test_endpoint "$env_name Readiness" "$base_url" "/api/health/ready"
    test_endpoint "$env_name Liveness" "$base_url" "/api/health/live"
}

# Check if jq is installed (for JSON parsing)
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. JSON parsing will be limited.${NC}"
    echo -e "${YELLOW}Install with: brew install jq${NC}"
    echo ""
fi

# Parse command line arguments
if [ "$1" = "local" ]; then
    test_environment "Local" "$LOCAL_URL"
elif [ "$1" = "prod" ]; then
    test_environment "Production" "$PROD_URL"
else
    # Test both environments
    test_environment "Local" "$LOCAL_URL"
    echo ""
    echo ""
    test_environment "Production" "$PROD_URL"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Health Check Test Complete${NC}"
echo -e "${BLUE}========================================${NC}"

# Exit with error if any production APIs are not healthy
if [ "$1" = "prod" ] || [ -z "$1" ]; then
    prod_health=$(curl -s "$PROD_URL/api/health" 2>/dev/null | jq -r '.status // "error"' 2>/dev/null || echo "error")
    if [ "$prod_health" != "healthy" ] && [ "$prod_health" != "degraded" ]; then
        echo -e "${RED}⚠️  Production health check failed!${NC}"
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Check Render dashboard for environment variables"
        echo "2. Review deployment logs: https://dashboard.render.com"
        echo "3. Verify API credentials are correctly set"
        exit 1
    fi
fi