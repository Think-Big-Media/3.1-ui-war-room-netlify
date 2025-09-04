#!/bin/bash

# Setup Pinecone Monitoring Cron Job
# This script sets up automated monitoring for Pinecone health checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configuration
MONITOR_SCRIPT="$PROJECT_ROOT/scripts/enhanced-pinecone-monitor.py"
LOG_DIR="$PROJECT_ROOT/logs/pinecone_monitoring"
CRON_LOG="$LOG_DIR/cron.log"
LOCK_FILE="/tmp/pinecone-monitor.lock"

echo "🔧 Setting up Pinecone monitoring automation..."

# Create log directory
mkdir -p "$LOG_DIR"

# Create wrapper script for cron execution
WRAPPER_SCRIPT="$PROJECT_ROOT/scripts/pinecone-monitor-wrapper.sh"

cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash

# Pinecone Monitor Cron Wrapper
# Prevents multiple instances and provides proper logging

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK_FILE="/tmp/pinecone-monitor.lock"
LOG_DIR="$PROJECT_ROOT/logs/pinecone_monitoring"
CRON_LOG="$LOG_DIR/cron.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log_with_timestamp() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$CRON_LOG"
}

# Check for existing lock file
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        log_with_timestamp "Monitor already running (PID: $PID), skipping execution"
        exit 0
    else
        log_with_timestamp "Removing stale lock file (PID: $PID)"
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"

# Function to cleanup on exit
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT

# Change to project directory
cd "$PROJECT_ROOT"

# Log start
log_with_timestamp "Starting Pinecone health check"

# Run the monitor
python3 scripts/enhanced-pinecone-monitor.py --test-all 2>&1 | while IFS= read -r line; do
    log_with_timestamp "$line"
done

# Log completion
log_with_timestamp "Pinecone health check completed"

# Check for alerts in recent logs
ALERT_COUNT=$(tail -100 "$CRON_LOG" | grep -c "ALERT:" || true)
if [ "$ALERT_COUNT" -gt 0 ]; then
    log_with_timestamp "WARNING: $ALERT_COUNT alerts found in recent execution"
    
    # Send notification if script exists
    if [ -f "$PROJECT_ROOT/scripts/claude-notify-unified.sh" ]; then
        "$PROJECT_ROOT/scripts/claude-notify-unified.sh" error "Pinecone monitoring alerts" "$ALERT_COUNT alerts detected - check logs"
    fi
fi

EOF

# Make wrapper script executable
chmod +x "$WRAPPER_SCRIPT"

# Create systemd service for more reliable monitoring (if systemd is available)
if command -v systemctl >/dev/null 2>&1; then
    SERVICE_FILE="/etc/systemd/system/pinecone-monitor.service"
    TIMER_FILE="/etc/systemd/system/pinecone-monitor.timer"
    
    echo "📋 Creating systemd service and timer..."
    
    # Create service file
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Pinecone Health Monitor
After=network.target

[Service]
Type=oneshot
User=$USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=$WRAPPER_SCRIPT
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Create timer file (runs every 30 minutes)
    sudo tee "$TIMER_FILE" > /dev/null << EOF
[Unit]
Description=Run Pinecone Health Monitor every 30 minutes
Requires=pinecone-monitor.service

[Timer]
OnCalendar=*:0/30
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Enable and start the timer
    sudo systemctl daemon-reload
    sudo systemctl enable pinecone-monitor.timer
    sudo systemctl start pinecone-monitor.timer
    
    echo "✅ Systemd timer created and started"
    echo "   Status: systemctl status pinecone-monitor.timer"
    echo "   Logs: journalctl -u pinecone-monitor.service"
    
else
    echo "📅 Setting up cron job (systemd not available)..."
    
    # Create cron job entry
    CRON_ENTRY="*/30 * * * * $WRAPPER_SCRIPT"
    
    # Add to crontab if not already present
    (crontab -l 2>/dev/null || true; echo "$CRON_ENTRY") | sort -u | crontab -
    
    echo "✅ Cron job added: $CRON_ENTRY"
fi

# Create log rotation configuration
LOGROTATE_CONF="/etc/logrotate.d/pinecone-monitor"

if [ -w "/etc/logrotate.d" ]; then
    sudo tee "$LOGROTATE_CONF" > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF
    echo "✅ Log rotation configured"
fi

# Create status check script
STATUS_SCRIPT="$PROJECT_ROOT/scripts/pinecone-monitor-status.sh"

cat > "$STATUS_SCRIPT" << EOF
#!/bin/bash

# Pinecone Monitor Status Checker

PROJECT_ROOT="$PROJECT_ROOT"
LOG_DIR="\$PROJECT_ROOT/logs/pinecone_monitoring"
CRON_LOG="\$LOG_DIR/cron.log"

echo "🔍 Pinecone Monitoring Status"
echo "============================"
echo

# Check if monitoring is running
if command -v systemctl >/dev/null 2>&1; then
    echo "Systemd Timer Status:"
    systemctl status pinecone-monitor.timer --no-pager || true
    echo
else
    echo "Cron Job Status:"
    crontab -l | grep pinecone || echo "No cron job found"
    echo
fi

# Check recent log activity
if [ -f "\$CRON_LOG" ]; then
    echo "Recent Activity (last 10 entries):"
    echo "-----------------------------------"
    tail -10 "\$CRON_LOG"
    echo
    
    # Check for recent alerts
    RECENT_ALERTS=\$(tail -100 "\$CRON_LOG" | grep "ALERT:" || true)
    if [ -n "\$RECENT_ALERTS" ]; then
        echo "🚨 Recent Alerts:"
        echo "\$RECENT_ALERTS"
    else
        echo "✅ No recent alerts"
    fi
    echo
    
    # Check last successful run
    LAST_SUCCESS=\$(grep "health check completed" "\$CRON_LOG" | tail -1)
    if [ -n "\$LAST_SUCCESS" ]; then
        echo "Last Successful Check: \$LAST_SUCCESS"
    else
        echo "⚠️  No successful completions found in recent logs"
    fi
else
    echo "⚠️  No log file found at \$CRON_LOG"
fi

echo
echo "Log Files:"
echo "----------"
ls -la "\$LOG_DIR"/ 2>/dev/null || echo "Log directory not found"

EOF

chmod +x "$STATUS_SCRIPT"

# Test the monitor once
echo "🧪 Running initial test..."
"$WRAPPER_SCRIPT"

echo
echo "✅ Pinecone monitoring setup complete!"
echo
echo "📊 Status Commands:"
echo "  Check status: $STATUS_SCRIPT"
echo "  View logs: tail -f $CRON_LOG"
echo "  Manual run: $WRAPPER_SCRIPT"
echo
echo "📁 Log Directory: $LOG_DIR"
echo "🔄 Monitoring Interval: Every 30 minutes"
echo
echo "The monitoring system will:"
echo "  • Run health checks every 30 minutes"
echo "  • Log all activities with timestamps"
echo "  • Send alerts for critical issues"
echo "  • Prevent multiple simultaneous runs"
echo "  • Rotate logs daily (keep 30 days)"