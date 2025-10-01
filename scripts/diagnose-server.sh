#!/bin/bash

# Server Database Permission Diagnostic Script
# Run this ON THE SERVER to diagnose why the database can't be created

echo "🔍 Spending Tracker - Database Permission Diagnostic"
echo "===================================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Running as root"
else
    echo "ℹ️  Running as user: $(whoami) (UID: $(id -u))"
fi
echo ""

echo "1. Checking directory structure..."
echo "-----------------------------------"
ls -la /opt/ | grep spending-tracker
ls -la /opt/spending-tracker/
ls -la /opt/spending-tracker/data/
echo ""

echo "2. Checking numeric ownership..."
echo "--------------------------------"
stat -c "%u:%g %A %n" /opt/spending-tracker
stat -c "%u:%g %A %n" /opt/spending-tracker/data
echo ""

echo "3. Checking SELinux status..."
echo "-----------------------------"
if command -v getenforce &> /dev/null; then
    getenforce
    ls -laZ /opt/spending-tracker/data/ 2>/dev/null || echo "SELinux context not available"
else
    echo "SELinux not installed"
fi
echo ""

echo "4. Checking AppArmor status..."
echo "------------------------------"
if command -v aa-status &> /dev/null; then
    sudo aa-status | grep docker || echo "No Docker AppArmor profiles"
else
    echo "AppArmor not installed or not active"
fi
echo ""

echo "5. Testing write permissions..."
echo "-------------------------------"
echo "Testing as current user:"
touch /opt/spending-tracker/data/test-current-user.txt 2>&1 && echo "✅ Can write" || echo "❌ Cannot write"
rm -f /opt/spending-tracker/data/test-current-user.txt 2>/dev/null

echo ""
echo "Testing as UID 1001 (nextjs):"
sudo -u "#1001" touch /opt/spending-tracker/data/test-uid-1001.txt 2>&1 && echo "✅ Can write" || echo "❌ Cannot write"
sudo -u "#1001" rm -f /opt/spending-tracker/data/test-uid-1001.txt 2>/dev/null
echo ""

echo "6. Checking Docker container status..."
echo "---------------------------------------"
cd ~/servershare/Apps/spending-tracker/deployment-package 2>/dev/null || cd ~/deployment-package 2>/dev/null || echo "Deployment package not found"
docker compose ps
echo ""

echo "7. Checking container user..."
echo "-----------------------------"
if docker ps | grep -q spending-tracker; then
    docker exec spending-tracker id
    docker exec spending-tracker ls -la /app/ | grep data
    echo ""
    echo "Testing write from inside container:"
    docker exec spending-tracker touch /app/data/test-from-container.txt 2>&1 || echo "❌ Cannot write from container"
    docker exec spending-tracker rm -f /app/data/test-from-container.txt 2>/dev/null
else
    echo "Container not running"
fi
echo ""

echo "8. Checking volume mounts..."
echo "----------------------------"
if docker ps | grep -q spending-tracker; then
    docker inspect spending-tracker | grep -A 20 "Mounts"
else
    echo "Container not running"
fi
echo ""

echo "9. Checking for filesystem restrictions..."
echo "------------------------------------------"
mount | grep /opt
df -Th | grep /opt
echo ""

echo "10. Recommended fixes based on findings..."
echo "-------------------------------------------"

# Check if directory exists
if [ ! -d "/opt/spending-tracker/data" ]; then
    echo "❌ Directory /opt/spending-tracker/data does not exist"
    echo "   Fix: sudo mkdir -p /opt/spending-tracker/data"
fi

# Check ownership
DATA_DIR_UID=$(stat -c "%u" /opt/spending-tracker/data 2>/dev/null)
if [ "$DATA_DIR_UID" != "1001" ]; then
    echo "❌ Directory not owned by UID 1001 (current: $DATA_DIR_UID)"
    echo "   Fix: sudo chown -R 1001:1001 /opt/spending-tracker/data"
fi

# Check permissions
DATA_DIR_PERMS=$(stat -c "%a" /opt/spending-tracker/data 2>/dev/null)
if [ "$DATA_DIR_PERMS" -lt "755" ]; then
    echo "❌ Directory permissions too restrictive (current: $DATA_DIR_PERMS)"
    echo "   Fix: sudo chmod 755 /opt/spending-tracker/data"
fi

# Check parent directory
PARENT_DIR_PERMS=$(stat -c "%a" /opt/spending-tracker 2>/dev/null)
if [ "$PARENT_DIR_PERMS" -lt "755" ]; then
    echo "❌ Parent directory permissions too restrictive (current: $PARENT_DIR_PERMS)"
    echo "   Fix: sudo chmod 755 /opt/spending-tracker"
fi

# Check SELinux
if command -v getenforce &> /dev/null; then
    if [ "$(getenforce)" = "Enforcing" ]; then
        echo "⚠️  SELinux is enforcing - may block Docker volume access"
        echo "   Fix: sudo chcon -R -t container_file_t /opt/spending-tracker/data"
        echo "   Or temporarily disable: sudo setenforce 0"
    fi
fi

echo ""
echo "✅ Diagnostic complete!"
echo ""
echo "If all checks pass but database still can't be created, try:"
echo "1. Stop container: docker compose down"
echo "2. Remove data: sudo rm -rf /opt/spending-tracker/data/*"
echo "3. Reset permissions: sudo chown -R 1001:1001 /opt/spending-tracker/data && sudo chmod -R 755 /opt/spending-tracker/data"
echo "4. Start container: docker compose up -d"
echo "5. Wait 20s and test: curl http://localhost:3000/api/storage/status"