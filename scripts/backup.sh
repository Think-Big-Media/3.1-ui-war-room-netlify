#!/bin/bash

# War Room Database Backup Script
# Automated backup with rotation and compression

set -e

# Configuration
DB_NAME="warroom"
DB_USER="warroom"
BACKUP_DIR="/backups"
RETENTION_DAYS=30
MAX_BACKUPS=50

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

create_backup() {
    local backup_type="$1"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/${DB_NAME}_${backup_type}_${timestamp}.sql"
    local compressed_file="${backup_file}.gz"
    
    log_info "Creating $backup_type backup..."
    
    # Create database backup
    if pg_dump -h db -U "$DB_USER" -d "$DB_NAME" > "$backup_file"; then
        log_info "Database backup created: $backup_file"
        
        # Compress backup
        if gzip "$backup_file"; then
            log_info "Backup compressed: $compressed_file"
            
            # Verify backup integrity
            if gunzip -t "$compressed_file" 2>/dev/null; then
                log_info "Backup integrity verified"
                
                # Calculate backup size
                local size=$(du -h "$compressed_file" | cut -f1)
                log_info "Backup size: $size"
                
                # Create backup metadata
                local metadata_file="${compressed_file}.meta"
                cat > "$metadata_file" << EOF
{
    "backup_type": "$backup_type",
    "timestamp": "$timestamp",
    "database": "$DB_NAME",
    "size": "$size",
    "checksum": "$(md5sum "$compressed_file" | cut -d' ' -f1)",
    "created_at": "$(date -u '+%Y-%m-%d %H:%M:%S') UTC"
}
EOF
                log_info "Backup metadata created: $metadata_file"
                
                return 0
            else
                log_error "Backup integrity check failed"
                rm -f "$compressed_file"
                return 1
            fi
        else
            log_error "Failed to compress backup"
            rm -f "$backup_file"
            return 1
        fi
    else
        log_error "Failed to create database backup"
        return 1
    fi
}

create_schema_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local schema_file="$BACKUP_DIR/${DB_NAME}_schema_${timestamp}.sql"
    
    log_info "Creating schema backup..."
    
    if pg_dump -h db -U "$DB_USER" -d "$DB_NAME" --schema-only > "$schema_file"; then
        log_info "Schema backup created: $schema_file"
        
        # Compress schema backup
        if gzip "$schema_file"; then
            log_info "Schema backup compressed: ${schema_file}.gz"
        fi
    else
        log_error "Failed to create schema backup"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Remove backups older than retention period
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "${DB_NAME}_*.meta" -mtime +$RETENTION_DAYS -delete
    
    # Keep only the latest MAX_BACKUPS
    local backup_count=$(ls -1 "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | wc -l)
    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        local excess=$((backup_count - MAX_BACKUPS))
        ls -1t "$BACKUP_DIR"/${DB_NAME}_*.sql.gz | tail -n "$excess" | xargs rm -f
        ls -1t "$BACKUP_DIR"/${DB_NAME}_*.meta | tail -n "$excess" | xargs rm -f
        log_info "Removed $excess old backups"
    fi
    
    log_info "Backup cleanup completed"
}

get_backup_stats() {
    local backup_count=$(ls -1 "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | awk '{s+=$1} END {print s}' || echo "0")
    local latest_backup=$(ls -1t "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | head -n1)
    
    log_info "Backup statistics:"
    log_info "  Total backups: $backup_count"
    log_info "  Total size: ${total_size:-0}M"
    log_info "  Latest backup: ${latest_backup:-none}"
}

test_backup_restore() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Testing backup restore capability..."
    
    # Test if backup can be restored (dry run)
    if gunzip -c "$backup_file" | pg_restore --list > /dev/null 2>&1; then
        log_info "Backup restore test passed"
        return 0
    else
        log_warn "Backup restore test failed - file may be a plain SQL dump"
        # Try as plain SQL
        if gunzip -t "$backup_file" 2>/dev/null; then
            log_info "Backup file is valid compressed SQL"
            return 0
        else
            log_error "Backup file is corrupted"
            return 1
        fi
    fi
}

send_notification() {
    local status="$1"
    local message="$2"
    
    # Send notification via webhook if configured
    if [ -n "$BACKUP_WEBHOOK_URL" ]; then
        curl -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\": \"$status\", \"message\": \"$message\", \"timestamp\": \"$(date -u)\"}" \
            > /dev/null 2>&1 || true
    fi
    
    # Log to syslog if available
    if command -v logger > /dev/null 2>&1; then
        logger -t warroom-backup "$status: $message"
    fi
}

main() {
    local backup_type="${1:-full}"
    
    log_info "Starting War Room backup process..."
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    # Check database connectivity
    if ! pg_isready -h db -U "$DB_USER" > /dev/null 2>&1; then
        log_error "Database is not accessible"
        send_notification "ERROR" "Database backup failed - database not accessible"
        exit 1
    fi
    
    # Create backup based on type
    case "$backup_type" in
        "full")
            if create_backup "full"; then
                log_info "Full backup completed successfully"
                send_notification "SUCCESS" "Full database backup completed"
            else
                log_error "Full backup failed"
                send_notification "ERROR" "Full database backup failed"
                exit 1
            fi
            ;;
        "schema")
            create_schema_backup
            ;;
        "incremental")
            # For incremental backups, we could use WAL-E or similar
            log_warn "Incremental backups not implemented yet"
            create_backup "incremental"
            ;;
        *)
            log_error "Invalid backup type: $backup_type"
            echo "Usage: $0 [full|schema|incremental]"
            exit 1
            ;;
    esac
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Show backup statistics
    get_backup_stats
    
    log_info "Backup process completed"
}

# Run main function with arguments
main "$@"