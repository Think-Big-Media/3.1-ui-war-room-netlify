#!/bin/bash

# Linear Task Sync for War Room
# Automatically creates and updates Linear tasks based on code activity

set -e

# Configuration
PROJECT_DIR="/Users/rodericandrews/WarRoom_Development/1.0-war-room"
LOG_FILE="$PROJECT_DIR/logs/linear-sync-$(date +%Y%m%d).log"

# Function to log
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting Linear task sync..."

# Check for TODOs in code
echo "Scanning for TODOs in code..."
TODO_COUNT=$(grep -r "TODO:" src/ --include="*.ts" --include="*.tsx" --include="*.py" 2>/dev/null | wc -l | tr -d ' ')
log "Found $TODO_COUNT TODOs in codebase"

# Check for FIXMEs
FIXME_COUNT=$(grep -r "FIXME:" src/ --include="*.ts" --include="*.tsx" --include="*.py" 2>/dev/null | wc -l | tr -d ' ')
log "Found $FIXME_COUNT FIXMEs in codebase"

# Create task list file for Claude to process
cat > "$PROJECT_DIR/logs/pending-tasks.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "todos": $TODO_COUNT,
  "fixmes": $FIXME_COUNT,
  "recent_commits": [
$(git log --oneline -5 | while read line; do echo "    \"$line\","; done | sed '$ s/,$//')
  ],
  "pending_files": [
$(git status --porcelain | while read line; do echo "    \"$line\","; done | sed '$ s/,$//')
  ]
}
EOF

log "Task sync data saved to logs/pending-tasks.json"
echo "Linear sync completed. Use 'linear create' in Claude to create tasks from this data."