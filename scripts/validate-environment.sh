#!/bin/bash

# Deployment environment validation script
set -e

echo "🔍 Validating deployment environment..."

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

# Check Docker version
DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
DOCKER_MAJOR=$(echo $DOCKER_VERSION | cut -d'.' -f1)
if [ "$DOCKER_MAJOR" -lt 20 ]; then
    echo "❌ Docker version must be 20.x or higher, found: $DOCKER_VERSION"
    exit 1
fi

# Check Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose is not available"
    exit 1
fi

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    exit 1
fi

# Check disk space (minimum 2GB)
AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 2 ]; then
    echo "❌ Insufficient disk space. Need at least 2GB, available: ${AVAILABLE_SPACE}GB"
    exit 1
fi

# Check memory (minimum 1GB)
AVAILABLE_MEMORY=$(free -m | grep '^Mem:' | awk '{print $7}')
if [ "$AVAILABLE_MEMORY" -lt 1024 ]; then
    echo "❌ Insufficient memory. Need at least 1GB available, found: ${AVAILABLE_MEMORY}MB"
    exit 1
fi

# Check if port 3000 is available (if not running in container)
if [ "${DOCKER_CONTAINER:-false}" != "true" ]; then
    if ss -tlnp | grep -q ':3000 '; then
        echo "⚠️ Warning: Port 3000 is already in use"
    fi
fi

# Check Node.js availability for builds
if ! command -v node &> /dev/null; then
    echo "⚠️ Warning: Node.js not available for local builds"
fi

echo "✅ Environment validation passed"
echo "📊 System info:"
echo "   Docker: $DOCKER_VERSION"
echo "   Available space: ${AVAILABLE_SPACE}GB"
echo "   Available memory: ${AVAILABLE_MEMORY}MB"