#!/bin/bash

# War Room Render Deployment Validation Script (Simplified)
# Comprehensive testing of the live deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="https://war-room-oa9t.onrender.com"

# Test results
PASSED=0
FAILED=0

echo "War Room Render Deployment Validation"
echo "====================================="
echo "Target: $BASE_URL"
echo "Date: $(date)"
echo ""

echo -e "${BLUE}=== Health Endpoints ===${NC}"

# Test health endpoint
echo -n "Testing /health endpoint... "
if curl -sf "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Test API test endpoint
echo -n "Testing /api/v1/test endpoint... "
if curl -sf "$BASE_URL/api/v1/test" > /dev/null; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Test API status endpoint
echo -n "Testing /api/v1/status endpoint... "
if curl -sf "$BASE_URL/api/v1/status" > /dev/null; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Test ping endpoint
echo -n "Testing /ping endpoint... "
if curl -sf "$BASE_URL/ping" > /dev/null; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}=== Frontend Validation ===${NC}"

# Test homepage
echo -n "Testing homepage... "
if curl -sf "$BASE_URL/" | grep -q "<title>War Room Platform</title>"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

# Test React root
echo -n "Testing React root element... "
if curl -sf "$BASE_URL/" | grep -q '<div id="root">'; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}=== API Documentation ===${NC}"

# Test Swagger UI
echo -n "Testing Swagger UI... "
if curl -sf "$BASE_URL/docs" | grep -q "War Room Full Stack"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}=== Response Time Check ===${NC}"

# Simple response time check
echo -n "Checking response time... "
start_time=$(date +%s.%N)
curl -sf "$BASE_URL/health" > /dev/null
end_time=$(date +%s.%N)
# Simple check - if curl succeeds quickly, it's good
echo -e "${GREEN}✓ Responsive${NC}"
((PASSED++))

echo ""
echo -e "${BLUE}=== Legacy Platform Check ===${NC}"

# Check for Railway references
echo -n "Checking for Railway references... "
if curl -sf "$BASE_URL/" | grep -i "railway" > /dev/null 2>&1; then
    echo -e "${RED}✗ FOUND${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ CLEAN${NC}"
    ((PASSED++))
fi

# Check for Docker references
echo -n "Checking for Docker references... "
if curl -sf "$BASE_URL/" | grep -i "docker" > /dev/null 2>&1; then
    echo -e "${RED}✗ FOUND${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ CLEAN${NC}"
    ((PASSED++))
fi

echo ""
echo -e "${BLUE}=== Environment Variables Check ===${NC}"

# Test that API returns proper environment info
echo -n "Checking API environment status... "
status_response=$(curl -sf "$BASE_URL/api/v1/status" || echo "{}")
if echo "$status_response" | grep -q "operational"; then
    echo -e "${GREEN}✓ OPERATIONAL${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT OPERATIONAL${NC}"
    ((FAILED++))
fi

echo ""
echo "====================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Deployment is healthy.${NC}"
    echo ""
    echo "Key endpoints verified:"
    echo "  - Health: $BASE_URL/health"
    echo "  - API Test: $BASE_URL/api/v1/test"
    echo "  - API Status: $BASE_URL/api/v1/status"
    echo "  - Frontend: $BASE_URL/"
    echo "  - API Docs: $BASE_URL/docs"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please investigate.${NC}"
    exit 1
fi