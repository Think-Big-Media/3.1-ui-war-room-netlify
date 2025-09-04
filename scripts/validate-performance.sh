#!/bin/bash
# Performance Validation Script

echo "🚀 Running Performance Validation Tests"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Performance thresholds
MAX_RESPONSE_TIME=3000  # 3 seconds in milliseconds
MAX_MEMORY_INCREASE=50  # 50MB max memory increase

echo -e "\n📊 Testing Dashboard Load Performance..."

# Start the frontend dev server in background
cd src/frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 5  # Wait for server to start

echo "Frontend server started (PID: $FRONTEND_PID)"

# Measure initial memory usage
INITIAL_MEM=$(ps -o rss= -p $FRONTEND_PID | awk '{print $1/1024}')
echo "Initial memory usage: ${INITIAL_MEM}MB"

echo -e "\n⏱️  Measuring Dashboard Load Times..."

# Test dashboard load time using curl
START_TIME=$(date +%s%3N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
END_TIME=$(date +%s%3N)
LOAD_TIME=$((END_TIME - START_TIME))

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Dashboard loaded successfully${NC}"
    echo "Response time: ${LOAD_TIME}ms"
    
    if [ $LOAD_TIME -lt $MAX_RESPONSE_TIME ]; then
        echo -e "${GREEN}✅ Response time within threshold (<${MAX_RESPONSE_TIME}ms)${NC}"
    else
        echo -e "${RED}❌ Response time exceeds threshold (>${MAX_RESPONSE_TIME}ms)${NC}"
    fi
else
    echo -e "${RED}❌ Failed to load dashboard (HTTP ${HTTP_CODE})${NC}"
fi

# Simulate user activity
echo -e "\n🔄 Simulating user activity for memory leak detection..."
for i in {1..10}; do
    curl -s http://localhost:5173/ > /dev/null
    sleep 1
done

# Measure final memory usage
FINAL_MEM=$(ps -o rss= -p $FRONTEND_PID | awk '{print $1/1024}')
MEM_INCREASE=$(echo "$FINAL_MEM - $INITIAL_MEM" | bc)

echo -e "\nMemory Usage Analysis:"
echo "Initial: ${INITIAL_MEM}MB"
echo "Final: ${FINAL_MEM}MB"
echo "Increase: ${MEM_INCREASE}MB"

if (( $(echo "$MEM_INCREASE < $MAX_MEMORY_INCREASE" | bc -l) )); then
    echo -e "${GREEN}✅ No significant memory leak detected${NC}"
else
    echo -e "${RED}❌ Potential memory leak detected (>${MAX_MEMORY_INCREASE}MB increase)${NC}"
fi

# Test API response times
echo -e "\n📡 Testing API Response Times..."

# Kill frontend server
kill $FRONTEND_PID 2>/dev/null

# Start backend server
cd ../backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 5  # Wait for server to start

echo "Backend server started (PID: $BACKEND_PID)"

# Test key API endpoints
ENDPOINTS=(
    "/api/v1/health"
    "/api/v1/documents/search/health"
)

ALL_PASS=true

for endpoint in "${ENDPOINTS[@]}"; do
    START_TIME=$(date +%s%3N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000$endpoint)
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    
    echo -n "$endpoint: "
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        echo -n "Response time: ${RESPONSE_TIME}ms - "
        if [ $RESPONSE_TIME -lt $MAX_RESPONSE_TIME ]; then
            echo -e "${GREEN}PASS${NC}"
        else
            echo -e "${RED}FAIL (>${MAX_RESPONSE_TIME}ms)${NC}"
            ALL_PASS=false
        fi
    else
        echo -e "${RED}FAIL (HTTP ${HTTP_CODE})${NC}"
        ALL_PASS=false
    fi
done

# Kill backend server
kill $BACKEND_PID 2>/dev/null

echo -e "\n📊 Performance Validation Summary:"
echo "=================================="
echo "Dashboard Load Time: ${LOAD_TIME}ms"
echo "Memory Leak Test: ${MEM_INCREASE}MB increase"
echo -n "Overall Status: "

if [ "$ALL_PASS" = true ] && [ $LOAD_TIME -lt $MAX_RESPONSE_TIME ] && (( $(echo "$MEM_INCREASE < $MAX_MEMORY_INCREASE" | bc -l) )); then
    echo -e "${GREEN}✅ ALL PERFORMANCE TESTS PASSED${NC}"
    echo -e "\n✅ System meets <3s response time requirement"
    echo "✅ No memory leaks detected"
    echo "✅ API endpoints responsive"
    exit 0
else
    echo -e "${RED}❌ PERFORMANCE ISSUES DETECTED${NC}"
    exit 1
fi