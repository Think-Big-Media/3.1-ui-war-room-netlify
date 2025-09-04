#!/bin/bash

# War Room Backup Script
# This script backs up the database and any uploaded files

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
# Use external backup directory outside the git repository
BACKUP_DIR="/Users/rodericandrews/WarRoom_Development/warroom-backups"
DATE=$(date +%Y%m%d-%H%M%S)
DB_BACKUP_NAME="warroom-db-backup-${DATE}.sql"
UPLOADS_BACKUP_NAME="warroom-uploads-backup-${DATE}.tar.gz"

echo -e "${YELLOW}Starting War Room backup process...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# 1. Database Backup (PostgreSQL)
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}Backing up PostgreSQL database...${NC}"
    
    # Parse DATABASE_URL for pg_dump
    # Format: postgresql://user:password@host:port/database
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        # Use pg_dump with parsed credentials
        PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/$DB_BACKUP_NAME"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Database backed up to: $BACKUP_DIR/$DB_BACKUP_NAME${NC}"
        else
            echo -e "${RED}✗ Database backup failed${NC}"
        fi
    else
        echo -e "${RED}Could not parse DATABASE_URL${NC}"
    fi
else
    echo -e "${YELLOW}No DATABASE_URL found, skipping database backup${NC}"
fi

# 2. Backup uploaded files and assets
UPLOAD_DIRS=(
    "src/backend/uploads"
    "src/frontend/public/uploads"
    "src/frontend/public/images"
    "src/backend/static/uploads"
)

DIRS_TO_BACKUP=()
for dir in "${UPLOAD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        DIRS_TO_BACKUP+=("$dir")
    fi
done

if [ ${#DIRS_TO_BACKUP[@]} -gt 0 ]; then
    echo -e "${GREEN}Backing up upload directories...${NC}"
    tar -czf "$BACKUP_DIR/$UPLOADS_BACKUP_NAME" "${DIRS_TO_BACKUP[@]}" 2>/dev/null || true
    echo -e "${GREEN}✓ Uploads backed up to: $BACKUP_DIR/$UPLOADS_BACKUP_NAME${NC}"
else
    echo -e "${YELLOW}No upload directories found to backup${NC}"
fi

# 3. Create backup manifest
echo -e "${GREEN}Creating backup manifest...${NC}"
cat > "$BACKUP_DIR/manifest-${DATE}.json" <<EOF
{
  "backup_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0",
  "files": {
    "database": "$DB_BACKUP_NAME",
    "uploads": "$UPLOADS_BACKUP_NAME"
  },
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git branch --show-current)",
  "directories_backed_up": [
$(printf '    "%s",\n' "${DIRS_TO_BACKUP[@]}" | sed '$ s/,$//')
  ]
}
EOF

# 4. Clean up old backups (keep last 5)
echo -e "${GREEN}Cleaning up old backups...${NC}"
cd "$BACKUP_DIR"
ls -t warroom-db-backup-*.sql 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t warroom-uploads-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
ls -t manifest-*.json 2>/dev/null | tail -n +6 | xargs -r rm -f
cd - > /dev/null

# 5. Show backup summary
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo -e "Backup directory: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "Database backup: ${YELLOW}$DB_BACKUP_NAME${NC}"
echo -e "Uploads backup: ${YELLOW}$UPLOADS_BACKUP_NAME${NC}"
echo -e "Manifest: ${YELLOW}manifest-${DATE}.json${NC}"

# Calculate sizes
if [ -f "$BACKUP_DIR/$DB_BACKUP_NAME" ]; then
    DB_SIZE=$(du -h "$BACKUP_DIR/$DB_BACKUP_NAME" | cut -f1)
    echo -e "Database size: ${YELLOW}$DB_SIZE${NC}"
fi

if [ -f "$BACKUP_DIR/$UPLOADS_BACKUP_NAME" ]; then
    UPLOAD_SIZE=$(du -h "$BACKUP_DIR/$UPLOADS_BACKUP_NAME" | cut -f1)
    echo -e "Uploads size: ${YELLOW}$UPLOAD_SIZE${NC}"
fi

echo -e "${GREEN}Backup completed successfully!${NC}"