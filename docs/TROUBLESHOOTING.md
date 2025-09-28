# Troubleshooting Guide: Spending Tracker

Common issues and solutions for deploying and running the Spending Tracker application.

## Quick Diagnostics

### Health Check Command
```bash
# Test application health
curl -f http://your-server:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "spending-tracker",
  "version": "1.0.0"
}
```

### Container Status Check
```bash
# Check if container is running
docker ps | grep spending-tracker

# Check container health
docker inspect spending-tracker | grep -A 10 "Health"

# View container logs
docker logs spending-tracker --tail 50
```

## Build Issues

### Docker Build Fails

**Problem**: `docker build` command fails

**Common Causes**:
1. **Dockerfile syntax errors**
2. **Missing dependencies**
3. **Network connectivity issues**
4. **Insufficient disk space**

**Solutions**:

1. **Validate Dockerfile**:
   ```bash
   ./scripts/validate-dockerfile.sh
   ```

2. **Check disk space** (build requires ~2GB temporary space):
   ```bash
   df -h
   # Need at least 2GB free for build process
   ```

3. **Clean up Docker resources**:
   ```bash
   docker system prune -f
   docker builder prune -f
   ```

4. **Build with verbose output**:
   ```bash
   docker build --no-cache --progress=plain .
   ```

**Known Issue - Next.js ESM Configuration**:
If you see "Failed to load next.config.mjs", ensure the config uses proper ESM imports:
```javascript
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
```

### Next.js Build Fails

**Problem**: Next.js build step fails in Docker

**Error Messages**:
- `npm ERR! code ELIFECYCLE`
- `Type checking failed`
- `Module not found`

**Solutions**:

1. **Check local build**:
   ```bash
   npm install
   npm run build
   ```

2. **Fix TypeScript errors**:
   ```bash
   npm run typecheck
   ```

3. **Update dependencies**:
   ```bash
   npm audit fix
   npm update
   ```

4. **Build without TypeScript checks** (temporary):
   ```bash
   # In next.config.mjs
   typescript: {
     ignoreBuildErrors: true,
   }
   ```

### Node.js Version Issues

**Problem**: Node.js version compatibility

**Solutions**:

1. **Check Node.js version** (tested with Node 20):
   ```bash
   node --version
   # Should be 18+ or 20+ (tested and verified with 20.x)
   ```

2. **Update Dockerfile base image**:
   ```dockerfile
   FROM node:20-alpine  # Tested and verified
   ```

3. **Use exact Node.js version**:
   ```dockerfile
   FROM node:20.10.0-alpine
   ```

**Verified Working Versions**:
- Node.js 20.x (tested)
- Docker 28.x (tested)
- Next.js 14.2.16 (tested)

## Deployment Issues

### SSH Connection Fails

**Problem**: Cannot connect to Ubuntu server

**Error Messages**:
- `Connection refused`
- `Permission denied`
- `Host key verification failed`

**Solutions**:

1. **Test SSH connection**:
   ```bash
   ssh -v ubuntu@your-server
   ```

2. **Check SSH service**:
   ```bash
   # On server
   sudo systemctl status ssh
   sudo systemctl start ssh
   ```

3. **Fix SSH key permissions**:
   ```bash
   chmod 600 ~/.ssh/id_rsa
   chmod 644 ~/.ssh/id_rsa.pub
   ```

4. **Accept host key**:
   ```bash
   ssh-keyscan -H your-server >> ~/.ssh/known_hosts
   ```

### Docker Not Found on Server

**Problem**: Docker not installed on Ubuntu server

**Solutions**:

1. **Run server setup script**:
   ```bash
   ./scripts/setup-server.sh your-server ubuntu
   ```

