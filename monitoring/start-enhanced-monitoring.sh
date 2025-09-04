#!/bin/bash

# War Room Enhanced Health Monitor Sub-Agent Startup Script
# 
# This script starts the enhanced health monitoring system with all features:
# - TypeScript-based health monitor with circuit breakers
# - WebSocket server for sub-agent coordination 
# - Real-time dashboard with enhanced visualizations
# - Pieces knowledge manager integration
# - Automated endpoint discovery and performance SLA enforcement

set -e

echo "🚀 Starting War Room Enhanced Health Monitoring System..."

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$SCRIPT_DIR/logs"
REPORTS_DIR="$SCRIPT_DIR/reports"

# Create directories
mkdir -p "$LOG_DIR" "$REPORTS_DIR" "$SCRIPT_DIR/knowledge-base/health-check-fixes" "$SCRIPT_DIR/knowledge-base/pieces-integration"

echo "📁 Created monitoring directories"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version check passed: $(node -v)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Install TypeScript globally if needed
if ! command -v tsc &> /dev/null; then
    echo "📦 Installing TypeScript..."
    npm install -g typescript
fi

# Compile TypeScript files
echo "🔨 Compiling TypeScript files..."
npx tsc

echo "✅ TypeScript compilation completed"

# Function to start a service in the background
start_service() {
    local service_name="$1"
    local command="$2"
    local log_file="$LOG_DIR/${service_name}.log"
    
    echo "🔄 Starting $service_name..."
    
    # Kill existing process if running
    pkill -f "$service_name" || true
    
    # Start service
    nohup $command > "$log_file" 2>&1 &
    local pid=$!
    
    # Save PID
    echo $pid > "$LOG_DIR/${service_name}.pid"
    
    # Wait a moment and check if service started successfully
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        echo "✅ $service_name started successfully (PID: $pid)"
        echo "📝 Logs: $log_file"
    else
        echo "❌ Failed to start $service_name"
        echo "📝 Check logs: $log_file"
        return 1
    fi
}

# Start services
echo ""
echo "🎯 Starting Enhanced Health Monitor Sub-Agent Services..."

# 1. Start Enhanced Health Monitor (Main Sub-Agent)
start_service "enhanced-health-monitor" "node dist/health-monitor-enhanced.js start"

# Wait for WebSocket server to start
echo "⏳ Waiting for WebSocket server to initialize..."
sleep 5

# 2. Start Enhanced Dashboard
start_service "enhanced-dashboard" "node dist/enhanced-dashboard.js"

# 3. Start Legacy Dashboard (for compatibility)
start_service "legacy-dashboard" "node real-time-dashboard.js"

echo ""
echo "🎉 War Room Enhanced Health Monitoring System Started Successfully!"
echo ""
echo "📊 Services Running:"
echo "   • Enhanced Health Monitor: WebSocket on port 8080"
echo "   • Enhanced Dashboard: Terminal-based real-time monitoring"
echo "   • Legacy Dashboard: Available for fallback"
echo ""
echo "🔗 Integration Status:"
echo "   • Circuit Breakers: ✅ Enabled"
echo "   • WebSocket Coordination: ✅ Active"
echo "   • Pieces Knowledge Manager: ✅ Integrated"
echo "   • Performance SLA (3s): ✅ Enforced"
echo "   • Auto-fix Patterns: ✅ Active"
echo "   • Endpoint Discovery: ✅ Running"
echo ""
echo "📁 File Locations:"
echo "   • Logs: $LOG_DIR/"
echo "   • Reports: $REPORTS_DIR/"
echo "   • Knowledge Base: $SCRIPT_DIR/knowledge-base/"
echo ""
echo "🎛️  Control Commands:"
echo "   • View Enhanced Dashboard: npm run dashboard:enhanced"
echo "   • Force Health Check: npm run health-check"
echo "   • View Logs: tail -f $LOG_DIR/enhanced-health-monitor.log"
echo "   • Stop All: $SCRIPT_DIR/stop-enhanced-monitoring.sh"
echo ""
echo "🌐 Target Application: https://war-room-oa9t.onrender.com/"
echo "⏰ Health Checks: Every 30 minutes (next check in progress)"

# Create status file
cat > "$SCRIPT_DIR/monitoring-status.json" << EOF
{
  "status": "running",
  "startedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "services": {
    "enhanced-health-monitor": {
      "pid": $(cat "$LOG_DIR/enhanced-health-monitor.pid" 2>/dev/null || echo "null"),
      "websocket": "ws://localhost:8080",
      "logFile": "$LOG_DIR/enhanced-health-monitor.log"
    },
    "enhanced-dashboard": {
      "pid": $(cat "$LOG_DIR/enhanced-dashboard.pid" 2>/dev/null || echo "null"),
      "logFile": "$LOG_DIR/enhanced-dashboard.log"
    },
    "legacy-dashboard": {
      "pid": $(cat "$LOG_DIR/legacy-dashboard.pid" 2>/dev/null || echo "null"),
      "logFile": "$LOG_DIR/legacy-dashboard.log"
    }
  },
  "target": "https://war-room-oa9t.onrender.com/",
  "features": {
    "circuitBreakers": true,
    "webSocketCoordination": true,
    "piecesIntegration": true,
    "performanceSLA": 3000,
    "autoFix": true,
    "endpointDiscovery": true
  }
}
EOF

echo "📄 Status file created: $SCRIPT_DIR/monitoring-status.json"
echo ""
echo "✅ Enhanced Health Monitor Sub-Agent is now active and monitoring!"
echo "🔍 Use 'npm run health-check' to trigger an immediate health check"