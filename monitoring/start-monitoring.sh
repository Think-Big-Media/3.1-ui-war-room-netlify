#!/bin/bash

# War Room Monitoring System Startup Script
# This script starts all monitoring components for the client demo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$MONITORING_DIR/logs"
REPORTS_DIR="$MONITORING_DIR/reports"
PID_DIR="$MONITORING_DIR/pids"
HEALTH_REPORT="$REPORTS_DIR/health-check-results.json"

# Create necessary directories
mkdir -p "$LOG_DIR" "$REPORTS_DIR" "$PID_DIR"

echo -e "${BLUE}=== War Room Monitoring System Startup ===${NC}"
echo -e "Starting comprehensive monitoring for: ${GREEN}https://war-room-oa9t.onrender.com${NC}"
echo -e "Monitoring directory: ${BLUE}$MONITORING_DIR${NC}"
echo ""

# Function to check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18 or higher.${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${RED}Error: Node.js version $NODE_VERSION found. Minimum required: 18.0.0${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js $NODE_VERSION detected${NC}"
}

# Function to install npm dependencies
install_dependencies() {
    echo -e "${YELLOW}Installing monitoring dependencies...${NC}"
    
    if [ ! -f "$MONITORING_DIR/package.json" ]; then
        echo -e "${RED}Error: package.json not found in monitoring directory${NC}"
        exit 1
    fi
    
    cd "$MONITORING_DIR"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}Running npm install...${NC}"
        npm install --only=production
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to install dependencies${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${GREEN}✓ Dependencies already installed${NC}"
    fi
}

# Function to start a monitoring process
start_process() {
    local name=$1
    local script=$2
    local description=$3
    
    echo -e "${YELLOW}Starting $name...${NC}"
    
    # Check if process is already running
    local pid_file="$PID_DIR/$name.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}$name is already running (PID: $pid)${NC}"
            return 0
        else
            rm -f "$pid_file"
        fi
    fi
    
    # Start the process
    nohup node "$MONITORING_DIR/$script" > "$LOG_DIR/$name.log" 2>&1 &
    local pid=$!
    
    # Save PID
    echo $pid > "$pid_file"
    
    # Wait a moment to check if process started successfully
    sleep 2
    
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $name started successfully (PID: $pid)${NC}"
        echo -e "  Description: $description"
        echo -e "  Log file: $LOG_DIR/$name.log"
    else
        echo -e "${RED}✗ Failed to start $name${NC}"
        rm -f "$pid_file"
        return 1
    fi
}

# Function to check site accessibility
check_site() {
    echo -e "${YELLOW}Checking site accessibility...${NC}"
    
    local site_url="https://war-room-oa9t.onrender.com"
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$site_url" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        echo -e "${GREEN}✓ Site is accessible (HTTP $response_code)${NC}"
    else
        echo -e "${YELLOW}⚠ Site returned HTTP $response_code (will monitor anyway)${NC}"
    fi
}

# Function to create initial health report
create_initial_report() {
    echo -e "${YELLOW}Creating initial health report...${NC}"
    
    local initial_report="$REPORTS_DIR/health-report.json"
    cat > "$initial_report" << 'EOF'
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "site": {
    "available": null,
    "responseTime": 0
  },
  "database": {
    "connected": null
  },
  "pinecone": {
    "available": null
  },
  "system": {
    "memory": {
      "percentage": 0
    },
    "cpu": {
      "loadAvg": [0]
    }
  },
  "summary": {
    "overall": "initializing",
    "totalChecks": 0,
    "successRate": "0%",
    "uptime": 0
  }
}
EOF
    
    # Replace the timestamp with actual current timestamp
    local current_timestamp=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
    sed -i '' "s/\$(date -u +%Y-%m-%dT%H:%M:%S\.%3NZ)/$current_timestamp/g" "$initial_report" 2>/dev/null || \
    sed -i "s/\$(date -u +%Y-%m-%dT%H:%M:%S\.%3NZ)/$current_timestamp/g" "$initial_report"
    
    echo -e "${GREEN}✓ Initial health report created${NC}"
}

# Function to show monitoring status
show_status() {
    echo ""
    echo -e "${BLUE}=== Monitoring System Status ===${NC}"
    
    local processes=("health-monitor" "alert-system")
    local all_running=true
    
    for process in "${processes[@]}"; do
        local pid_file="$PID_DIR/$process.pid"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ $process running (PID: $pid)${NC}"
            else
                echo -e "${RED}✗ $process stopped${NC}"
                all_running=false
            fi
        else
            echo -e "${RED}✗ $process not started${NC}"
            all_running=false
        fi
    done
    
    echo ""
    if $all_running; then
        echo -e "${GREEN}All monitoring services are running successfully!${NC}"
    else
        echo -e "${YELLOW}Some monitoring services are not running${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Monitoring URLs:${NC}"
    echo -e "Site being monitored: ${GREEN}https://war-room-oa9t.onrender.com${NC}"
    echo ""
    echo -e "${BLUE}Log files:${NC}"
    echo -e "Health Monitor: ${BLUE}$LOG_DIR/health-monitor.log${NC}"
    echo -e "Alert System: ${BLUE}$LOG_DIR/alert-system.log${NC}"
    echo ""
    echo -e "${BLUE}Reports:${NC}"
    echo -e "Health Report: ${BLUE}$REPORTS_DIR/health-report.json${NC}"
    echo -e "Alerts Log: ${BLUE}$LOG_DIR/alerts.log${NC}"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "View live dashboard: ${BLUE}cd $MONITORING_DIR && npm run dashboard${NC}"
    echo -e "Stop monitoring: ${BLUE}$MONITORING_DIR/stop-monitoring.sh${NC}"
    echo -e "View logs: ${BLUE}tail -f $LOG_DIR/*.log${NC}"
}

# Main execution
main() {
    # Pre-flight checks
    check_node
    check_site
    
    # Setup
    install_dependencies
    create_initial_report
    
    echo ""
    echo -e "${BLUE}Starting monitoring processes...${NC}"
    echo ""
    
    # Start monitoring processes
    start_process "health-monitor" "war-room-monitor.js" "Main health checking and performance monitoring"
    sleep 3  # Give health monitor time to start
    
    start_process "alert-system" "alert-system.js" "Automated alerting system for critical issues"
    
    # Show final status
    show_status
    
    echo ""
    echo -e "${GREEN}=== Monitoring System Started Successfully! ===${NC}"
    echo -e "${YELLOW}For live dashboard run: ${BLUE}cd $MONITORING_DIR && npm run dashboard${NC}"
    echo -e "${YELLOW}To stop monitoring run: ${BLUE}$MONITORING_DIR/stop-monitoring.sh${NC}"
    echo ""
    echo -e "${BLUE}Monitoring will continue in the background...${NC}"
}

# Error handling
trap 'echo -e "${RED}Error occurred during startup${NC}"; exit 1' ERR

# Run main function
main "$@"