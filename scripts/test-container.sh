#!/bin/bash

# Container functionality test script
set -e

echo "🧪 Testing container functionality..."

# Configuration
CONTAINER_NAME="spending-tracker-test"
TEST_PORT="3002"
TEST_VOLUME="/tmp/spending-tracker-test-data"

# Clean up function
cleanup() {
    echo "🧹 Cleaning up test environment..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    rm -rf $TEST_VOLUME 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT

# Clean up any existing test containers
cleanup

# Create test volume directory
mkdir -p $TEST_VOLUME

# Start container
echo "🚀 Starting test container..."
docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    -p $TEST_PORT:3000 \
    -v $TEST_VOLUME:/app/uploads \
    spending-tracker:latest

# Wait for container to be ready
echo "⏳ Waiting for container to start..."
sleep 15

# Test 1: Container health
echo "🔍 Testing container health..."
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Container is not running"
    exit 1
fi

# Test 2: Health endpoint
echo "🔍 Testing health endpoint..."
if ! curl -f http://localhost:$TEST_PORT/api/health > /dev/null 2>&1; then
    echo "❌ Health endpoint failed"
    exit 1
fi

# Test 3: Main application
echo "🔍 Testing main application..."
if ! curl -f http://localhost:$TEST_PORT/ > /dev/null 2>&1; then
    echo "❌ Main application not accessible"
    exit 1
fi

# Test 4: Volume mounting
echo "🔍 Testing volume mounting..."
echo "test data" > $TEST_VOLUME/test-file.txt
if ! docker exec $CONTAINER_NAME ls /app/uploads/test-file.txt > /dev/null 2>&1; then
    echo "❌ Volume mounting failed"
    exit 1
fi

# Test 5: Container restart persistence
echo "🔍 Testing restart persistence..."
docker restart $CONTAINER_NAME
sleep 10

if ! docker exec $CONTAINER_NAME ls /app/uploads/test-file.txt > /dev/null 2>&1; then
    echo "❌ Data not persistent after restart"
    exit 1
fi

# Test 6: Resource usage
echo "🔍 Testing resource usage..."
MEMORY_USAGE=$(docker stats $CONTAINER_NAME --no-stream --format "{{.MemUsage}}" | cut -d'/' -f1 | sed 's/MiB//')
if [ "${MEMORY_USAGE%%.*}" -gt 512 ]; then
    echo "⚠️ Warning: Memory usage exceeds 512MB: ${MEMORY_USAGE}MiB"
fi

# Test 7: Logs check
echo "🔍 Checking container logs..."
if docker logs $CONTAINER_NAME 2>&1 | grep -i error; then
    echo "⚠️ Warning: Errors found in container logs"
fi

echo "✅ Container functionality test passed"
echo "📊 Container stats:"
echo "   Memory usage: ${MEMORY_USAGE}MiB"
echo "   Health endpoint: ✅"
echo "   Volume persistence: ✅"
echo "   Restart resilience: ✅"