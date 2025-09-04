# War Room Checkpoint System

## Overview

The War Room platform includes a comprehensive checkpoint system that provides:
1. **Workflow Checkpoints** - Save and restore automation workflow states
2. **Database Checkpoints** - Backup and restore database states
3. **Deployment Checkpoints** - Validate deployment readiness

## Features

### Workflow Checkpoints
- Automatic checkpointing during workflow execution
- Resume failed workflows from last successful step
- Configurable retention period (default: 7 days)
- Efficient storage using pickle serialization

### Database Checkpoints
- Full database backups using pg_dump
- Checksum verification for data integrity
- Scheduled daily backups (configurable)
- Point-in-time recovery capabilities

### Deployment Checkpoints
- Pre-deployment validation checks
- Environment variable verification
- Dependency validation
- Configuration file checks
- Automated rollback support

## API Endpoints

### Create Workflow Checkpoint
```
POST /api/v1/checkpoints/workflow
{
  "execution_id": "string",
  "step_id": "string",
  "state": {},
  "metadata": {}
}
```

### Create Database Backup
```
POST /api/v1/checkpoints/database
{
  "checkpoint_name": "string" (optional)
}
```

### Run Deployment Validation
```
POST /api/v1/checkpoints/deployment
```

### List Checkpoints
```
GET /api/v1/checkpoints/list?type={workflow|database|deployment}
```

### Restore Database
```
POST /api/v1/checkpoints/restore/database/{checkpoint_name}
```

## Configuration

### Environment Variables
```bash
# Checkpoint directories
CHECKPOINT_DIR=/app/checkpoints
BACKUP_DIR=/app/backups

# Retention settings
CHECKPOINT_RETENTION_DAYS=7
ENABLE_AUTO_CHECKPOINTS=true

# Scheduling
DATABASE_CHECKPOINT_SCHEDULE="0 3 * * *"
```

### Railway Configuration
The system is configured to use Railway's persistent volumes:
- `/app/checkpoints` - Workflow checkpoints
- `/app/backups` - Database backups

## Usage

### Command Line Tools

#### Create a checkpoint
```bash
./scripts/create-checkpoint.sh database --name my-backup
./scripts/create-checkpoint.sh deployment
./scripts/create-checkpoint.sh all
```

#### Test checkpoints
```bash
./scripts/test-checkpoints.sh
```

### Integration with Deployment

The Railway deployment script automatically:
1. Creates a deployment checkpoint
2. Validates all requirements
3. Creates a database backup
4. Tags the deployment

### Automation Engine Integration

The automation engine automatically creates checkpoints:
- After each successful workflow step
- Before critical operations
- On workflow completion

Resume a failed workflow:
```python
# Workflows automatically resume from last checkpoint
execution_id = automation_engine.execute_workflow(workflow_id)
```

## Monitoring

### Check checkpoint status
```bash
# List all checkpoints
curl -H "Authorization: Bearer $TOKEN" \
  https://api.warroom.com/api/v1/checkpoints/list

# Check deployment readiness
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.warroom.com/api/v1/checkpoints/deployment
```

### Cleanup old checkpoints
Automated cleanup runs daily at 2 AM UTC, removing checkpoints older than 7 days.

Manual cleanup:
```bash
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  "https://api.warroom.com/api/v1/checkpoints/cleanup?days=7"
```

## Best Practices

1. **Always create a deployment checkpoint before deploying**
2. **Test database restore procedures regularly**
3. **Monitor checkpoint storage usage**
4. **Keep checkpoint retention aligned with backup policies**
5. **Use workflow checkpoints for long-running processes**

## Troubleshooting

### Common Issues

1. **Checkpoint creation fails**
   - Check directory permissions
   - Verify disk space availability
   - Check environment variables

2. **Database backup fails**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL client tools are installed
   - Ensure database user has backup permissions

3. **Workflow doesn't resume**
   - Check checkpoint exists
   - Verify execution ID matches
   - Check checkpoint hasn't expired

### Debug Commands
```bash
# Check checkpoint directory
ls -la /app/checkpoints/

# Verify database connection
pg_dump --version

# Test checkpoint service
python -c "from backend.services.checkpoint_service import checkpoint_service; print('OK')"
```

## Security Considerations

1. **Checkpoints contain sensitive data** - Ensure proper access controls
2. **Database backups are unencrypted** - Use encrypted volumes in production
3. **API endpoints require authentication** - Admin role required for database operations
4. **Cleanup old checkpoints** - Prevent data accumulation

## Future Enhancements

- Encrypted checkpoint storage
- S3 backup integration
- Incremental database backups
- Cross-region replication
- Checkpoint compression
- Web UI for checkpoint management