#!/bin/bash

# Capture deployment validation results to log file
# Usage: ./scripts/capture-deployment-log.sh

set -e

# Configuration
LOGS_DIR="logs/deployments"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)
LOG_FILE="$LOGS_DIR/${DATE}-validation.log"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

echo "Capturing deployment validation log..."
echo "=====================================
War Room Deployment Validation Log
==================================
Date: $DATE
Time: $TIME
Platform: Render
URL: https://war-room-oa9t.onrender.com

" > "$LOG_FILE"

# Run validation and capture output
echo "Running validation tests..." >> "$LOG_FILE"
./scripts/validate-render-deployment-simple.sh >> "$LOG_FILE" 2>&1

# Add timestamp
echo "
Log captured at: $(date)
" >> "$LOG_FILE"

echo "Log saved to: $LOG_FILE"

# Display summary
if grep -q "All tests passed" "$LOG_FILE"; then
    echo "✅ Deployment validation successful!"
else
    echo "⚠️  Some tests failed. Check $LOG_FILE for details."
fi