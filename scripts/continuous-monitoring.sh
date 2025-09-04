#!/bin/bash

# Continuous monitoring script for War Room site
# Runs Playwright tests every 5 minutes with screenshots and performance validation

# Configuration
SITE_URL="https://war-room-oa9t.onrender.com"
MONITORING_INTERVAL=300  # 5 minutes in seconds
SCREENSHOT_DIR="monitoring-screenshots"
LOG_FILE="monitoring.log"
ALERT_THRESHOLD=3000  # 3 seconds in milliseconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories if they don't exist
mkdir -p "$SCREENSHOT_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local alert_type=$1
    local message=$2
    local details=$3
    
    # Use the notification script if available
    if [ -f "/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh" ]; then
        /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh error "$message" "$details"
    else
        echo -e "${RED}ALERT: $message${NC}"
        echo "$details"
    fi
}

# Function to run Playwright monitoring
run_monitoring() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    
    log "Starting monitoring check..."
    
    # Run the enhanced monitoring test
    npx playwright test tests/monitoring/enhanced-monitoring.spec.js \
        --project=monitoring \
        --reporter=json \
        --output="$SCREENSHOT_DIR/report-$timestamp.json" \
        2>&1 | tee -a "$LOG_FILE"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Monitoring check passed${NC}"
        log "Monitoring check completed successfully"
    else
        echo -e "${RED}✗ Monitoring check failed${NC}"
        log "ERROR: Monitoring check failed with exit code $exit_code"
        send_alert "monitoring_failure" "Site monitoring failed" "Check $LOG_FILE for details"
    fi
    
    # Check for screenshots
    local screenshot_count=$(find "$SCREENSHOT_DIR" -name "*-$timestamp.png" 2>/dev/null | wc -l)
    if [ $screenshot_count -gt 0 ]; then
        log "Captured $screenshot_count screenshot(s)"
    fi
}

# Function to check site availability
check_site_availability() {
    local start_time=$(date +%s%3N)
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response" -eq 200 ]; then
        echo -e "${GREEN}✓ Site is up (${response_time}ms)${NC}"
        log "Site is up - Response: $response, Time: ${response_time}ms"
        
        if [ $response_time -gt $ALERT_THRESHOLD ]; then
            echo -e "${YELLOW}⚠ Response time exceeds threshold${NC}"
            send_alert "performance" "Slow response time" "${response_time}ms > ${ALERT_THRESHOLD}ms threshold"
        fi
    else
        echo -e "${RED}✗ Site is down (HTTP $response)${NC}"
        log "ERROR: Site is down - HTTP $response"
        send_alert "site_down" "Site is not responding" "HTTP status: $response"
    fi
}

# Function to clean old screenshots
cleanup_old_screenshots() {
    # Remove screenshots older than 7 days
    find "$SCREENSHOT_DIR" -name "*.png" -mtime +7 -delete 2>/dev/null
    find "$SCREENSHOT_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null
    log "Cleaned up old screenshots"
}

# Main monitoring loop
main() {
    echo -e "${BLUE}War Room Continuous Monitoring${NC}"
    echo "Site: $SITE_URL"
    echo "Interval: Every $((MONITORING_INTERVAL / 60)) minutes"
    echo "Screenshot directory: $SCREENSHOT_DIR"
    echo "Performance threshold: ${ALERT_THRESHOLD}ms"
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    echo ""
    
    # Trap for graceful shutdown
    trap 'echo -e "\n${YELLOW}Stopping monitoring...${NC}"; exit 0' INT TERM
    
    # Initial check
    check_site_availability
    run_monitoring
    
    # Main loop
    while true; do
        echo ""
        echo "Next check in $((MONITORING_INTERVAL / 60)) minutes..."
        sleep $MONITORING_INTERVAL
        
        # Run checks
        check_site_availability
        run_monitoring
        
        # Cleanup old files periodically (every 24 checks = ~2 hours)
        if [ $(($(date +%s) % (24 * MONITORING_INTERVAL))) -lt $MONITORING_INTERVAL ]; then
            cleanup_old_screenshots
        fi
    done
}

# Run the main function
main