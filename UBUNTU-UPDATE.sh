#!/bin/bash

# ====================================================
# JW Player Video Extractor - Ubuntu 24.04 Update Script
# ====================================================
#
# This script updates your Ubuntu 24.04 deployment to fix Chromium issues
# by switching to Puppeteer's bundled Chromium instead of system Chromium.
#
# Run this script on your Ubuntu 24.04 server in the application directory:
#   cd /var/www/jwplayer-video-extractor
#   chmod +x UBUNTU-UPDATE.sh
#   ./UBUNTU-UPDATE.sh
#
# ====================================================

echo "🚀 Starting JW Player Video Extractor Ubuntu 24.04 Update..."
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Please run this script from the jwplayer-video-extractor directory."
    print_error "Expected location: /var/www/jwplayer-video-extractor"
    exit 1
fi

print_status "✅ Found package.json - we're in the right directory"

# Step 1: Pull latest changes
print_status "📥 Pulling latest changes from GitHub..."
if git pull origin master; then
    print_success "✅ Code updated successfully"
else
    print_error "❌ Failed to pull changes. Check your git configuration."
    exit 1
fi

# Step 2: Clean reinstall dependencies (downloads bundled Chromium)
print_status "📦 Reinstalling dependencies with Puppeteer's bundled Chromium..."
if rm -rf node_modules package-lock.json && npm install; then
    print_success "✅ Dependencies installed with bundled Chromium"
else
    print_error "❌ Failed to install dependencies"
    exit 1
fi

# Step 3: Update environment file
print_status "⚙️  Updating environment configuration..."
if [ -f ".env" ]; then
    print_warning "Backing up existing .env file to .env.backup"
    cp .env .env.backup
fi

if cp env.example .env; then
    print_success "✅ Environment file updated"
    print_warning "⚠️  IMPORTANT: Edit .env file with your production settings!"
    print_warning "   Run: nano .env"
else
    print_error "❌ Failed to update environment file"
    exit 1
fi

# Step 4: Restart application
print_status "🔄 Restarting application with new configuration..."
pm2 stop jwplayer-extractor 2>/dev/null || true
pm2 delete jwplayer-extractor 2>/dev/null || true

if npm run pm2:start; then
    print_success "✅ Application restarted successfully"
else
    print_error "❌ Failed to start application"
    exit 1
fi

# Step 5: Verify everything works
print_status "🔍 Verifying application status..."
sleep 3

echo ""
echo "================================================================"
echo "📊 APPLICATION STATUS:"
echo "================================================================"

# Check PM2 status
echo "PM2 Processes:"
pm2 list | grep -E "(Name|jwplayer)" | head -3

echo ""
echo "Recent Logs:"
pm2 logs jwplayer-extractor --lines 5 --nostream 2>/dev/null || echo "No logs available yet"

echo ""
echo "Health Check:"
curl -s http://localhost:3000/health | head -5 || echo "Health check not available yet"

echo ""
echo "================================================================"
print_success "🎉 UPDATE COMPLETE!"
echo ""
echo "🌐 Your application should be available at:"
echo "   Web Interface: http://your-server-ip:3000"
echo "   API: http://your-server-ip:3000/api/extract"
echo "   Health Check: http://your-server-ip:3000/health"
echo ""
print_warning "⚠️  REMEMBER TO EDIT YOUR .env FILE WITH PRODUCTION SETTINGS!"
echo "   Run: nano .env"
echo ""
echo "================================================================"