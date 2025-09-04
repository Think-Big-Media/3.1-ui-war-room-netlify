#!/bin/bash

# War Room Performance Test Suite
# Tests critical endpoints and measures response times
# Usage: ./performance-test.sh [iterations] [url]

set -e

# Configuration
ITERATIONS=${1:-5}
BASE_URL=${2:-"https://war-room-oa9t.onrender.com"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="performance-results-${TIMESTAMP}.json"
LOG_FILE="performance-test-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Endpoints to test
declare -a ENDPOINTS=(
    "/health"
    "/settings" 
    "/"
)

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local url="${BASE_URL}${endpoint}"
    local total_time=0
    local success_count=0
    local failed_count=0
    local min_time=999999
    local max_time=0
    
    echo -e "${BLUE}Testing endpoint: ${endpoint}${NC}" | tee -a $LOG_FILE
    echo "URL: $url" | tee -a $LOG_FILE
    echo "Iterations: $ITERATIONS" | tee -a $LOG_FILE
    echo "---" | tee -a $LOG_FILE
    
    declare -a response_times=()
    
    for i in $(seq 1 $ITERATIONS); do
        echo -n "  Run $i/$ITERATIONS: " | tee -a $LOG_FILE
        
        # Make request with detailed timing
        response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}|%{time_namelookup}|%{time_connect}|%{time_appconnect}|%{time_pretransfer}|%{time_redirect}|%{time_starttransfer}" "$url" 2>/dev/null || echo "000|0|0|0|0|0|0|0")
        
        IFS='|' read -r http_code time_total time_namelookup time_connect time_appconnect time_pretransfer time_redirect time_starttransfer <<< "$response"
        
        if [[ "$http_code" =~ ^[2-3][0-9][0-9]$ ]]; then
            echo -e "${GREEN}HTTP $http_code - ${time_total}s${NC}" | tee -a $LOG_FILE
            success_count=$((success_count + 1))
            
            # Convert to milliseconds for easier comparison
            time_ms=$(echo "$time_total * 1000" | bc -l)
            response_times+=($time_ms)
            total_time=$(echo "$total_time + $time_total" | bc -l)
            
            # Track min/max
            if (( $(echo "$time_total < $min_time" | bc -l) )); then
                min_time=$time_total
            fi
            if (( $(echo "$time_total > $max_time" | bc -l) )); then
                max_time=$time_total
            fi
        else
            echo -e "${RED}HTTP $http_code - FAILED${NC}" | tee -a $LOG_FILE
            failed_count=$((failed_count + 1))
        fi
        
        # Brief pause between requests
        sleep 1
    done
    
    # Calculate statistics
    if [ $success_count -gt 0 ]; then
        avg_time=$(echo "scale=3; $total_time / $success_count" | bc -l)
        success_rate=$(echo "scale=1; $success_count * 100 / $ITERATIONS" | bc -l)
        
        echo -e "${GREEN}✅ Results for ${endpoint}:${NC}" | tee -a $LOG_FILE
        echo "  Success Rate: ${success_rate}%" | tee -a $LOG_FILE
        echo "  Average Time: ${avg_time}s" | tee -a $LOG_FILE
        echo "  Min Time: ${min_time}s" | tee -a $LOG_FILE  
        echo "  Max Time: ${max_time}s" | tee -a $LOG_FILE
        echo "  Successful Requests: $success_count/$ITERATIONS" | tee -a $LOG_FILE
    else
        echo -e "${RED}❌ All requests failed for ${endpoint}${NC}" | tee -a $LOG_FILE
        avg_time=0
        success_rate=0
    fi
    
    # JSON output for results file
    cat << EOF >> $RESULTS_FILE
{
  "endpoint": "$endpoint",
  "url": "$url", 
  "timestamp": "$(date -Iseconds)",
  "iterations": $ITERATIONS,
  "success_count": $success_count,
  "failed_count": $failed_count,
  "success_rate": $success_rate,
  "avg_response_time": $avg_time,
  "min_response_time": $min_time,
  "max_response_time": $max_time,
  "response_times": [$(IFS=,; echo "${response_times[*]}")],
  "status": "$([ $success_count -gt 0 ] && echo "PASS" || echo "FAIL")"
},
EOF
    
    echo "" | tee -a $LOG_FILE
}