2. **Manual Docker installation**:
   ```bash
   # On Ubuntu server
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Verify Docker installation**:
   ```bash
   docker --version
   docker info
   ```

### Image Transfer Fails

**Problem**: Cannot transfer Docker image to server

**Solutions**:

1. **Check export file**:
   ```bash
   ls -lh exports/
   ```

2. **Test SCP connectivity**:
   ```bash
   scp /dev/null ubuntu@your-server:/tmp/test
   ssh ubuntu@your-server 'rm /tmp/test'
   ```

3. **Transfer manually**:
   ```bash
   scp exports/spending-tracker-latest-*.tar.gz ubuntu@your-server:/tmp/
   ```

4. **Use alternative transfer method**:
   ```bash
   # Via rsync
   rsync -avz exports/ ubuntu@your-server:/tmp/exports/
   ```

## Runtime Issues

### Container Won't Start

**Problem**: Container fails to start

**Error Messages**:
- `Container exited with code 1`
- `Port already in use`
- `Permission denied`

**Solutions**:

1. **Check logs**:
   ```bash
   docker logs spending-tracker
   ```

2. **Check port conflicts**:
   ```bash
   # Check if port 3000 is in use
   sudo netstat -tlnp | grep :3000
   # or
   sudo ss -tlnp | grep :3000
   ```

3. **Use different port**:
   ```bash
   # In docker-compose.yml
   ports:
     - "3001:3000"
   ```

4. **Check permissions**:
   ```bash
   # Ensure data directory is writable
   sudo chown -R 1001:1001 /opt/spending-tracker/data
   ```

5. **Start with debug mode**:
   ```bash
   docker run -it --rm spending-tracker:latest sh
   ```

### Health Check Fails

**Problem**: Container health check always fails

**Error Messages**:
- `Health check failed`
- `Connection refused`
- `Curl command not found`

**Solutions**:

1. **Check health endpoint manually**:
   ```bash
   docker exec spending-tracker curl http://localhost:3000/api/health
   ```

2. **Verify curl is installed**:
   ```bash
   docker exec spending-tracker which curl
   ```

3. **Check application startup**:
   ```bash
   docker exec spending-tracker ps aux
   ```

4. **Increase health check timeout**:
   ```yaml
   # In docker-compose.yml
   healthcheck:
     timeout: 30s
     start_period: 60s
   ```

### Application Not Accessible

**Problem**: Cannot access web interface

**Solutions**:

1. **Check container is running**:
   ```bash
   docker ps | grep spending-tracker
   ```

2. **Test local access on server**:
   ```bash
   ssh ubuntu@your-server
   curl http://localhost:3000
   ```

3. **Check firewall**:
   ```bash
   # On server
   sudo ufw status
   sudo ufw allow 3000/tcp
   ```

4. **Test network connectivity**:
   ```bash
   # From your machine
   telnet your-server 3000
   ```

5. **Check Docker port mapping**:
   ```bash
   docker port spending-tracker
   ```

### Data Not Persisting

**Problem**: Uploaded CSV files disappear after restart

**Solutions**:

1. **Check volume mapping**:
   ```bash
   docker inspect spending-tracker | grep -A 10 "Mounts"
   ```

2. **Verify data directory**:
   ```bash
   ls -la /opt/spending-tracker/data/uploads/
   ```

3. **Check container user permissions**:
   ```bash
   docker exec spending-tracker ls -la /app/uploads/
   ```

4. **Fix volume permissions**:
   ```bash
   sudo chown -R 1001:1001 /opt/spending-tracker/data
   sudo chmod -R 755 /opt/spending-tracker/data
   ```

## Performance Issues

### High Memory Usage

**Problem**: Container uses too much memory

**Normal Usage** (based on testing):
- Idle: 17-25MB
- Processing CSV: 30-50MB
- Peak: <100MB

**Solutions** if usage exceeds these baselines:

1. **Check memory usage**:
   ```bash
   docker stats spending-tracker --no-stream
   # Expected: ~17-25MB normal, <50MB peak
   ```

2. **Reduce memory limit if needed**:
   ```yaml
   # In docker-compose.yml - conservative settings
   deploy:
     resources:
       limits:
         memory: 128m  # Tested: sufficient for normal operation
   ```

3. **Optimize Node.js memory for very constrained environments**:
   ```yaml
   environment:
     - NODE_OPTIONS="--max-old-space-size=128"
   ```

**Investigation Steps**:
- Check if memory leak exists (should stay <50MB)
- Verify no large CSV files are being processed
- Review container logs for memory warnings

### Slow Response Times

**Problem**: Application responds slowly

**Solutions**:

1. **Check server resources**:
   ```bash
   # On server
   top
   free -h
   df -h
   ```

2. **Monitor container performance**:
   ```bash
   docker exec spending-tracker top
   ```

3. **Increase CPU allocation**:
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         cpus: '2.0'
   ```

### Large Docker Images

**Problem**: Docker image is too large

**Solutions**:

1. **Check image size**:
   ```bash
   docker images | grep spending-tracker
   ```

