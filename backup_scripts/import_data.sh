#!/bin/bash

# ==============================================================================
# WAR ROOM ANALYTICS PLATFORM - DATA IMPORT SCRIPT
# ==============================================================================
# This script imports data from the migration export into the new deployment
# Run this script in the new Render.com environment after setup is complete
# ==============================================================================

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$PROJECT_ROOT/import_log_$TIMESTAMP.txt"

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

# Usage information
usage() {
    echo ""
    echo "Usage: $0 [OPTIONS] <migration_archive>"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -f, --force             Force import even if data exists"
    echo "  --skip-database         Skip database import"
    echo "  --skip-redis           Skip Redis import"
    echo "  --skip-files           Skip file import"
    echo "  --validate-only        Only validate import package"
    echo ""
    echo "Arguments:"
    echo "  migration_archive       Path to the migration .tar.gz archive"
    echo ""
    echo "Examples:"
    echo "  $0 war_room_migration_20240108_143022.tar.gz"
    echo "  $0 --validate-only migration.tar.gz"
    echo "  $0 --skip-redis --force migration.tar.gz"
    echo ""
}

# Parse command line arguments
FORCE_IMPORT=false
SKIP_DATABASE=false
SKIP_REDIS=false
SKIP_FILES=false
VALIDATE_ONLY=false
MIGRATION_ARCHIVE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -f|--force)
            FORCE_IMPORT=true
            shift
            ;;
        --skip-database)
            SKIP_DATABASE=true
            shift
            ;;
        --skip-redis)
            SKIP_REDIS=true
            shift
            ;;
        --skip-files)
            SKIP_FILES=true
            shift
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        -*)
            error "Unknown option $1"
            ;;
        *)
            if [[ -z "$MIGRATION_ARCHIVE" ]]; then
                MIGRATION_ARCHIVE="$1"
            else
                error "Multiple archives specified. Please provide only one archive."
            fi
            shift
            ;;
    esac
done

if [[ -z "$MIGRATION_ARCHIVE" ]]; then
    error "Migration archive not specified. Use --help for usage information."
fi

# Check if archive exists
if [[ ! -f "$MIGRATION_ARCHIVE" ]]; then
    error "Migration archive not found: $MIGRATION_ARCHIVE"
fi

# Validate environment
check_environment() {
    log "Checking target environment..."
    
    # Check required environment variables
    if [[ -z "$DATABASE_URL" ]]; then
        error "DATABASE_URL environment variable not set"
    fi
    
    if [[ "$SKIP_REDIS" != true && -z "$REDIS_URL" ]]; then
        warning "REDIS_URL environment variable not set - Redis import will be skipped"
        SKIP_REDIS=true
    fi
    
    # Check required commands
    local required_commands=("psql" "tar")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "$cmd command not found. Please install required tools."
        fi
    done
    
    # Check Redis CLI if needed
    if [[ "$SKIP_REDIS" != true && ! command -v "redis-cli" &> /dev/null ]]; then
        warning "redis-cli not found. Redis import will be skipped."
        SKIP_REDIS=true
    fi
    
    success "Environment validation passed"
}

# Extract migration archive
extract_archive() {
    log "Extracting migration archive: $MIGRATION_ARCHIVE"
    
    local extract_dir="$PROJECT_ROOT/migration_import_$TIMESTAMP"
    mkdir -p "$extract_dir"
    
    # Verify archive integrity
    if [[ -f "${MIGRATION_ARCHIVE}.sha256" ]]; then
        log "Verifying archive checksum..."
        if sha256sum -c "${MIGRATION_ARCHIVE}.sha256"; then
            success "Archive checksum verification passed"
        else
            error "Archive checksum verification failed"
        fi
    else
        warning "No checksum file found - skipping verification"
    fi
    
    # Extract archive
    if tar -xzf "$MIGRATION_ARCHIVE" -C "$extract_dir"; then
        success "Archive extracted to: $extract_dir"
        
        # Find the extracted directory
        local extracted_dir=$(find "$extract_dir" -mindepth 1 -maxdepth 1 -type d | head -1)
        if [[ -z "$extracted_dir" ]]; then
            error "Could not find extracted directory"
        fi
        
        echo "$extracted_dir"
    else
        error "Failed to extract archive"
    fi
}

