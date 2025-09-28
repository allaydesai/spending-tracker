#!/bin/bash

# Data restore procedure script
set -e

echo "🔄 Starting data restore process..."

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/spending-tracker/backups}"
DATA_DIR="${DATA_DIR:-/opt/spending-tracker/data}"
BACKUP_FILE="${1}"
CONTAINER_NAME="${CONTAINER_NAME:-spending-tracker}"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE} Spending Tracker Data Restore${NC}"
    echo -e "${BLUE}======================================${NC}"
}

show_usage() {
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Examples:"
    echo "  $0 spending-tracker-backup-20240101-120000.tar.gz"
    echo "  $0 /path/to/backup.tar.gz"
    echo ""
    echo "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -lt "$BACKUP_DIR"/spending-tracker-backup-*.tar.gz 2>/dev/null | head -10 || echo "  No backups found"
    else
        echo "  Backup directory not found: $BACKUP_DIR"
    fi
}

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    print_error "Backup file not specified"
    show_usage
    exit 1
fi

print_header

# Resolve backup file path
if [ ! -f "$BACKUP_FILE" ]; then
    # Try to find file in backup directory
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        print_error "Backup file not found: $BACKUP_FILE"
        show_usage
        exit 1
    fi
fi

BACKUP_FILE=$(realpath "$BACKUP_FILE")
print_status "Using backup file: $BACKUP_FILE"

# Verify backup file
print_status "Verifying backup file integrity..."
if ! tar -tzf "$BACKUP_FILE" >/dev/null 2>&1; then
    print_error "Backup file is corrupted or invalid"
    exit 1
fi
print_success "Backup file integrity verified"

# Get backup information
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
FILE_COUNT=$(tar -tzf "$BACKUP_FILE" | wc -l)
print_status "Backup size: $BACKUP_SIZE"
print_status "Files in backup: $FILE_COUNT"

# Check if metadata exists in backup
if tar -tzf "$BACKUP_FILE" | grep -q "backup-metadata.json"; then
    print_status "Extracting backup metadata..."
    TEMP_METADATA=$(mktemp)
    tar -xzf "$BACKUP_FILE" -O backup-metadata.json > "$TEMP_METADATA" 2>/dev/null || true

    if [ -s "$TEMP_METADATA" ]; then
        echo "📋 Backup Information:"
        if command -v jq >/dev/null 2>&1; then
            jq -r '
                "   Created: " + .local_time +
                "\n   Original data directory: " + .data_directory +
                "\n   File count: " + (.file_count | tostring) +
                "\n   CSV files: " + (.csv_files | tostring) +
                "\n   Container status: " + .container_status
            ' "$TEMP_METADATA"
        else
            cat "$TEMP_METADATA"
        fi
    fi
    rm -f "$TEMP_METADATA"
fi

# Warning and confirmation
print_warning "This will replace ALL data in: $DATA_DIR"
print_warning "Current data will be backed up to: ${DATA_DIR}.backup-$(date +%Y%m%d-%H%M%S)"
echo ""
read -p "Do you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Restore cancelled by user"
    exit 0
fi

# Check if container is running
print_status "Checking container status..."
CONTAINER_RUNNING=false
if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    print_warning "Container $CONTAINER_NAME is currently running"
    CONTAINER_RUNNING=true

    read -p "Stop container during restore? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "Stopping container..."
        docker stop "$CONTAINER_NAME"
        print_success "Container stopped"
    else
        print_warning "Restoring while container is running may cause issues"
    fi
fi

# Create backup of current data
if [ -d "$DATA_DIR" ] && [ "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
    CURRENT_BACKUP="${DATA_DIR}.backup-$(date +%Y%m%d-%H%M%S)"
    print_status "Backing up current data to: $CURRENT_BACKUP"

    if cp -r "$DATA_DIR" "$CURRENT_BACKUP"; then
        print_success "Current data backed up"
    else
        print_error "Failed to backup current data"
        exit 1
    fi
else
    print_status "No existing data to backup"
fi

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Clear existing data
print_status "Clearing existing data..."
rm -rf "${DATA_DIR:?}"/*

# Restore data from backup
print_status "Restoring data from backup..."
TEMP_RESTORE=$(mktemp -d)
trap "rm -rf $TEMP_RESTORE" EXIT

# Extract backup to temporary directory
if tar -xzf "$BACKUP_FILE" -C "$TEMP_RESTORE"; then
    print_success "Backup extracted successfully"
else
    print_error "Failed to extract backup"
    exit 1
fi

# Copy data files (excluding metadata)
print_status "Copying restored files..."
find "$TEMP_RESTORE" -type f ! -name "backup-metadata.json" -exec cp {} "$DATA_DIR"/ \;

# Set proper permissions
print_status "Setting file permissions..."
chown -R 1001:1001 "$DATA_DIR" 2>/dev/null || {
    print_warning "Could not set ownership to 1001:1001 (may require sudo)"
    print_status "Current user will be used as owner"
}
chmod -R 755 "$DATA_DIR"

# Verify restoration
print_status "Verifying restoration..."
RESTORED_COUNT=$(find "$DATA_DIR" -type f | wc -l)
RESTORED_SIZE=$(du -sh "$DATA_DIR" | cut -f1)

print_success "Data restoration completed!"
print_status "Restored files: $RESTORED_COUNT"
print_status "Restored data size: $RESTORED_SIZE"

# List restored files
echo ""
echo "📁 Restored files:"
ls -la "$DATA_DIR"

# Start container if it was running
if [ "$CONTAINER_RUNNING" = true ]; then
    read -p "Start container now? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "Starting container..."
        if docker start "$CONTAINER_NAME"; then
            print_success "Container started"

            # Wait a moment and check health
            sleep 5
            if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
                print_success "Application is responding normally"
            else
                print_warning "Application may need more time to start"
            fi
        else
            print_error "Failed to start container"
        fi
    fi
fi

# Final summary
echo ""
print_success "Restore process completed successfully!"
echo ""
echo "📊 Restore Summary:"
echo "   Source backup: $(basename "$BACKUP_FILE")"
echo "   Backup size: $BACKUP_SIZE"
echo "   Files restored: $RESTORED_COUNT"
echo "   Target directory: $DATA_DIR"
echo "   Data size: $RESTORED_SIZE"
echo ""
echo "🔧 Next steps:"
echo "   1. Verify application functionality"
echo "   2. Test CSV upload and processing"
echo "   3. Check that charts render correctly"
echo "   4. Monitor application logs: docker logs $CONTAINER_NAME"
echo ""
if [ -n "$CURRENT_BACKUP" ]; then
    echo "💾 Previous data backed up to: $CURRENT_BACKUP"
    echo "   Remove when confident restore is successful: rm -rf $CURRENT_BACKUP"
fi