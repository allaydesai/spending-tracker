# Updating Server Deployment

**Purpose**: Update your home server with the latest application build
**Method**: Tested and verified procedure
**Downtime**: ~30 seconds during container restart

## When to Update

- After making code changes to the application
- When updating dependencies
- For security updates
- Performance improvements

## Quick Update Process

### Option 1: Shared Folder Method (Recommended)

```bash
# 1. On development machine - create new deployment package
./scripts/create-deployment-package.sh

# 2. Copy to shared folder (replace existing)
cp -r deployment-package /path/to/shared/folder/

# 3. On server - update from shared folder
ssh your-username@your-server-ip
cd /path/to/shared/deployment-package
./deploy.sh
```

### Option 2: Direct SSH Method

```bash
# 1. Build and export
./scripts/build.sh
./scripts/export-image.sh

# 2. Deploy to server
./scripts/deploy-to-server.sh your-server-ip your-username
```

## Detailed Update Steps

### Step 1: Prepare New Build

```bash
# Ensure you're on the latest code
git pull origin main

# Build the updated application
./scripts/build.sh

# Create deployment package
./scripts/create-deployment-package.sh
```

**Output**: Fresh `deployment-package/` folder with updated Docker image

### Step 2: Backup Current State (Optional but Recommended)

```bash
# On server - create backup before update
ssh your-username@your-server-ip

# Backup current data
sudo cp -r /opt/spending-tracker/data /opt/spending-tracker/data.backup-$(date +%Y%m%d)

# Export current container state (optional)
docker compose logs > logs-backup-$(date +%Y%m%d).txt
```

### Step 3: Deploy Update

```bash
# Transfer new package to server (via shared folder or SCP)
# Example with shared folder:
cp -r deployment-package /mnt/shared/

# On server:
ssh your-username@your-server-ip
cd /path/to/shared/deployment-package
./deploy.sh
```

**What happens during deployment:**
1. ✅ Stops current container gracefully
2. ✅ Loads new Docker image
3. ✅ Starts updated container
4. ✅ Verifies health check
5. ✅ Reports success and access URL

### Step 4: Verify Update

```bash
# Check application is running
curl http://your-server-ip:3000/api/health

# Check container status
ssh your-username@your-server-ip 'cd ~/deployment-package && docker compose ps'

# Test functionality
# - Visit http://your-server-ip:3000
# - Upload a test CSV file
# - Verify charts render correctly
```

## Zero-Downtime Update (Advanced)

For minimal downtime during updates:

```bash
# 1. On server - prepare new image first
ssh your-username@your-server-ip
gunzip -c /path/to/new/spending-tracker-deployment.tar.gz | docker load

# 2. Quick switch
docker compose down && docker compose up -d

# Total downtime: ~10-15 seconds
```

## Update Automation Script

Create `scripts/update-server.sh` for automation:

```bash
#!/bin/bash
set -e

SERVER_HOST="${1}"
SERVER_USER="${2}"
SHARED_FOLDER="${3}"

if [ -z "$SERVER_HOST" ]; then
    echo "Usage: $0 <server-ip> <ssh-user> [shared-folder-path]"
    exit 1
fi

echo "🔄 Updating server deployment..."

# Build latest
./scripts/build.sh

if [ -n "$SHARED_FOLDER" ]; then
    # Shared folder method
    ./scripts/create-deployment-package.sh
    cp -r deployment-package "$SHARED_FOLDER/"

    ssh "$SERVER_USER@$SERVER_HOST" "cd $SHARED_FOLDER/deployment-package && ./deploy.sh"
else
    # Direct SSH method
    ./scripts/export-image.sh
    ./scripts/deploy-to-server.sh "$SERVER_HOST" "$SERVER_USER"
fi

echo "✅ Server updated successfully!"
```

## Rollback Procedure

If update fails, rollback to previous version:

```bash
# On server - quick rollback
ssh your-username@your-server-ip

# Stop current deployment
docker compose down

# Load previous image (if you have it)
docker load < previous-backup.tar.gz

# Or restore from backup data
sudo rm -rf /opt/spending-tracker/data
sudo mv /opt/spending-tracker/data.backup-YYYYMMDD /opt/spending-tracker/data
sudo chown $USER:$USER /opt/spending-tracker/data

# Start with previous configuration
docker compose up -d
```

## Monitoring Updates

After update, monitor for:

```bash
# Resource usage (should remain ~17-25MB)
docker stats spending-tracker --no-stream

# Application logs
docker compose logs -f

# Health status
watch curl -s http://localhost:3000/api/health
```

## Update Checklist

**Pre-Update:**
- [ ] Code changes tested locally
- [ ] Build completes successfully
- [ ] Backup current server data
- [ ] Note current version/commit

**During Update:**
- [ ] New package created successfully
- [ ] Files transferred to server
- [ ] Deployment script runs without errors
- [ ] Health check passes

**Post-Update:**
- [ ] Application accessible at expected URL
- [ ] CSV upload functionality works
- [ ] Charts render correctly
- [ ] Data persisted through update
- [ ] Resource usage within normal ranges

## Troubleshooting Updates

### Update Fails to Start

```bash
# Check deployment logs
docker compose logs

# Verify image loaded correctly
docker images | grep spending-tracker

# Check available resources
free -h && df -h

# Try manual restart
docker compose restart
```

### Data Not Available After Update

```bash
# Check data directory permissions
ls -la /opt/spending-tracker/data

# Verify volume mount
docker inspect spending-tracker | grep -A 10 Mounts

# Restore from backup if needed
sudo cp -r /opt/spending-tracker/data.backup-* /opt/spending-tracker/data
```

### Performance Issues After Update

```bash
# Check resource usage
docker stats spending-tracker --no-stream

# If high usage, restart container
docker compose restart

# Check for memory leaks
docker compose logs | grep -i memory
```

## Best Practices

✅ **Always test updates locally first**
✅ **Backup data before major updates**
✅ **Update during low-usage periods**
✅ **Monitor system after updates**
✅ **Keep rollback plan ready**
✅ **Document update changes**

---

**This update procedure has been tested and verified to work reliably with minimal downtime.**