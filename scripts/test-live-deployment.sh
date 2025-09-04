#!/bin/bash

# Test Live Deployment Script for War Room
# Tests the deployed application on Render

echo "🧪 Starting Live Deployment Tests..."
echo "=================================="

# Get the live URL from Render
LIVE_URL="https://war-room-oa9t.onrender.com"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "Testing $test_name... "
    
    if eval "$command"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to check HTTP status
check_http_status() {
    local url="$1"
    local expected_status="$2"
    local actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    [ "$actual_status" = "$expected_status" ]
}

# Function to check if response contains text
check_response_contains() {
    local url="$1"
    local text="$2"
    
    curl -s "$url" | grep -q "$text"
}

echo ""
echo "🌐 Testing URL: $LIVE_URL"
echo ""

# 1. Test if site is accessible
run_test "Site Accessibility" \
    "check_http_status '$LIVE_URL' '200'" \
    "200"

# 2. Test if API health endpoint works
run_test "API Health Endpoint" \
    "check_http_status '$LIVE_URL/health' '200'" \
    "200"

# 3. Test if API returns correct health response
run_test "Health Response Content" \
    "curl -s '$LIVE_URL/health' | jq -e '.status == \"healthy\"' > /dev/null" \
    "healthy"

# 4. Test if frontend assets are served
run_test "Frontend Assets" \
    "check_http_status '$LIVE_URL/assets/index-DLRK9GuM.js' '200'" \
    "200"

# 5. Test if logo is served
run_test "Logo Image" \
    "check_http_status '$LIVE_URL/images/war-room-logo.png' '200'" \
    "200"

# 6. Test API test endpoint
run_test "API Test Endpoint" \
    "check_http_status '$LIVE_URL/api/v1/test' '200'" \
    "200"

# 7. Test API status endpoint
run_test "API Status Endpoint" \
    "curl -s '$LIVE_URL/api/v1/status' | jq -e '.api_status == \"operational\"' > /dev/null" \
    "operational"

# 8. Test 404 handling
run_test "404 Error Handling" \
    "check_http_status '$LIVE_URL/api/nonexistent' '404'" \
    "404"

# 9. Test JSON response format
run_test "JSON Response Format" \
    "curl -s '$LIVE_URL/api/v1/test' | jq -e '.message' > /dev/null" \
    "JSON"

# 10. Test response time
run_test "Response Time (<3s)" \
    "[ $(curl -o /dev/null -s -w '%{time_total}' '$LIVE_URL' | cut -d. -f1) -lt 3 ]" \
    "<3s"

echo ""
echo "=================================="
echo "📊 Test Results:"
echo "✅ Passed: $TESTS_PASSED"
echo "❌ Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is healthy.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the deployment.${NC}"
    exit 1
fi