# Function to run load test
run_load_test() {
    local endpoint=${1:-"/health"}
    local concurrent=${2:-10}
    local url="${BASE_URL}${endpoint}"
    
    echo -e "${YELLOW}🚀 Running load test${NC}" | tee -a $LOG_FILE
    echo "Endpoint: $endpoint" | tee -a $LOG_FILE
    echo "Concurrent requests: $concurrent" | tee -a $LOG_FILE
    echo "URL: $url" | tee -a $LOG_FILE
    echo "---" | tee -a $LOG_FILE
    
    # Create temp directory for load test results
    local temp_dir=$(mktemp -d)
    
    # Start timer
    local start_time=$(date +%s.%N)
    
    # Launch concurrent requests
    for i in $(seq 1 $concurrent); do
        (
            response=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" "$url" 2>/dev/null || echo "000|0")
            echo "$response" > "${temp_dir}/result_${i}.txt"
        ) &
    done
    
    # Wait for all requests to complete
    wait
    
    local end_time=$(date +%s.%N)
    local total_duration=$(echo "$end_time - $start_time" | bc -l)
    
    # Analyze results
    local success_count=0
    local total_response_time=0
    
    for result_file in ${temp_dir}/result_*.txt; do
        if [ -f "$result_file" ]; then
            IFS='|' read -r http_code time_total < "$result_file"
            if [[ "$http_code" =~ ^[2-3][0-9][0-9]$ ]]; then
                success_count=$((success_count + 1))
                total_response_time=$(echo "$total_response_time + $time_total" | bc -l)
            fi
        fi
    done
    
    # Calculate stats
    local success_rate=$(echo "scale=1; $success_count * 100 / $concurrent" | bc -l)
    local avg_response_time=$(echo "scale=3; $total_response_time / $success_count" | bc -l 2>/dev/null || echo "0")
    local requests_per_second=$(echo "scale=2; $concurrent / $total_duration" | bc -l)
    
    echo -e "${GREEN}📊 Load Test Results:${NC}" | tee -a $LOG_FILE
    echo "  Total Duration: ${total_duration}s" | tee -a $LOG_FILE
    echo "  Success Rate: ${success_rate}%" | tee -a $LOG_FILE
    echo "  Successful Requests: $success_count/$concurrent" | tee -a $LOG_FILE
    echo "  Average Response Time: ${avg_response_time}s" | tee -a $LOG_FILE
    echo "  Requests per Second: ${requests_per_second}" | tee -a $LOG_FILE
    
    # Cleanup
    rm -rf "$temp_dir"
    
    # Add to results
    cat << EOF >> $RESULTS_FILE
{
  "test_type": "load_test",
  "endpoint": "$endpoint",
  "url": "$url",
  "timestamp": "$(date -Iseconds)",
  "concurrent_requests": $concurrent,
  "total_duration": $total_duration,
  "success_count": $success_count,
  "success_rate": $success_rate,
  "avg_response_time": $avg_response_time,
  "requests_per_second": $requests_per_second,
  "status": "$([ $success_count -gt 0 ] && echo "PASS" || echo "FAIL")"
},
EOF
    
    echo "" | tee -a $LOG_FILE
}

# Main execution
main() {
    echo -e "${BLUE}🔥 War Room Performance Test Suite${NC}" | tee $LOG_FILE
    echo "Started at: $(date)" | tee -a $LOG_FILE
    echo "Base URL: $BASE_URL" | tee -a $LOG_FILE
    echo "Iterations per endpoint: $ITERATIONS" | tee -a $LOG_FILE
    echo "Results file: $RESULTS_FILE" | tee -a $LOG_FILE
    echo "Log file: $LOG_FILE" | tee -a $LOG_FILE
    echo "=========================" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
    
    # Initialize results file
    echo "[" > $RESULTS_FILE
    
    # Test individual endpoints
    for endpoint in "${ENDPOINTS[@]}"; do
        test_endpoint "$endpoint"
    done
    
    # Run load test on health endpoint
    echo -e "${YELLOW}Running concurrent load test...${NC}" | tee -a $LOG_FILE
    run_load_test "/health" 10
    
    # Close results JSON array (remove last comma and close)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' '$ s/,$//' $RESULTS_FILE
    else
        sed -i '$ s/,$//' $RESULTS_FILE
    fi
    echo "]" >> $RESULTS_FILE
    
    echo -e "${GREEN}🎉 Performance test complete!${NC}" | tee -a $LOG_FILE
    echo "Completed at: $(date)" | tee -a $LOG_FILE
    echo "" | tee -a $LOG_FILE
    echo -e "${BLUE}📋 Summary:${NC}" | tee -a $LOG_FILE
    echo "  - Results saved to: $RESULTS_FILE" | tee -a $LOG_FILE
    echo "  - Log saved to: $LOG_FILE" | tee -a $LOG_FILE
    echo "  - Tested ${#ENDPOINTS[@]} endpoints with $ITERATIONS iterations each" | tee -a $LOG_FILE
    echo "  - Performed load test with 10 concurrent requests" | tee -a $LOG_FILE
    
    # Basic analysis
    echo -e "${BLUE}🔍 Quick Analysis:${NC}" | tee -a $LOG_FILE
    
    # Check if any endpoint is slow (>3 seconds)
    slow_endpoints=$(grep -c "Max Time: [3-9]" $LOG_FILE 2>/dev/null || echo 0)
    if [ $slow_endpoints -gt 0 ]; then
        echo -e "  ${RED}⚠️  Warning: $slow_endpoints endpoint(s) had responses >3 seconds${NC}" | tee -a $LOG_FILE
    else
        echo -e "  ${GREEN}✅ All endpoints responded within acceptable time (<3s)${NC}" | tee -a $LOG_FILE
    fi
    
    # Check overall success rate
    total_tests=$((${#ENDPOINTS[@]} * $ITERATIONS + 10))  # endpoints + load test
    failed_tests=$(grep -c "FAILED\|All requests failed" $LOG_FILE 2>/dev/null || echo 0)
    if [ $failed_tests -gt 0 ]; then
        echo -e "  ${RED}❌ $failed_tests failed requests detected${NC}" | tee -a $LOG_FILE
    else
        echo -e "  ${GREEN}✅ All requests completed successfully${NC}" | tee -a $LOG_FILE
    fi
}

# Check dependencies
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: curl is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        echo -e "${RED}Error: bc is required but not installed${NC}"
        exit 1
    fi
}

# Help function
show_help() {
    echo "War Room Performance Test Suite"
    echo ""
    echo "Usage: $0 [iterations] [base_url]"
    echo ""
    echo "Arguments:"
    echo "  iterations  Number of test iterations per endpoint (default: 5)"
    echo "  base_url    Base URL to test (default: https://war-room-oa9t.onrender.com)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Test with defaults"
    echo "  $0 10                                # Test with 10 iterations"
    echo "  $0 3 http://localhost:5000           # Test local server"
    echo ""
    echo "Output:"
    echo "  - Performance results: performance-results-{timestamp}.json"
    echo "  - Detailed log: performance-test-{timestamp}.log"
}

# Handle arguments
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Run the tests
check_dependencies
main