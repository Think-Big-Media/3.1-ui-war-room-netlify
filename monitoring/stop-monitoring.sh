#!/bin/bash

# War Room Monitoring System Stop Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$MONITORING_DIR/pids"

echo -e "${BLUE}=== War Room Monitoring System Shutdown ===${NC}"
echo ""

# Function to stop a process
stop_process() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"
    
    if [ ! -f "$pid_file" ]; then
        echo -e "${YELLOW}$name: No PID file found${NC}"
        return 0
    fi
    
    local pid=$(cat "$pid_file")
    
    if ! ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${YELLOW}$name: Process not running${NC}"
        rm -f "$pid_file"
        return 0
    fi
    
    echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
    
    # Try graceful shutdown first
    kill -TERM "$pid" 2>/dev/null || true
    
    # Wait up to 10 seconds for graceful shutdown
    local count=0
    while [ $count -lt 10 ] && ps -p "$pid" > /dev/null 2>&1; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${YELLOW}Force killing $name...${NC}"
        kill -KILL "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # Verify process is stopped
    if ps -p "$pid" > /dev/null 2>&1; then
        echo -e "${RED}✗ Failed to stop $name${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $name stopped successfully${NC}"
        rm -f "$pid_file"
        return 0
    fi
}

# Stop all monitoring processes
main() {
    local processes=("health-monitor" "alert-system")
    local stopped_count=0
    
    for process in "${processes[@]}"; do
        if stop_process "$process"; then
            stopped_count=$((stopped_count + 1))
        fi
    done
    
    echo ""
    
    if [ $stopped_count -eq ${#processes[@]} ]; then
        echo -e "${GREEN}All monitoring processes stopped successfully!${NC}"
    else
        echo -e "${YELLOW}Some processes may still be running${NC}"
    fi
    
    # Clean up any remaining PID files
    if [ -d "$PID_DIR" ]; then
        rm -f "$PID_DIR"/*.pid
    fi
    
    echo ""
    echo -e "${BLUE}=== Monitoring System Shutdown Complete ===${NC}"
}

# Run main function
main "$@"