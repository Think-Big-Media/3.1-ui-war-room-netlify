# Backups Directory Notice

⚠️ **Important**: Large backup files should NOT be stored in this directory.

## Backup Location
All backups are now stored in the external directory:
```
/Users/rodericandrews/WarRoom_Development/warroom-backups/
```

## Directory Structure
```
warroom-backups/
├── database/        # PostgreSQL database dumps
├── code-snapshots/  # Full code backups (.zip files)
├── uploads/         # User uploaded files and assets
└── deployments/     # Deployment-specific backups
```

## Creating Backups
Use the backup script:
```bash
./scripts/backup/backup-war-room.sh
```

This will automatically save backups to the external location.

## Why External Storage?
- Prevents accidental commits of large files
- Keeps git repository clean and fast
- Allows separate backup strategies
- Avoids git history bloat

---
*Last updated: 2025-07-22*