# Validate migration package
validate_package() {
    local package_dir="$1"
    
    log "Validating migration package structure..."
    
    local required_files=(
        "MIGRATION_MANIFEST.md"
        "export_log.txt"
        "database"
        "config"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -e "$package_dir/$file" ]]; then
            error "Required file/directory not found in package: $file"
        fi
    done
    
    # Check for database files
    local db_files=$(find "$package_dir/database" -name "*.sql" | wc -l)
    if [[ "$db_files" -eq 0 ]]; then
        error "No database SQL files found in package"
    fi
    
    log "Found $db_files database files"
    
    # Check for configuration files
    if [[ ! -f "$package_dir/config/environment_variables_"*".txt" ]]; then
        warning "No environment configuration found in package"
    fi
    
    success "Migration package validation completed"
    
    # Display package information
    if [[ -f "$package_dir/MIGRATION_MANIFEST.md" ]]; then
        log "Package information:"
        echo "----------------------------------------"
        head -20 "$package_dir/MIGRATION_MANIFEST.md"
        echo "----------------------------------------"
    fi
}

# Check existing data
check_existing_data() {
    log "Checking for existing data in target database..."
    
    # Check if database has any user tables
    local table_count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    " 2>/dev/null | xargs)
    
    if [[ "$table_count" -gt 0 ]]; then
        if [[ "$FORCE_IMPORT" == true ]]; then
            warning "Found $table_count existing tables. Proceeding with --force option."
        else
            error "Target database contains $table_count existing tables. Use --force to proceed anyway."
        fi
    else
        success "Target database is empty - safe to proceed with import"
    fi
}

# Import database
import_database() {
    local package_dir="$1"
    
    if [[ "$SKIP_DATABASE" == true ]]; then
        log "Skipping database import as requested"
        return
    fi
    
    log "Starting database import..."
    
    # Find the main database dump file
    local db_dump_file=$(find "$package_dir/database" -name "*database*.sql" | head -1)
    
    if [[ -z "$db_dump_file" || ! -f "$db_dump_file" ]]; then
        error "Database dump file not found in package"
    fi
    
    log "Importing database from: $(basename "$db_dump_file")"
    
    # Create backup of current state (if any data exists)
    if [[ "$FORCE_IMPORT" == true ]]; then
        log "Creating backup of existing data..."
        local backup_file="$PROJECT_ROOT/pre_import_backup_$TIMESTAMP.sql"
        pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null || warning "Could not create backup"
    fi
    
    # Import database
    log "Importing database (this may take several minutes)..."
    if psql "$DATABASE_URL" < "$db_dump_file"; then
        success "Database import completed successfully"
    else
        error "Database import failed"
    fi
    
    # Verify import
    local imported_tables=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    " 2>/dev/null | xargs)
    
    log "Import verification: $imported_tables tables found in database"
    
    if [[ "$imported_tables" -gt 0 ]]; then
        success "Database import verification passed"
    else
        error "Database import verification failed - no tables found"
    fi
}

