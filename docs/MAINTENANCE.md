# Maintenance Guide: Spending Tracker

Comprehensive guide for maintaining your Spending Tracker deployment, including updates, monitoring, backups, and performance optimization.

## Regular Maintenance Tasks

### Daily Tasks (Automated)

These tasks are automated but should be monitored:

1. **Automated Backups** (2:00 AM daily)
   - Check backup logs: `tail -f /opt/spending-tracker/logs/backup.log`
   - Verify backup files: `ls -la /opt/spending-tracker/backups/`

2. **Health Monitoring**
   - Docker health checks run automatically
   - Monitor via: `docker inspect spending-tracker --format='{{.State.Health.Status}}'`

3. **Log Rotation**
   - Logs rotated automatically via logrotate
   - Check: `sudo logrotate -d /etc/logrotate.d/spending-tracker`

### Weekly Tasks

#### 1. System Health Check

```bash
#!/bin/bash
# Weekly health check script

echo "=== Weekly Health Check - $(date) ==="

# Container status
echo "Container Status:"
docker ps | grep spending-tracker

# Resource usage
echo "Resource Usage:"
docker stats spending-tracker --no-stream

# Disk space
echo "Disk Space:"
df -h /opt/spending-tracker

# Memory usage
echo "Memory Usage:"
free -h

# Recent errors in logs
echo "Recent Errors:"
docker logs spending-tracker --since 168h 2>&1 | grep -i error | tail -10

# Backup verification
echo "Recent Backups:"
ls -lt /opt/spending-tracker/backups/ | head -5

echo "=== Health Check Complete ==="
```

#### 2. Backup Verification

```bash
# Test latest backup
LATEST_BACKUP=$(ls -t /opt/spending-tracker/backups/spending-tracker-backup-*.tar.gz | head -1)
echo "Testing backup: $LATEST_BACKUP"

# Verify backup integrity
tar -tzf "$LATEST_BACKUP" > /dev/null && echo "✅ Backup integrity OK" || echo "❌ Backup corrupted"

# Check backup size
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Count files in backup
FILE_COUNT=$(tar -tzf "$LATEST_BACKUP" | wc -l)
echo "Files in backup: $FILE_COUNT"
```

### Monthly Tasks

#### 1. Update System Packages

```bash
# On Ubuntu server
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get autoremove -y
sudo apt-get autoclean
```

#### 2. Docker Maintenance

```bash
# Clean up unused Docker resources
docker system prune -f

# Clean up old images (keep last 3)
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | \
  grep spending-tracker | tail -n +4 | awk '{print $3}' | xargs -r docker rmi

# Update Docker (if needed)
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

#### 3. Performance Review

```bash
# Analyze container performance over time
docker stats spending-tracker --no-stream
# Expected: Memory 17-25MB, CPU <0.1%

# Check log file sizes
du -sh /opt/spending-tracker/logs/*

# Review backup storage usage
du -sh /opt/spending-tracker/backups/
# Typical backup size: 10-20KB per backup

# Check data growth
du -sh /opt/spending-tracker/data/
# Growth rate: varies with CSV upload frequency
```

**Performance Baselines** (verified through testing):
- **Idle Memory**: 17-25MB
- **Peak Memory**: <50MB during CSV processing
- **CPU Usage**: <0.1% idle, <1% during file processing
- **Startup Time**: 8-12 seconds to healthy status
- **Response Time**: <100ms for API calls

### Quarterly Tasks

#### 1. Security Updates

```bash
# Update base image
docker pull node:20-alpine

# Rebuild application with latest base
./scripts/build.sh

# Deploy updated version
./scripts/deploy-to-server.sh your-server ubuntu
```

#### 2. Capacity Planning

- Review storage growth trends
- Analyze memory and CPU usage patterns
- Plan for scaling if needed
- Update resource limits if necessary

## Application Updates

### Version Update Process

1. **Prepare for Update**:
   ```bash
   # Create manual backup before update
   /opt/spending-tracker/backup.sh

   # Note current version
   curl http://localhost:3000/api/health | grep version
   ```

2. **Build New Version**:
   ```bash
   # Development environment
   git pull origin main
   ./scripts/build.sh v1.1.0
   ./scripts/test-build.sh
   ./scripts/export-image.sh v1.1.0
   ```

3. **Deploy Update**:
   ```bash
   ./scripts/deploy-to-server.sh your-server ubuntu v1.1.0
   ```

4. **Verify Update**:
   ```bash
   # Check new version
   curl http://localhost:3000/api/health

   # Test functionality
   # - Upload a CSV file
   # - Verify charts render
   # - Check data persistence
   ```

5. **Rollback if Needed**:
   ```bash
   # If update fails, rollback to previous version
   docker stop spending-tracker
   docker run -d --name spending-tracker \
     --restart unless-stopped \
     -p 3000:3000 \
     -v /opt/spending-tracker/data:/app/uploads \
     spending-tracker:previous-version
   ```

### Update Checklist

- [ ] Create backup before update
- [ ] Test new version in development
- [ ] Note current version and settings
- [ ] Deploy during low-usage period
- [ ] Verify all functionality works
- [ ] Monitor for errors after update
- [ ] Update documentation if needed

## Monitoring and Alerting

### Health Monitoring Script

```bash
#!/bin/bash
# /opt/spending-tracker/monitor.sh

LOG_FILE="/opt/spending-tracker/logs/monitor.log"
ALERT_EMAIL="admin@yourcompany.com"  # Configure if needed

log_message() {
    echo "$(date): $1" >> "$LOG_FILE"
}

check_container() {
    if ! docker ps | grep -q spending-tracker; then
        log_message "ALERT: Container not running"
        # Attempt restart
        docker start spending-tracker
        return 1
    fi
    return 0
}

check_health() {
    if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
        log_message "ALERT: Health check failed"
        return 1
    fi
    return 0
}

check_disk() {
    USAGE=$(df /opt/spending-tracker | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$USAGE" -gt 80 ]; then
        log_message "WARNING: Disk usage at ${USAGE}%"
        return 1
    fi
    return 0
}

check_memory() {
    MEM_USAGE=$(docker stats spending-tracker --no-stream --format "{{.MemPerc}}" | sed 's/%//')
    if [ "${MEM_USAGE%.*}" -gt 80 ]; then
        log_message "WARNING: Memory usage at ${MEM_USAGE}%"
        return 1
    fi
    return 0
}

# Run checks
check_container && \
check_health && \
check_disk && \
check_memory && \
log_message "All checks passed"
```

### Set Up Monitoring Cron

```bash
# Add to crontab (runs every 5 minutes)
*/5 * * * * /opt/spending-tracker/monitor.sh
```

### Log Analysis

```bash
# Check for errors in the last 24 hours
docker logs spending-tracker --since 24h 2>&1 | grep -i error

