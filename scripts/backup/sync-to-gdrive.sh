#!/bin/bash

# War Room Google Drive Sync Script
# Syncs local backups to Google Drive using rclone

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_BACKUP_DIR="/Users/rodericandrews/WarRoom_Development/warroom-backups"
GDRIVE_REMOTE="gdrive"  # Update this with your rclone remote name

echo -e "${BLUE}=== War Room Google Drive Sync ===${NC}"

# Check if rclone is configured
if ! rclone listremotes | grep -q "$GDRIVE_REMOTE:"; then
    echo -e "${YELLOW}Google Drive not configured in rclone${NC}"
    echo "Run: rclone config"
    echo "And set up a remote named '$GDRIVE_REMOTE'"
    exit 1
fi

# Sync code snapshots
echo -e "${GREEN}Syncing code snapshots...${NC}"
rclone copy "$LOCAL_BACKUP_DIR/code-snapshots" "$GDRIVE_REMOTE:Operation Waterfall/Archive/code-snapshots/War Room" \
    --progress \
    --exclude ".DS_Store"

# Sync database backups (keep only last 30 days)
echo -e "${GREEN}Syncing database backups...${NC}"
rclone sync "$LOCAL_BACKUP_DIR/database" "$GDRIVE_REMOTE:Operation Waterfall/Archive/database-backups/War Room" \
    --progress \
    --max-age 30d \
    --exclude ".DS_Store"

# Show what's in Google Drive
echo -e "${BLUE}Current Google Drive contents:${NC}"
rclone ls "$GDRIVE_REMOTE:Operation Waterfall/Archive" --max-depth 3 | grep -i "war room" | tail -10

echo -e "${GREEN}✅ Sync complete!${NC}"

# Optional: Create a summary file
SUMMARY_FILE="$LOCAL_BACKUP_DIR/last-sync.txt"
cat > "$SUMMARY_FILE" <<EOF
Last sync: $(date)
Files synced to: Google Drive/Operation Waterfall/Archive/
Local backup dir: $LOCAL_BACKUP_DIR
EOF

echo -e "${BLUE}Summary saved to: $SUMMARY_FILE${NC}"