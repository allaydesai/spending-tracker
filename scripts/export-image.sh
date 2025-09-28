#!/bin/bash

# Image export script for server transfer
set -e

echo "📦 Exporting Docker image for server transfer..."

# Configuration
IMAGE_NAME="spending-tracker"
VERSION="${1:-latest}"
TAG="${IMAGE_NAME}:${VERSION}"
EXPORT_DIR="${2:-./exports}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
EXPORT_FILE="${EXPORT_DIR}/${IMAGE_NAME}-${VERSION}-${TIMESTAMP}.tar.gz"

# Create export directory
mkdir -p "$EXPORT_DIR"

# Validate image exists
echo "🔍 Checking if image exists..."
if ! docker images | grep -q "$IMAGE_NAME.*$VERSION"; then
    echo "❌ Image $TAG not found. Please build it first:"
    echo "   ./scripts/build.sh $VERSION"
    exit 1
fi

# Get image information
IMAGE_SIZE=$(docker images "$TAG" --format "{{.Size}}")
IMAGE_ID=$(docker images "$TAG" --format "{{.ID}}")

echo "📊 Image information:"
echo "   Image: $TAG"
echo "   ID: $IMAGE_ID"
echo "   Size: $IMAGE_SIZE"

# Export the image
echo "💾 Exporting image to: $EXPORT_FILE"
docker save "$TAG" | gzip > "$EXPORT_FILE"

# Verify export
if [ ! -f "$EXPORT_FILE" ]; then
    echo "❌ Export failed - file not created"
    exit 1
fi

EXPORT_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
echo "✅ Export completed successfully!"
echo "📊 Export summary:"
echo "   File: $EXPORT_FILE"
echo "   Size: $EXPORT_SIZE"
echo "   Created: $(date)"

# Generate transfer instructions
INSTRUCTIONS_FILE="${EXPORT_DIR}/transfer-instructions-${VERSION}-${TIMESTAMP}.txt"
cat > "$INSTRUCTIONS_FILE" << EOF
# Transfer Instructions for Spending Tracker v${VERSION}

## File Information
- Export file: $(basename "$EXPORT_FILE")
- Size: $EXPORT_SIZE
- Created: $(date)
- Source image: $TAG ($IMAGE_ID)

## Transfer to Ubuntu Server
1. Copy the export file to your Ubuntu server:
   scp "$EXPORT_FILE" user@your-server:/tmp/

2. On the Ubuntu server, load the image:
   cd /tmp
   gunzip -c "$(basename "$EXPORT_FILE")" | docker load

3. Verify the image was loaded:
   docker images | grep spending-tracker

4. Create deployment directory:
   sudo mkdir -p /opt/spending-tracker/data
   sudo chown \$USER:\$USER /opt/spending-tracker/data

5. Run the container:
   docker run -d \\
     --name spending-tracker \\
     --restart unless-stopped \\
     -p 3000:3000 \\
     -v /opt/spending-tracker/data:/app/uploads \\
     $TAG

6. Verify deployment:
   curl -f http://localhost:3000/api/health

## Cleanup
After successful deployment, you can remove the export file:
   rm /tmp/$(basename "$EXPORT_FILE")
EOF

echo ""
echo "📋 Transfer instructions written to: $INSTRUCTIONS_FILE"
echo ""
echo "🚀 Next steps:"
echo "   1. Transfer $EXPORT_FILE to your Ubuntu server"
echo "   2. Follow instructions in $INSTRUCTIONS_FILE"
echo "   3. Run deployment: ./scripts/deploy-to-server.sh"