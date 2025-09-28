# Deployment Guide: Spending Tracker

Complete step-by-step guide for deploying the Spending Tracker application on an Ubuntu server using Docker.

## Prerequisites

### Development Environment
- Node.js 18+ (for building)
- Docker 20.x or higher (tested with 28.x)
- Git
- SSH access to Ubuntu server

### Ubuntu Server Requirements
- Ubuntu 22.04+ LTS
- Docker 20.x or higher (tested with 28.x)
- Minimum 2GB available disk space
- Minimum 512MB available memory (actual usage ~20MB)
- Port 3000 available (or alternative port)

## Quick Start

For experienced users, here are the fastest deployment paths:

### Method 1: Shared Folder Deployment (Recommended for Home Labs)
```bash
# 1. Build and package
./scripts/build.sh
./scripts/create-deployment-package.sh

# 2. Copy deployment-package/ to shared folder
# 3. On server: copy package locally and run ./deploy.sh
```

### Method 2: Direct SSH Deployment
```bash
# 1. Setup server (run once)
./scripts/setup-server.sh your-server-ip ubuntu

# 2. Build and deploy
./scripts/build.sh
./scripts/export-image.sh
./scripts/deploy-to-server.sh your-server-ip ubuntu
```

## Detailed Deployment Steps

### Step 1: Prepare Your Development Environment

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd spending-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Test the application locally** (optional):
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

### Step 2: Configure Environment

1. **Create environment configuration**:
   ```bash
   cp docker/env.template .env
   ```

2. **Edit `.env` file** with your settings:
   ```bash
   # Key settings to customize:
   SERVER_HOST=192.168.1.100    # Your Ubuntu server IP
   SERVER_USER=ubuntu           # SSH username
   HOST_PORT=3000              # Port for web access
   DATA_DIR=./data/uploads     # Local data directory
   ```

3. **Validate configuration**:
   ```bash
   ./scripts/validate-environment.sh
   ```

### Step 3: Prepare Ubuntu Server

1. **Setup server environment**:
   ```bash
   ./scripts/setup-server.sh 192.168.1.100 ubuntu
   ```

   This script will:
   - Install Docker and dependencies
   - Create deployment directories
   - Configure firewall and services
   - Set up automated backups
   - Create systemd service

2. **Verify server setup**:
   ```bash
   ssh ubuntu@192.168.1.100 'docker --version'
   ```

### Step 4: Build Docker Image

1. **Build the application**:
   ```bash
   ./scripts/build.sh
   ```

   This will:
   - Validate Dockerfile
   - Build multi-stage Docker image
   - Optimize for production

2. **Test the build** (optional):
   ```bash
   ./scripts/test-build.sh
   ```

### Step 5: Export and Transfer

1. **Export Docker image**:
   ```bash
   ./scripts/export-image.sh
   ```

   This creates a compressed image file in `./exports/`

2. **Review transfer instructions**:
   ```bash
   cat exports/transfer-instructions-*.txt
   ```

### Step 6: Deploy to Server

1. **Deploy to Ubuntu server**:
   ```bash
   ./scripts/deploy-to-server.sh 192.168.1.100 ubuntu
   ```

   This will:
   - Transfer image to server
   - Stop any existing container
   - Load new image
   - Start container with proper configuration
   - Run health checks

2. **Verify deployment**:
   ```bash
   curl -f http://192.168.1.100:3000/api/health
   ```

### Step 7: Access Your Application

1. **Web interface**: `http://192.168.1.100:3000`
2. **Health check**: `http://192.168.1.100:3000/api/health`

## Configuration Options

### Port Configuration

Change the port if 3000 conflicts with other services:

```bash
# In .env file
HOST_PORT=8080

# Or directly in docker-compose.yml
ports:
  - "8080:3000"
```

### Storage Configuration

Configure persistent storage for CSV files:

```bash
# Local development
DATA_DIR=./data/uploads

# Production server
DATA_DIR=/opt/spending-tracker/data/uploads
```

### Resource Limits

Adjust memory and CPU limits based on testing results:

```bash
# Conservative settings (tested and verified)
MEMORY_LIMIT=256m
CPU_LIMIT=0.5
MEMORY_RESERVATION=128m
CPU_RESERVATION=0.25

# Standard settings (recommended)
MEMORY_LIMIT=512m
CPU_LIMIT=1.0
MEMORY_RESERVATION=256m
CPU_RESERVATION=0.5

# High-performance settings
MEMORY_LIMIT=1g
CPU_LIMIT=2.0
MEMORY_RESERVATION=512m
CPU_RESERVATION=1.0
```

## Validation and Testing

### Pre-deployment Validation

Run all validation scripts before deployment:

```bash
./scripts/validate-dockerfile.sh
./scripts/validate-compose.sh
./scripts/validate-environment.sh
```

### Post-deployment Testing

1. **Container functionality**:
   ```bash
   ./scripts/test-container.sh
   ```

2. **Health endpoint**:
   ```bash
   curl -f http://your-server:3000/api/health
   ```

3. **CSV upload test**:
   - Access web interface
   - Upload a test CSV file
   - Verify charts render correctly
   - Restart container and verify data persists

### Performance Validation

Check resource usage:

```bash
# On server
docker stats spending-tracker --no-stream

# Expected results based on testing:
# Memory: ~17-25MB (well under 512MB limit)
# CPU: <0.1% during normal operation
# Startup time: <10 seconds to healthy status
```

