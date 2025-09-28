#!/bin/bash

# Docker build test script
set -e

echo "🏗️ Testing Docker build process..."

# Clean up any existing test image
echo "🧹 Cleaning up previous test builds..."
docker rmi spending-tracker:test-build 2>/dev/null || true

# Build the Docker image
echo "📦 Building Docker image..."
if ! docker build -t spending-tracker:test-build .; then
    echo "❌ Docker build failed"
    exit 1
fi

# Check image properties
echo "🔍 Checking image properties..."
IMAGE_SIZE=$(docker images spending-tracker:test-build --format "{{.Size}}")
echo "   Image size: $IMAGE_SIZE"

# Verify image can be inspected
if ! docker inspect spending-tracker:test-build > /dev/null 2>&1; then
    echo "❌ Failed to inspect built image"
    exit 1
fi

# Check for Next.js standalone output
echo "🔍 Verifying standalone build..."
if ! docker run --rm spending-tracker:test-build ls -la /app/.next/standalone > /dev/null 2>&1; then
    echo "❌ Next.js standalone build not found"
    exit 1
fi

# Check for health endpoint executable
echo "🔍 Verifying health endpoint..."
CONTAINER_ID=$(docker run -d --rm -p 3001:3000 spending-tracker:test-build)
sleep 10

if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "❌ Health endpoint not accessible"
    docker stop $CONTAINER_ID
    exit 1
fi

# Stop test container
docker stop $CONTAINER_ID

# Clean up test image
docker rmi spending-tracker:test-build

echo "✅ Docker build test passed"
echo "📊 Build summary:"
echo "   Image built successfully"
echo "   Standalone output verified"
echo "   Health endpoint functional"