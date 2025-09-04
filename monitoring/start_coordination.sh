#!/bin/bash
"""
War Room Coordination System Startup Script
Launches all coordination components in the correct order

Components:
1. Coordination System (WebSocket hub)
2. Sub-Agent Hook Monitor  
3. SLA Dashboard
4. Agent Integration Validation
"""

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="/Users/rodericandrews/WarRoom_Development/1.0-war-room/monitoring"
LOG_DIR="$MONITORING_DIR/logs"
COORDINATION_PORT=8765
DASHBOARD_PORT=8766

# PID tracking
PIDS_FILE="$MONITORING_DIR/coordination_pids.txt"

echo -e "${BLUE}🚀 Starting War Room Coordination System${NC}"
echo "======================================"

# Create logs directory
mkdir -p "$LOG_DIR"

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready on port $port...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if check_port $port; then
            sleep 1
            ((attempt++))
        else
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
    done
    
    echo -e "${RED}❌ $service_name failed to start within 30 seconds${NC}"
    return 1
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down coordination system...${NC}"
    
    if [ -f "$PIDS_FILE" ]; then
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                echo "Stopping process $pid"
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PIDS_FILE"
        rm -f "$PIDS_FILE"
    fi
    
    # Kill any remaining processes
    pkill -f "coordination_system.py" 2>/dev/null || true
    pkill -f "sub_agent_hooks.py" 2>/dev/null || true  
    pkill -f "sla_dashboard.py" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Coordination system stopped${NC}"
}

# Set trap for cleanup on script exit
trap cleanup EXIT INT TERM

# Clear any existing PIDs
> "$PIDS_FILE"

# Step 1: Check prerequisites
echo -e "\n${BLUE}📋 Checking prerequisites...${NC}"

# Check Python dependencies
if ! python3 -c "import websockets, aiohttp, aiofiles, plotly" 2>/dev/null; then
    echo -e "${RED}❌ Missing Python dependencies${NC}"
    echo "Install with: pip install websockets aiohttp aiofiles plotly pandas sqlite3"
    exit 1
fi

echo -e "${GREEN}✅ Python dependencies OK${NC}"

# Check if coordination ports are available
if ! check_port $COORDINATION_PORT; then
    echo -e "${RED}❌ Coordination port $COORDINATION_PORT is in use${NC}"
    exit 1
fi

if ! check_port $DASHBOARD_PORT; then
    echo -e "${RED}❌ Dashboard port $DASHBOARD_PORT is in use${NC}"  
    exit 1
fi

echo -e "${GREEN}✅ Ports available${NC}"

# Step 2: Integrate agents (if not already done)
echo -e "\n${BLUE}🔗 Checking agent integration...${NC}"

cd "$MONITORING_DIR"

if python3 integrate_agents.py validate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Agents already integrated${NC}"
else
    echo -e "${YELLOW}⚙️ Integrating agents...${NC}"
    
    if python3 integrate_agents.py integrate; then
        echo -e "${GREEN}✅ Agent integration completed${NC}"
    else
        echo -e "${RED}❌ Agent integration failed${NC}"
        exit 1
    fi
fi

# Step 3: Start Coordination System
echo -e "\n${BLUE}🎛️ Starting Coordination System...${NC}"

python3 coordination_system.py > "$LOG_DIR/coordination_system.log" 2>&1 &
COORD_PID=$!
echo $COORD_PID >> "$PIDS_FILE"

if ! wait_for_service $COORDINATION_PORT "Coordination System"; then
    echo -e "${RED}❌ Failed to start Coordination System${NC}"
    exit 1
fi

# Step 4: Start Sub-Agent Hook Monitor  
echo -e "\n${BLUE}🔗 Starting Sub-Agent Hook Monitor...${NC}"

python3 sub_agent_hooks.py > "$LOG_DIR/hook_monitor.log" 2>&1 &
HOOK_PID=$!
echo $HOOK_PID >> "$PIDS_FILE"

sleep 3  # Give hook monitor time to connect
echo -e "${GREEN}✅ Hook Monitor started${NC}"

# Step 5: Start SLA Dashboard
echo -e "\n${BLUE}📊 Starting SLA Dashboard...${NC}"

python3 sla_dashboard.py > "$LOG_DIR/sla_dashboard.log" 2>&1 &
DASHBOARD_PID=$!
echo $DASHBOARD_PID >> "$PIDS_FILE"

if ! wait_for_service $DASHBOARD_PORT "SLA Dashboard"; then
    echo -e "${RED}❌ Failed to start SLA Dashboard${NC}"
    exit 1
fi

# Step 6: Validate system health
echo -e "\n${BLUE}🏥 Validating system health...${NC}"

# Test coordination WebSocket
if timeout 5 bash -c "exec 3<>/dev/tcp/localhost/$COORDINATION_PORT" 2>/dev/null; then
    echo -e "${GREEN}✅ Coordination WebSocket responding${NC}"
else
    echo -e "${RED}❌ Coordination WebSocket not responding${NC}"
fi

# Test dashboard HTTP
if curl -s "http://localhost:$DASHBOARD_PORT/api/stats" >/dev/null; then
    echo -e "${GREEN}✅ SLA Dashboard API responding${NC}"
else
    echo -e "${RED}❌ SLA Dashboard API not responding${NC}"
fi

# Display system status
echo -e "\n${GREEN}🎉 War Room Coordination System Started Successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}Services Running:${NC}"
echo "• Coordination System: ws://localhost:$COORDINATION_PORT (PID: $COORD_PID)"  
echo "• Hook Monitor: Running (PID: $HOOK_PID)"
echo "• SLA Dashboard: http://localhost:$DASHBOARD_PORT (PID: $DASHBOARD_PID)"
echo ""
echo -e "${BLUE}Integrated Agents:${NC}"
echo "• Health Check Monitor"
echo "• AMP Refactoring Specialist"  
echo "• CodeRabbit Integration"
echo "• Pieces Knowledge Manager"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo "• Hourly status reports: ✅ Active"
echo "• SLA monitoring (3s target): ✅ Active"  
echo "• Git conflict resolution: ✅ Active"
echo "• WebSocket coordination: ✅ Active"
echo ""
echo -e "${BLUE}Log Files:${NC}"
echo "• Coordination: $LOG_DIR/coordination_system.log"
echo "• Hook Monitor: $LOG_DIR/hook_monitor.log"  
echo "• SLA Dashboard: $LOG_DIR/sla_dashboard.log"
echo ""
echo -e "${YELLOW}⏹️ Press Ctrl+C to stop all services${NC}"

# Keep script running and monitor services
while true; do
    # Check if all services are still running
    services_running=0
    
    if kill -0 "$COORD_PID" 2>/dev/null; then
        ((services_running++))
    else
        echo -e "${RED}❌ Coordination System stopped unexpectedly${NC}"
        break
    fi
    
    if kill -0 "$HOOK_PID" 2>/dev/null; then
        ((services_running++))
    else
        echo -e "${RED}❌ Hook Monitor stopped unexpectedly${NC}"
        break
    fi
    
    if kill -0 "$DASHBOARD_PID" 2>/dev/null; then
        ((services_running++))
    else
        echo -e "${RED}❌ SLA Dashboard stopped unexpectedly${NC}" 
        break
    fi
    
    if [ $services_running -eq 3 ]; then
        # All services running, sleep for 10 seconds
        sleep 10
    else
        break
    fi
done

echo -e "${RED}❌ One or more services failed, shutting down...${NC}"
exit 1