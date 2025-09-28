#!/bin/bash

# Home server deployment via shared folder
set -e

echo "🏠 Deploying spending tracker to home server via shared folder..."

# Configuration - CUSTOMIZE THESE VALUES
SERVER_HOST="${1:-192.168.1.100}"     # Your Ubuntu server IP
SERVER_USER="${2:-ubuntu}"            # Your SSH username
SHARED_FOLDER="${3}"                   # Path to shared folder (e.g., /mnt/shared or ~/shared)
SERVER_SHARED_PATH="${4:-/mnt/shared}" # Where server accesses shared folder

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Validate inputs
if [ -z "$SHARED_FOLDER" ]; then
    print_error "Shared folder path required"
    echo "Usage: $0 <server-ip> <ssh-user> <shared-folder-path> [server-shared-path]"
    echo ""
    echo "Examples:"
    echo "  $0 192.168.1.100 ubuntu /mnt/nas/shared"
    echo "  $0 192.168.1.100 pi ~/shared /home/pi/shared"
    exit 1
fi

if [ ! -d "$SHARED_FOLDER" ]; then
    print_error "Shared folder not accessible: $SHARED_FOLDER"
    exit 1
fi

print_status "Deployment configuration:"
echo "   Server: $SERVER_USER@$SERVER_HOST"
echo "   Shared folder (local): $SHARED_FOLDER"
echo "   Shared folder (server): $SERVER_SHARED_PATH"

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_error "Cannot connect to server. Please check:"
    echo "   - Server IP: $SERVER_HOST"
    echo "   - SSH user: $SERVER_USER"
    echo "   - SSH key/password authentication"
    exit 1
fi
print_success "SSH connection verified"

# Check if image exists
if ! docker images | grep -q "spending-tracker.*latest"; then
    print_error "Docker image 'spending-tracker:latest' not found"
    echo "Please build the image first:"
    echo "   ./scripts/build.sh"
    exit 1
fi

# Create deployment directory in shared folder
DEPLOY_DIR="$SHARED_FOLDER/spending-tracker-deploy"
mkdir -p "$DEPLOY_DIR"
print_success "Created deployment directory: $DEPLOY_DIR"

# Export Docker image to shared folder
print_status "Exporting Docker image to shared folder..."
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
IMAGE_FILE="spending-tracker-$TIMESTAMP.tar.gz"
docker save spending-tracker:latest | gzip > "$DEPLOY_DIR/$IMAGE_FILE"
print_success "Image exported: $IMAGE_FILE"

# Copy docker-compose and environment files
print_status "Copying configuration files..."
cp docker-compose.yml "$DEPLOY_DIR/"
cp .env "$DEPLOY_DIR/"

# Create deployment script for server
cat > "$DEPLOY_DIR/deploy-on-server.sh" << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment on server..."

SERVER_SHARED_PATH="${1:-/mnt/shared}"
DEPLOY_DIR="$SERVER_SHARED_PATH/spending-tracker-deploy"

# Find the image file
IMAGE_FILE=$(ls -t "$DEPLOY_DIR"/spending-tracker-*.tar.gz 2>/dev/null | head -1)
if [ -z "$IMAGE_FILE" ]; then
    echo "❌ No image file found in $DEPLOY_DIR"
    exit 1
fi

echo "📦 Loading Docker image: $(basename "$IMAGE_FILE")"
gunzip -c "$IMAGE_FILE" | docker load

echo "🛑 Stopping existing container..."
docker-compose -f "$DEPLOY_DIR/docker-compose.yml" down 2>/dev/null || true

echo "📁 Creating data directory..."
sudo mkdir -p /opt/spending-tracker/data
sudo chown $USER:$USER /opt/spending-tracker/data

echo "🚀 Starting services..."
cd "$DEPLOY_DIR"
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "🔍 Checking health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Access your application at: http://$(hostname -I | awk '{print $1}'):3000"
else
    echo "❌ Health check failed"
    docker-compose logs
    exit 1
fi

echo "📊 Container status:"
docker-compose ps
EOF

chmod +x "$DEPLOY_DIR/deploy-on-server.sh"
print_success "Created server deployment script"

# Deploy on server via SSH
print_status "Executing deployment on server..."
ssh "$SERVER_USER@$SERVER_HOST" "bash $SERVER_SHARED_PATH/spending-tracker-deploy/deploy-on-server.sh $SERVER_SHARED_PATH"

print_success "Deployment completed!"
echo ""
echo "🎉 Your spending tracker is now running!"
echo "🌐 Access it at: http://$SERVER_HOST:3000"
echo ""
echo "📊 To check status:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_SHARED_PATH/spending-tracker-deploy && docker-compose ps'"
echo ""
echo "📋 To view logs:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_SHARED_PATH/spending-tracker-deploy && docker-compose logs'"
echo ""
echo "🔄 To restart:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_SHARED_PATH/spending-tracker-deploy && docker-compose restart'"