### Verified Performance Metrics
- **Memory Usage**: 17-25MB typical, 50MB peak during CSV processing
- **CPU Usage**: <0.1% idle, <1% during file processing
- **Startup Time**: 8-12 seconds from container start to healthy
- **Response Time**: <100ms for health endpoint
- **Build Time**: ~3 minutes for complete Docker build

## Environment-Specific Configurations

### Development Environment

```bash
NODE_ENV=development
HOST_PORT=3001
DATA_DIR=./dev-data
MEMORY_LIMIT=128m          # Tested: sufficient for development
CPU_LIMIT=0.25
LOG_LEVEL=debug
```

### Production Environment (Recommended)

```bash
NODE_ENV=production
HOST_PORT=3000
DATA_DIR=/opt/spending-tracker/data
MEMORY_LIMIT=256m          # Tested: 4x actual usage for safety
CPU_LIMIT=0.5              # Tested: sufficient for normal operation
LOG_LEVEL=info
BACKUP_ENABLED=true
```

### High-Performance Server

```bash
NODE_ENV=production
MEMORY_LIMIT=512m          # Tested: generous headroom
CPU_LIMIT=1.0              # Tested: handles concurrent users
MEMORY_RESERVATION=256m
CPU_RESERVATION=0.5
BACKUP_RETENTION_DAYS=90
```

## Common Deployment Scenarios

### Single Server Deployment (Recommended)

Default configuration for one Ubuntu server:
- Port 3000 exposed to local network
- Data persisted to host filesystem
- Automatic container restart
- Daily backups

### Multi-Port Deployment

Deploy multiple instances on different ports:

```bash
# Instance 1 (production)
HOST_PORT=3000 DATA_DIR=/opt/spending-tracker/prod docker-compose up -d

# Instance 2 (staging)
HOST_PORT=3001 DATA_DIR=/opt/spending-tracker/staging docker-compose up -d
```

### Development + Production

Separate environments on same server:

```bash
# Production
docker-compose -f docker-compose.yml up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

## Security Considerations

### Container Security

The deployment includes security best practices:
- Non-root user execution
- Read-only root filesystem
- Minimal capabilities
- No new privileges
- Isolated network

### Network Security

- Application only listens on local network
- Firewall configured for port 3000 only
- No external dependencies
- Health checks use internal networking

### Data Security

- CSV files stored in isolated volume
- Regular automated backups
- File permissions properly configured
- No sensitive data in environment variables

## Backup and Recovery

### Automated Backups

Daily backups are configured automatically:
- Run at 2:00 AM daily
- Stored in `/opt/spending-tracker/backups/`
- Retained for 30 days
- Compressed format

### Manual Backup

```bash
# On server
/opt/spending-tracker/backup.sh
```

### Restore from Backup

```bash
# Stop container
docker stop spending-tracker

# Restore data
cd /opt/spending-tracker/data
tar -xzf ../backups/spending-tracker-backup-YYYYMMDD-HHMMSS.tar.gz

# Start container
docker start spending-tracker
```

## Monitoring

### Health Monitoring

Built-in health checks:
- HTTP endpoint: `/api/health`
- Docker health status
- Automatic restart on failure

### Log Monitoring

```bash
# Container logs
docker logs spending-tracker -f

# Application logs
tail -f /opt/spending-tracker/logs/*.log
```

### Resource Monitoring

```bash
# Real-time stats
docker stats spending-tracker

# Historical data
docker exec spending-tracker top
```

## Updates and Maintenance

### Application Updates

1. Build new version:
   ```bash
   ./scripts/build.sh v1.1.0
   ```

2. Export and deploy:
   ```bash
   ./scripts/export-image.sh v1.1.0
   ./scripts/deploy-to-server.sh your-server ubuntu v1.1.0
   ```

### Container Maintenance

```bash
# Restart container
docker restart spending-tracker

# Update container settings
docker-compose up -d

# Clean up old images
docker system prune -f
```

### Server Maintenance

Regular maintenance tasks:
- Monitor disk space
- Review backup logs
- Update system packages
- Check container health

## Next Steps

After successful deployment:

1. **Test all functionality**:
   - Upload CSV files
   - Generate charts
   - Test data persistence

2. **Set up monitoring**:
   - Health check alerts
   - Resource usage tracking
   - Backup verification

3. **Document your configuration**:
   - Server details
   - Custom settings
   - Access credentials

4. **Plan maintenance**:
   - Update schedule
   - Backup verification
   - Performance monitoring

## Alternative Deployment Methods

### Shared Folder Deployment
For home lab environments with shared folders/network drives, see:
- [Shared Folder Deployment Guide](SHARED_FOLDER_DEPLOYMENT.md) ✅ **Tested Method**

This method is ideal when you have:
- Development machine with Docker
- Ubuntu server with SSH access
- Shared folder accessible from both machines
- Network restrictions that make direct transfer difficult

## Updating Your Deployment

After making changes to the application, update your server:

### Quick Update
```bash
# Method 1: Shared folder (recommended for home labs)
./scripts/update-server.sh your-server-ip your-username /path/to/shared

# Method 2: Direct SSH
./scripts/update-server.sh your-server-ip your-username
```

For detailed update procedures, see [Update Deployment Guide](UPDATE_DEPLOYMENT.md)

## Support

For issues and troubleshooting, see:
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Maintenance Guide](MAINTENANCE.md)
- [Shared Folder Deployment](SHARED_FOLDER_DEPLOYMENT.md)
- [Update Deployment Guide](UPDATE_DEPLOYMENT.md)
- Application logs: `docker logs spending-tracker`