2. **Use multi-stage builds** (already implemented)

3. **Clean up dependencies**:
   ```bash
   npm audit
   npm prune --production
   ```

4. **Optimize Dockerfile**:
   ```dockerfile
   # Remove development dependencies
   RUN npm ci --only=production
   ```

## Backup Issues

### Backup Script Fails

**Problem**: Automated backups not working

**Solutions**:

1. **Check backup script**:
   ```bash
   # On server
   /opt/spending-tracker/backup.sh
   ```

2. **Check crontab**:
   ```bash
   crontab -l | grep backup
   ```

3. **Check backup logs**:
   ```bash
   tail -f /opt/spending-tracker/logs/backup.log
   ```

4. **Fix permissions**:
   ```bash
   chmod +x /opt/spending-tracker/backup.sh
   chown $USER:$USER /opt/spending-tracker/backup.sh
   ```

### Restore Fails

**Problem**: Cannot restore from backup

**Solutions**:

1. **Check backup file**:
   ```bash
   tar -tzf backup-file.tar.gz
   ```

2. **Stop container first**:
   ```bash
   docker stop spending-tracker
   ```

3. **Restore manually**:
   ```bash
   cd /opt/spending-tracker/data
   tar -xzf ../backups/backup-file.tar.gz
   ```

4. **Fix permissions after restore**:
   ```bash
   chown -R 1001:1001 /opt/spending-tracker/data
   ```

## Network Issues

### DNS Resolution Fails

**Problem**: Container cannot resolve external domains

**Solutions**:

1. **Check DNS in container**:
   ```bash
   docker exec spending-tracker nslookup google.com
   ```

2. **Configure DNS**:
   ```yaml
   # In docker-compose.yml
   dns:
     - 8.8.8.8
     - 8.8.4.4
   ```

### Port Conflicts

**Problem**: Port 3000 already in use

**Solutions**:

1. **Find process using port**:
   ```bash
   sudo lsof -i :3000
   sudo fuser -v 3000/tcp
   ```

2. **Use different port**:
   ```bash
   # In .env file
   HOST_PORT=3001
   ```

3. **Stop conflicting service**:
   ```bash
   sudo systemctl stop conflicting-service
   ```

## Diagnostic Commands

### Complete Health Check

```bash
#!/bin/bash
echo "=== Container Status ==="
docker ps | grep spending-tracker

echo "=== Container Health ==="
docker inspect spending-tracker --format='{{.State.Health.Status}}'

echo "=== Port Mapping ==="
docker port spending-tracker

echo "=== Resource Usage ==="
docker stats spending-tracker --no-stream

echo "=== Application Health ==="
curl -f http://localhost:3000/api/health

echo "=== Recent Logs ==="
docker logs spending-tracker --tail 10

echo "=== Volume Mounts ==="
docker inspect spending-tracker --format='{{range .Mounts}}{{.Source}}:{{.Destination}}{{end}}'
```

### Log Collection

```bash
#!/bin/bash
# Collect all relevant logs
mkdir -p debug-logs

docker logs spending-tracker > debug-logs/container.log 2>&1
docker inspect spending-tracker > debug-logs/inspect.json
docker stats spending-tracker --no-stream > debug-logs/stats.txt
curl -f http://localhost:3000/api/health > debug-logs/health.json 2>&1

tar -czf debug-logs-$(date +%Y%m%d-%H%M%S).tar.gz debug-logs/
```

## Getting Help

### Log Analysis

When reporting issues, include:
1. Container logs: `docker logs spending-tracker`
2. System information: `uname -a`, `docker version`
3. Container inspection: `docker inspect spending-tracker`
4. Resource usage: `docker stats spending-tracker --no-stream`

### Common Commands Summary

```bash
# Health and status
curl -f http://localhost:3000/api/health
docker ps | grep spending-tracker
docker logs spending-tracker --tail 20

# Resource monitoring
docker stats spending-tracker --no-stream
free -h
df -h

# Restart and recovery
docker restart spending-tracker
docker-compose restart
docker-compose up -d --force-recreate

# Cleanup and maintenance
docker system prune -f
docker logs spending-tracker > /tmp/logs.txt
```

For additional help:
- Check [Deployment Guide](DEPLOYMENT.md)
- Check [Maintenance Guide](MAINTENANCE.md)
- Review container logs for specific error messages