# Monitor resource usage trends
docker stats spending-tracker --no-stream >> /opt/spending-tracker/logs/stats.log

# Analyze access patterns (if web server logs available)
tail -f /var/log/nginx/access.log | grep spending-tracker
```

## Backup and Recovery

### Backup Strategy

1. **Automated Daily Backups**:
   - Data files: `/opt/spending-tracker/data/`
   - Configuration: `.env`, `docker-compose.yml`
   - Retention: 30 days

2. **Weekly System Backups**:
   - Include application binaries
   - Include system configuration
   - Store off-site if possible

3. **Monthly Archive Backups**:
   - Long-term retention
   - Compressed and verified
   - Documented restore procedures

### Advanced Backup Script

```bash
#!/bin/bash
# /opt/spending-tracker/advanced-backup.sh

BACKUP_DIR="/opt/spending-tracker/backups"
DATA_DIR="/opt/spending-tracker/data"
CONFIG_DIR="/opt/spending-tracker"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="spending-tracker-full-$TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup data and configuration
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" \
    -C "$DATA_DIR" . \
    -C "$CONFIG_DIR" docker-compose.yml .env 2>/dev/null

# Backup Docker image
docker save spending-tracker:latest | gzip > "$BACKUP_DIR/$BACKUP_NAME-image.tar.gz"

# Create metadata file
cat > "$BACKUP_DIR/$BACKUP_NAME-metadata.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(docker inspect spending-tracker --format='{{.Config.Labels.version}}' 2>/dev/null || echo 'unknown')",
  "data_size": "$(du -sh $DATA_DIR | cut -f1)",
  "backup_size": "$(du -sh $BACKUP_DIR/$BACKUP_NAME.tar.gz | cut -f1)",
  "file_count": $(tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | wc -l)
}
EOF

# Verify backup integrity
if tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" >/dev/null 2>&1; then
    echo "$(date): Backup completed successfully: $BACKUP_NAME"
else
    echo "$(date): Backup verification failed: $BACKUP_NAME"
    exit 1
fi

