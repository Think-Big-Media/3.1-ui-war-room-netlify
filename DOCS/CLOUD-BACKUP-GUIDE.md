# Cloud Backup Options for War Room

## Overview
Your 400MB+ backups need reliable cloud storage. Here are the best options:

## 1. GitHub LFS (Git Large File Storage)
- **Free tier**: 1 GB storage + 1 GB/month bandwidth
- **Paid**: $5/month per data pack (50 GB storage + 50 GB bandwidth)
- **Pros**: Integrated with git, version controlled
- **Cons**: Not ideal for frequent large backups
- **Best for**: Occasional release snapshots

## 2. Google Drive
- **Free tier**: 15 GB
- **Paid**: $1.99/month for 100 GB, $2.99/month for 200 GB
- **Pros**: Cheap, reliable, easy sharing
- **Cons**: Manual upload unless scripted
- **Setup**: Use `gdrive` CLI tool or `rclone`

## 3. Dropbox
- **Free tier**: 2 GB (very limited)
- **Paid**: $11.99/month for 2 TB
- **Pros**: Excellent sync, version history
- **Cons**: No middle-tier pricing
- **Setup**: Official CLI or API

## 4. AWS S3
- **Pricing**: ~$0.023/GB/month storage + transfer costs
- **Pros**: Programmatic, scalable, lifecycle policies
- **Cons**: More complex setup
- **Best for**: Automated backups, production use

## 5. Backblaze B2
- **Pricing**: $0.005/GB/month (10x cheaper than S3)
- **Free tier**: 10 GB
- **Pros**: Very cheap, S3-compatible API
- **Cons**: Less known brand
- **Best for**: Cost-effective automated backups

## 6. OneDrive
- **Free tier**: 5 GB
- **Paid**: $1.99/month for 100 GB (with Microsoft 365: $6.99/month for 1 TB)
- **Pros**: Integrated with Windows/Office
- **Cons**: Limited CLI tools

## Recommended Setup: Google Drive with rclone

### Install rclone
```bash
brew install rclone
```

### Configure Google Drive
```bash
rclone config
# Choose: n (new remote)
# Name: warroom-backup
# Storage: drive (Google Drive)
# Follow OAuth setup
```

### Backup Script Addition
```bash
# Add to backup script
echo "Uploading to Google Drive..."
rclone copy "$BACKUP_DIR/$DB_BACKUP_NAME" warroom-backup:WarRoomBackups/database/
rclone copy "$BACKUP_DIR/$UPLOADS_BACKUP_NAME" warroom-backup:WarRoomBackups/uploads/
```

## Alternative: AWS S3 Setup

### Install AWS CLI
```bash
brew install awscli
aws configure
```

### Backup Script Addition
```bash
# Add to backup script
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/$DB_BACKUP_NAME" s3://warroom-backups/database/
aws s3 cp "$BACKUP_DIR/$UPLOADS_BACKUP_NAME" s3://warroom-backups/uploads/
```

### S3 Lifecycle Policy (auto-delete old backups)
```json
{
  "Rules": [{
    "Id": "DeleteOldBackups",
    "Status": "Enabled",
    "ExpirationInDays": 30,
    "Prefix": "database/"
  }]
}
```

## Quick Comparison Table

| Service | Free Tier | Best Paid Tier | $/GB/month | Best For |
|---------|-----------|----------------|------------|----------|
| GitHub LFS | 1 GB | $5 for 50 GB | $0.10 | Code snapshots |
| Google Drive | 15 GB | $1.99 for 100 GB | $0.02 | General backups |
| AWS S3 | None | Pay as you go | $0.023 | Automation |
| Backblaze B2 | 10 GB | Pay as you go | $0.005 | Cheap storage |
| OneDrive | 5 GB | $1.99 for 100 GB | $0.02 | Windows users |

## Recommended Strategy

1. **Daily database backups**: Google Drive or Backblaze B2
2. **Weekly code snapshots**: Google Drive (100 GB for $1.99/month)
3. **Release archives**: GitHub Releases (no size limit for releases)
4. **Local copies**: External drive for redundancy

## Automation Example

Create `scripts/backup/upload-to-cloud.sh`:
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/Users/rodericandrews/WarRoom_Development/warroom-backups"
REMOTE="warroom-backup:WarRoomBackups"

# Upload recent backups
echo "Uploading recent backups to cloud..."

# Database backups (keep last 7 days)
rclone sync "$BACKUP_DIR/database" "$REMOTE/database" \
  --max-age 7d \
  --progress

# Code snapshots (keep all)
rclone copy "$BACKUP_DIR/code-snapshots" "$REMOTE/code-snapshots" \
  --progress

# Show remote contents
echo "Cloud backup contents:"
rclone ls "$REMOTE" --max-depth 2
```

## Setting Up Automated Backups

### Using macOS launchd (runs daily at 2 AM)
Create `~/Library/LaunchAgents/com.warroom.backup.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.warroom.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/rodericandrews/WarRoom_Development/1.0-war-room/scripts/backup/backup-war-room.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.warroom.backup.plist
```

---
*Last updated: 2025-07-22*