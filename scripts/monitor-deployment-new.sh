#!/bin/bash

# Monitor Render deployment status
echo "🔍 Monitoring War Room deployment on Render..."
echo "URL: https://war-room-app-2025.onrender.com"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
attempts=0
max_attempts=60  # 10 minutes (10 seconds x 60)

while [ $attempts -lt $max_attempts ]; do
    attempts=$((attempts + 1))
    echo -ne "\r⏳ Checking deployment (attempt $attempts/$max_attempts)... "
    
    # Check health endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" https://war-room-app-2025.onrender.com/health)
    
    if [ "$response" = "200" ]; then
        echo -e "\n${GREEN}✅ Service is UP!${NC}"
        
        # Get detailed health info
        health=$(curl -s https://war-room-app-2025.onrender.com/health)
        echo -e "\n${GREEN}Health Check Response:${NC}"
        echo "$health" | python3 -m json.tool 2>/dev/null || echo "$health"
        
        # Check for OAuth
        echo -e "\n${YELLOW}Checking OAuth integration...${NC}"
        settings_response=$(curl -s -o /dev/null -w "%{http_code}" https://war-room-app-2025.onrender.com/settings)
        
        if [ "$settings_response" = "200" ]; then
            echo -e "${GREEN}✅ Settings page accessible${NC}"
            echo -e "\n${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
            echo "Visit: https://war-room-app-2025.onrender.com/settings"
            echo "Scroll to bottom to see OAuth integrations"
        else
            echo -e "${YELLOW}⚠️ Settings page returned: $settings_response${NC}"
        fi
        
        exit 0
    elif [ "$response" = "502" ]; then
        echo -ne "${YELLOW}Building...${NC}"
    else
        echo -ne "${RED}Status: $response${NC}"
    fi
    
    sleep 10
done

echo -e "\n${RED}❌ Deployment monitoring timed out after 10 minutes${NC}"
echo "Check Render dashboard for build logs"
exit 1