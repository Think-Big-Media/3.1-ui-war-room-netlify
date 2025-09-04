#!/bin/bash
# Setup script for daily report cron job

echo "Setting up daily report cron job..."

# Create a temporary cron file
CRON_FILE="/tmp/warroom_cron_$$"

# Get existing crontab (if any)
crontab -l 2>/dev/null > "$CRON_FILE" || true

# Check if daily report cron already exists
if grep -q "daily-report-cron.sh" "$CRON_FILE"; then
    echo "Daily report cron job already exists. Updating..."
    # Remove existing entry
    grep -v "daily-report-cron.sh" "$CRON_FILE" > "$CRON_FILE.tmp"
    mv "$CRON_FILE.tmp" "$CRON_FILE"
fi

# Add new cron job - runs at 9:00 AM daily
echo "0 9 * * * /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/daily-report-cron.sh" >> "$CRON_FILE"

# Install the new crontab
crontab "$CRON_FILE"

# Clean up
rm -f "$CRON_FILE"

echo "✅ Daily report cron job installed successfully!"
echo ""
echo "Cron schedule: 9:00 AM daily"
echo "Script: /Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/daily-report-cron.sh"
echo ""
echo "To view current crontab: crontab -l"
echo "To remove cron job: crontab -e (then delete the line)"
echo ""
echo "The cron job will:"
echo "1. Pull latest code from git"
echo "2. Generate daily report"
echo "3. Commit and push to repository"
echo "4. Send Apple Watch notification"