# Import Redis data
import_redis() {
    local package_dir="$1"
    
    if [[ "$SKIP_REDIS" == true ]]; then
        log "Skipping Redis import as requested"
        return
    fi
    
    log "Starting Redis data import..."
    
    # Find Redis command file
    local redis_commands_file=$(find "$package_dir/redis" -name "*commands*.txt" | head -1)
    
    if [[ -z "$redis_commands_file" || ! -f "$redis_commands_file" ]]; then
        warning "Redis commands file not found - skipping Redis import"
        return
    fi
    
    # Extract Redis connection details
    local redis_host=$(echo "$REDIS_URL" | sed 's|redis://||' | sed 's|:.*||')
    local redis_port=$(echo "$REDIS_URL" | sed 's|.*:||' | sed 's|/.*||')
    
    # Test Redis connection
    if ! redis-cli -h "$redis_host" -p "$redis_port" ping > /dev/null 2>&1; then
        warning "Cannot connect to Redis - skipping Redis import"
        return
    fi
    
    log "Importing Redis data from: $(basename "$redis_commands_file")"
    
    # Import Redis commands
    local imported_keys=0
    while IFS= read -r line; do
        if [[ "$line" =~ ^#\ Key:\ (.+)$ ]]; then
            # This is a key comment line
            continue
        elif [[ -n "$line" && ! "$line" =~ ^# ]]; then
            # This is a Redis command
            echo "$line" | redis-cli -h "$redis_host" -p "$redis_port" > /dev/null 2>&1 && ((imported_keys++)) || true
        fi
    done < "$redis_commands_file"
    
    if [[ "$imported_keys" -gt 0 ]]; then
        success "Redis import completed: $imported_keys keys imported"
    else
        warning "No Redis keys were imported"
    fi
}

# Import application files
import_files() {
    local package_dir="$1"
    
    if [[ "$SKIP_FILES" == true ]]; then
        log "Skipping file import as requested"
        return
    fi
    
    log "Starting application files import..."
    
    # Import storage files
    if [[ -d "$package_dir/files/storage" ]]; then
        log "Importing storage files..."
        local target_storage="$PROJECT_ROOT/src/backend/storage"
        mkdir -p "$target_storage"
        
        if cp -r "$package_dir/files/storage"/* "$target_storage/" 2>/dev/null; then
            local file_count=$(find "$target_storage" -type f | wc -l)
            success "Storage files imported: $file_count files"
        else
            warning "Could not import storage files"
        fi
    fi
    
    # Import certificates (if present)
    if [[ -d "$package_dir/files/certificates" ]]; then
        log "Importing certificates..."
        local target_certs="$PROJECT_ROOT/certificates"
        mkdir -p "$target_certs"
        
        if cp -r "$package_dir/files/certificates"/* "$target_certs/" 2>/dev/null; then
            success "Certificates imported"
            warning "Remember to update file permissions for certificates"
        else
            warning "Could not import certificates"
        fi
    fi
    
    success "Application files import completed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if migration script exists
    local migration_script="$PROJECT_ROOT/src/backend/alembic/env.py"
    if [[ -f "$migration_script" ]]; then
        cd "$PROJECT_ROOT/src/backend"
        
        # Run Alembic migrations
        if python -m alembic upgrade head; then
            success "Database migrations completed successfully"
        else
            warning "Database migrations failed - check manually"
        fi
        
        cd "$PROJECT_ROOT"
    else
        warning "No migration system found - skipping migrations"
    fi
}

# Validate import
validate_import() {
    log "Validating import results..."
    
    local validation_errors=0
    
    # Test database connection and basic queries
    log "Testing database connectivity..."
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        success "Database connection test passed"
    else
        error "Database connection test failed"
        ((validation_errors++))
    fi
    
    # Test Redis connection (if not skipped)
    if [[ "$SKIP_REDIS" != true ]]; then
        log "Testing Redis connectivity..."
        local redis_host=$(echo "$REDIS_URL" | sed 's|redis://||' | sed 's|:.*||')
        local redis_port=$(echo "$REDIS_URL" | sed 's|.*:||' | sed 's|/.*||')
        
        if redis-cli -h "$redis_host" -p "$redis_port" ping > /dev/null 2>&1; then
            success "Redis connection test passed"
        else
            warning "Redis connection test failed"
            ((validation_errors++))
        fi
    fi
    
    # Check table counts
    local table_count=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    " 2>/dev/null | xargs)
    
    log "Database validation: $table_count tables found"
    
    if [[ "$table_count" -gt 0 ]]; then
        success "Database validation passed"
    else
        error "Database validation failed - no tables found"
        ((validation_errors++))
    fi
    
    # Basic application health check
    log "Running basic application health checks..."
    
    # Check if we can import Python modules
    cd "$PROJECT_ROOT/src/backend"
    if python -c "import main; print('Backend modules can be imported')" 2>/dev/null; then
        success "Backend application validation passed"
    else
        warning "Backend application validation failed"
        ((validation_errors++))
    fi
    cd "$PROJECT_ROOT"
    
    if [[ "$validation_errors" -eq 0 ]]; then
        success "All validation checks passed!"
    else
        warning "$validation_errors validation errors found - please review"
    fi
    
    return $validation_errors
}

# Generate import report
generate_import_report() {
    local package_dir="$1"
    
    log "Generating import report..."
    
    local report_file="$PROJECT_ROOT/IMPORT_REPORT_$TIMESTAMP.md"
    
    cat << EOF > "$report_file"
# War Room Analytics Import Report

**Import Date**: $(date)  
**Source Package**: $(basename "$MIGRATION_ARCHIVE")  
**Target Environment**: ${ENVIRONMENT:-production}  
**Import Log**: $LOG_FILE

## Import Summary

### Database Import
- Status: $([ "$SKIP_DATABASE" == "true" ] && echo "Skipped" || echo "Completed")
- Tables Imported: $(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs || echo "Unknown")

### Redis Import
- Status: $([ "$SKIP_REDIS" == "true" ] && echo "Skipped" || echo "Attempted")

### Files Import
- Status: $([ "$SKIP_FILES" == "true" ] && echo "Skipped" || echo "Completed")

### Migrations
- Database migrations: $([ -f "$PROJECT_ROOT/src/backend/alembic/env.py" ] && echo "Available" || echo "Not available")

## Validation Results

$(
if validate_import >/dev/null 2>&1; then
    echo "✅ All validation checks passed"
else
    echo "⚠️  Some validation issues found - see log for details"
fi
)

## Next Steps

### Required Actions
1. [ ] Update environment variables with production values
2. [ ] Test authentication system
3. [ ] Verify external integrations (Supabase, PostHog, etc.)
4. [ ] Run full application health check
5. [ ] Update DNS records (when ready)

### Optional Actions
- [ ] Set up monitoring and alerts
- [ ] Configure backup schedules
- [ ] Review and update documentation
- [ ] Train team on new environment

## Support

If you encounter issues:
1. Check the import log: $LOG_FILE
2. Review the migration checklist: MIGRATION_CHECKLIST.md
3. Contact support: support@your-domain.com

---

**Import completed at**: $(date)
EOF

    success "Import report generated: $report_file"
}

# Main execution function
main() {
    echo ""
    echo "=============================================="
    echo "WAR ROOM ANALYTICS - DATA IMPORT SCRIPT"
    echo "=============================================="
    echo ""
    
    log "Starting data import process..."
    log "Migration archive: $MIGRATION_ARCHIVE"
    log "Options: Force=$FORCE_IMPORT, Skip-DB=$SKIP_DATABASE, Skip-Redis=$SKIP_REDIS, Skip-Files=$SKIP_FILES, Validate-Only=$VALIDATE_ONLY"
    
    # Initial setup and validation
    check_environment
    local package_dir=$(extract_archive)
    validate_package "$package_dir"
    
    if [[ "$VALIDATE_ONLY" == true ]]; then
        success "Package validation completed. Exiting as requested."
        return 0
    fi
    
    # Pre-import checks
    check_existing_data
    
    # Import data
    import_database "$package_dir"
    import_redis "$package_dir"
    import_files "$package_dir"
    
    # Post-import tasks
    run_migrations
    validate_import
    generate_import_report "$package_dir"
    
    # Cleanup
    rm -rf "$package_dir"
    
    success "Data import completed successfully!"
    
    echo ""
    echo "==================================="
    echo "IMPORT COMPLETED"
    echo "==================================="
    echo "Log File: $LOG_FILE"
    echo "Report: $PROJECT_ROOT/IMPORT_REPORT_$TIMESTAMP.md"
    echo "==================================="
    echo ""
    echo "Next Steps:"
    echo "1. Review import report and logs"
    echo "2. Test application functionality"
    echo "3. Update environment variables"
    echo "4. Configure external integrations"
    echo "5. Run full system validation"
    echo ""
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi