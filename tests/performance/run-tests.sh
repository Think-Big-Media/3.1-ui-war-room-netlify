#!/bin/bash

# War Room k6 Performance Test Runner
# Runs comprehensive performance tests and generates reports
# Usage: ./run-tests.sh [test-type] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_SCRIPTS_DIR="$SCRIPT_DIR/k6-scripts"
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Test configuration
TEST_TYPE=${1:-"all"}
ENVIRONMENT=${2:-"production"}
OUTPUT_FORMAT="json"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Install it with: brew install k6"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is not installed. Install it with: brew install jq (for better JSON parsing)"
    fi
    
    print_success "Dependencies check passed"
}

# Function to run a single k6 test
run_k6_test() {
    local test_name=$1
    local test_file=$2
    local output_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.json"
    
    print_status "Running $test_name test..."
    
    # Run k6 test with environment variables
    k6 run \
        --env TEST_ENV="$ENVIRONMENT" \
        --env TEST_TYPE="$test_name" \
        --out "json=$output_file" \
        --quiet \
        "$test_file" 2>&1 | tee "$RESULTS_DIR/${test_name}_${TIMESTAMP}.log"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "$test_name test completed successfully"
        echo "$output_file" >> "$RESULTS_DIR/test_files_${TIMESTAMP}.txt"
    else
        print_error "$test_name test failed (exit code: $exit_code)"
    fi
    
    return $exit_code
}

# Function to run health endpoint test
run_health_test() {
    print_status "🏥 Starting Health Endpoint Performance Test"
    run_k6_test "health" "$K6_SCRIPTS_DIR/health-endpoint.js"
}

# Function to run analytics endpoints test
run_analytics_test() {
    print_status "📊 Starting Analytics Endpoints Performance Test"
    run_k6_test "analytics" "$K6_SCRIPTS_DIR/analytics-endpoints.js"
}

# Function to run campaigns endpoints test
run_campaigns_test() {
    print_status "🎯 Starting Campaigns Endpoints Performance Test"
    run_k6_test "campaigns" "$K6_SCRIPTS_DIR/campaigns-endpoints.js"
}

# Function to run frontend load time test
run_frontend_test() {
    print_status "🌐 Starting Frontend Load Time Performance Test"
    run_k6_test "frontend" "$K6_SCRIPTS_DIR/frontend-load-time.js"
}

# Function to generate summary report
generate_summary_report() {
    local summary_file="$RESULTS_DIR/performance_summary_${TIMESTAMP}.md"
    
    print_status "Generating performance summary report..."
    
    cat > "$summary_file" << EOF
# War Room Performance Test Summary

**Test Date:** $(date)
**Environment:** $ENVIRONMENT
**Test Duration:** Multiple scenarios (see individual test logs)

## Test Results Overview

EOF

    # Add individual test results if available
    if [ -f "$RESULTS_DIR/test_files_${TIMESTAMP}.txt" ]; then
        while read -r result_file; do
            if [ -f "$result_file" ]; then
                local test_name=$(basename "$result_file" | cut -d'_' -f1)
                echo "### $test_name Test" >> "$summary_file"
                echo "" >> "$summary_file"
                
                # Extract basic metrics from JSON (if jq is available)
                if command -v jq &> /dev/null; then
                    echo "- **Total Requests:** $(jq '[.type | select(. == "Point")] | length' "$result_file" 2>/dev/null || echo "N/A")" >> "$summary_file"
                    echo "- **Test Duration:** See individual logs for details" >> "$summary_file"
                    echo "- **Result File:** $(basename "$result_file")" >> "$summary_file"
                else
                    echo "- **Result File:** $(basename "$result_file")" >> "$summary_file"
                fi
                echo "" >> "$summary_file"
            fi
        done < "$RESULTS_DIR/test_files_${TIMESTAMP}.txt"
    fi

    cat >> "$summary_file" << EOF

## Performance Targets

- **Health Endpoint:** < 100ms (95th percentile)
- **Analytics Endpoints:** < 1s (95th percentile)  
- **Campaigns Endpoints:** < 500ms (95th percentile)
- **Frontend Load Time:** < 3s (95th percentile)

## Files Generated

- Summary Report: $(basename "$summary_file")
- Individual test logs: *_${TIMESTAMP}.log
- Raw JSON results: *_${TIMESTAMP}.json

## Next Steps

1. Review individual test logs for detailed metrics
2. Compare results against performance targets
3. Identify any endpoints exceeding thresholds
4. Set up monitoring alerts for performance regression

EOF

    print_success "Performance summary generated: $(basename "$summary_file")"
    echo "📄 Summary report: $summary_file"
}

# Function to show usage
show_usage() {
    echo "War Room k6 Performance Test Runner"
    echo ""
    echo "Usage: $0 [test-type] [environment]"
    echo ""
    echo "Test Types:"
    echo "  all          Run all performance tests (default)"
    echo "  health       Run health endpoint test only"
    echo "  analytics    Run analytics endpoints test only"
    echo "  campaigns    Run campaigns endpoints test only"
    echo "  frontend     Run frontend load time test only"
    echo ""
    echo "Environments:"
    echo "  production   Test production environment (default)"
    echo "  local        Test local development server"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests on production"
    echo "  $0 health             # Run health test only on production"
    echo "  $0 all local          # Run all tests on local server"
    echo "  $0 analytics production # Run analytics test on production"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 War Room k6 Performance Test Suite${NC}"
    echo "================================================"
    echo "Test Type: $TEST_TYPE"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $TIMESTAMP"
    echo "Results Directory: $RESULTS_DIR"
    echo ""

    # Check if help is requested
    if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi

    # Check dependencies
    check_dependencies

    # Run tests based on type
    case $TEST_TYPE in
        "health")
            run_health_test
            ;;
        "analytics") 
            run_analytics_test
            ;;
        "campaigns")
            run_campaigns_test
            ;;
        "frontend")
            run_frontend_test
            ;;
        "all")
            print_status "Running comprehensive performance test suite..."
            
            # Run all tests
            run_health_test
            sleep 2
            run_analytics_test  
            sleep 2
            run_campaigns_test
            sleep 2
            run_frontend_test
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            show_usage
            exit 1
            ;;
    esac

    # Generate summary report
    generate_summary_report

    echo ""
    print_success "Performance testing completed!"
    echo "📊 Results available in: $RESULTS_DIR"
    echo "📄 Summary report: $RESULTS_DIR/performance_summary_${TIMESTAMP}.md"
}

# Run main function
main "$@"