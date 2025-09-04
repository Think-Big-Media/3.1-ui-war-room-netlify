#!/bin/bash

# War Room Render Deployment Validation Script
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
TIMEOUT=10

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Test function
test_endpoint() {
    local test_name="$1"
    local endpoint="$2"
    local expected_status="${3:-200}"
    local max_time="${4:-3}"  # Default 3s SLA
    
    echo -n "Testing $test_name... "
    
    # Make request and capture response
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" "$BASE_URL$endpoint" -H "Accept: application/json" --max-time $TIMEOUT 2>/dev/null || echo -e "\n000\n0")
    
    # Parse response
    http_code=$(echo "$response" | tail -2 | head -1)
    time_total=$(echo "$response" | tail -1)
    
    # Check status code
    if [ "$http_code" = "$expected_status" ]; then
        status_ok=true
    else
        status_ok=false
    fi
    
    # Check response time
    if (( $(echo "$time_total < $max_time" | bc -l) )); then
        time_ok=true
    else
        time_ok=false
    fi
    
    # Report results
    if [ "$status_ok" = true ] && [ "$time_ok" = true ]; then
        echo -e "${GREEN}✓ PASSED${NC} (${time_total}s)"
        ((PASSED++))
    elif [ "$status_ok" = true ] && [ "$time_ok" = false ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (${time_total}s > ${max_time}s SLA)"
        ((WARNINGS++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code, ${time_total}s)"
        ((FAILED++))
    fi
}

# Check content function
check_content() {
    local test_name="$1"
    local endpoint="$2"
    local search_string="$3"
    
    echo -n "Checking $test_name... "
    
    if curl -s "$BASE_URL$endpoint" | grep -q "$search_string" 2>/dev/null; then
        echo -e "${GREEN}✓ FOUND${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ NOT FOUND${NC}"
        ((FAILED++))
    fi
}

echo "War Room Render Deployment Validation"
echo "====================================="
echo "Target: $BASE_URL"
echo "Date: $(date)"
echo ""

# Health Endpoints
echo -e "${BLUE}=== Health Endpoints ===${NC}"
test_endpoint "Main health check" "/health" 200 1
test_endpoint "API test endpoint" "/api/v1/test" 200 1
test_endpoint "API status endpoint" "/api/v1/status" 200 1
test_endpoint "Ping endpoint" "/ping" 200 1

echo ""
echo -e "${BLUE}=== Frontend Validation ===${NC}"
test_endpoint "Homepage" "/" 200 3
check_content "Homepage title" "/" "<title>War Room Platform</title>"
check_content "React root element" "/" '<div id="root">'

echo ""
echo -e "${BLUE}=== API Documentation ===${NC}"
test_endpoint "Swagger UI" "/docs" 200 3
check_content "API docs title" "/docs" "War Room Full Stack"

echo ""
echo -e "${BLUE}=== Static Assets ===${NC}"
# Check if main JS/CSS files are served
echo -n "Checking static assets... "
if curl -s "$BASE_URL/" | grep -E "(\.js|\.css)" | grep -q "assets/" 2>/dev/null; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - No asset references found"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}=== Security Headers ===${NC}"
echo -n "Checking CORS headers... "
cors_header=$(curl -s -I "$BASE_URL/api/v1/test" | grep -i "access-control-allow-origin" || echo "")
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓ PRESENT${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} - CORS headers not found"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}=== Performance Metrics ===${NC}"
# Run 5 requests and calculate average
total_time=0
echo -n "Average response time (5 requests)... "
for i in {1..5}; do
    time=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL/health")
    total_time=$(echo "$total_time + $time" | bc)
done
avg_time=$(echo "scale=3; $total_time / 5" | bc)
echo "${avg_time}s"

if (( $(echo "$avg_time < 1" | bc -l) )); then
    echo -e "${GREEN}✓ Excellent performance${NC}"
    ((PASSED++))
elif (( $(echo "$avg_time < 3" | bc -l) )); then
    echo -e "${YELLOW}⚠ Acceptable performance${NC}"
    ((WARNINGS++))
else
    echo -e "${RED}✗ Poor performance${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}=== Legacy Platform Check ===${NC}"
echo -n "Checking for Railway references... "
if curl -s "$BASE_URL/" | grep -i "railway" 2>/dev/null; then
    echo -e "${RED}✗ FOUND${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ CLEAN${NC}"
    ((PASSED++))
fi

echo -n "Checking for Docker references... "
if curl -s "$BASE_URL/" | grep -i "docker" 2>/dev/null; then
    echo -e "${RED}✗ FOUND${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ CLEAN${NC}"
    ((PASSED++))
fi

echo ""
echo "====================================="
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

# Generate summary
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed! Deployment is healthy.${NC}"
        exit_code=0
    else
        echo -e "${YELLOW}⚠ Deployment is functional with warnings.${NC}"
        exit_code=0
    fi
else
    echo -e "${RED}✗ Deployment validation failed!${NC}"
    exit_code=1
fi

echo ""
echo "Deployment URL: $BASE_URL"
echo "API Documentation: $BASE_URL/docs"
echo "Health Check: $BASE_URL/health"
echo ""

exit $exit_code