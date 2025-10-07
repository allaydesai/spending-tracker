#!/bin/bash

# Transfer deployment package to home server
set -e

# Configuration
SERVER_USER="allay"
SERVER_HOST="192.168.2.80"
SERVER_PATH="/home/allay/servershare/Apps/spending-tracker"
LOCAL_PACKAGE="deployment-package"

echo "📡 Transferring deployment package to home server..."
echo "Target: $SERVER_USER@$SERVER_HOST:$SERVER_PATH"
echo ""

# Check if deployment package exists
if [ ! -d "$LOCAL_PACKAGE" ]; then
    echo "❌ Error: deployment-package not found"
    echo "Run ./scripts/create-deployment-package.sh first"
    exit 1
fi

# Remove old deployment package on server
echo "🧹 Removing old deployment package on server..."
ssh "$SERVER_USER@$SERVER_HOST" "rm -rf $SERVER_PATH/deployment-package"

# Create parent directory if needed
echo "📁 Ensuring target directory exists..."
ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $SERVER_PATH"

# Transfer deployment package
echo "📦 Transferring deployment package..."
scp -r "$LOCAL_PACKAGE" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

echo ""
echo "✅ Transfer complete!"
echo ""
echo "📋 Next steps:"
echo "1. SSH to server:"
echo "   ssh $SERVER_USER@$SERVER_HOST"
echo ""
echo "2. Navigate to deployment folder:"
echo "   cd $SERVER_PATH/deployment-package"
echo ""
echo "3. Run deployment:"
echo "   ./deploy.sh"
echo ""
echo "🚀 Or run all steps automatically:"
echo "   ssh $SERVER_USER@$SERVER_HOST 'cd $SERVER_PATH/deployment-package && ./deploy.sh'"
