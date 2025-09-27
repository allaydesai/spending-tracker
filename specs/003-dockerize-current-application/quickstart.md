# Quickstart: Docker Deployment Validation

## Prerequisites Test
```bash
# Verify Docker installation
docker --version  # Should show Docker 20.x or 24.x
docker compose --version  # Should show Compose v2

# Verify Ubuntu server access
ssh user@your-ubuntu-server  # Replace with your server details
```

## Build and Export Test
```bash
# From Windows/WSL development environment
cd /path/to/spending-tracker

# Build the Docker image
docker build -t spending-tracker:latest .

# Verify image was created
docker images | grep spending-tracker

# Export image for transfer
docker save spending-tracker:latest | gzip > spending-tracker.tar.gz

# Verify export file
ls -lh spending-tracker.tar.gz
```

## Deployment Test
```bash
# On Ubuntu server
# Create data directory
mkdir -p /opt/spending-tracker/data

# Load the image
gunzip -c spending-tracker.tar.gz | docker load

# Run the container
docker run -d \
  --name spending-tracker \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/spending-tracker/data:/app/uploads \
  spending-tracker:latest

# Verify container is running
docker ps | grep spending-tracker
```

## Functional Validation
```bash
# Test 1: Health check
curl -f http://localhost:3000/api/health
# Expected: HTTP 200 OK with health status

# Test 2: Web interface access
curl -I http://localhost:3000/
# Expected: HTTP 200 OK

# Test 3: Container restart persistence
# Upload a CSV file via web interface
# Stop container: docker stop spending-tracker
# Start container: docker start spending-tracker
# Verify uploaded file still accessible
```

## Network Access Test
```bash
# From another device on local network
curl -f http://[SERVER-IP]:3000/api/health
# Replace [SERVER-IP] with actual Ubuntu server IP

# Access web interface
# Open browser to http://[SERVER-IP]:3000/
# Verify full application functionality
```

## CSV Upload Integration Test
```bash
# Prepare test CSV file
echo "Date,Description,Amount,Category" > test.csv
echo "2024-01-01,Test Transaction,-50.00,Food" >> test.csv

# Upload via web interface at http://[SERVER-IP]:3000/
# Verify:
# 1. File appears in upload interface
# 2. Charts render with test data
# 3. Filtering works correctly
# 4. Data persists after container restart
```

## Cleanup (if needed)
```bash
# Stop and remove container
docker stop spending-tracker
docker rm spending-tracker

# Remove image
docker rmi spending-tracker:latest

# Remove data directory (CAUTION: This deletes all uploaded CSV files)
sudo rm -rf /opt/spending-tracker/data
```

## Success Criteria
- ✅ Docker image builds without errors
- ✅ Container starts and shows healthy status
- ✅ Web interface accessible on local network
- ✅ CSV upload functionality works in container
- ✅ Charts render correctly with uploaded data
- ✅ Data persists through container restarts
- ✅ Resource usage within limits (<512MB memory)