#!/bin/bash

# War Room Enhanced Health Monitor Sub-Agent Stop Script
# 
# This script gracefully stops all enhanced health monitoring services

set -e

echo "🛑 Stopping War Room Enhanced Health Monitoring System..."

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"

# Function to stop a service
stop_service() {
    local service_name="$1"
    local pid_file="$LOG_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo "🔄 Stopping $service_name (PID: $pid)..."
        
        if kill -0 "$pid" 2>/dev/null; then
            # Send SIGTERM first
            kill "$pid" 2>/dev/null || true
            
            # Wait up to 10 seconds for graceful shutdown
            for i in {1..10}; do
                if ! kill -0 "$pid" 2>/dev/null; then
                    echo "✅ $service_name stopped gracefully"
                    rm -f "$pid_file"
                    return 0
                fi
                sleep 1
            done
            
            # Force kill if still running
            echo "⚠️  Force stopping $service_name..."
            kill -9 "$pid" 2>/dev/null || true
            rm -f "$pid_file"
            echo "✅ $service_name force stopped"
        else
            echo "ℹ️  $service_name was not running"
            rm -f "$pid_file"
        fi
    else
        echo "ℹ️  No PID file found for $service_name"
    fi
}

# Stop all services
echo ""
echo "🎯 Stopping Enhanced Health Monitor Services..."

stop_service "enhanced-health-monitor"
stop_service "enhanced-dashboard" 
stop_service "legacy-dashboard"

# Kill any remaining processes by name
echo ""
echo "🧹 Cleaning up any remaining processes..."

pkill -f "health-monitor-enhanced" || true
pkill -f "enhanced-dashboard" || true
pkill -f "real-time-dashboard" || true

# Update status file
if [ -f "$SCRIPT_DIR/monitoring-status.json" ]; then
    cat > "$SCRIPT_DIR/monitoring-status.json" << EOF
{
  "status": "stopped",
  "stoppedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "services": {
    "enhanced-health-monitor": {
      "pid": null,
      "status": "stopped"
    },
    "enhanced-dashboard": {
      "pid": null,
      "status": "stopped"
    },
    "legacy-dashboard": {
      "pid": null,
      "status": "stopped"
    }
  }
}
EOF
    echo "📄 Status file updated: $SCRIPT_DIR/monitoring-status.json"
fi

echo ""
echo "✅ All Enhanced Health Monitor services have been stopped"
echo ""
echo "📊 Final Status:"
echo "   • Enhanced Health Monitor: Stopped"
echo "   • Enhanced Dashboard: Stopped"
echo "   • Legacy Dashboard: Stopped"
echo "   • WebSocket Server: Stopped"
echo ""
echo "📁 Preserved Data:"
echo "   • Log files: $LOG_DIR/"
echo "   • Health reports: $SCRIPT_DIR/reports/"
echo "   • Knowledge base: $SCRIPT_DIR/knowledge-base/"
echo ""
echo "🔄 To restart: $SCRIPT_DIR/start-enhanced-monitoring.sh"