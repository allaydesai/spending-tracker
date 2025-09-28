#!/bin/bash

# Dockerfile validation script
set -e

echo "🔍 Validating Dockerfile..."

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found"
    exit 1
fi

# Validate Dockerfile syntax - if it can load the definition, syntax is OK
echo "Checking Dockerfile syntax..."
if docker build --target non-existent-stage . 2>&1 | grep -q "transferring dockerfile"; then
    echo "✅ Dockerfile syntax is valid"
else
    echo "❌ Dockerfile syntax validation failed"
    exit 1
fi

# Check for required instructions
REQUIRED_INSTRUCTIONS=("FROM" "WORKDIR" "COPY" "RUN" "EXPOSE" "USER" "CMD")
for instruction in "${REQUIRED_INSTRUCTIONS[@]}"; do
    if ! grep -q "^$instruction" Dockerfile; then
        echo "❌ Missing required instruction: $instruction"
        exit 1
    fi
done

# Check for Node.js Alpine base image
if ! grep -q "FROM node:.*-alpine" Dockerfile; then
    echo "❌ Dockerfile must use Node.js Alpine base image"
    exit 1
fi

# Check for non-root user
if ! grep -q "USER.*nextjs" Dockerfile; then
    echo "❌ Dockerfile must run as non-root user 'nextjs'"
    exit 1
fi

# Check for exposed port 3000
if ! grep -q "EXPOSE 3000" Dockerfile; then
    echo "❌ Dockerfile must expose port 3000"
    exit 1
fi

# Check for healthcheck
if ! grep -q "HEALTHCHECK" Dockerfile; then
    echo "❌ Dockerfile must include health check"
    exit 1
fi

echo "✅ Dockerfile validation passed"