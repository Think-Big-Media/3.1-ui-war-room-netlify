#!/bin/bash

# Backend Monitor Agent - Continuous API health checking
# This agent monitors backend API endpoints, database connectivity, and performance

SERVICE_URL="${1:-https://one-0-war-room.onrender.com}"
LOG_FILE="/tmp/backend-monitor-agent.log"
ALERT_LOG="/tmp/backend-alerts.log"

echo "🔍 Backend Monitor Agent Started" | tee -a "$LOG_FILE"
echo "Monitoring: $SERVICE_URL/api" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

check_endpoint() {
    local endpoint="$1"
    local expected_code="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL$endpoint" --max-time 10)
    
    if [ "$response" = "$expected_code" ]; then
        echo "[$timestamp] ✅ $endpoint - OK ($response)" | tee -a "$LOG_FILE"
        return 0
    else
        echo "[$timestamp] 🔴 $endpoint - FAILED (Expected: $expected_code, Got: $response)" | tee -a "$LOG_FILE" "$ALERT_LOG"
        return 1
    fi
}

check_backend() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local failures=0
    
    echo "[$timestamp] Starting backend health check..." | tee -a "$LOG_FILE"
    
    # Critical endpoints to monitor
    check_endpoint "/api/health" "200" || ((failures++))
    check_endpoint "/api/v1/dashboard/overview" "401" || ((failures++))  # Should require auth
    check_endpoint "/docs" "200" || ((failures++))  # FastAPI docs
    
    # Check response time for health endpoint
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/api/health" --max-time 10)
    if (( $(echo "$response_time > 2" | bc -l) )); then
        echo "[$timestamp] ⚠️  Performance WARNING - API response time: ${response_time}s (>2s)" | tee -a "$LOG_FILE" "$ALERT_LOG"
        ((failures++))
    fi
    
    # Check if backend is serving frontend correctly
    api_response=$(curl -s "$SERVICE_URL/api/health" --max-time 10)
    if echo "$api_response" | grep -q "healthy"; then
        echo "[$timestamp] ✅ API health check passed" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] ⚠️  API health check returned unexpected response" | tee -a "$LOG_FILE" "$ALERT_LOG"
        ((failures++))
    fi
    
    # Summary
    if [ $failures -eq 0 ]; then
        echo "[$timestamp] ✅ Backend fully operational" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] ⚠️  Backend has $failures issue(s)" | tee -a "$LOG_FILE" "$ALERT_LOG"
        echo "  ACTION: Check backend logs and database connectivity" | tee -a "$ALERT_LOG"
    fi
}

# Main monitoring loop
while true; do
    check_backend
    echo "----------------------------------------" | tee -a "$LOG_FILE"
    sleep 120  # Check every 2 minutes
done