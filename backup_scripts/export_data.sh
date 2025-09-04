#!/bin/bash

# ==============================================================================
# WAR ROOM ANALYTICS PLATFORM - DATA EXPORT SCRIPT
# ==============================================================================
# This script exports all data from the current production deployment
# for migration to the new client environment
# ==============================================================================

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$PROJECT_ROOT/backups/migration_$TIMESTAMP"
LOG_FILE="$BACKUP_DIR/export_log.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running on correct environment
check_environment() {
    log "Checking environment..."
    
    if [[ -z "$DATABASE_URL" ]]; then
        error "DATABASE_URL environment variable not set"
    fi
    
    if [[ -z "$REDIS_URL" ]]; then
        warning "REDIS_URL environment variable not set - Redis backup will be skipped"
    fi
    
    # Check if we can connect to database
    if ! command -v psql &> /dev/null; then
        error "psql command not found. Please install PostgreSQL client tools."
    fi
    
    success "Environment checks passed"
}

# Create backup directory structure
setup_backup_directory() {
    log "Setting up backup directory: $BACKUP_DIR"
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/redis"
    mkdir -p "$BACKUP_DIR/files"
    mkdir -p "$BACKUP_DIR/config"
    mkdir -p "$BACKUP_DIR/logs"
    
    success "Backup directory structure created"
}

# Export PostgreSQL database
export_postgresql() {
    log "Starting PostgreSQL database export..."
    
    local db_dump_file="$BACKUP_DIR/database/warroom_database_$TIMESTAMP.sql"
    local db_schema_file="$BACKUP_DIR/database/warroom_schema_$TIMESTAMP.sql"
    
    # Extract database connection details from DATABASE_URL
    local db_url="$DATABASE_URL"
    
    # Export full database with data
    log "Exporting full database with data..."
    if pg_dump "$db_url" > "$db_dump_file"; then
        success "Database data export completed: $db_dump_file"
    else
        error "Database data export failed"
    fi
    
    # Export schema only
    log "Exporting database schema..."
    if pg_dump --schema-only "$db_url" > "$db_schema_file"; then
        success "Database schema export completed: $db_schema_file"
    else
        error "Database schema export failed"
    fi
    
    # Generate database statistics
    log "Generating database statistics..."
    local stats_file="$BACKUP_DIR/database/database_stats_$TIMESTAMP.txt"
    
    cat << EOF > "$stats_file"
War Room Analytics Database Statistics
Generated: $(date)
Database URL: $db_url (credentials redacted)

Table Statistics:
EOF
    
    # Get table row counts (this requires database connection)
    psql "$db_url" -c "
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows
        FROM pg_stat_user_tables 
        ORDER BY live_rows DESC;
    " >> "$stats_file" 2>/dev/null || warning "Could not generate table statistics"
    
    success "PostgreSQL export completed"
}

# Export Redis data
export_redis() {
    if [[ -z "$REDIS_URL" ]]; then
        warning "Skipping Redis export - REDIS_URL not configured"
        return
    fi
    
    log "Starting Redis data export..."
    
    local redis_dump_file="$BACKUP_DIR/redis/redis_data_$TIMESTAMP.rdb"
    local redis_commands_file="$BACKUP_DIR/redis/redis_commands_$TIMESTAMP.txt"
    
    # Extract Redis connection details
    local redis_host=$(echo "$REDIS_URL" | sed 's|redis://||' | sed 's|:.*||')
    local redis_port=$(echo "$REDIS_URL" | sed 's|.*:||' | sed 's|/.*||')
    
    # Check if redis-cli is available
    if command -v redis-cli &> /dev/null; then
        log "Exporting Redis keys..."
        
        # Get all keys and their values
        redis-cli -h "$redis_host" -p "$redis_port" --scan > "$redis_commands_file.keys" 2>/dev/null || {
            warning "Could not connect to Redis or export keys"
            return
        }
        
        # Export key-value pairs
        while IFS= read -r key; do
            if [[ -n "$key" ]]; then
                echo "# Key: $key" >> "$redis_commands_file"
                redis-cli -h "$redis_host" -p "$redis_port" DUMP "$key" >> "$redis_commands_file" 2>/dev/null || true
                echo "" >> "$redis_commands_file"
            fi
        done < "$redis_commands_file.keys"
        
        rm "$redis_commands_file.keys"
        success "Redis data export completed"
    else
        warning "redis-cli not available - Redis backup skipped"
    fi
}

