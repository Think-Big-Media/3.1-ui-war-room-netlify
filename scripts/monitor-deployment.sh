#!/bin/bash

# Monitor War Room deployment
echo "🔍 Monitoring War Room Deployment Status..."
echo "Started at: $(date)"
echo ""

# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo "✅ OK (200)"
        return 0
    elif [ "$response" = "404" ]; then
        echo "⚠️  404 (Routes not registered)"
        return 1
    elif [ "$response" = "000" ]; then
        echo "❌ Not responding"
        return 1
    else
        echo "⚠️  HTTP $response"
        return 1
    fi
}

# Check every 30 seconds
while true; do
    echo "=== Checking at $(date +%H:%M:%S) ==="
    
    check_endpoint "https://war-room.onrender.com/health" "Health endpoint"
    health_ok=$?
    
    check_endpoint "https://war-room.onrender.com/" "Root endpoint"
    check_endpoint "https://war-room.onrender.com/docs" "API docs"
    
    if [ $health_ok -eq 0 ]; then
        echo ""
        echo "🎉 Deployment successful! Backend is operational."
        
        # Get full health status
        echo ""
        echo "Health Status:"
        curl -s https://war-room.onrender.com/health | jq '.'
        break
    else
        echo ""
        echo "⏳ Still deploying... checking again in 30 seconds"
        echo ""
        sleep 30
    fi
done

echo ""
echo "✅ Deployment monitoring complete!"