#!/bin/bash

# Data backup automation script
set -e

echo "💾 Starting data backup process..."

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/spending-tracker/backups}"
DATA_DIR="${DATA_DIR:-/opt/spending-tracker/data}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="spending-tracker-backup-$TIMESTAMP"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️ $1${NC}"
    echo "$(date): $1" >> "$LOG_FILE"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "$(date): SUCCESS - $1" >> "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    echo "$(date): WARNING - $1" >> "$LOG_FILE"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "$(date): ERROR - $1" >> "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Initialize log file
echo "$(date): Starting backup process" >> "$LOG_FILE"

# Check if data directory exists
if [ ! -d "$DATA_DIR" ]; then
    print_error "Data directory not found: $DATA_DIR"
    exit 1
fi

# Check available disk space
print_status "Checking available disk space..."
AVAILABLE_SPACE=$(df -BG "$BACKUP_DIR" | tail -1 | awk '{print $4}' | sed 's/G//')
DATA_SIZE=$(du -BG "$DATA_DIR" | tail -1 | awk '{print $1}' | sed 's/G//')

if [ "$AVAILABLE_SPACE" -lt "$((DATA_SIZE * 2))" ]; then
    print_warning "Low disk space. Available: ${AVAILABLE_SPACE}GB, Data: ${DATA_SIZE}GB"
fi

# Create backup
print_status "Creating backup: $BACKUP_NAME.tar.gz"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Include metadata in backup
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy data to temp directory
cp -r "$DATA_DIR"/* "$TEMP_DIR"/ 2>/dev/null || true

# Create metadata file
cat > "$TEMP_DIR/backup-metadata.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "local_time": "$(date)",
  "data_directory": "$DATA_DIR",
  "backup_directory": "$BACKUP_DIR",
  "file_count": $(find "$DATA_DIR" -type f 2>/dev/null | wc -l),
  "total_size_bytes": $(du -sb "$DATA_DIR" 2>/dev/null | cut -f1),
  "csv_files": $(find "$DATA_DIR" -name "*.csv" 2>/dev/null | wc -l),
  "container_status": "$(docker inspect spending-tracker --format='{{.State.Status}}' 2>/dev/null || echo 'unknown')",
  "container_health": "$(docker inspect spending-tracker --format='{{.State.Health.Status}}' 2>/dev/null || echo 'unknown')"
}
EOF

# Create the backup
if tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" .; then
    print_success "Backup created successfully"
else
    print_error "Failed to create backup"
    exit 1
fi

# Verify backup integrity
print_status "Verifying backup integrity..."
if tar -tzf "$BACKUP_FILE" >/dev/null 2>&1; then
    print_success "Backup integrity verified"
else
    print_error "Backup verification failed"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
FILE_COUNT=$(tar -tzf "$BACKUP_FILE" | wc -l)

print_success "Backup completed: $BACKUP_FILE"
print_status "Backup size: $BACKUP_SIZE"
print_status "Files in backup: $FILE_COUNT"

# Clean up old backups
print_status "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
DELETED_COUNT=0

find "$BACKUP_DIR" -name "spending-tracker-backup-*.tar.gz" -mtime +$RETENTION_DAYS -type f | while read -r old_backup; do
    if [ -f "$old_backup" ]; then
        rm "$old_backup"
        echo "$(date): Deleted old backup: $(basename "$old_backup")" >> "$LOG_FILE"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    fi
done

if [ "$DELETED_COUNT" -gt 0 ]; then
    print_status "Deleted $DELETED_COUNT old backup(s)"
else
    print_status "No old backups to clean up"
fi

# Generate backup report
REPORT_FILE="$BACKUP_DIR/backup-report-$(date +%Y%m).txt"
echo "=== Backup Report - $(date) ===" >> "$REPORT_FILE"
echo "Backup file: $BACKUP_NAME.tar.gz" >> "$REPORT_FILE"
echo "Size: $BACKUP_SIZE" >> "$REPORT_FILE"
echo "Files: $FILE_COUNT" >> "$REPORT_FILE"
echo "Data directory: $DATA_DIR" >> "$REPORT_FILE"
echo "Container status: $(docker inspect spending-tracker --format='{{.State.Status}}' 2>/dev/null || echo 'unknown')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Summary
print_success "Backup process completed successfully!"
echo ""
echo "📊 Backup Summary:"
echo "   File: $BACKUP_FILE"
echo "   Size: $BACKUP_SIZE"
echo "   Files: $FILE_COUNT"
echo "   Retention: $RETENTION_DAYS days"
echo ""
echo "🗂️ Recent backups:"
ls -lt "$BACKUP_DIR"/spending-tracker-backup-*.tar.gz 2>/dev/null | head -5 || echo "   No backups found"

# Check backup frequency
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "spending-tracker-backup-*.tar.gz" -mtime -7 | wc -l)
if [ "$BACKUP_COUNT" -lt 7 ]; then
    print_warning "Only $BACKUP_COUNT backups in the last 7 days. Consider checking backup schedule."
fi

# Disk usage warning
BACKUP_DIR_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
print_status "Total backup storage used: $BACKUP_DIR_SIZE"

echo "$(date): Backup process completed successfully" >> "$LOG_FILE"