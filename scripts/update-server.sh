#!/bin/bash

# Update server deployment with latest build
set -e

echo "🔄 Updating server deployment with latest build..."

# Configuration
SERVER_HOST="${1}"
SERVER_USER="${2}"
SHARED_FOLDER="${3}"

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
if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ]; then
    print_error "Server host and user required"
    echo "Usage: $0 <server-ip> <ssh-user> [shared-folder-path]"
    echo ""
    echo "Examples:"
    echo "  $0 192.168.1.100 ubuntu /mnt/shared"
    echo "  $0 192.168.1.100 pi"
    exit 1
fi

print_status "Update configuration:"
echo "   Server: $SERVER_USER@$SERVER_HOST"
if [ -n "$SHARED_FOLDER" ]; then
    echo "   Method: Shared folder ($SHARED_FOLDER)"
else
    echo "   Method: Direct SSH transfer"
fi

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

# Build latest version
print_status "Building latest application version..."
if ! ./scripts/build.sh; then
    print_error "Build failed"
    exit 1
fi
print_success "Build completed successfully"

# Check if deployment method uses shared folder
if [ -n "$SHARED_FOLDER" ] && [ -d "$SHARED_FOLDER" ]; then
    print_status "Using shared folder deployment method..."

    # Create deployment package
    print_status "Creating deployment package..."
    ./scripts/create-deployment-package.sh

    # Copy to shared folder
    print_status "Copying package to shared folder..."
    cp -r deployment-package "$SHARED_FOLDER/"
    print_success "Package copied to shared folder"

    # Deploy on server
    print_status "Deploying on server via shared folder..."
    ssh "$SERVER_USER@$SERVER_HOST" << EOF
set -e
cd "$SHARED_FOLDER/deployment-package"
echo "🚀 Running deployment on server..."
./deploy.sh
EOF

else
    print_status "Using direct SSH deployment method..."

    # Export image for transfer
    print_status "Exporting image for transfer..."
    ./scripts/export-image.sh

    # Deploy directly to server
    print_status "Deploying directly to server..."
    ./scripts/deploy-to-server.sh "$SERVER_HOST" "$SERVER_USER"
fi

# Verify deployment
print_status "Verifying deployment..."
sleep 10

if ssh "$SERVER_USER@$SERVER_HOST" "curl -f http://localhost:3000/api/health" > /dev/null 2>&1; then
    print_success "Deployment verification successful!"

    # Get server IP for access URL
    SERVER_IP=$(ssh "$SERVER_USER@$SERVER_HOST" "hostname -I | awk '{print \$1}'")

    echo ""
    print_success "Server update completed successfully!"
    echo "🌐 Access your updated application at: http://$SERVER_IP:3000"
    echo ""
    echo "📊 Server status:"
    ssh "$SERVER_USER@$SERVER_HOST" "cd /opt/spending-tracker 2>/dev/null || cd ~/deployment-package 2>/dev/null || cd /mnt/shared/deployment-package; docker compose ps"
    echo ""
    echo "📋 Post-update commands:"
    echo "   View logs: ssh $SERVER_USER@$SERVER_HOST 'docker compose logs'"
    echo "   Check health: curl http://$SERVER_IP:3000/api/health"
    echo "   Monitor resources: ssh $SERVER_USER@$SERVER_HOST 'docker stats spending-tracker --no-stream'"

else
    print_error "Deployment verification failed"
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check server logs: ssh $SERVER_USER@$SERVER_HOST 'docker compose logs'"
    echo "   2. Check container status: ssh $SERVER_USER@$SERVER_HOST 'docker compose ps'"
    echo "   3. Try manual restart: ssh $SERVER_USER@$SERVER_HOST 'docker compose restart'"
    exit 1
fi

# Clean up local files
if [ -n "$SHARED_FOLDER" ]; then
    print_status "Cleaning up local deployment package..."
    rm -rf deployment-package
fi

print_success "Update process completed!"
echo ""
echo "🎯 Next steps:"
echo "   1. Test application functionality"
echo "   2. Verify CSV upload works"
echo "   3. Check performance metrics"
echo "   4. Monitor for any issues"