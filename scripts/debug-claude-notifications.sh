#!/bin/bash
# Debug script to understand notification flow

LOG_FILE="/tmp/claude-notification-debug.log"

log_debug() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Log script execution
log_debug "=== DEBUG SCRIPT CALLED ==="
log_debug "Called from: $(pwd)"
log_debug "Script exists: $(test -f /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh && echo YES || echo NO)"
log_debug "Script executable: $(test -x /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh && echo YES || echo NO)"

# Check if notification script is being called
if pgrep -f "claude-notify-unified.sh" > /dev/null; then
    log_debug "Notification script is currently running"
else
    log_debug "Notification script is NOT running"
fi

# Monitor for questions in my output
log_debug "Checking for question patterns in recent terminal output..."

# Test the notification script directly
log_debug "Testing notification script..."
/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/claude-notify-unified.sh test 2>&1 | while read line; do
    log_debug "Script output: $line"
done

echo "Debug log written to: $LOG_FILE"
tail -20 "$LOG_FILE"