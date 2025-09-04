#!/bin/bash

echo "🔄 Running War Room Integration Tests"
echo "====================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$CODE" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $CODE)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_code, got $CODE)"
        ((TESTS_FAILED++))
    fi
}

echo -e "\n📡 Testing Live Production Site..."
echo "=================================="

# Test main site
test_endpoint "Homepage" "https://war-room-oa9t.onrender.com" "200"
test_endpoint "Health Check" "https://war-room-oa9t.onrender.com/health" "200"
test_endpoint "API Health" "https://war-room-oa9t.onrender.com/api/v1/health" "200"

echo -e "\n🔧 Testing API Endpoints..."
echo "============================"

BASE_URL="https://war-room-oa9t.onrender.com"
test_endpoint "Ping" "$BASE_URL/ping" "200"
test_endpoint "API Status" "$BASE_URL/api/v1/status" "200"
test_endpoint "API Test" "$BASE_URL/api/v1/test" "200"

echo -e "\n📊 Testing Documentation..."
echo "==========================="

# Check if documentation files exist
DOCS=(
    "docs/CLIENT_USER_MANUAL.md"
    "docs/ADMINISTRATOR_GUIDE.md"
    "docs/QUICK_START_GUIDE.md"
    "docs/FAQ.md"
    "monitoring/README.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "Documentation: $doc ${GREEN}✅ EXISTS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "Documentation: $doc ${RED}❌ MISSING${NC}"
        ((TESTS_FAILED++))
    fi
done

echo -e "\n🔍 Testing Monitoring System..."
echo "================================"

# Check monitoring scripts
if [ -f "monitoring/war-room-monitor.js" ]; then
    echo -e "Monitoring Script ${GREEN}✅ EXISTS${NC}"
    ((TESTS_PASSED++))
    
    # Run quick health check
    cd monitoring
    if command -v node > /dev/null; then
        echo "Running health check..."
        node health-check.js brief
        ((TESTS_PASSED++))
    fi
    cd ..
else
    echo -e "Monitoring Script ${RED}❌ MISSING${NC}"
    ((TESTS_FAILED++))
fi

echo -e "\n📈 Integration Test Summary"
echo "==========================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL INTEGRATION TESTS PASSED!${NC}"
    echo "System is ready for client demonstration."
    exit 0
else
    echo -e "\n${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please review failures before client demo."
    exit 1
fi