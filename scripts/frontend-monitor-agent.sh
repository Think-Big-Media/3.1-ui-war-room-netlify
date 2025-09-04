#!/bin/bash

# Frontend Monitor Agent - Continuous frontend health checking
# This agent monitors frontend availability, theme correctness, and performance

SERVICE_URL="${1:-https://one-0-war-room.onrender.com}"
LOG_FILE="/tmp/frontend-monitor-agent.log"
ALERT_LOG="/tmp/frontend-alerts.log"

echo "🔍 Frontend Monitor Agent Started" | tee -a "$LOG_FILE"
echo "Monitoring: $SERVICE_URL" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

check_frontend() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check if frontend is responding
    response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL" --max-time 10)
    
    if [ "$response" = "200" ]; then
        # Check for correct theme (slate, not purple)
        html_content=$(curl -s "$SERVICE_URL" --max-time 10)
        
        # Check for slate theme indicators
        if echo "$html_content" | grep -q "from-slate-600"; then
            echo "[$timestamp] ✅ Frontend OK - Slate theme active" | tee -a "$LOG_FILE"
        elif echo "$html_content" | grep -q "from-purple-600"; then
            echo "[$timestamp] ⚠️  Frontend WARNING - Old purple theme detected!" | tee -a "$LOG_FILE" "$ALERT_LOG"
            echo "  ACTION: Frontend build may have failed" | tee -a "$ALERT_LOG"
        else
            echo "[$timestamp] ❓ Frontend UNKNOWN - Could not detect theme" | tee -a "$LOG_FILE"
        fi
        
        # Check for removed elements (headers and icons)
        if echo "$html_content" | grep -q "PageHeader"; then
            echo "[$timestamp] ⚠️  Frontend WARNING - Page headers still present!" | tee -a "$LOG_FILE" "$ALERT_LOG"
        fi
        
        if echo "$html_content" | grep -q "lucide-react"; then
            echo "[$timestamp] ℹ️  Frontend INFO - Icons detected (should be removed)" | tee -a "$LOG_FILE"
        fi
        
    elif [ "$response" = "502" ] || [ "$response" = "503" ]; then
        echo "[$timestamp] 🔴 Frontend DOWN - Service unavailable ($response)" | tee -a "$LOG_FILE" "$ALERT_LOG"
        echo "  ACTION: Check Render dashboard for deployment status" | tee -a "$ALERT_LOG"
    else
        echo "[$timestamp] ⚠️  Frontend ERROR - HTTP $response" | tee -a "$LOG_FILE" "$ALERT_LOG"
    fi
    
    # Check response time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL" --max-time 10)
    if (( $(echo "$response_time > 3" | bc -l) )); then
        echo "[$timestamp] ⚠️  Performance WARNING - Response time: ${response_time}s (>3s)" | tee -a "$LOG_FILE" "$ALERT_LOG"
    fi
}

# Main monitoring loop
while true; do
    check_frontend
    sleep 60  # Check every minute
done