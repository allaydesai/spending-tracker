#!/bin/bash

# Create deployment package for shared folder deployment
set -e

echo "📦 Creating deployment package for shared folder deployment..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }

# Check if Docker image exists
if ! docker images | grep -q "spending-tracker.*latest"; then
    print_warning "Docker image 'spending-tracker:latest' not found"
    echo "Building image first..."
    ./scripts/build.sh
fi

# Clean up previous package
print_status "Cleaning up previous deployment package..."
rm -rf deployment-package
rm -f spending-tracker-deployment.tar.gz

# Export Docker image
print_status "Exporting Docker image (this may take a moment)..."
docker save spending-tracker:latest | gzip > spending-tracker-deployment.tar.gz
IMAGE_SIZE=$(du -h spending-tracker-deployment.tar.gz | cut -f1)
print_success "Docker image exported: $IMAGE_SIZE"

# Create package directory
mkdir -p deployment-package

# Copy essential files
print_status "Packaging deployment files..."
cp spending-tracker-deployment.tar.gz deployment-package/
cp docker-compose.yml deployment-package/
cp .env deployment-package/

# Create deployment script
cat > deployment-package/deploy.sh << 'EOF'
#!/bin/bash

# Simple deployment script for home server
set -e

echo "🏠 Deploying Spending Tracker on Home Server"
echo "============================================="

# Check if running on Ubuntu server
if [ ! -f /etc/lsb-release ]; then
    echo "⚠️ This script should be run on the Ubuntu server"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."

    # Install Docker
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER

    echo "✅ Docker installed. Please logout and login again, then re-run this script."
    exit 0
fi

echo "📦 Loading Docker image..."
if [ -f "spending-tracker-deployment.tar.gz" ]; then
    gunzip -c spending-tracker-deployment.tar.gz | docker load
    echo "✅ Docker image loaded successfully"
else
    echo "❌ spending-tracker-deployment.tar.gz not found"
    echo "Please ensure all deployment files are in the current directory"
    exit 1
fi

echo "🛑 Stopping any existing deployment..."
docker compose down 2>/dev/null || true

echo "📁 Creating data directory..."
sudo mkdir -p /opt/spending-tracker/data
sudo chown $USER:$USER /opt/spending-tracker/data

echo "🚀 Starting Spending Tracker..."
docker compose up -d

echo "⏳ Waiting for application to start..."
sleep 15

echo "🔍 Checking application health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Spending Tracker is now running!"
    echo "🌐 Access it at: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📊 Container status:"
    docker compose ps
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: docker compose logs"
    echo "   Restart:   docker compose restart"
    echo "   Stop:      docker compose stop"
    echo "   Update:    docker compose pull && docker compose up -d"
else
    echo "❌ Health check failed. Checking logs..."
    docker compose logs
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   Check logs: docker compose logs"
    echo "   Check status: docker compose ps"
    exit 1
fi
EOF

chmod +x deployment-package/deploy.sh

# Create comprehensive instructions
cat > deployment-package/DEPLOYMENT_INSTRUCTIONS.txt << EOF
🏠 HOME SERVER DEPLOYMENT INSTRUCTIONS
=====================================

Your deployment package is ready! Here's how to deploy to your home server:

📦 PACKAGE CONTENTS:
- spending-tracker-deployment.tar.gz  ($IMAGE_SIZE Docker image)
- docker-compose.yml                  (Service configuration)
- .env                               (Environment settings)
- deploy.sh                          (Automated deployment script)
- DEPLOYMENT_INSTRUCTIONS.txt        (This file)

🚀 DEPLOYMENT STEPS:

1. COPY FILES TO SERVER:
   Copy this entire 'deployment-package' folder to your Ubuntu server.

   Method A - Using shared folder:
   - Copy deployment-package folder to your shared folder (e.g., \\192.168.2.80\shared)
   - On Ubuntu server: cp -r /path/to/shared/deployment-package ~/

   Method B - Using SCP:
   - scp -r deployment-package your-username@your-server-ip:~/

2. SSH TO YOUR SERVER:
   ssh your-username@your-server-ip

3. NAVIGATE TO DEPLOYMENT FOLDER:
   cd ~/deployment-package

4. RUN DEPLOYMENT:
   ./deploy.sh

   The script will:
   - Install Docker (if needed)
   - Load the application image
   - Start the services
   - Verify everything is working

🌐 ACCESSING YOUR APPLICATION:
After successful deployment, access at: http://your-server-ip:3000

📋 USEFUL COMMANDS (run on server):
- View status:    docker compose ps
- View logs:      docker compose logs
- Restart app:    docker compose restart
- Stop app:       docker compose stop
- Start app:      docker compose up -d

🔧 CONFIGURATION:
- Port: 3000 (edit docker-compose.yml to change)
- Data storage: /opt/spending-tracker/data (persistent across restarts)
- Memory limit: 256MB (very efficient!)
- CPU limit: 0.5 cores

🛠️ TROUBLESHOOTING:
If deployment fails:
1. Check Docker is installed: docker --version
2. Check logs: docker compose logs
3. Verify files copied correctly: ls -la
4. Check server resources: free -h && df -h

📊 EXPECTED PERFORMANCE:
- Memory usage: ~17-25MB (very lightweight!)
- Startup time: 8-12 seconds
- CPU usage: <0.1% when idle

🔒 SECURITY:
- Runs as non-root user
- Memory and CPU limits enforced
- Only exposes port 3000
- Data stored securely in /opt/spending-tracker/data

Need help? Check the documentation in docs/DEPLOYMENT.md or docs/SHARED_FOLDER_DEPLOYMENT.md
EOF

# Create package summary
PACKAGE_SIZE=$(du -sh deployment-package/ | cut -f1)
FILE_COUNT=$(find deployment-package/ -type f | wc -l)

print_success "Deployment package created successfully!"
echo ""
echo "📊 Package Summary:"
echo "   Location: deployment-package/"
echo "   Size: $PACKAGE_SIZE"
echo "   Files: $FILE_COUNT"
echo "   Docker image: $IMAGE_SIZE"
echo ""
echo "📁 Contents:"
ls -la deployment-package/
echo ""
echo "🚀 Next Steps:"
echo "1. Copy deployment-package/ to your shared folder or server"
echo "2. SSH to your Ubuntu server"
echo "3. Navigate to the deployment-package directory"
echo "4. Run: ./deploy.sh"
echo ""
echo "📋 For detailed instructions, see:"
echo "   deployment-package/DEPLOYMENT_INSTRUCTIONS.txt"
echo "   docs/SHARED_FOLDER_DEPLOYMENT.md"