# Clean old backups (keep last 30 days)
find "$BACKUP_DIR" -name "spending-tracker-full-*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "spending-tracker-full-*-image.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "spending-tracker-full-*-metadata.json" -mtime +30 -delete
```

### Disaster Recovery Plan

#### Complete System Failure

1. **Prepare New Server**:
   ```bash
   # Set up new Ubuntu server
   ./scripts/setup-server.sh new-server-ip ubuntu
   ```

2. **Restore from Backup**:
   ```bash
   # Copy latest backup to new server
   scp backups/spending-tracker-full-latest.tar.gz ubuntu@new-server:/tmp/

   # On new server
   cd /opt/spending-tracker
   tar -xzf /tmp/spending-tracker-full-latest.tar.gz
   chown -R 1001:1001 data/
   ```

3. **Restore Docker Image**:
   ```bash
   # If image backup exists
   gunzip -c spending-tracker-full-latest-image.tar.gz | docker load

   # Or rebuild from source
   ./scripts/build.sh
   ```

4. **Start Services**:
   ```bash
   docker-compose up -d
   ```

#### Data Corruption

1. **Stop Application**:
   ```bash
   docker stop spending-tracker
   ```

2. **Restore Data Only**:
   ```bash
   cd /opt/spending-tracker/data
   rm -rf *
   tar -xzf ../backups/spending-tracker-backup-latest.tar.gz
   chown -R 1001:1001 .
   ```

3. **Restart Application**:
   ```bash
   docker start spending-tracker
   ```

## Performance Optimization

### Container Optimization

1. **Memory Tuning** (based on actual usage):
   ```yaml
   # In docker-compose.yml - Conservative (tested)
   environment:
     - NODE_OPTIONS="--max-old-space-size=128"
   deploy:
     resources:
       limits:
         memory: 256m      # 10x actual usage for safety
       reservations:
         memory: 128m      # 5x actual usage

   # Standard production settings
   limits:
     memory: 512m          # Generous headroom
   reservations:
     memory: 256m          # Conservative reserve
   ```

2. **CPU Optimization** (based on actual usage):
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'       # Tested: sufficient for normal load
       reservations:
         cpus: '0.25'      # Tested: adequate baseline

   # For high-concurrency environments
   limits:
     cpus: '1.0'
   reservations:
     cpus: '0.5'
   ```

### Storage Optimization

1. **Clean Up Old CSV Files**:
   ```bash
   # Remove CSV files older than 1 year (if desired)
   find /opt/spending-tracker/data/uploads -name "*.csv" -mtime +365 -delete
   ```

2. **Optimize Docker Storage**:
   ```bash
   # Clean up Docker storage
   docker system prune -f
   docker volume prune -f
   ```

### Network Optimization

1. **Enable HTTP/2** (if using reverse proxy):
   ```nginx
   # In Nginx configuration
   listen 443 ssl http2;
   ```

2. **Optimize Container Networking**:
   ```yaml
   # In docker-compose.yml
   networks:
     spending-tracker-network:
       driver: bridge
       driver_opts:
         com.docker.network.bridge.name: br-spending
   ```

## Security Maintenance

### Regular Security Tasks

1. **Update Base Images**:
   ```bash
   # Pull latest Node.js Alpine image
   docker pull node:20-alpine

   # Rebuild application
   ./scripts/build.sh
   ```

2. **Review Container Security**:
   ```bash
   # Check for security issues
   docker scan spending-tracker:latest

   # Review running processes
   docker exec spending-tracker ps aux
   ```

3. **Update System Packages**:
   ```bash
   # On server
   sudo apt-get update && sudo apt-get upgrade -y
   ```

### Access Control Review

1. **SSH Access**:
   - Review authorized_keys
   - Check SSH logs
   - Disable unused accounts

2. **Docker Access**:
   - Review docker group membership
   - Check Docker daemon logs
   - Monitor container creation

3. **File Permissions**:
   ```bash
   # Verify data directory permissions
   ls -la /opt/spending-tracker/data/

   # Should be owned by user 1001:1001
   ```

## Troubleshooting Common Issues

### Gradual Performance Degradation

1. **Check Resource Usage Trends**:
   ```bash
   # Analyze historical stats
   grep "$(date +%Y-%m-%d)" /opt/spending-tracker/logs/stats.log

   # Expected baseline values:
   # Memory: Should stay 17-25MB (alert if >50MB)
   # CPU: Should stay <0.1% idle (alert if >1% sustained)
   ```

2. **Check for Memory Leaks**:
   ```bash
   # Monitor memory usage over time
   docker stats spending-tracker --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

   # Red flags:
   # - Memory consistently >50MB
   # - Memory continuously growing over days
   # - CPU consistently >1% when idle
   ```

3. **Restart if Needed**:
   ```bash
   docker restart spending-tracker
   # Should return to baseline: ~17-25MB in <12 seconds
   ```

### Storage Issues

1. **Disk Space Monitoring**:
   ```bash
   # Check disk usage trends
   df -h /opt/spending-tracker

   # Large file analysis
   du -sh /opt/spending-tracker/* | sort -hr
   ```

2. **Log File Management**:
   ```bash
   # Compress old logs
   gzip /opt/spending-tracker/logs/*.log.1

   # Remove very old logs
   find /opt/spending-tracker/logs -name "*.log.gz" -mtime +90 -delete
   ```

## Maintenance Schedule Template

### Daily (Automated)
- [ ] Health check monitoring
- [ ] Automated backups
- [ ] Log rotation

### Weekly
- [ ] Review system health
- [ ] Verify backup integrity
- [ ] Check resource usage trends
- [ ] Review error logs

### Monthly
- [ ] Update system packages
- [ ] Clean up Docker resources
- [ ] Performance analysis
- [ ] Security review

### Quarterly
- [ ] Application updates
- [ ] Capacity planning
- [ ] Disaster recovery testing
- [ ] Documentation updates

### Annually
- [ ] Complete security audit
- [ ] Backup strategy review
- [ ] Infrastructure assessment
- [ ] Performance baseline update

This maintenance guide ensures your Spending Tracker deployment remains secure, performant, and reliable over time.