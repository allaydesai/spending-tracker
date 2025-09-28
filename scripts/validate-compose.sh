#!/bin/bash

# Docker Compose validation script
set -e

echo "🔍 Validating docker-compose.yml..."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
fi

# Validate YAML syntax
if ! docker compose config > /dev/null 2>&1; then
    echo "❌ docker-compose.yml syntax validation failed"
    exit 1
fi

# Check for required services
if ! grep -q "services:" docker-compose.yml; then
    echo "❌ No services defined in docker-compose.yml"
    exit 1
fi

# Check for spending-tracker service
if ! grep -q "spending-tracker:" docker-compose.yml; then
    echo "❌ spending-tracker service not found"
    exit 1
fi

# Check for port mapping
if ! grep -q "ports:" docker-compose.yml; then
    echo "❌ No port mapping defined"
    exit 1
fi

# Check for volume mapping
if ! grep -q "volumes:" docker-compose.yml; then
    echo "❌ No volume mapping defined"
    exit 1
fi

# Check for environment variables
if ! grep -q "environment:" docker-compose.yml; then
    echo "❌ No environment variables defined"
    exit 1
fi

# Check for restart policy
if ! grep -q "restart:" docker-compose.yml; then
    echo "❌ No restart policy defined"
    exit 1
fi

# Check for health check
if ! grep -q "healthcheck:" docker-compose.yml; then
    echo "❌ No health check defined"
    exit 1
fi

echo "✅ docker-compose.yml validation passed"