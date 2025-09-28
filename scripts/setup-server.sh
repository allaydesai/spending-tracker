#!/bin/bash

# Server setup script for Ubuntu deployment
set -e

echo "🛠️ Setting up Ubuntu server for spending tracker deployment..."

# Configuration
SERVER_HOST="${1}"
SERVER_USER="${2:-$USER}"
REMOTE_PATH="/opt/spending-tracker"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validate inputs
if [ -z "$SERVER_HOST" ]; then
    print_error "Server host required"
    echo "Usage: $0 <server-host> [user]"
    echo "Example: $0 192.168.1.100 ubuntu"
    exit 1
fi

print_status "Server setup configuration:"
echo "   Server: $SERVER_USER@$SERVER_HOST"
echo "   Deployment path: $REMOTE_PATH"

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 "$SERVER_USER@$SERVER_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_error "Cannot connect to server. Please check:"
    echo "   - Server host: $SERVER_HOST"
    echo "   - SSH user: $SERVER_USER"
    echo "   - SSH key/password authentication"
    exit 1
fi
print_success "SSH connection verified"

# Setup server environment
print_status "Setting up server environment..."
ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
set -e

# Color codes for remote output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Update system packages
print_status "Updating system packages..."
sudo apt-get update -qq

# Install required packages
print_status "Installing required packages..."
PACKAGES=(
    "curl"
    "wget"
    "gnupg"
    "lsb-release"
    "ca-certificates"
    "software-properties-common"
    "apt-transport-https"
)

for package in "${PACKAGES[@]}"; do
    if ! dpkg -l | grep -q "^ii  $package "; then
        print_status "Installing $package..."
        sudo apt-get install -y "$package"
    else
        print_success "$package already installed"
    fi
done

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."

    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Update package index and install Docker
    sudo apt-get update -qq
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Add user to docker group
    sudo usermod -aG docker $USER

    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi

# Start and enable Docker service
print_status "Configuring Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker installation
DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
print_success "Docker $DOCKER_VERSION is running"

# Create deployment directory structure
print_status "Creating deployment directories..."
sudo mkdir -p /opt/spending-tracker/{data,backups,logs}
sudo chown -R $USER:$USER /opt/spending-tracker
sudo chmod -R 755 /opt/spending-tracker

# Create data subdirectories
mkdir -p /opt/spending-tracker/data/uploads
mkdir -p /opt/spending-tracker/backups
mkdir -p /opt/spending-tracker/logs

print_success "Directory structure created"

# Configure firewall (if UFW is enabled)
if sudo ufw status | grep -q "Status: active"; then
    print_status "Configuring firewall..."
    sudo ufw allow 3000/tcp comment "Spending Tracker"
    print_success "Firewall configured for port 3000"
else
    print_warning "UFW firewall not active - consider enabling for security"
fi

# Set up log rotation
print_status "Configuring log rotation..."
sudo tee /etc/logrotate.d/spending-tracker > /dev/null << 'LOGROTATE_EOF'
/opt/spending-tracker/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
LOGROTATE_EOF

print_success "Log rotation configured"

# Create systemd service for container management (optional)
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/spending-tracker.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=Spending Tracker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
ExecStart=/usr/bin/docker start spending-tracker
ExecStop=/usr/bin/docker stop spending-tracker
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SERVICE_EOF

sudo systemctl daemon-reload
print_success "Systemd service created"

# Create backup script
print_status "Creating backup script..."
tee /opt/spending-tracker/backup.sh > /dev/null << 'BACKUP_EOF'
#!/bin/bash
# Automated backup script for spending tracker data

BACKUP_DIR="/opt/spending-tracker/backups"
DATA_DIR="/opt/spending-tracker/data"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/spending-tracker-backup-$TIMESTAMP.tar.gz"

echo "$(date): Starting backup..."
tar -czf "$BACKUP_FILE" -C "$DATA_DIR" .
echo "$(date): Backup completed: $BACKUP_FILE"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "spending-tracker-backup-*.tar.gz" -mtime +30 -delete
echo "$(date): Old backups cleaned up"
BACKUP_EOF

chmod +x /opt/spending-tracker/backup.sh
print_success "Backup script created"

# Add backup to crontab
print_status "Scheduling automatic backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/spending-tracker/backup.sh >> /opt/spending-tracker/logs/backup.log 2>&1") | crontab -
print_success "Daily backups scheduled at 2:00 AM"

# System information
print_status "System information:"
echo "   OS: $(lsb_release -d | cut -f2)"
echo "   Kernel: $(uname -r)"
echo "   Docker: $DOCKER_VERSION"
echo "   Available space: $(df -h /opt | tail -1 | awk '{print $4}')"
echo "   Available memory: $(free -h | grep '^Mem:' | awk '{print $7}')"

print_success "Server setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Logout and login again to apply Docker group membership"
echo "   2. Deploy your application: ./scripts/deploy-to-server.sh $SERVER_HOST $USER"
echo "   3. Access at: http://$SERVER_HOST:3000"
EOF

print_success "Server setup completed!"
print_status "Important: The user needs to logout and login again for Docker group membership to take effect"

echo ""
echo "📋 Server is now ready for deployment!"
echo "🚀 Next steps:"
echo "   1. Build image: ./scripts/build.sh"
echo "   2. Export image: ./scripts/export-image.sh"
echo "   3. Deploy: ./scripts/deploy-to-server.sh $SERVER_HOST $SERVER_USER"