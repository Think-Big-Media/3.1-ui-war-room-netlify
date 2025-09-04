#!/bin/bash

# War Room Simple Load Test
# Quick concurrent request test for performance validation
# Usage: ./simple-load-test.sh [concurrent_requests] [endpoint] [url]

set -e

# Configuration
CONCURRENT=${1:-10}
ENDPOINT=${2:-"/health"}
BASE_URL=${3:-"https://war-room-oa9t.onrender.com"}
URL="${BASE_URL}${ENDPOINT}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 War Room Simple Load Test${NC}"
echo "URL: $URL"
echo "Concurrent Requests: $CONCURRENT"
echo "Started: $(date)"
echo "========================="

# Create temp directory for results
TEMP_DIR=$(mktemp -d)
START_TIME=$(date +%s.%N)

# Launch concurrent requests
echo -e "${YELLOW}Launching $CONCURRENT concurrent requests...${NC}"
for i in $(seq 1 $CONCURRENT); do
    (
        response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}|%{time_connect}|%{time_starttransfer}" "$URL" 2>/dev/null || echo "000|0|0|0")
        echo "$response" > "${TEMP_DIR}/result_${i}.txt"
    ) &
done

echo "Waiting for all requests to complete..."
wait

END_TIME=$(date +%s.%N)
TOTAL_DURATION=$(echo "$END_TIME - $START_TIME" | bc -l)

# Analyze results
SUCCESS_COUNT=0
ERROR_COUNT=0
TOTAL_RESPONSE_TIME=0
TOTAL_CONNECT_TIME=0
TOTAL_TRANSFER_TIME=0
declare -a RESPONSE_TIMES=()

echo -e "${BLUE}📊 Processing results...${NC}"

for result_file in ${TEMP_DIR}/result_*.txt; do
    if [ -f "$result_file" ]; then
        IFS='|' read -r http_code time_total time_connect time_starttransfer < "$result_file"
        
        if [[ "$http_code" =~ ^[2-3][0-9][0-9]$ ]]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            TOTAL_RESPONSE_TIME=$(echo "$TOTAL_RESPONSE_TIME + $time_total" | bc -l)
            TOTAL_CONNECT_TIME=$(echo "$TOTAL_CONNECT_TIME + $time_connect" | bc -l)
            TOTAL_TRANSFER_TIME=$(echo "$TOTAL_TRANSFER_TIME + $time_starttransfer" | bc -l)
            
            # Convert to milliseconds for display
            time_ms=$(echo "$time_total * 1000" | bc -l)
            RESPONSE_TIMES+=($time_ms)
        else
            ERROR_COUNT=$((ERROR_COUNT + 1))
            echo -e "  ${RED}Request failed with HTTP $http_code${NC}"
        fi
    fi
done

# Calculate statistics
if [ $SUCCESS_COUNT -gt 0 ]; then
    AVG_RESPONSE_TIME=$(echo "scale=3; $TOTAL_RESPONSE_TIME / $SUCCESS_COUNT" | bc -l)
    AVG_CONNECT_TIME=$(echo "scale=3; $TOTAL_CONNECT_TIME / $SUCCESS_COUNT" | bc -l)
    AVG_TRANSFER_TIME=$(echo "scale=3; $TOTAL_TRANSFER_TIME / $SUCCESS_COUNT" | bc -l)
else
    AVG_RESPONSE_TIME=0
    AVG_CONNECT_TIME=0
    AVG_TRANSFER_TIME=0
fi

SUCCESS_RATE=$(echo "scale=1; $SUCCESS_COUNT * 100 / $CONCURRENT" | bc -l)
REQUESTS_PER_SECOND=$(echo "scale=2; $CONCURRENT / $TOTAL_DURATION" | bc -l)

# Display results
echo "========================="
echo -e "${GREEN}✅ Load Test Results${NC}"
echo ""
echo "📈 Performance Metrics:"
echo "  Total Duration: $(printf '%.3f' $TOTAL_DURATION)s"
echo "  Requests per Second: $REQUESTS_PER_SECOND"
echo "  Average Response Time: ${AVG_RESPONSE_TIME}s"
echo "  Average Connect Time: ${AVG_CONNECT_TIME}s"
echo "  Average Transfer Time: ${AVG_TRANSFER_TIME}s"
echo ""
echo "📊 Success Metrics:"
echo "  Successful Requests: $SUCCESS_COUNT/$CONCURRENT"
echo "  Success Rate: ${SUCCESS_RATE}%"
echo "  Failed Requests: $ERROR_COUNT"
echo ""

# Performance assessment
if (( $(echo "$SUCCESS_RATE >= 95.0" | bc -l) )); then
    echo -e "🎯 ${GREEN}SUCCESS RATE: EXCELLENT${NC} (≥95%)"
else
    echo -e "⚠️  ${YELLOW}SUCCESS RATE: NEEDS ATTENTION${NC} (<95%)"
fi

if (( $(echo "$AVG_RESPONSE_TIME < 1.0" | bc -l) )); then
    echo -e "⚡ ${GREEN}RESPONSE TIME: EXCELLENT${NC} (<1s)"
elif (( $(echo "$AVG_RESPONSE_TIME < 3.0" | bc -l) )); then
    echo -e "✅ ${YELLOW}RESPONSE TIME: GOOD${NC} (<3s)"
else
    echo -e "🐌 ${RED}RESPONSE TIME: SLOW${NC} (≥3s)"
fi

if (( $(echo "$REQUESTS_PER_SECOND >= 10.0" | bc -l) )); then
    echo -e "🚀 ${GREEN}THROUGHPUT: EXCELLENT${NC} (≥10 req/s)"
else
    echo -e "📈 ${YELLOW}THROUGHPUT: MODERATE${NC} (<10 req/s)"
fi

echo ""
echo "Completed: $(date)"

# Cleanup
rm -rf "$TEMP_DIR"

# Exit with appropriate code
if [ $SUCCESS_COUNT -eq $CONCURRENT ]; then
    exit 0
else
    exit 1
fi