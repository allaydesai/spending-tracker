#!/bin/bash

# Complete deployment workflow: build -> package -> transfer -> deploy
set -e

# Configuration
SERVER_USER="allay"
SERVER_HOST="192.168.2.80"
SERVER_PATH="/home/allay/servershare/Apps/spending-tracker"

echo "🚀 Complete Deployment Workflow"
echo "================================"
echo ""

# Step 1: Build Docker image
echo "Step 1/4: Building Docker image..."
./scripts/build.sh

# Step 2: Create deployment package
echo ""
echo "Step 2/4: Creating deployment package..."
./scripts/create-deployment-package.sh

# Step 3: Transfer to server
echo ""
echo "Step 3/4: Transferring to server..."
./scripts/transfer-to-server.sh

# Step 4: Deploy on server
echo ""
echo "Step 4/4: Deploying on server..."
ssh "$SERVER_USER@$SERVER_HOST" "cd $SERVER_PATH/deployment-package && ./deploy.sh"

echo ""
echo "✅ Complete deployment finished!"
echo "🌐 Access your app at: http://$SERVER_HOST:3000"
