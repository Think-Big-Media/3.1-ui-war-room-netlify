#!/bin/bash

# Monitor V2 Staging Service Build and Health
# Service ID: srv-d2epsjvdiees7384uf10
# URL: https://war-room-v2-staging.onrender.com

SERVICE_ID="srv-d2epsjvdiees7384uf10"
SERVICE_URL="https://one-0-war-room-ibqc.onrender.com"
LOG_FILE="/tmp/v2-staging-monitor.log"

echo "🚀 V2 Staging Monitor Started" | tee -a "$LOG_FILE"
echo "Service: $SERVICE_ID" | tee -a "$LOG_FILE"
echo "URL: $SERVICE_URL" | tee -a "$LOG_FILE"
echo "----------------------------------------" | tee -a "$LOG_FILE"

check_build_status() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check if service is responding
    response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL" --max-time 10)
    
    if [ "$response" = "200" ]; then
        echo "[$timestamp] ✅ V2 Staging is LIVE!" | tee -a "$LOG_FILE"
        
        # Check for slate theme (the key test!)
        html_content=$(curl -s "$SERVICE_URL" --max-time 10)
        
        if echo "$html_content" | grep -q "from-slate-600"; then
            echo "[$timestamp] 🎉 SUCCESS: Slate theme detected!" | tee -a "$LOG_FILE"
            echo "[$timestamp] ✅ Frontend build worked correctly!" | tee -a "$LOG_FILE"
            
            # Notify user of success
            /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh complete \
                "V2 Staging SUCCESS!" \
                "Slate theme live at: $SERVICE_URL"
                
            return 0
        elif echo "$html_content" | grep -q "from-purple-600"; then
            echo "[$timestamp] ⚠️  WARNING: Still showing purple theme" | tee -a "$LOG_FILE"
            return 1
        else
            echo "[$timestamp] ❓ Theme unknown - may still be building" | tee -a "$LOG_FILE"
            return 1
        fi
        
    elif [ "$response" = "502" ] || [ "$response" = "503" ]; then
        echo "[$timestamp] 🔄 Still building... (HTTP $response)" | tee -a "$LOG_FILE"
        return 1
    else
        echo "[$timestamp] ❌ Error: HTTP $response" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Monitor until success or timeout
echo "$(date '+%Y-%m-%d %H:%M:%S') Starting build monitoring..."
attempts=0
max_attempts=60  # 10 minutes max

while [ $attempts -lt $max_attempts ]; do
    if check_build_status; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') 🎉 V2 Staging deployment SUCCESS!"
        echo "URL: $SERVICE_URL"
        echo "✅ Slate theme confirmed"
        echo "✅ Frontend building correctly"
        echo "✅ Ready for testing!"
        exit 0
    fi
    
    ((attempts++))
    echo "Attempt $attempts/$max_attempts - waiting 10 seconds..."
    sleep 10
done

echo "$(date '+%Y-%m-%d %H:%M:%S') ⏰ Timeout waiting for V2 deployment"
echo "Check build logs at: https://dashboard.render.com/web/srv-d2epsjvdiees7384uf10/deploys"