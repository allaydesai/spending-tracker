#!/bin/bash

# Docker build automation script
set -e

echo "🏗️ Building spending tracker Docker image..."

# Configuration
IMAGE_NAME="spending-tracker"
VERSION="${1:-latest}"
TAG="${IMAGE_NAME}:${VERSION}"

# Validate environment
echo "🔍 Validating build environment..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker."
    exit 1
fi

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
docker system prune -f --filter "label=project=spending-tracker" 2>/dev/null || true

# Run validation scripts
echo "🔍 Running pre-build validation..."
if [ -f "scripts/validate-dockerfile.sh" ]; then
    ./scripts/validate-dockerfile.sh
fi

if [ -f "scripts/validate-environment.sh" ]; then
    ./scripts/validate-environment.sh
fi

# Build the image
echo "📦 Building Docker image: $TAG"
docker build \
    --label "project=spending-tracker" \
    --label "version=$VERSION" \
    --label "build-date=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    -t "$TAG" \
    .

# Verify the build
echo "🔍 Verifying build..."
if ! docker images | grep -q "$IMAGE_NAME.*$VERSION"; then
    echo "❌ Build verification failed"
    exit 1
fi

# Get image information
IMAGE_SIZE=$(docker images "$TAG" --format "{{.Size}}")
IMAGE_ID=$(docker images "$TAG" --format "{{.ID}}")

echo "✅ Build completed successfully!"
echo "📊 Build summary:"
echo "   Image: $TAG"
echo "   ID: $IMAGE_ID"
echo "   Size: $IMAGE_SIZE"
echo "   Built: $(date)"

# Optional: Tag as latest if building a specific version
if [ "$VERSION" != "latest" ]; then
    echo "🏷️ Tagging as latest..."
    docker tag "$TAG" "${IMAGE_NAME}:latest"
fi

echo ""
echo "🚀 Next steps:"
echo "   Test: ./scripts/test-container.sh"
echo "   Export: ./scripts/export-image.sh $VERSION"
echo "   Deploy: ./scripts/deploy-to-server.sh"