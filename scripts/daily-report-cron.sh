#!/bin/bash
# Daily report generation script for cron

# Set working directory
cd /Users/rodericandrews/WarRoom_Development/1.0-war-room

# Set up environment
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
export LANG=en_US.UTF-8

# Log file
LOG_FILE="logs/daily-report-$(date +%Y%m%d).log"
mkdir -p logs

echo "=== Daily Report Generation Started at $(date) ===" >> "$LOG_FILE"

# Ensure we have latest code
git pull origin main >> "$LOG_FILE" 2>&1

# Generate the report
python3 scripts/generate-daily-report.py >> "$LOG_FILE" 2>&1

# Check if report was generated successfully
if [ $? -eq 0 ]; then
    echo "✅ Report generated successfully" >> "$LOG_FILE"
    
    # Commit and push the report
    git add reports/daily/*.md >> "$LOG_FILE" 2>&1
    git commit -m "📊 Automated daily report for $(date +'%Y-%m-%d')" >> "$LOG_FILE" 2>&1
    git push origin main >> "$LOG_FILE" 2>&1
    
    # Send notification if claude-notify script exists
    if [ -f "scripts/claude-notify-unified.sh" ]; then
        ./scripts/claude-notify-unified.sh complete "Daily report generated" "Report for $(date +'%Y-%m-%d') created and pushed"
    fi
else
    echo "❌ Report generation failed" >> "$LOG_FILE"
    if [ -f "scripts/claude-notify-unified.sh" ]; then
        ./scripts/claude-notify-unified.sh error "Daily report failed" "Check logs/daily-report-$(date +%Y%m%d).log"
    fi
fi

echo "=== Daily Report Generation Completed at $(date) ===" >> "$LOG_FILE"