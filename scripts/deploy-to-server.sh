#!/bin/bash

# Server deployment script
set -e

echo "🚀 Deploying spending tracker to Ubuntu server..."

# Configuration
SERVER_HOST="${1}"
SERVER_USER="${2:-$USER}"
IMAGE_NAME="spending-tracker"
VERSION="${3:-latest}"
REMOTE_PATH="/opt/spending-tracker"
CONTAINER_NAME="spending-tracker"

# Validate inputs
if [ -z "$SERVER_HOST" ]; then
    echo "❌ Server host required"
    echo "Usage: $0 <server-host> [user] [version]"
    echo "Example: $0 192.168.1.100 ubuntu latest"
    exit 1
fi

echo "📊 Deployment configuration:"
echo "   Server: $SERVER_USER@$SERVER_HOST"
echo "   Image: $IMAGE_NAME:$VERSION"
echo "   Remote path: $REMOTE_PATH"

# Test SSH connection
echo "🔍 Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'"; then
    echo "❌ Cannot connect to server. Please check:"
    echo "   - Server host: $SERVER_HOST"
    echo "   - SSH user: $SERVER_USER"
    echo "   - SSH key/password authentication"
    exit 1
fi

# Validate Docker on server
echo "🔍 Validating Docker on server..."
if ! ssh "$SERVER_USER@$SERVER_HOST" "docker --version"; then
    echo "❌ Docker not found on server. Please install Docker first."
    exit 1
fi

# Find latest export file if no specific version provided
EXPORT_FILE=""
if [ -d "./exports" ]; then
    EXPORT_FILE=$(ls -t ./exports/${IMAGE_NAME}-${VERSION}-*.tar.gz 2>/dev/null | head -1)
fi

if [ -z "$EXPORT_FILE" ] || [ ! -f "$EXPORT_FILE" ]; then
    echo "❌ No export file found for version $VERSION"
    echo "Please run: ./scripts/export-image.sh $VERSION"
    exit 1
fi

echo "📦 Using export file: $EXPORT_FILE"

# Transfer image to server
echo "📤 Transferring image to server..."
scp "$EXPORT_FILE" "$SERVER_USER@$SERVER_HOST:/tmp/"
REMOTE_FILE="/tmp/$(basename "$EXPORT_FILE")"

# Deploy on server
echo "🚀 Deploying on server..."
ssh "$SERVER_USER@$SERVER_HOST" << EOF
set -e

echo "🛑 Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "📦 Loading new image..."
gunzip -c "$REMOTE_FILE" | docker load

echo "📁 Creating deployment directory..."
sudo mkdir -p $REMOTE_PATH/data
sudo chown \$USER:\$USER $REMOTE_PATH/data

echo "🚀 Starting container..."
docker run -d \\
    --name $CONTAINER_NAME \\
    --restart unless-stopped \\
    -p 3000:3000 \\
    -v $REMOTE_PATH/data:/app/uploads \\
    $IMAGE_NAME:$VERSION

echo "⏳ Waiting for container to start..."
sleep 15

echo "🔍 Checking container status..."
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Container is running"
else
    echo "❌ Container failed to start"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo "🔍 Testing health endpoint..."
if curl -f http://localhost:3000/api/health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

echo "🧹 Cleaning up transfer file..."
rm "$REMOTE_FILE"

echo "✅ Deployment completed successfully!"
echo "📊 Deployment summary:"
docker ps | grep $CONTAINER_NAME
echo ""
echo "🌐 Access your application at:"
echo "   http://$SERVER_HOST:3000"
EOF

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your spending tracker is now running at:"
echo "   http://$SERVER_HOST:3000"
echo ""
echo "🛠️ Management commands:"
echo "   Check status: ssh $SERVER_USER@$SERVER_HOST 'docker ps | grep $CONTAINER_NAME'"
echo "   View logs: ssh $SERVER_USER@$SERVER_HOST 'docker logs $CONTAINER_NAME'"
echo "   Restart: ssh $SERVER_USER@$SERVER_HOST 'docker restart $CONTAINER_NAME'"