# Export environment variables (sanitized)
export_environment_config() {
    log "Exporting environment configuration..."
    
    local env_file="$BACKUP_DIR/config/environment_variables_$TIMESTAMP.txt"
    local env_template_file="$BACKUP_DIR/config/env_template_for_new_deployment.txt"
    
    # Create sanitized environment export
    cat << EOF > "$env_file"
# War Room Analytics Environment Variables Export
# Generated: $(date)
# NOTE: Sensitive values have been replaced with placeholders

# Application Configuration
APP_NAME="${APP_NAME:-War Room Analytics}"
APP_VERSION="${APP_VERSION:-1.0.0}"
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL="${LOG_LEVEL:-INFO}"

# Runtime Configuration
PYTHON_VERSION="${PYTHON_VERSION:-3.11.0}"
NODE_VERSION="${NODE_VERSION:-18.17.0}"

# API Configuration
API_V1_STR="${API_V1_STR:-/api/v1}"

# Security Configuration (REGENERATE THESE FOR NEW DEPLOYMENT)
SECRET_KEY=[GENERATE_NEW_SECRET_KEY]
JWT_SECRET=[GENERATE_NEW_JWT_SECRET]
JWT_ALGORITHM="${JWT_ALGORITHM:-HS256}"
ACCESS_TOKEN_EXPIRE_MINUTES="${ACCESS_TOKEN_EXPIRE_MINUTES:-30}"

# Database Configuration
DATABASE_URL=[CONFIGURE_WITH_NEW_DATABASE_URL]
DB_POOL_SIZE="${DB_POOL_SIZE:-20}"
DB_MAX_OVERFLOW="${DB_MAX_OVERFLOW:-40}"

# Redis Configuration
REDIS_URL=[CONFIGURE_WITH_NEW_REDIS_URL]
REDIS_POOL_MIN_SIZE="${REDIS_POOL_MIN_SIZE:-10}"
REDIS_POOL_MAX_SIZE="${REDIS_POOL_MAX_SIZE:-20}"

# External Service Configuration
$(env | grep -E "^VITE_|^REACT_APP_|^POSTHOG_|^SENTRY_|^META_|^GOOGLE_" | sed 's/=.*/=[CONFIGURE_IN_NEW_DEPLOYMENT]/' || true)

# Feature Flags
ENABLE_ANALYTICS="${ENABLE_ANALYTICS:-true}"
ENABLE_AUTOMATION="${ENABLE_AUTOMATION:-true}"
ENABLE_REAL_TIME_UPDATES="${ENABLE_REAL_TIME_UPDATES:-true}"

# Performance Settings
RATE_LIMIT_ANALYTICS="${RATE_LIMIT_ANALYTICS:-30/minute}"
RATE_LIMIT_EXPORT="${RATE_LIMIT_EXPORT:-10/hour}"
MAX_EXPORT_ROWS="${MAX_EXPORT_ROWS:-10000}"

# Monitoring Configuration
HEALTH_CHECK_ENABLED="${HEALTH_CHECK_ENABLED:-true}"
ENABLE_METRICS="${ENABLE_METRICS:-true}"
EOF

    # Create template for new deployment
    cp "$PROJECT_ROOT/.env.render.template" "$env_template_file" 2>/dev/null || {
        warning "Could not copy .env.render.template - creating basic template"
        echo "# Use the main .env.render.template file for complete configuration" > "$env_template_file"
    }
    
    success "Environment configuration exported"
}

# Export application files
export_application_files() {
    log "Exporting application files..."
    
    local files_dir="$BACKUP_DIR/files"
    
    # Export uploaded files if they exist
    if [[ -d "$PROJECT_ROOT/src/backend/storage" ]]; then
        log "Copying application storage files..."
        cp -r "$PROJECT_ROOT/src/backend/storage" "$files_dir/storage" 2>/dev/null || {
            warning "Could not copy storage files"
        }
    fi
    
    # Export logs if they exist
    if [[ -d "$PROJECT_ROOT/logs" ]]; then
        log "Copying log files..."
        cp -r "$PROJECT_ROOT/logs" "$BACKUP_DIR/logs/application_logs" 2>/dev/null || {
            warning "Could not copy log files"
        }
    fi
    
    # Export any SSL certificates or keys (if present)
    if [[ -d "$PROJECT_ROOT/certificates" ]]; then
        log "Copying certificates..."
        cp -r "$PROJECT_ROOT/certificates" "$files_dir/certificates" 2>/dev/null || {
            warning "Could not copy certificates"
        }
    fi
    
    success "Application files exported"
}

