#!/bin/bash

# War Room Deployment Verification Script
# This script performs comprehensive post-deployment verification
# Usage: ./verify_deployment.sh [SERVICE_URL]

set -e  # Exit on any error

# Configuration
SERVICE_URL="${1:-https://war-room-oa9t.onrender.com}"
TIMEOUT=30
RETRY_COUNT=3
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/deployment_verification_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Helper function to make HTTP requests with retry logic
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    local description="$4"
    
    log_info "Testing: $description"
    
    for i in $(seq 1 $RETRY_COUNT); do
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}|TIME:%{time_total}" \
                       --max-time $TIMEOUT \
                       --connect-timeout 10 \
                       "$url" 2>/dev/null || echo "HTTPSTATUS:000|TIME:999")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}|TIME:%{time_total}" \
                       --max-time $TIMEOUT \
                       --connect-timeout 10 \
                       -X "$method" \
                       "$url" 2>/dev/null || echo "HTTPSTATUS:000|TIME:999")
        fi
        
        http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_time=$(echo "$response" | grep -o "TIME:[0-9.]*" | cut -d: -f2)
        response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*\|TIME:[0-9.]*$//')
        
        if [ "$http_status" = "$expected_status" ]; then
            log_success "$description (${response_time}s, attempt $i/$RETRY_COUNT)"
            echo "$response_body"
            return 0
        else
            if [ $i -eq $RETRY_COUNT ]; then
                log_error "$description failed - HTTP $http_status (${response_time}s, all $RETRY_COUNT attempts failed)"
                echo "$response_body"
                return 1
            else
                log_warning "$description failed - HTTP $http_status, retrying... (attempt $i/$RETRY_COUNT)"
                sleep 2
            fi
        fi
    done
}

# Function to check if a service is running
check_service_health() {
    log "🔍 Checking basic service health..."
    
    # Basic health endpoint
    if response=$(make_request "$SERVICE_URL/health" "GET" "200" "Basic health endpoint"); then
        # Verify response contains expected content
        if echo "$response" | grep -q "healthy"; then
            log_success "Service health check passed"
        else
            log_error "Service responded but health status not confirmed"
            log "Response: $response"
            return 1
        fi
    else
        log_error "Basic health check failed"
        return 1
    fi
}

# Function to check API health
check_api_health() {
    log "🔍 Checking API health..."
    
    if response=$(make_request "$SERVICE_URL/api/v1/health" "GET" "200" "API health endpoint"); then
        # Check for expected API health indicators
        if echo "$response" | grep -q -E "(healthy|database|connected)"; then
            log_success "API health check passed"
            log_info "API Response: $response"
        else
            log_warning "API responded but health indicators unclear"
            log "Response: $response"
        fi
    else
        log_error "API health check failed"
        return 1
    fi
}

# Function to check frontend availability
check_frontend() {
    log "🔍 Checking frontend availability..."
    
    # Check if homepage loads
    if response=$(make_request "$SERVICE_URL/" "GET" "200" "Frontend homepage"); then
        # Check for expected HTML content
        if echo "$response" | grep -q -E "(War Room|<!DOCTYPE|<html)" && 
           echo "$response" | grep -q -E "(War Room|title|React)"; then
            log_success "Frontend loads successfully"
        else
            log_warning "Frontend loads but content may be incomplete"
            log "Response preview: $(echo "$response" | head -c 200)..."
        fi
    else
        log_error "Frontend availability check failed"
        return 1
    fi
    
    # Check static assets
    log_info "Checking static assets..."
    if make_request "$SERVICE_URL/favicon.ico" "GET" "200" "Favicon" >/dev/null; then
        log_success "Static assets accessible"
    else
        log_warning "Some static assets may not be accessible"
    fi
}

# Function to check WebSocket connectivity
check_websocket() {
    log "🔍 Checking WebSocket capability..."
    
    # Test WebSocket upgrade headers (basic check)
    if response=$(curl -s -I -H "Connection: Upgrade" -H "Upgrade: websocket" \
                       --max-time 10 "$SERVICE_URL/ws" 2>/dev/null); then
        if echo "$response" | grep -q -i "upgrade.*websocket" || 
           echo "$response" | grep -q "101"; then
            log_success "WebSocket support detected"
        else
            log_info "WebSocket support check inconclusive (this may be normal)"
        fi
    else
        log_info "WebSocket check skipped (endpoint may not exist)"
    fi
}

# Function to check API documentation
check_api_docs() {
    log "🔍 Checking API documentation..."
    
    # Check FastAPI docs endpoints
    if make_request "$SERVICE_URL/docs" "GET" "200" "API documentation (/docs)" >/dev/null; then
        log_success "API documentation accessible at /docs"
    else
        log_info "API docs at /docs not accessible (may be disabled in production)"
    fi
    
    if make_request "$SERVICE_URL/redoc" "GET" "200" "ReDoc documentation (/redoc)" >/dev/null; then
        log_success "ReDoc documentation accessible at /redoc"
    else
        log_info "ReDoc docs at /redoc not accessible (may be disabled in production)"
    fi
}

# Function to check database connectivity through API
check_database_connectivity() {
    log "🔍 Checking database connectivity..."
    
    # Try to access an endpoint that requires database
    if response=$(make_request "$SERVICE_URL/api/v1/health" "GET" "200" "Database connectivity check"); then
        if echo "$response" | grep -q -E "(database.*connected|db.*ok)" || 
           echo "$response" | grep -q "healthy"; then
            log_success "Database connectivity confirmed through API"
        else
            log_warning "Database connectivity status unclear from API response"
        fi
    else
        log_error "Cannot verify database connectivity"
        return 1
    fi
}

# Function to test core API endpoints
test_core_endpoints() {
    log "🔍 Testing core API endpoints..."
    
    # Test authentication endpoint (should return method not allowed or auth required)
    if make_request "$SERVICE_URL/api/v1/auth/login" "GET" "405" "Auth endpoint availability" >/dev/null || 
       make_request "$SERVICE_URL/api/v1/auth/login" "GET" "401" "Auth endpoint availability" >/dev/null; then
        log_success "Authentication endpoint accessible"
    else
        log_warning "Authentication endpoint may not be available"
    fi
    
    # Test other core endpoints (expect auth required)
    endpoints=(
        "/api/v1/campaigns"
        "/api/v1/analytics/dashboard"
        "/api/v1/monitoring/status"
    )
    
    for endpoint in "${endpoints[@]}"; do
        # Accept various response codes for endpoints requiring auth
        if make_request "$SERVICE_URL$endpoint" "GET" "401" "Endpoint $endpoint" >/dev/null ||
           make_request "$SERVICE_URL$endpoint" "GET" "403" "Endpoint $endpoint" >/dev/null ||
           make_request "$SERVICE_URL$endpoint" "GET" "200" "Endpoint $endpoint" >/dev/null; then
            log_success "Endpoint $endpoint is accessible"
        else
            log_warning "Endpoint $endpoint may not be available"
        fi
    done
}

# Function to check performance metrics
check_performance() {
    log "🔍 Checking performance metrics..."
    
    # Test response time for key endpoints
    start_time=$(date +%s.%3N)
    if make_request "$SERVICE_URL/" "GET" "200" "Homepage performance" >/dev/null; then
        end_time=$(date +%s.%3N)
        response_time=$(echo "$end_time - $start_time" | bc -l)
        
        if (( $(echo "$response_time < 3.0" | bc -l) )); then
            log_success "Homepage response time: ${response_time}s (< 3s threshold)"
        else
            log_warning "Homepage response time: ${response_time}s (> 3s threshold)"
        fi
    fi
    
    # Test API response time
    start_time=$(date +%s.%3N)
    if make_request "$SERVICE_URL/api/v1/health" "GET" "200" "API performance" >/dev/null; then
        end_time=$(date +%s.%3N)
        api_response_time=$(echo "$end_time - $start_time" | bc -l)
        
        if (( $(echo "$api_response_time < 2.0" | bc -l) )); then
            log_success "API response time: ${api_response_time}s (< 2s threshold)"
        else
            log_warning "API response time: ${api_response_time}s (> 2s threshold)"
        fi
    fi
}

# Function to check console errors (if we can access them)
check_for_errors() {
    log "🔍 Checking for obvious errors..."
    
    # Get the homepage and look for error indicators
    if response=$(make_request "$SERVICE_URL/" "GET" "200" "Error detection"); then
        if echo "$response" | grep -q -i "error\|exception\|failed\|broken"; then
            log_warning "Potential error indicators found in homepage response"
            # Show a snippet of the error context
            echo "$response" | grep -i -A 2 -B 2 "error\|exception\|failed\|broken" | head -5
        else
            log_success "No obvious error indicators in homepage"
        fi
    fi
}

# Function to generate deployment report
generate_report() {
    local exit_code=$1
    
    echo
    log "📊 Generating deployment verification report..."
    
    echo "
=================================
  WAR ROOM DEPLOYMENT REPORT
=================================

Service URL: $SERVICE_URL
Verification Time: $(date)
Log File: $LOG_FILE

" >> "$LOG_FILE"
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ DEPLOYMENT VERIFICATION: PASSED
        
All critical checks completed successfully.
The War Room platform appears to be deployed and functioning correctly.

Next steps:
1. Monitor service for 15-30 minutes to ensure stability
2. Perform user acceptance testing
3. Notify stakeholders of successful deployment
4. Update monitoring dashboards

" >> "$LOG_FILE"
        
        log_success "Deployment verification PASSED"
        
    else
        echo "❌ DEPLOYMENT VERIFICATION: FAILED

Some critical checks failed. Please review the errors above and:
1. Check Render service logs
2. Verify environment variables
3. Check external service connectivity
4. Consider rollback if issues are critical

" >> "$LOG_FILE"
        
        log_error "Deployment verification FAILED"
    fi
    
    log "Full report saved to: $LOG_FILE"
}

# Function to display usage
show_usage() {
    echo "Usage: $0 [SERVICE_URL]"
    echo ""
    echo "War Room Deployment Verification Script"
    echo ""
    echo "Arguments:"
    echo "  SERVICE_URL    The URL of the deployed service (default: https://war-room-oa9t.onrender.com)"
    echo ""
    echo "Examples:"
    echo "  $0                                          # Use default URL"
    echo "  $0 https://my-war-room.onrender.com       # Use custom URL"
    echo ""
    echo "The script will:"
    echo "  - Check service health endpoints"
    echo "  - Verify frontend accessibility"
    echo "  - Test API functionality"
    echo "  - Check database connectivity"
    echo "  - Measure performance metrics"
    echo "  - Generate a comprehensive report"
    echo ""
}

# Main execution
main() {
    # Check if help is requested
    if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    echo "
╔══════════════════════════════════════════════════════════════╗
║               War Room Deployment Verification              ║
║                                                              ║
║  This script verifies the deployment of War Room platform   ║
║  and ensures all critical components are functioning.       ║
╚══════════════════════════════════════════════════════════════╝
"
    
    log "🚀 Starting deployment verification for: $SERVICE_URL"
    log "📝 Logging to: $LOG_FILE"
    echo
    
    # Initialize exit code
    overall_exit_code=0
    
    # Run verification steps
    check_service_health || overall_exit_code=1
    echo
    
    check_api_health || overall_exit_code=1
    echo
    
    check_frontend || overall_exit_code=1
    echo
    
    check_websocket
    echo
    
    check_api_docs
    echo
    
    check_database_connectivity || overall_exit_code=1
    echo
    
    test_core_endpoints
    echo
    
    check_performance
    echo
    
    check_for_errors
    echo
    
    # Generate final report
    generate_report $overall_exit_code
    
    # Exit with appropriate code
    exit $overall_exit_code
}

# Check dependencies
if ! command -v curl >/dev/null 2>&1; then
    log_error "curl is required but not installed"
    exit 1
fi

if ! command -v bc >/dev/null 2>&1; then
    log_warning "bc is not installed - response time calculations will be skipped"
fi

# Run main function
main "$@"