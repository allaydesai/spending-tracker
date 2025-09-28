#!/bin/bash

# Health monitoring and checks script
set -e

echo "🔍 Starting health monitoring check..."

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-spending-tracker}"
LOG_FILE="${LOG_FILE:-/opt/spending-tracker/logs/monitor.log}"
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_DISK=80
ALERT_THRESHOLD_CPU=80
CHECK_INTERVAL="${CHECK_INTERVAL:-300}" # 5 minutes

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️ $1${NC}"
    log_message "INFO: $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log_message "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    log_message "WARNING: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log_message "ERROR: $1"
}

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_FILE"
}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

print_status "Health monitoring check started"

# Check 1: Container Status
check_container_status() {
    print_status "Checking container status..."

    if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        CONTAINER_STATUS=$(docker inspect "$CONTAINER_NAME" --format '{{.State.Status}}')
        if [ "$CONTAINER_STATUS" = "running" ]; then
            print_success "Container is running"
            return 0
        else
            print_error "Container exists but not running (status: $CONTAINER_STATUS)"
            return 1
        fi
    else
        print_error "Container not found"
        return 1
    fi
}

# Check 2: Application Health
check_application_health() {
    print_status "Checking application health..."

    if curl -f -s -m 10 http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "Health endpoint responding"

        # Get detailed health info
        HEALTH_RESPONSE=$(curl -s -m 5 http://localhost:3000/api/health 2>/dev/null)
        if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
            print_success "Application reports healthy status"
            return 0
        else
            print_warning "Health endpoint responding but status unclear"
            return 1
        fi
    else
        print_error "Health endpoint not responding"
        return 1
    fi
}

# Check 3: Resource Usage
check_resource_usage() {
    print_status "Checking resource usage..."

    # Get container stats
    if docker stats "$CONTAINER_NAME" --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" > /tmp/container_stats 2>/dev/null; then

        # Parse stats
        CPU_USAGE=$(docker stats "$CONTAINER_NAME" --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
        MEM_USAGE=$(docker stats "$CONTAINER_NAME" --no-stream --format "{{.MemPerc}}" | sed 's/%//')
        MEM_ACTUAL=$(docker stats "$CONTAINER_NAME" --no-stream --format "{{.MemUsage}}")

        print_status "CPU Usage: ${CPU_USAGE}%"
        print_status "Memory Usage: ${MEM_USAGE}% ($MEM_ACTUAL)"

        # Check thresholds
        if [ "${CPU_USAGE%.*}" -gt $ALERT_THRESHOLD_CPU ]; then
            print_warning "High CPU usage: ${CPU_USAGE}%"
        fi

        if [ "${MEM_USAGE%.*}" -gt $ALERT_THRESHOLD_MEMORY ]; then
            print_warning "High memory usage: ${MEM_USAGE}%"
        fi

        return 0
    else
        print_error "Could not retrieve container stats"
        return 1
    fi
}

# Check 4: Disk Space
check_disk_space() {
    print_status "Checking disk space..."

    DATA_DIR="${DATA_DIR:-/opt/spending-tracker}"
    if [ -d "$DATA_DIR" ]; then
        DISK_USAGE=$(df "$DATA_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
        DISK_AVAILABLE=$(df -h "$DATA_DIR" | tail -1 | awk '{print $4}')

        print_status "Disk usage: ${DISK_USAGE}% (${DISK_AVAILABLE} available)"

        if [ "$DISK_USAGE" -gt $ALERT_THRESHOLD_DISK ]; then
            print_warning "High disk usage: ${DISK_USAGE}%"
            return 1
        else
            print_success "Disk space OK"
            return 0
        fi
    else
        print_warning "Data directory not found: $DATA_DIR"
        return 1
    fi
}

# Check 5: Docker Service
check_docker_service() {
    print_status "Checking Docker service..."

    if docker info >/dev/null 2>&1; then
        print_success "Docker service is running"
        return 0
    else
        print_error "Docker service not responding"
        return 1
    fi
}

# Check 6: Network Connectivity
check_network() {
    print_status "Checking network connectivity..."

    # Test internal container networking
    if docker exec "$CONTAINER_NAME" wget -q --spider http://localhost:3000 2>/dev/null; then
        print_success "Internal networking OK"
    else
        print_warning "Internal networking issue detected"
    fi

    # Test external port access
    if curl -f -s -m 5 http://localhost:3000 >/dev/null 2>&1; then
        print_success "External port access OK"
        return 0
    else
        print_warning "External port access issue"
        return 1
    fi
}

# Check 7: Log Analysis
check_recent_errors() {
    print_status "Checking for recent errors..."

    # Check container logs for errors in last hour
    if docker logs "$CONTAINER_NAME" --since 1h 2>&1 | grep -i -E "(error|exception|failed)" | tail -5 | grep -q .; then
        print_warning "Recent errors found in logs:"
        docker logs "$CONTAINER_NAME" --since 1h 2>&1 | grep -i -E "(error|exception|failed)" | tail -3
        return 1
    else
        print_success "No recent errors in logs"
        return 0
    fi
}

# Check 8: File System Health
check_filesystem() {
    print_status "Checking file system health..."

    DATA_DIR="${DATA_DIR:-/opt/spending-tracker/data}"
    if [ -d "$DATA_DIR" ]; then
        # Check if directory is writable
        if touch "$DATA_DIR/.health_check" 2>/dev/null; then
            rm -f "$DATA_DIR/.health_check"
            print_success "File system is writable"
            return 0
        else
            print_error "File system not writable"
            return 1
        fi
    else
        print_warning "Data directory does not exist"
        return 1
    fi
}

# Recovery Actions
attempt_recovery() {
    print_status "Attempting automatic recovery..."

    # Try to restart container if it's not running
    if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        print_status "Attempting to start container..."
        if docker start "$CONTAINER_NAME" 2>/dev/null; then
            print_success "Container started successfully"
            sleep 10 # Give time for startup
            return 0
        else
            print_error "Failed to start container"
            return 1
        fi
    fi

    # If container is running but health check fails, try restart
    if ! curl -f -s -m 10 http://localhost:3000/api/health >/dev/null 2>&1; then
        print_status "Attempting to restart container..."
        if docker restart "$CONTAINER_NAME" 2>/dev/null; then
            print_success "Container restarted"
            sleep 15 # Give time for startup
            return 0
        else
            print_error "Failed to restart container"
            return 1
        fi
    fi

    return 0
}

# Main monitoring function
run_health_checks() {
    local failed_checks=0
    local total_checks=8

    echo "🏥 Running comprehensive health checks..."
    echo ""

    # Run all checks
    check_docker_service || ((failed_checks++))
    check_container_status || ((failed_checks++))
    check_application_health || ((failed_checks++))
    check_resource_usage || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_network || ((failed_checks++))
    check_recent_errors || ((failed_checks++))
    check_filesystem || ((failed_checks++))

    # Summary
    echo ""
    echo "📊 Health Check Summary:"
    echo "   Total checks: $total_checks"
    echo "   Passed: $((total_checks - failed_checks))"
    echo "   Failed: $failed_checks"

    if [ "$failed_checks" -eq 0 ]; then
        print_success "All health checks passed! 🎉"
        return 0
    elif [ "$failed_checks" -le 2 ]; then
        print_warning "Some issues detected but system is mostly healthy"
        return 1
    else
        print_error "Multiple critical issues detected"
        return 2
    fi
}

# Continuous monitoring mode
continuous_monitoring() {
    print_status "Starting continuous monitoring mode (interval: ${CHECK_INTERVAL}s)"
    print_status "Press Ctrl+C to stop"

    while true; do
        echo ""
        echo "=== Health Check - $(date) ==="

        if run_health_checks; then
            print_success "System healthy"
        else
            print_warning "Issues detected - attempting recovery"
            attempt_recovery
        fi

        echo "Next check in ${CHECK_INTERVAL} seconds..."
        sleep "$CHECK_INTERVAL"
    done
}

# Status report
generate_status_report() {
    REPORT_FILE="/tmp/spending-tracker-status-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$REPORT_FILE" << EOF
# Spending Tracker Status Report
Generated: $(date)

## Container Information
$(docker inspect "$CONTAINER_NAME" --format 'Name: {{.Name}}
Status: {{.State.Status}}
Health: {{.State.Health.Status}}
Started: {{.State.StartedAt}}
Image: {{.Config.Image}}
Ports: {{range .NetworkSettings.Ports}}{{.}}{{end}}')

## Resource Usage
$(docker stats "$CONTAINER_NAME" --no-stream)

## Disk Usage
$(df -h /opt/spending-tracker 2>/dev/null || echo "Data directory not found")

## Recent Logs (last 20 lines)
$(docker logs "$CONTAINER_NAME" --tail 20 2>&1)

## Health Endpoint Response
$(curl -s http://localhost:3000/api/health 2>/dev/null || echo "Health endpoint not accessible")
EOF

    echo "📋 Status report generated: $REPORT_FILE"
    return 0
}

# Main execution
case "${1:-check}" in
    "check"|"")
        run_health_checks
        ;;
    "monitor")
        continuous_monitoring
        ;;
    "report")
        generate_status_report
        ;;
    "recovery")
        attempt_recovery
        ;;
    "--help"|"-h")
        echo "Usage: $0 [check|monitor|report|recovery]"
        echo ""
        echo "Commands:"
        echo "  check    - Run one-time health checks (default)"
        echo "  monitor  - Continuous monitoring mode"
        echo "  report   - Generate detailed status report"
        echo "  recovery - Attempt automatic recovery"
        echo ""
        echo "Environment variables:"
        echo "  CONTAINER_NAME - Container name (default: spending-tracker)"
        echo "  LOG_FILE - Log file path (default: /opt/spending-tracker/logs/monitor.log)"
        echo "  CHECK_INTERVAL - Monitoring interval in seconds (default: 300)"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 --help' for usage information"
        exit 1
        ;;
esac