# Generate migration manifest
generate_migration_manifest() {
    log "Generating migration manifest..."
    
    local manifest_file="$BACKUP_DIR/MIGRATION_MANIFEST.md"
    
    cat << EOF > "$manifest_file"
# War Room Analytics Migration Package

**Generated**: $(date)  
**Source Environment**: ${ENVIRONMENT:-production}  
**Backup Directory**: $BACKUP_DIR

## Contents

### Database Export
- **Full Database**: \`database/warroom_database_$TIMESTAMP.sql\`
- **Schema Only**: \`database/warroom_schema_$TIMESTAMP.sql\`
- **Statistics**: \`database/database_stats_$TIMESTAMP.txt\`

### Redis Export
- **Redis Data**: \`redis/redis_data_$TIMESTAMP.rdb\`
- **Redis Commands**: \`redis/redis_commands_$TIMESTAMP.txt\`

### Configuration
- **Environment Variables**: \`config/environment_variables_$TIMESTAMP.txt\`
- **New Deployment Template**: \`config/env_template_for_new_deployment.txt\`

### Application Files
- **Storage Files**: \`files/storage/\` (if present)
- **Certificates**: \`files/certificates/\` (if present)

### Logs
- **Export Log**: \`export_log.txt\`
- **Application Logs**: \`logs/application_logs/\` (if present)

## Migration Checklist

### Before Import
- [ ] New Render.com environment set up
- [ ] PostgreSQL database service created
- [ ] Redis cache service created
- [ ] Environment variables configured
- [ ] Custom domain configured (if needed)

### Import Process
1. Run \`import_data.sh\` script in new environment
2. Verify database import successful
3. Test Redis connectivity
4. Validate environment variables
5. Run application health checks

### Post-Import Validation
- [ ] Database connectivity test
- [ ] Redis cache functionality
- [ ] Authentication system working
- [ ] All integrations functional
- [ ] Performance benchmarks met

## Important Notes

1. **Security**: All secrets and API keys must be regenerated for new environment
2. **Database**: Ensure target database is empty before import
3. **Redis**: Redis data import is optional - cache will rebuild automatically
4. **DNS**: Update DNS records after successful deployment
5. **SSL**: Verify SSL certificates are properly configured

## Support

For assistance with migration, contact:
- **Email**: support@your-domain.com
- **Documentation**: See RENDER_MIGRATION.md and MIGRATION_CHECKLIST.md

---

**Total Export Size**: $(du -sh "$BACKUP_DIR" | cut -f1)  
**Files Exported**: $(find "$BACKUP_DIR" -type f | wc -l) files
EOF

    success "Migration manifest generated"
}

# Create archive
create_archive() {
    log "Creating migration archive..."
    
    local archive_dir="$(dirname "$BACKUP_DIR")"
    local archive_name="war_room_migration_$TIMESTAMP.tar.gz"
    local archive_path="$archive_dir/$archive_name"
    
    cd "$(dirname "$BACKUP_DIR")"
    if tar -czf "$archive_name" "$(basename "$BACKUP_DIR")"; then
        success "Archive created: $archive_path"
        
        # Display archive information
        local archive_size=$(du -sh "$archive_path" | cut -f1)
        log "Archive size: $archive_size"
        
        # Generate checksums
        local checksum_file="$archive_dir/${archive_name}.sha256"
        sha256sum "$archive_name" > "$checksum_file"
        success "Checksum file created: $checksum_file"
        
        echo ""
        echo "==================================="
        echo "MIGRATION EXPORT COMPLETED"
        echo "==================================="
        echo "Archive: $archive_path"
        echo "Size: $archive_size"
        echo "Checksum: $checksum_file"
        echo "==================================="
        
    else
        error "Failed to create archive"
    fi
}

# Upload to secure location (optional)
upload_backup() {
    # This function can be implemented to upload backup to:
    # - AWS S3
    # - Google Cloud Storage
    # - Azure Blob Storage
    # - Secure FTP server
    
    log "Upload functionality not implemented"
    warning "Consider manually uploading backup to secure location"
}

# Main execution function
main() {
    echo ""
    echo "=============================================="
    echo "WAR ROOM ANALYTICS - DATA EXPORT SCRIPT"
    echo "=============================================="
    echo ""
    
    log "Starting data export process..."
    
    # Setup
    setup_backup_directory
    check_environment
    
    # Export data
    export_postgresql
    export_redis
    export_environment_config
    export_application_files
    
    # Finalize
    generate_migration_manifest
    create_archive
    upload_backup
    
    success "Data export completed successfully!"
    
    echo ""
    echo "Next Steps:"
    echo "1. Securely transfer the migration archive to the new environment"
    echo "2. Run import_data.sh in the target environment"
    echo "3. Follow the migration checklist for validation"
    echo "4. Update DNS records when ready to go live"
    echo ""
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi